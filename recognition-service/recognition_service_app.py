import asyncio
import json
import os
import re
import shutil
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import uvicorn
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from pydub import AudioSegment

from audio_pipeline import (
    CORE_SAMPLE_COUNT,
    FEATURE_BUNDLE_VERSION,
    FEATURE_QUALITY_FLAGS_KEY,
    MAX_CARD_SAMPLES,
    extract_feature_bundle,
    inspect_audio_quality,
    load_feature_bundle,
    preprocess_audio,
    quality_rejection_reason,
    readiness_thresholds,
    sample_readiness,
    save_feature_bundle_at,
    write_json_atomic,
)
from matching_engine import build_card_debug_summary, leave_one_out_evaluation, predict_vocalization, summarize_card_profile

LOCAL_FFMPEG = Path(__file__).resolve().parent / "ffmpeg.exe"
SYSTEM_FFMPEG = shutil.which("ffmpeg")

if LOCAL_FFMPEG.exists():
    AudioSegment.converter = str(LOCAL_FFMPEG)
    FFMPEG_AVAILABLE = True
elif SYSTEM_FFMPEG:
    AudioSegment.converter = SYSTEM_FFMPEG
    FFMPEG_AVAILABLE = True
else:
    FFMPEG_AVAILABLE = False

MAX_UPLOAD_BYTES = 3 * 1024 * 1024
IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,64}$")
HASH_PATTERN = re.compile(r"^[a-fA-F0-9]{64}$")
ALLOWED_AUDIO_FORMATS = {
    "wav": "wav",
    "x-wav": "wav",
    "wave": "wav",
    "m4a": "m4a",
    "x-m4a": "m4a",
    "mp4": "m4a",
    "mpeg": "mp3",
    "mp3": "mp3",
    "ogg": "ogg",
    "webm": "webm",
}

BASE_DIR = Path(__file__).resolve().parent
SAMPLES_DIR = BASE_DIR / "samples"
SAMPLES_DIR.mkdir(exist_ok=True)
AUTH_REGISTRY_PATH = BASE_DIR / "auth_registry.json"
SESSIONS_PATH = BASE_DIR / "backend_sessions.json"
STATE_LOCK = asyncio.Lock()

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "TALKBRIDGE_ALLOWED_ORIGINS",
        "http://localhost:8081,http://localhost:19006,http://localhost:8000,http://127.0.0.1:8081,http://127.0.0.1:19006",
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="TalkBridge Recognition Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


class SyncUserPayload(BaseModel):
    username: str
    password_hash: str


class SessionPayload(BaseModel):
    username: str
    password_hash: str


class CloseSessionPayload(BaseModel):
    token: str


@app.middleware("http")
async def enforce_request_size(request: Request, call_next):
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > MAX_UPLOAD_BYTES:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Upload exceeds the 3 MB maximum payload size."},
                    )
            except ValueError:
                pass

    return await call_next(request)


def read_json_file(path: Path, default):
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return default


async def load_registry() -> Dict[str, str]:
    return await asyncio.to_thread(read_json_file, AUTH_REGISTRY_PATH, {})


async def save_registry(payload: Dict[str, str]):
    await asyncio.to_thread(write_json_atomic, AUTH_REGISTRY_PATH, payload)


async def load_sessions() -> Dict[str, Dict[str, str]]:
    return await asyncio.to_thread(read_json_file, SESSIONS_PATH, {})


async def save_sessions(payload: Dict[str, Dict[str, str]]):
    await asyncio.to_thread(write_json_atomic, SESSIONS_PATH, payload)


async def write_binary_file(path: Path, payload: bytes):
    await asyncio.to_thread(path.write_bytes, payload)


async def remove_directory(path: Path):
    await asyncio.to_thread(shutil.rmtree, path, True)


def save_vector_file(path: Path, vector: np.ndarray):
    temp_path = path.with_name(f"{path.stem}.{uuid.uuid4().hex}{path.suffix}")
    np.save(str(temp_path), np.asarray(vector, dtype=np.float32))
    temp_path.replace(path)


def validate_identifier(value: str, field_name: str) -> str:
    if not IDENTIFIER_PATTERN.fullmatch(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}.")
    return value


def validate_password_hash(value: str) -> str:
    if not HASH_PATTERN.fullmatch(value):
        raise HTTPException(status_code=400, detail="Invalid password hash.")
    return value.lower()


def resolve_audio_format(upload: UploadFile) -> str:
    if upload.content_type and "/" in upload.content_type:
        mime_format = upload.content_type.split("/")[-1].split(";")[0].lower()
        canonical = ALLOWED_AUDIO_FORMATS.get(mime_format)
        if canonical:
            return canonical

    suffix = Path(upload.filename).suffix.lower().lstrip(".") if upload.filename else ""
    return ALLOWED_AUDIO_FORMATS.get(suffix, "wav")


def extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing backend session token.")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing backend session token.")
    return token


async def get_current_username(authorization: Optional[str] = Header(None)) -> str:
    token = extract_bearer_token(authorization)
    sessions = await load_sessions()
    session = sessions.get(token)
    if not session or "username" not in session:
        raise HTTPException(status_code=401, detail="Invalid or expired backend session.")
    return validate_identifier(session["username"], "username")


def sample_audio_rank(path: Path) -> int:
    if path.suffix.lower() == ".wav" and not path.name.endswith(".norm.wav"):
        return 0
    if path.name.endswith(".norm.wav"):
        return 2
    return 1


def list_sample_audio_files(card_dir: Path) -> List[Path]:
    sample_files_by_index: Dict[str, Path] = {}
    for path in sorted(card_dir.iterdir()):
        if not path.is_file():
            continue
        if not path.stem.startswith("sample_"):
            continue
        if path.suffix.lower() not in {".wav", ".m4a", ".mp3", ".ogg", ".webm"}:
            continue

        match = re.search(r"sample_(\d+)", path.stem)
        if not match:
            continue
        sample_index = match.group(1)
        existing = sample_files_by_index.get(sample_index)
        if existing is None or sample_audio_rank(path) < sample_audio_rank(existing):
            sample_files_by_index[sample_index] = path
    return [sample_files_by_index[key] for key in sorted(sample_files_by_index.keys(), key=int)]


def resolve_sample_audio_file(card_dir: Path, sample_index: int) -> Optional[Path]:
    for sample_path in list_sample_audio_files(card_dir):
        match = re.search(r"sample_(\d+)", sample_path.stem)
        if match and int(match.group(1)) == sample_index:
            return sample_path
    return None


def resolve_sample_feature_file(card_dir: Path, sample_index: int) -> Optional[Path]:
    npz_path = card_dir / f"sample_{sample_index}.npz"
    if npz_path.exists():
        return npz_path
    legacy_path = card_dir / f"sample_{sample_index}.npy"
    if legacy_path.exists() and legacy_path.name != "prototype.npy" and not legacy_path.name.startswith("sample_embedding_"):
        return legacy_path
    return None


def list_slot_artifacts(card_dir: Path, sample_index: int) -> List[Path]:
    artifacts: List[Path] = []
    for path in card_dir.glob(f"sample_{sample_index}*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".wav", ".m4a", ".mp3", ".ogg", ".webm", ".npz", ".npy", ".json"}:
            continue
        artifacts.append(path)
    embedding_path = card_dir / f"sample_embedding_{sample_index}.npy"
    if embedding_path.exists():
        artifacts.append(embedding_path)
    return artifacts


def load_sample_metadata(card_dir: Path) -> Dict[str, Any]:
    payload = read_json_file(card_dir / "sample_metadata.json", {})
    return payload if isinstance(payload, dict) else {}


def save_sample_metadata(card_dir: Path, payload: Dict[str, Any]):
    write_json_atomic(card_dir / "sample_metadata.json", payload)


def build_quality_labels(profile: Dict[str, Any]) -> Tuple[str, str]:
    consistency = float(profile.get("consistency_score", 0.0))
    sample_count = int(profile.get("sample_count", 0))
    nearest_confusion = float(profile.get("confusable_cards", [{}])[0].get("score", 0.0)) if profile.get("confusable_cards") else 0.0

    if sample_count >= 6 and consistency >= 0.82:
        enrollment_quality = "good"
    elif sample_count >= 3 and consistency >= 0.72:
        enrollment_quality = "fair"
    else:
        enrollment_quality = "poor"

    if nearest_confusion >= 0.88:
        distinctiveness_status = "poor"
    elif nearest_confusion >= 0.8:
        distinctiveness_status = "close"
    else:
        distinctiveness_status = "good"
    return enrollment_quality, distinctiveness_status


def list_complete_sample_indexes(card_dir: Path) -> List[int]:
    sample_indexes: List[int] = []
    for sample_path in list_sample_audio_files(card_dir):
        match = re.search(r"sample_(\d+)", sample_path.stem)
        if not match:
            continue
        sample_index = int(match.group(1))
        feature_path = resolve_sample_feature_file(card_dir, sample_index)
        if feature_path is None:
            continue
        bundle = load_feature_bundle(feature_path, audio_path=sample_path)
        if bundle is None:
            continue
        sample_indexes.append(sample_index)
    return sorted(set(sample_indexes))


def get_card_sample_count(card_dir: Path) -> int:
    return len(list_complete_sample_indexes(card_dir))


def list_card_samples(card_dir: Path) -> List[Dict[str, Any]]:
    samples: List[Dict[str, Any]] = []
    metadata = load_sample_metadata(card_dir)

    for sample_index in list_complete_sample_indexes(card_dir):
        sample_path = resolve_sample_audio_file(card_dir, sample_index)
        feature_path = resolve_sample_feature_file(card_dir, sample_index)
        if sample_path is None or feature_path is None:
            continue

        feature_bundle = load_feature_bundle(feature_path, audio_path=sample_path)
        if feature_bundle is None:
            continue

        entry = metadata.get(str(sample_index), {})
        created_at = float(entry.get("created_at") or sample_path.stat().st_mtime)
        quality_summary = entry.get("quality_summary") or feature_bundle.get("quality_summary", {})
        feature_quality_flags = entry.get(FEATURE_QUALITY_FLAGS_KEY) or feature_bundle.get(FEATURE_QUALITY_FLAGS_KEY, [])

        samples.append(
            {
                "sample_index": sample_index,
                "file_name": sample_path.name,
                "format": sample_path.suffix.lower().lstrip("."),
                "duration_seconds": round(float(feature_bundle.get("duration", 0.0)), 4),
                "created_at": created_at,
                "playback_path": f"/cards/{card_dir.name}/samples/{sample_index}/audio",
                "source": entry.get("source", "manual"),
                "quality_summary": quality_summary,
                FEATURE_QUALITY_FLAGS_KEY: feature_quality_flags,
            }
        )

    return sorted(samples, key=lambda item: int(item["sample_index"]))


def load_card_samples_with_features(card_dir: Path) -> List[Dict[str, Any]]:
    metadata = load_sample_metadata(card_dir)
    samples: List[Dict[str, Any]] = []
    for sample_index in list_complete_sample_indexes(card_dir):
        sample_path = resolve_sample_audio_file(card_dir, sample_index)
        feature_path = resolve_sample_feature_file(card_dir, sample_index)
        if sample_path is None or feature_path is None:
            continue

        features = load_feature_bundle(feature_path, audio_path=sample_path)
        if features is None:
            continue

        entry = metadata.get(str(sample_index), {})
        samples.append(
            {
                "sample_index": sample_index,
                "source": entry.get("source", "manual"),
                "created_at": float(entry.get("created_at") or sample_path.stat().st_mtime),
                "duration": float(features.get("duration", 0.0)),
                "quality_summary": entry.get("quality_summary") or features.get("quality_summary", {}),
                FEATURE_QUALITY_FLAGS_KEY: entry.get(FEATURE_QUALITY_FLAGS_KEY) or features.get(FEATURE_QUALITY_FLAGS_KEY, []),
                "features": features,
            }
        )
    return samples


def load_all_card_profiles(user_dir: Path) -> List[Dict[str, Any]]:
    raw_cards: List[Dict[str, Any]] = []
    for card_path in sorted(user_dir.iterdir()):
        if not card_path.is_dir():
            continue
        meta_path = card_path / "meta.json"
        if not meta_path.exists():
            continue
        meta = read_json_file(meta_path, {})
        if not isinstance(meta, dict):
            continue
        samples = load_card_samples_with_features(card_path)
        if not samples:
            continue
        raw_cards.append(
            {
                "card_path": card_path,
                "label": str(meta.get("label") or card_path.name),
                "phrase_output": str(meta.get("phrase_output") or meta.get("label") or card_path.name),
                "sound_card_id": str(meta.get("id") or card_path.name),
                "samples": samples,
            }
        )

    base_profiles = []
    for card in raw_cards:
        profile = summarize_card_profile(
            card_id=card["sound_card_id"],
            label=card["label"],
            phrase_output=card["phrase_output"],
            samples=card["samples"],
            sibling_cards=[],
        )
        base_profiles.append({**card, **profile})

    final_profiles = []
    for card in raw_cards:
        siblings = [item for item in base_profiles if item["sound_card_id"] != card["sound_card_id"]]
        profile = summarize_card_profile(
            card_id=card["sound_card_id"],
            label=card["label"],
            phrase_output=card["phrase_output"],
            samples=card["samples"],
            sibling_cards=siblings,
        )
        enrollment_quality, distinctiveness_status = build_quality_labels(profile)
        final_profiles.append(
            {
                **card,
                **profile,
                "enrollment_quality": enrollment_quality,
                "distinctiveness_status": distinctiveness_status,
            }
        )
    return final_profiles


def persist_card_profile(card_dir: Path, profile: Dict[str, Any]):
    if isinstance(profile.get("prototype"), np.ndarray):
        save_vector_file(card_dir / "prototype.npy", profile["prototype"])
    if isinstance(profile.get("shape_prototype"), np.ndarray):
        save_vector_file(card_dir / "signature_prototype.npy", profile["shape_prototype"])

    meta_payload = {
        "label": profile["label"],
        "id": profile["sound_card_id"],
        "phrase_output": profile["phrase_output"],
        "consistency_score": profile["consistency_score"],
        "similarity_threshold": profile["similarity_threshold"],
        "margin_threshold": profile["margin_threshold"],
        "readiness": profile["readiness"],
        "sample_cap": MAX_CARD_SAMPLES,
        "feature_bundle_version": FEATURE_BUNDLE_VERSION,
        "enrollment_quality": profile["enrollment_quality"],
        "distinctiveness_status": profile["distinctiveness_status"],
        "recommended_action": profile.get("recommended_action"),
        "confusable_cards": profile.get("confusable_cards", []),
        "updated_at": time.time(),
    }
    write_json_atomic(card_dir / "meta.json", meta_payload)


@app.post("/auth/sync-user")
async def sync_user(payload: SyncUserPayload):
    username = validate_identifier(payload.username, "username")
    password_hash = validate_password_hash(payload.password_hash)

    async with STATE_LOCK:
        registry = await load_registry()
        existing_hash = registry.get(username)
        if existing_hash and existing_hash != password_hash:
            raise HTTPException(status_code=409, detail="This backend account is already registered.")
        if not existing_hash:
            registry[username] = password_hash
            await save_registry(registry)

    return {"status": "ok"}


@app.post("/auth/session")
async def open_session(payload: SessionPayload):
    username = validate_identifier(payload.username, "username")
    password_hash = validate_password_hash(payload.password_hash)

    registry = await load_registry()
    existing_hash = registry.get(username)
    if not existing_hash:
        raise HTTPException(status_code=404, detail="No backend account found for this username.")
    if existing_hash != password_hash:
        raise HTTPException(status_code=401, detail="Invalid backend credentials.")

    token = uuid.uuid4().hex
    async with STATE_LOCK:
        sessions = await load_sessions()
        sessions[token] = {"username": username, "created_at": str(uuid.uuid4())}
        await save_sessions(sessions)

    return {"token": token}


@app.post("/auth/session/close")
async def close_session(payload: CloseSessionPayload):
    if not payload.token:
        return {"status": "ok"}

    async with STATE_LOCK:
        sessions = await load_sessions()
        sessions.pop(payload.token, None)
        await save_sessions(sessions)
    return {"status": "ok"}


@app.get("/health")
async def health():
    return {"status": "ok", "ffmpeg": FFMPEG_AVAILABLE}


@app.get("/cards")
async def get_cards(
    current_username: str = Depends(get_current_username),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    user_dir = SAMPLES_DIR / current_username
    if not user_dir.exists():
        return {"cards": [], "total": 0, "limit": limit, "offset": offset}

    profiles = await asyncio.to_thread(load_all_card_profiles, user_dir)
    cards = [
        {
            "sound_card_id": profile["sound_card_id"],
            "label": profile["label"],
            "phrase_output": profile["phrase_output"],
            "sample_count": profile["sample_count"],
            "readiness": profile["readiness"],
            "sample_cap": profile["sample_cap"],
            "feature_bundle_version": profile["feature_bundle_version"],
            "similarity_threshold": profile["similarity_threshold"],
            "margin_threshold": profile["margin_threshold"],
            "enrollment_quality": profile["enrollment_quality"],
            "distinctiveness_status": profile["distinctiveness_status"],
            "consistency_score": profile["consistency_score"],
            "recommended_action": profile.get("recommended_action"),
            "confusable_cards": profile.get("confusable_cards", []),
        }
        for profile in profiles
    ]
    total = len(cards)
    return {"cards": cards[offset : offset + limit], "total": total, "limit": limit, "offset": offset}


@app.get("/cards/{sound_card_id}/samples")
async def get_card_samples(
    sound_card_id: str,
    current_username: str = Depends(get_current_username),
):
    safe_card_id = validate_identifier(sound_card_id, "sound_card_id")
    card_dir = SAMPLES_DIR / current_username / safe_card_id
    if not card_dir.exists():
        return {"samples": []}
    return {"samples": list_card_samples(card_dir)}


@app.get("/cards/{sound_card_id}/samples/{sample_index}/audio")
async def get_card_sample_audio(
    sound_card_id: str,
    sample_index: int,
    current_username: str = Depends(get_current_username),
):
    if sample_index < 1:
        raise HTTPException(status_code=400, detail="Invalid sample index.")

    safe_card_id = validate_identifier(sound_card_id, "sound_card_id")
    card_dir = SAMPLES_DIR / current_username / safe_card_id
    if not card_dir.exists():
        raise HTTPException(status_code=404, detail="Training card not found.")

    sample_path = resolve_sample_audio_file(card_dir, sample_index)
    if sample_path is None or not sample_path.exists():
        raise HTTPException(status_code=404, detail="Training sample not found.")

    media_type = f"audio/{sample_path.suffix.lower().lstrip('.') or 'wav'}"
    return FileResponse(str(sample_path), media_type=media_type, filename=sample_path.name)


@app.delete("/cards/{sound_card_id}")
async def delete_card(
    sound_card_id: str,
    current_username: str = Depends(get_current_username),
):
    safe_card_id = validate_identifier(sound_card_id, "sound_card_id")
    card_dir = SAMPLES_DIR / current_username / safe_card_id
    if card_dir.exists():
        await remove_directory(card_dir)
    return {"status": "ok"}


@app.post("/cards/{sound_card_id}/reset")
async def reset_card_training(
    sound_card_id: str,
    current_username: str = Depends(get_current_username),
):
    safe_card_id = validate_identifier(sound_card_id, "sound_card_id")
    card_dir = SAMPLES_DIR / current_username / safe_card_id
    if not card_dir.exists():
        return {"status": "ok", "sample_count": 0}

    async with STATE_LOCK:
        for artifact in list(card_dir.glob("*")):
            if artifact.name == "meta.json":
                continue
            if artifact.is_file():
                await asyncio.to_thread(artifact.unlink)
    return {"status": "ok", "sample_count": 0}


@app.post("/train-sample")
async def train_sample(
    file: UploadFile = File(...),
    label: str = Form(...),
    sound_card_id: str = Form(...),
    sample_index: int = Form(...),
    phrase_output: Optional[str] = Form(None),
    sample_source: Optional[str] = Form(None),
    current_username: str = Depends(get_current_username),
):
    if sample_index < 1 or sample_index > MAX_CARD_SAMPLES:
        raise HTTPException(status_code=400, detail="Invalid sample index.")

    safe_card_id = validate_identifier(sound_card_id, "sound_card_id")
    file_format = resolve_audio_format(file)
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded audio sample was empty.")
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Upload exceeds the 3 MB maximum payload size.")

    source = sample_source if sample_source in {"manual", "confirmed_match", "corrected_match"} else "manual"
    user_dir = SAMPLES_DIR / current_username
    user_dir.mkdir(exist_ok=True)
    card_dir = user_dir / safe_card_id
    card_dir.mkdir(exist_ok=True)

    commit_id = uuid.uuid4().hex
    raw_path = card_dir / f"__upload_{commit_id}.{file_format}"
    staged_audio_path = card_dir / f"__sample_{sample_index}_{commit_id}.wav"
    staged_feature_path = card_dir / f"__sample_{sample_index}_{commit_id}.npz"
    staged_embedding_path = card_dir / f"__sample_embedding_{sample_index}_{commit_id}.npy"
    final_audio_path = card_dir / f"sample_{sample_index}.wav"
    final_feature_path = card_dir / f"sample_{sample_index}.npz"
    final_embedding_path = card_dir / f"sample_embedding_{sample_index}.npy"

    await write_binary_file(raw_path, file_bytes)
    try:
        preprocessing = await asyncio.to_thread(
            preprocess_audio,
            raw_path,
            staged_audio_path,
            file_format=file_format,
            ffmpeg_available=FFMPEG_AVAILABLE,
        )
    finally:
        if raw_path.exists():
            raw_path.unlink()

    features = await asyncio.to_thread(extract_feature_bundle, staged_audio_path, preprocessing=preprocessing)
    audio_quality = await asyncio.to_thread(inspect_audio_quality, staged_audio_path)
    rejection = quality_rejection_reason(preprocessing, audio_quality)
    if features is None or rejection is not None:
        if staged_audio_path.exists():
            staged_audio_path.unlink()
        error_code, detail = rejection or ("SILENCE_DETECTED", "No usable vocalization was detected.")
        return JSONResponse(status_code=422, content={"error_code": error_code, "detail": detail})

    existing_profiles = await asyncio.to_thread(load_all_card_profiles, user_dir)
    current_profile = next((profile for profile in existing_profiles if profile["sound_card_id"] == safe_card_id), None)
    if current_profile and int(current_profile.get("sample_count", 0)) >= 2 and current_profile.get("prototype") is not None:
        similarity = float(np.dot(features["vector"], current_profile["prototype"]))
        if similarity < 0.55:
            if staged_audio_path.exists():
                staged_audio_path.unlink()
            return JSONResponse(
                status_code=422,
                content={
                    "error_code": "CONSISTENCY_MISMATCH",
                    "detail": "That take sounded too different from the saved pattern for this card.",
                },
            )

    await asyncio.to_thread(save_feature_bundle_at, staged_feature_path, features)
    await asyncio.to_thread(save_vector_file, staged_embedding_path, features["vector"])

    slot_backups: List[Tuple[Path, Path]] = []
    commit_completed = False
    training_response: Dict[str, Any] = {}
    async with STATE_LOCK:
        try:
            for existing_path in list_slot_artifacts(card_dir, sample_index):
                backup_path = existing_path.with_name(f"{existing_path.name}.{commit_id}.bak")
                await asyncio.to_thread(existing_path.replace, backup_path)
                slot_backups.append((existing_path, backup_path))

            await asyncio.to_thread(staged_audio_path.replace, final_audio_path)
            await asyncio.to_thread(staged_feature_path.replace, final_feature_path)
            await asyncio.to_thread(staged_embedding_path.replace, final_embedding_path)

            metadata = load_sample_metadata(card_dir)
            metadata[str(sample_index)] = {
                "sample_index": sample_index,
                "source": source,
                "created_at": time.time(),
                "quality_summary": features.get("quality_summary", {}),
                FEATURE_QUALITY_FLAGS_KEY: features.get(FEATURE_QUALITY_FLAGS_KEY, []),
            }
            await asyncio.to_thread(save_sample_metadata, card_dir, metadata)

            profiles = load_all_card_profiles(user_dir)
            profile = next((item for item in profiles if item["sound_card_id"] == safe_card_id), None)
            if profile is None:
                raise RuntimeError("Failed to rebuild the trained card profile.")
            await asyncio.to_thread(persist_card_profile, card_dir, profile)

            training_response = {
                "status": "success",
                "sound_card_id": safe_card_id,
                "sample_count": int(profile["sample_count"]),
                "sample_index": sample_index,
                "readiness": profile["readiness"],
                "sample_cap": profile["sample_cap"],
                "enrollment_quality": profile["enrollment_quality"],
                "distinctiveness_status": profile["distinctiveness_status"],
                "consistency_score": profile["consistency_score"],
                "recommended_action": profile.get("recommended_action"),
            }
            commit_completed = True
        except Exception:
            for path in [final_audio_path, final_feature_path, final_embedding_path]:
                if path.exists():
                    await asyncio.to_thread(path.unlink, True)
            for original_path, backup_path in reversed(slot_backups):
                if backup_path.exists():
                    await asyncio.to_thread(backup_path.replace, original_path)
            raise
        finally:
            if commit_completed:
                for _original_path, backup_path in slot_backups:
                    if backup_path.exists():
                        await asyncio.to_thread(backup_path.unlink, True)
            for staged_path in [staged_audio_path, staged_feature_path, staged_embedding_path]:
                if staged_path.exists():
                    await asyncio.to_thread(staged_path.unlink, True)

    return training_response


async def recognize_internal(audio: UploadFile, current_username: str) -> Dict[str, Any]:
    file_format = resolve_audio_format(audio)
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="The uploaded audio clip was empty.")
    if len(audio_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Upload exceeds the 3 MB maximum payload size.")

    input_id = uuid.uuid4().hex
    raw_path = BASE_DIR / f"temp_{input_id}.{file_format}"
    temp_path = BASE_DIR / f"temp_{input_id}.wav"
    await write_binary_file(raw_path, audio_bytes)

    try:
        preprocessing = await asyncio.to_thread(
            preprocess_audio,
            raw_path,
            temp_path,
            file_format=file_format,
            ffmpeg_available=FFMPEG_AVAILABLE,
        )
        feature_bundle = await asyncio.to_thread(extract_feature_bundle, temp_path, preprocessing=preprocessing)
        audio_quality = await asyncio.to_thread(inspect_audio_quality, temp_path)
        if feature_bundle is None:
            raise HTTPException(status_code=400, detail="Could not extract features from input.")

        user_dir = SAMPLES_DIR / current_username
        if not user_dir.exists():
            prediction = predict_vocalization(
                input_bundle=feature_bundle,
                input_quality=audio_quality,
                input_preprocessing=preprocessing,
                cards=[],
            )
        else:
            profiles = await asyncio.to_thread(load_all_card_profiles, user_dir)
            prediction = predict_vocalization(
                input_bundle=feature_bundle,
                input_quality=audio_quality,
                input_preprocessing=preprocessing,
                cards=profiles,
            )

        legacy_reason = {
            "no_samples": "no_samples",
            "low_margin_between_top_matches": "low_margin",
            "needs_confirmation_low_data": "low_margin",
            "low_similarity": "below_threshold",
            "low_signal": "below_threshold",
        }.get(prediction.get("reason"), None)

        return {
            "predictedCard": prediction["predictedCard"],
            "confidence": prediction["confidence"],
            "topMatches": prediction["topMatches"],
            "accepted": prediction["accepted"],
            "reason": prediction.get("reason"),
            "debug": prediction.get("debug"),
            "match_label": prediction.get("predictedCard") if prediction.get("accepted") else None,
            "sound_card_id": prediction.get("sound_card_id"),
            "phrase_output": prediction.get("phrase_output"),
            "message": prediction.get("message"),
            "decision_source": prediction.get("decision_source"),
            "best_similarity": prediction.get("best_similarity"),
            "second_best_similarity": prediction.get("second_best_similarity"),
            "support_score": prediction.get("support_score"),
            "active_signal_count": prediction.get("active_signal_count"),
            "rejection_reason": legacy_reason,
        }
    finally:
        if raw_path.exists():
            raw_path.unlink()
        if temp_path.exists():
            temp_path.unlink()


@app.post("/recognize")
async def recognize(
    audio: UploadFile = File(...),
    current_username: str = Depends(get_current_username),
):
    return await recognize_internal(audio, current_username)


@app.post("/predict")
async def predict(
    audio: UploadFile = File(...),
    current_username: str = Depends(get_current_username),
):
    return await recognize_internal(audio, current_username)


@app.get("/debug/cards/{sound_card_id}/analysis")
async def get_card_debug_analysis(
    sound_card_id: str,
    current_username: str = Depends(get_current_username),
):
    safe_card_id = validate_identifier(sound_card_id, "sound_card_id")
    user_dir = SAMPLES_DIR / current_username
    if not user_dir.exists():
        return {"card": None}

    profiles = await asyncio.to_thread(load_all_card_profiles, user_dir)
    profile = next((item for item in profiles if item["sound_card_id"] == safe_card_id), None)
    if profile is None:
        raise HTTPException(status_code=404, detail="Training card not found.")

    return {"card": build_card_debug_summary(profile, profile["samples"])}


@app.get("/debug/evaluation")
async def get_debug_evaluation(current_username: str = Depends(get_current_username)):
    user_dir = SAMPLES_DIR / current_username
    if not user_dir.exists():
        return {"sampleCount": 0, "acceptedAccuracy": 0.0, "rejectionRate": 0.0, "mostConfusableCards": [], "evaluations": []}
    profiles = await asyncio.to_thread(load_all_card_profiles, user_dir)
    return await asyncio.to_thread(leave_one_out_evaluation, profiles)


def run():
    uvicorn.run(app, host="0.0.0.0", port=8000)
