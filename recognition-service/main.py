import asyncio
import json
import os
import re
import shutil
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import librosa
import numpy as np
import uvicorn
from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from pydub import AudioSegment
from scipy.spatial.distance import cosine

# ---------------------------------------------------------------------------
# FFmpeg discovery
# ---------------------------------------------------------------------------
LOCAL_FFMPEG = Path(__file__).resolve().parent / "ffmpeg.exe"
SYSTEM_FFMPEG = shutil.which("ffmpeg")

if LOCAL_FFMPEG.exists():
    AudioSegment.converter = str(LOCAL_FFMPEG)
    FFMPEG_AVAILABLE = True
    print(f"[Backend] Using local FFmpeg: {LOCAL_FFMPEG}")
elif SYSTEM_FFMPEG:
    AudioSegment.converter = SYSTEM_FFMPEG
    FFMPEG_AVAILABLE = True
    print(f"[Backend] Using system FFmpeg: {SYSTEM_FFMPEG}")
else:
    FFMPEG_AVAILABLE = False
    print("[Backend] WARNING: FFmpeg not detected locally or in PATH.")

# ---------------------------------------------------------------------------
# Settings & Paths
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class SyncUserPayload(BaseModel):
    username: str
    password_hash: str


class SessionPayload(BaseModel):
    username: str
    password_hash: str


class CloseSessionPayload(BaseModel):
    token: str


# ---------------------------------------------------------------------------
# Storage helpers
# ---------------------------------------------------------------------------
def read_json_file(path: Path, default):
    if not path.exists():
        return default

    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return default


def write_json_atomic(path: Path, payload):
    temp_path = path.with_name(f"{path.name}.{uuid.uuid4().hex}.tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle)
    temp_path.replace(path)


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


def save_feature_bundle(file_path: Path, features: Dict[str, np.ndarray | float]):
    save_feature_bundle_at(file_path.with_suffix(".npz"), features)


def save_feature_bundle_at(target_path: Path, features: Dict[str, np.ndarray | float]):
    temp_path = target_path.with_name(f"{target_path.stem}.{uuid.uuid4().hex}.npz")
    np.savez(
        str(temp_path),
        sequence=np.asarray(features["sequence"], dtype=np.float32),
        aggregate=np.asarray(features["aggregate"], dtype=np.float32),
        duration=np.asarray(features["duration"], dtype=np.float32),
    )
    temp_path.replace(target_path)


def save_vector_file(path: Path, vector: np.ndarray):
    temp_path = path.with_name(f"{path.stem}.{uuid.uuid4().hex}{path.suffix}")
    np.save(str(temp_path), np.asarray(vector, dtype=np.float32))
    temp_path.replace(path)


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------
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
    canonical = ALLOWED_AUDIO_FORMATS.get(suffix)
    if canonical:
        return canonical

    # Extensionless legacy samples need an explicit default for normalization.
    return "wav"


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


# ---------------------------------------------------------------------------
# Audio Processing Logic
# ---------------------------------------------------------------------------
def normalize_audio(input_path: Path, output_path: Path, file_format: str = "wav"):
    """
    Normalizes audio into a stable mono 22.05 kHz WAV used for calibration/playback.
    """
    decode_path = output_path.with_name(f"{output_path.stem}.{uuid.uuid4().hex}.decode.wav")

    try:
        if FFMPEG_AVAILABLE:
            audio = AudioSegment.from_file(str(input_path), format=file_format)
            audio = audio.set_channels(1).set_frame_rate(22050)
            audio.export(str(decode_path), format="wav")
            load_path = decode_path
        else:
            load_path = input_path

        y, sr = librosa.load(str(load_path), sr=22050, mono=True)
        y_trimmed, _ = librosa.effects.trim(y, top_db=20)
        if y_trimmed.size == 0:
            y_trimmed = y

        import soundfile as sf

        sf.write(str(output_path), y_trimmed, sr, format="WAV")
    except Exception as e:
        print(f"[Backend] Normalization error: {e}")
        raise
    finally:
        if decode_path.exists():
            decode_path.unlink()


def _normalize_sequence(sequence: np.ndarray) -> np.ndarray:
    mean = np.mean(sequence, axis=1, keepdims=True)
    std = np.std(sequence, axis=1, keepdims=True) + 1e-6
    return (sequence - mean) / std


def _load_audio(file_path: Path) -> Tuple[np.ndarray, int]:
    y, sr = librosa.load(str(file_path), sr=22050)
    y, _ = librosa.effects.trim(y, top_db=25)
    return y.astype(np.float32), sr


def _safe_stat(values: np.ndarray, stat: str) -> np.ndarray:
    if values.ndim == 1:
        values = values.reshape(1, -1)
    if values.shape[1] == 0:
        return np.zeros(values.shape[0], dtype=np.float32)
    if stat == "mean":
        return np.mean(values, axis=1).astype(np.float32)
    if stat == "std":
        return np.std(values, axis=1).astype(np.float32)
    if stat == "p10":
        return np.percentile(values, 10, axis=1).astype(np.float32)
    if stat == "p90":
        return np.percentile(values, 90, axis=1).astype(np.float32)
    raise ValueError(f"Unsupported stat {stat}")


def _normalize_vector(vector: np.ndarray) -> np.ndarray:
    vector = np.asarray(vector, dtype=np.float32)
    norm = float(np.linalg.norm(vector))
    if norm <= 1e-8:
        return vector
    return vector / norm


def _cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    a = _normalize_vector(vec_a)
    b = _normalize_vector(vec_b)
    similarity = float(np.dot(a, b))
    return max(-1.0, min(1.0, similarity))


def _sample_audio_rank(path: Path) -> int:
    if path.suffix.lower() == ".wav" and not path.name.endswith(".norm.wav"):
        return 0
    if path.name.endswith(".norm.wav"):
        return 2
    return 1


def _list_sample_audio_files(card_dir: Path) -> List[Path]:
    sample_files_by_index: Dict[str, Path] = {}

    for path in sorted(card_dir.iterdir()):
        if not path.is_file():
            continue
        if not path.stem.startswith("sample_"):
            continue
        if path.suffix.lower() not in {".wav", ".m4a", ".mp3", ".ogg", ".webm"}:
            continue

        sample_index = _extract_sample_index(path)
        if sample_index is None:
            continue

        existing = sample_files_by_index.get(sample_index)
        if existing is None or _sample_audio_rank(path) < _sample_audio_rank(existing):
            sample_files_by_index[sample_index] = path

    return [sample_files_by_index[key] for key in sorted(sample_files_by_index.keys(), key=int)]


def _resolve_sample_audio_file(card_dir: Path, sample_index: int) -> Optional[Path]:
    index_key = str(sample_index)
    for sample_path in _list_sample_audio_files(card_dir):
        if _extract_sample_index(sample_path) == index_key:
            return sample_path
    return None


def _list_sample_embedding_files(card_dir: Path) -> List[Path]:
    return sorted(card_dir.glob("sample_embedding_*.npy"))


def _resolve_sample_feature_file(card_dir: Path, sample_index: int) -> Optional[Path]:
    npz_path = card_dir / f"sample_{sample_index}.npz"
    if npz_path.exists():
        return npz_path

    legacy_path = card_dir / f"sample_{sample_index}.npy"
    if legacy_path.exists() and legacy_path.name != "prototype.npy" and not legacy_path.name.startswith("sample_embedding_"):
        return legacy_path

    return None


def _sample_slot_is_complete(card_dir: Path, sample_index: int) -> bool:
    sample_path = _resolve_sample_audio_file(card_dir, sample_index)
    if sample_path is None or not sample_path.exists():
        return False

    feature_path = _resolve_sample_feature_file(card_dir, sample_index)
    if feature_path is None or load_feature_bundle(feature_path) is None:
        return False

    embedding_path = card_dir / f"sample_embedding_{sample_index}.npy"
    if not embedding_path.exists():
        return False

    embedding = _load_embedding(embedding_path)
    return embedding is not None


def _list_complete_sample_indexes(card_dir: Path) -> List[int]:
    sample_indexes: List[int] = []
    seen_indexes = set()

    for sample_path in _list_sample_audio_files(card_dir):
        sample_index = _extract_sample_index(sample_path)
        if sample_index is None:
            continue

        sample_index_int = int(sample_index)
        if sample_index_int in seen_indexes:
            continue

        if _sample_slot_is_complete(card_dir, sample_index_int):
            seen_indexes.add(sample_index_int)
            sample_indexes.append(sample_index_int)

    return sorted(sample_indexes)


def _list_slot_artifacts(card_dir: Path, sample_index: int) -> List[Path]:
    artifacts: List[Path] = []

    for path in card_dir.glob(f"sample_{sample_index}*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".wav", ".m4a", ".mp3", ".ogg", ".webm", ".npz", ".npy"}:
            continue
        artifacts.append(path)

    embedding_path = card_dir / f"sample_embedding_{sample_index}.npy"
    if embedding_path.exists():
        artifacts.append(embedding_path)

    return artifacts


def get_card_sample_count(card_dir: Path) -> int:
    return len(_list_complete_sample_indexes(card_dir))


def _load_embedding(path: Path) -> Optional[np.ndarray]:
    try:
        return _normalize_vector(np.load(str(path)).astype(np.float32))
    except Exception as e:
        print(f"[Backend] Embedding load error: {e}")
        return None


def extract_embedding_from_array(y: np.ndarray, sr: int) -> Optional[np.ndarray]:
    try:
        if y.size == 0:
            return None

        mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=1024, hop_length=256, n_mels=64, fmax=8000)
        log_mel = librosa.power_to_db(mel + 1e-6)
        mfcc = librosa.feature.mfcc(S=log_mel, n_mfcc=20)
        delta = librosa.feature.delta(mfcc)
        delta2 = librosa.feature.delta(mfcc, order=2)
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        flatness = librosa.feature.spectral_flatness(y=y)
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
        zcr = librosa.feature.zero_crossing_rate(y)
        rms = librosa.feature.rms(y=y)

        voiced_fraction = float(np.mean(rms > max(np.mean(rms) * 0.55, 0.008))) if rms.size else 0.0
        clipping_ratio = float(np.mean(np.abs(y) >= 0.98))
        peak_level = float(np.max(np.abs(y))) if y.size else 0.0
        duration = float(len(y) / sr)

        parts = [
            _safe_stat(log_mel, "mean"),
            _safe_stat(log_mel, "std"),
            _safe_stat(log_mel, "p10"),
            _safe_stat(log_mel, "p90"),
            _safe_stat(mfcc, "mean"),
            _safe_stat(mfcc, "std"),
            _safe_stat(delta, "mean"),
            _safe_stat(delta, "std"),
            _safe_stat(delta2, "mean"),
            _safe_stat(delta2, "std"),
            _safe_stat(contrast, "mean"),
            _safe_stat(contrast, "std"),
            np.array(
                [
                    float(np.mean(centroid)),
                    float(np.std(centroid)),
                    float(np.mean(bandwidth)),
                    float(np.std(bandwidth)),
                    float(np.mean(flatness)),
                    float(np.std(flatness)),
                    float(np.mean(rolloff)),
                    float(np.std(rolloff)),
                    float(np.mean(zcr)),
                    float(np.std(zcr)),
                    float(np.mean(rms)),
                    float(np.std(rms)),
                    voiced_fraction,
                    clipping_ratio,
                    peak_level,
                    duration,
                ],
                dtype=np.float32,
            ),
        ]

        return _normalize_vector(np.concatenate(parts).astype(np.float32))
    except Exception as e:
        print(f"[Backend] Embedding extraction error: {e}")
        return None


def extract_embedding(file_path: Path) -> Optional[np.ndarray]:
    try:
        y, sr = _load_audio(file_path)
        return extract_embedding_from_array(y, sr)
    except Exception as e:
        print(f"[Backend] Embedding extraction error: {e}")
        return None


def build_augmented_embeddings(file_path: Path) -> List[np.ndarray]:
    try:
        y, sr = _load_audio(file_path)
        if y.size == 0:
            return []

        variants: List[np.ndarray] = []
        base = extract_embedding_from_array(y, sr)
        if base is not None:
            variants.append(base)

        try:
            stretched = librosa.effects.time_stretch(y, rate=1.04)
            embedding = extract_embedding_from_array(stretched.astype(np.float32), sr)
            if embedding is not None:
                variants.append(embedding)
        except Exception:
            pass

        try:
            shifted = librosa.effects.pitch_shift(y, sr=sr, n_steps=0.35)
            embedding = extract_embedding_from_array(shifted.astype(np.float32), sr)
            if embedding is not None:
                variants.append(embedding)
        except Exception:
            pass

        gain_adjusted = np.clip(y * 1.04, -1.0, 1.0).astype(np.float32)
        embedding = extract_embedding_from_array(gain_adjusted, sr)
        if embedding is not None:
            variants.append(embedding)

        noise_scale = max(float(np.std(y)) * 0.01, 0.0008)
        noisy = np.clip(y + np.random.normal(0.0, noise_scale, size=y.shape).astype(np.float32), -1.0, 1.0)
        embedding = extract_embedding_from_array(noisy.astype(np.float32), sr)
        if embedding is not None:
            variants.append(embedding)

        return variants
    except Exception as e:
        print(f"[Backend] Augmentation error: {e}")
        return []


def extract_features(file_path: Path) -> Optional[Dict[str, np.ndarray | float]]:
    try:
        y, sr = _load_audio(file_path)
        if y.size == 0:
            return None

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        delta = librosa.feature.delta(mfcc)
        delta2 = librosa.feature.delta(mfcc, order=2)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        rms = librosa.feature.rms(y=y)[0]
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        duration = len(y) / sr

        sequence = np.concatenate([mfcc, delta, delta2], axis=0)
        sequence = _normalize_sequence(sequence)

        aggregate = np.concatenate(
            [
                np.mean(mfcc, axis=1),
                np.std(mfcc, axis=1),
                np.mean(chroma, axis=1),
                np.array(
                    [
                        float(np.mean(rms)),
                        float(np.std(rms)),
                        float(np.mean(centroid)),
                        float(np.std(centroid)),
                        float(np.mean(zcr)),
                        float(duration),
                    ]
                ),
            ]
        ).astype(np.float32)

        return {
            "sequence": sequence.astype(np.float32),
            "aggregate": aggregate,
            "duration": float(duration),
        }
    except Exception as e:
        print(f"[Backend] Feature extraction error: {e}")
        return None


def inspect_audio_quality(file_path: Path) -> Dict[str, float]:
    try:
        y, sr = _load_audio(file_path)
        if y.size == 0:
            return {
                "duration": 0.0,
                "mean_rms": 0.0,
                "clipping_ratio": 0.0,
                "noise_floor": 0.0,
                "peak_level": 0.0,
                "voiced_fraction": 0.0,
            }

        rms = librosa.feature.rms(y=y)[0]
        duration = len(y) / sr
        mean_rms = float(np.mean(rms)) if rms.size > 0 else 0.0
        clipping_ratio = float(np.mean(np.abs(y) >= 0.98))
        noise_floor = float(np.percentile(np.abs(y), 20))
        peak_level = float(np.max(np.abs(y))) if y.size > 0 else 0.0
        voiced_fraction = float(np.mean(rms > max(mean_rms * 0.55, 0.008))) if rms.size > 0 else 0.0
        return {
            "duration": float(duration),
            "mean_rms": mean_rms,
            "clipping_ratio": clipping_ratio,
            "noise_floor": noise_floor,
            "peak_level": peak_level,
            "voiced_fraction": voiced_fraction,
        }
    except Exception as e:
        print(f"[Backend] Audio quality inspection error: {e}")
        return {
            "duration": 0.0,
            "mean_rms": 0.0,
            "clipping_ratio": 0.0,
            "noise_floor": 0.0,
            "peak_level": 0.0,
            "voiced_fraction": 0.0,
        }


def load_feature_bundle(feature_path: Path) -> Optional[Dict[str, np.ndarray | float]]:
    try:
        if feature_path.suffix == ".npz":
            bundle = np.load(str(feature_path))
            return {
                "sequence": bundle["sequence"].astype(np.float32),
                "aggregate": bundle["aggregate"].astype(np.float32),
                "duration": float(bundle["duration"]),
            }

        legacy = np.load(str(feature_path))
        aggregate = np.asarray(legacy, dtype=np.float32)
        sequence = np.tile(aggregate.reshape(-1, 1), (1, 2))
        return {
            "sequence": sequence,
            "aggregate": aggregate,
            "duration": 0.0,
        }
    except Exception as e:
        print(f"[Backend] Feature bundle load error: {e}")
        return None


def build_feature_signature(features: Dict[str, np.ndarray | float]) -> np.ndarray:
    sequence = np.asarray(features["sequence"], dtype=np.float32)
    aggregate = np.asarray(features["aggregate"], dtype=np.float32)
    duration = float(features["duration"])

    if sequence.ndim != 2 or sequence.shape[1] == 0:
        return _normalize_vector(np.concatenate([aggregate, np.array([duration], dtype=np.float32)]))

    # Keep the most speech-like coefficients and preserve beginning/middle/end shape.
    signature_base = sequence[: min(24, sequence.shape[0]), :]
    segments: List[np.ndarray] = []
    for segment in np.array_split(signature_base, 3, axis=1):
        if segment.shape[1] == 0:
            mean_part = np.zeros(signature_base.shape[0], dtype=np.float32)
            std_part = np.zeros(signature_base.shape[0], dtype=np.float32)
        else:
            mean_part = np.mean(segment, axis=1).astype(np.float32)
            std_part = np.std(segment, axis=1).astype(np.float32)
        segments.extend([mean_part, std_part])

    signature = np.concatenate(
        [
            aggregate,
            *segments,
            np.array([duration], dtype=np.float32),
        ]
    ).astype(np.float32)
    return _normalize_vector(signature)


def _extract_sample_index(path: Path) -> Optional[str]:
    match = re.search(r"sample_(\d+)", path.stem)
    if not match:
        return None
    return match.group(1)


def list_card_samples(card_dir: Path) -> List[Dict[str, object]]:
    samples: List[Dict[str, object]] = []

    for sample_index in _list_complete_sample_indexes(card_dir):
        sample_path = _resolve_sample_audio_file(card_dir, sample_index)
        feature_path = _resolve_sample_feature_file(card_dir, sample_index)
        if sample_path is None or feature_path is None:
            continue

        feature_bundle = load_feature_bundle(feature_path)
        duration = None
        if feature_bundle is not None:
            duration = float(feature_bundle["duration"])

        try:
            created_at = sample_path.stat().st_mtime
        except Exception:
            created_at = 0.0

        samples.append(
            {
                "sample_index": int(sample_index),
                "file_name": sample_path.name,
                "format": sample_path.suffix.lower().lstrip("."),
                "duration_seconds": round(duration, 4) if duration is not None else None,
                "created_at": created_at,
            }
        )

    return sorted(samples, key=lambda item: int(item["sample_index"]))


def _meta_updated_at(meta: Dict[str, object], meta_path: Path) -> float:
    updated_at = meta.get("updated_at")
    if isinstance(updated_at, (int, float)):
        return float(updated_at)
    try:
        return meta_path.stat().st_mtime
    except Exception:
        return 0.0


def load_card_sample_representations(card_dir: Path) -> List[Dict[str, object]]:
    representations: List[Dict[str, object]] = []

    for sample_index in _list_complete_sample_indexes(card_dir):
        feature_path = _resolve_sample_feature_file(card_dir, sample_index)
        if feature_path is None:
            continue
        features = load_feature_bundle(feature_path)
        if features is None:
            continue

        embedding = _load_embedding(card_dir / f"sample_embedding_{sample_index}.npy")

        representations.append(
            {
                "features": features,
                "signature": build_feature_signature(features),
                "embedding": embedding,
            }
        )

    return representations


def compute_aggregate_similarity(
    input_features: Dict[str, np.ndarray | float],
    sample_features: Dict[str, np.ndarray | float],
) -> float:
    input_aggregate = np.asarray(input_features["aggregate"], dtype=np.float32)
    sample_aggregate = np.asarray(sample_features["aggregate"], dtype=np.float32)
    cosine_distance = float(cosine(input_aggregate, sample_aggregate))
    if not np.isfinite(cosine_distance):
        return 0.0
    return max(0.0, min(1.0, 1.0 - (cosine_distance / 2.0)))


def compute_sample_distance(
    input_features: Dict[str, np.ndarray | float],
    sample_features: Dict[str, np.ndarray | float],
) -> float:
    input_sequence = np.asarray(input_features["sequence"], dtype=np.float32)
    sample_sequence = np.asarray(sample_features["sequence"], dtype=np.float32)
    input_aggregate = np.asarray(input_features["aggregate"], dtype=np.float32)
    sample_aggregate = np.asarray(sample_features["aggregate"], dtype=np.float32)

    dtw_cost_matrix, path = librosa.sequence.dtw(X=input_sequence, Y=sample_sequence, metric="cosine")
    dtw_score = float(dtw_cost_matrix[-1, -1]) / max(len(path), 1)

    cosine_score = float(cosine(input_aggregate, sample_aggregate))
    if not np.isfinite(cosine_score):
        cosine_score = 1.0

    euclidean_score = float(np.linalg.norm(input_aggregate - sample_aggregate) / max(len(input_aggregate), 1))
    duration_penalty = abs(
        np.log((float(input_features["duration"]) + 1e-6) / (float(sample_features["duration"]) + 1e-6))
    )

    return (
        (dtw_score * 0.55)
        + (cosine_score * 0.2)
        + (euclidean_score * 0.15)
        + (duration_penalty * 0.1)
    )


def compute_hybrid_similarity(
    input_features: Dict[str, np.ndarray | float],
    sample_features: Dict[str, np.ndarray | float],
    input_embedding: Optional[np.ndarray] = None,
    sample_embedding: Optional[np.ndarray] = None,
    input_signature: Optional[np.ndarray] = None,
    sample_signature: Optional[np.ndarray] = None,
) -> Dict[str, float]:
    signature_a = input_signature if input_signature is not None else build_feature_signature(input_features)
    signature_b = sample_signature if sample_signature is not None else build_feature_signature(sample_features)

    embedding_similarity = (
        _cosine_similarity(input_embedding, sample_embedding)
        if input_embedding is not None and sample_embedding is not None
        else None
    )
    signature_similarity = _cosine_similarity(signature_a, signature_b)
    dtw_similarity = float(np.exp(-compute_sample_distance(input_features, sample_features) * 1.35))
    aggregate_similarity = compute_aggregate_similarity(input_features, sample_features)

    weighted_total = 0.0
    weight_sum = 0.0

    if embedding_similarity is not None:
        weighted_total += embedding_similarity * 0.34
        weight_sum += 0.34

    weighted_total += signature_similarity * 0.31
    weight_sum += 0.31

    weighted_total += dtw_similarity * 0.23
    weight_sum += 0.23

    weighted_total += aggregate_similarity * 0.12
    weight_sum += 0.12

    combined = weighted_total / max(weight_sum, 1e-6)
    if embedding_similarity is not None:
        combined -= abs(embedding_similarity - signature_similarity) * 0.05
        combined -= abs(embedding_similarity - dtw_similarity) * 0.04

    combined -= abs(signature_similarity - dtw_similarity) * 0.03

    return {
        "combined": float(max(0.0, min(1.0, combined))),
        "embedding": float(embedding_similarity) if embedding_similarity is not None else 0.0,
        "signature": float(signature_similarity),
        "dtw": float(max(0.0, min(1.0, dtw_similarity))),
        "aggregate": float(max(0.0, min(1.0, aggregate_similarity))),
    }


def compute_prototype_stats(
    card_dir: Path,
    user_dir: Path,
    current_card_id: str,
) -> Dict[str, object]:
    sample_representations = load_card_sample_representations(card_dir)
    base_embeddings = [
        sample["embedding"]
        for sample in sample_representations
        if isinstance(sample.get("embedding"), np.ndarray)
    ]
    base_signatures = [
        sample["signature"]
        for sample in sample_representations
        if isinstance(sample.get("signature"), np.ndarray)
    ]

    if not base_embeddings:
        return {
            "sample_count": 0,
            "prototype": None,
            "signature_prototype": None,
            "consistency_score": 0.0,
            "prototype_threshold": 0.78,
            "margin_threshold": 0.1,
            "enrollment_quality": "poor",
            "distinctiveness_status": "poor",
            "recommended_action": "Record three clean, consistent takes to calibrate this phrase.",
            "confusable_with": None,
            "confusable_similarity": 0.0,
        }

    augmented_embeddings: List[np.ndarray] = []
    for sample_file in _list_sample_audio_files(card_dir):
        augmented_embeddings.extend(build_augmented_embeddings(sample_file))

    prototype_sources = augmented_embeddings or base_embeddings
    prototype = _normalize_vector(np.mean(np.stack(prototype_sources, axis=0), axis=0))
    signature_prototype = (
        _normalize_vector(np.mean(np.stack(base_signatures, axis=0), axis=0))
        if base_signatures
        else None
    )

    pairwise_scores: List[float] = []
    for left_index, left_sample in enumerate(sample_representations):
        left_features = left_sample.get("features")
        if not isinstance(left_features, dict):
            continue
        for right_sample in sample_representations[left_index + 1 :]:
            right_features = right_sample.get("features")
            if not isinstance(right_features, dict):
                continue
            pairwise_scores.append(
                compute_hybrid_similarity(
                    left_features,
                    right_features,
                    left_sample.get("embedding") if isinstance(left_sample.get("embedding"), np.ndarray) else None,
                    right_sample.get("embedding") if isinstance(right_sample.get("embedding"), np.ndarray) else None,
                    left_sample.get("signature") if isinstance(left_sample.get("signature"), np.ndarray) else None,
                    right_sample.get("signature") if isinstance(right_sample.get("signature"), np.ndarray) else None,
                )["combined"]
            )

    sample_similarities = [_cosine_similarity(sample, prototype) for sample in base_embeddings]
    prototype_consistency = float(np.mean(sample_similarities)) if sample_similarities else 0.0
    pairwise_consistency = float(np.mean(pairwise_scores)) if pairwise_scores else prototype_consistency
    positive_floor = float(min(pairwise_scores)) if pairwise_scores else prototype_consistency
    consistency_score = max(pairwise_consistency, prototype_consistency)

    enrollment_quality = "poor"
    recommended_action = "Record three clean, consistent takes to calibrate this phrase."
    if consistency_score >= 0.86 and len(base_embeddings) >= 3:
        enrollment_quality = "good"
        recommended_action = None
    elif consistency_score >= 0.74 and len(base_embeddings) >= 2:
        enrollment_quality = "fair"
        recommended_action = "Keep your pace and distance consistent for stronger recognition."

    confusable_with = None
    confusable_similarity = 0.0
    for sibling_dir in user_dir.iterdir():
        if not sibling_dir.is_dir() or sibling_dir.name == current_card_id:
            continue
        sibling_proto = _load_embedding(sibling_dir / "prototype.npy")
        if sibling_proto is None:
            continue
        sibling_signature_proto = _load_embedding(sibling_dir / "signature_prototype.npy")
        prototype_similarity = _cosine_similarity(prototype, sibling_proto)
        signature_similarity = (
            _cosine_similarity(signature_prototype, sibling_signature_proto)
            if signature_prototype is not None and sibling_signature_proto is not None
            else prototype_similarity
        )
        similarity = (prototype_similarity * 0.62) + (signature_similarity * 0.38)
        if similarity > confusable_similarity:
            confusable_similarity = similarity
            sibling_meta = read_json_file(sibling_dir / "meta.json", {})
            if isinstance(sibling_meta, dict):
                confusable_with = sibling_meta.get("label")

    prototype_threshold = max(0.74, positive_floor - 0.08)
    if confusable_similarity > 0.0:
        prototype_threshold = max(prototype_threshold, confusable_similarity + 0.035)
    prototype_threshold = float(min(0.93, prototype_threshold))

    if confusable_similarity >= 0.9:
        margin_threshold = 0.14
    elif confusable_similarity >= 0.84:
        margin_threshold = 0.12
    elif confusable_similarity >= 0.76:
        margin_threshold = 0.1
    else:
        margin_threshold = 0.08

    distinctiveness_status = "good"
    if confusable_similarity >= 0.84 or consistency_score < 0.74:
        distinctiveness_status = "poor"
    elif confusable_similarity >= 0.76 or consistency_score < 0.86:
        distinctiveness_status = "close"

    if confusable_similarity >= 0.8 and confusable_with:
        if enrollment_quality == "good":
            enrollment_quality = "fair"
        recommended_action = f'This sound is close to "{confusable_with}". Make the vocalization more distinct.'
    elif distinctiveness_status == "poor":
        recommended_action = "This phrase needs a more distinct sound shape before it will demo reliably."
    elif distinctiveness_status == "close" and recommended_action is None:
        recommended_action = "This phrase is usable, but a more distinct sound will improve reliability."

    return {
        "sample_count": len(base_embeddings),
        "prototype": prototype,
        "signature_prototype": signature_prototype,
        "consistency_score": round(consistency_score, 4),
        "prototype_threshold": round(prototype_threshold, 4),
        "margin_threshold": round(margin_threshold, 4),
        "enrollment_quality": enrollment_quality,
        "distinctiveness_status": distinctiveness_status,
        "recommended_action": recommended_action,
        "confusable_with": confusable_with,
        "confusable_similarity": round(confusable_similarity, 4),
    }


def select_active_demo_cards(user_dir: Path) -> List[Tuple[Path, Dict[str, object], Path, int]]:
    ready_cards: List[Tuple[Path, Dict[str, object], Path, int, float]] = []

    for card_path in user_dir.iterdir():
        if not card_path.is_dir():
            continue

        meta_path = card_path / "meta.json"
        if not meta_path.exists():
            continue

        meta = read_json_file(meta_path, {})
        if not isinstance(meta, dict):
            continue

        sample_count = get_card_sample_count(card_path)
        if sample_count < 3:
            continue

        ready_cards.append((card_path, meta, meta_path, sample_count, _meta_updated_at(meta, meta_path)))

    ready_cards.sort(key=lambda item: item[4], reverse=True)
    return [(card_path, meta, meta_path, sample_count) for card_path, meta, meta_path, sample_count, _ in ready_cards]


def score_embedding_confidence(
    best_similarity: float,
    threshold: float,
    second_best_similarity: Optional[float],
    margin_threshold: float,
    consistency_score: float,
    support_score: float = 0.0,
) -> float:
    similarity_confidence = max(0.0, min(1.0, (best_similarity - threshold) / max(1.0 - threshold, 1e-6)))
    if second_best_similarity is None:
        margin_confidence = 1.0
    else:
        margin = best_similarity - second_best_similarity
        margin_confidence = max(0.0, min(1.0, margin / max(margin_threshold * 2.0, 0.08)))

    consistency_confidence = max(0.0, min(1.0, consistency_score))
    support_confidence = max(0.0, min(1.0, support_score))
    return max(
        0.0,
        min(
            1.0,
            (similarity_confidence * 0.45)
            + (margin_confidence * 0.25)
            + (consistency_confidence * 0.15)
            + (support_confidence * 0.15),
        ),
    )


def score_to_confidence(best_score: float, second_best_score: Optional[float]) -> float:
    absolute_confidence = float(np.exp(-best_score * 2.2))
    if second_best_score is None:
        return max(0.0, min(1.0, absolute_confidence))

    margin = max(0.0, second_best_score - best_score)
    margin_confidence = max(0.0, min(1.0, margin / 0.35))
    return max(0.0, min(1.0, (absolute_confidence * 0.7) + (margin_confidence * 0.3)))


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
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
        sessions[token] = {
            "username": username,
            "created_at": str(uuid.uuid4()),
        }
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


# ---------------------------------------------------------------------------
# Utility endpoints
# ---------------------------------------------------------------------------
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

    cards: List[Dict[str, object]] = []
    for card_path in sorted(user_dir.iterdir()):
        if not card_path.is_dir():
            continue

        meta_path = card_path / "meta.json"
        if not meta_path.exists():
            continue

        meta = await asyncio.to_thread(read_json_file, meta_path, {})
        if not isinstance(meta, dict):
            continue

        sample_count = get_card_sample_count(card_path)
        consistency_score = meta.get("consistency_score")
        cards.append(
            {
                "sound_card_id": meta.get("id"),
                "label": meta.get("label"),
                "phrase_output": meta.get("phrase_output") or meta.get("label"),
                "sample_count": sample_count,
                "enrollment_quality": meta.get("enrollment_quality"),
                "distinctiveness_status": meta.get("distinctiveness_status"),
                "consistency_score": consistency_score if isinstance(consistency_score, (int, float)) else None,
                "recommended_action": meta.get("recommended_action"),
            }
        )

    total = len(cards)
    return {
        "cards": cards[offset : offset + limit],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/cards/{sound_card_id}/samples")
async def get_card_samples(
    sound_card_id: str,
    current_username: str = Depends(get_current_username),
):
    safe_card_id = validate_identifier(sound_card_id, "sound_card_id")
    card_dir = SAMPLES_DIR / current_username / safe_card_id
    if not card_dir.exists():
        return {"samples": []}

    samples = list_card_samples(card_dir)
    return {
        "samples": [
            {
                **sample,
                "playback_path": f"/cards/{safe_card_id}/samples/{sample['sample_index']}/audio",
            }
            for sample in samples
        ]
    }


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

    sample_path = _resolve_sample_audio_file(card_dir, sample_index)
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
    if not card_dir.exists():
      return {"status": "ok"}

    async with STATE_LOCK:
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
        for audio_file in list(card_dir.glob("*")):
            if audio_file.name == "meta.json":
                continue
            if audio_file.is_file():
                await asyncio.to_thread(audio_file.unlink)

    return {"status": "ok", "sample_count": 0}


# ---------------------------------------------------------------------------
# Training & Recognition endpoints
# ---------------------------------------------------------------------------
@app.post("/train-sample")
async def train_sample(
    file: UploadFile = File(...),
    label: str = Form(...),
    sound_card_id: str = Form(...),
    sample_index: int = Form(...),
    phrase_output: Optional[str] = Form(None),
    current_username: str = Depends(get_current_username),
):
    if sample_index < 1:
        raise HTTPException(status_code=400, detail="Invalid sample index.")

    safe_card_id = validate_identifier(sound_card_id, "sound_card_id")
    file_format = resolve_audio_format(file)
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded audio sample was empty.")
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Upload exceeds the 3 MB maximum payload size.")

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
        normalize_audio(raw_path, staged_audio_path, file_format)
    finally:
        if raw_path.exists():
            raw_path.unlink()

    features = extract_features(staged_audio_path)
    embedding = extract_embedding(staged_audio_path)
    audio_quality = inspect_audio_quality(staged_audio_path)

    if features is None or embedding is None:
        if staged_audio_path.exists():
            staged_audio_path.unlink()
        return JSONResponse(
            status_code=422,
            content={
                "error_code": "SILENCE_DETECTED",
                "detail": "No voice detected. Please speak louder or move closer to the microphone.",
            },
        )

    if audio_quality["mean_rms"] < 0.01:
        if staged_audio_path.exists():
            staged_audio_path.unlink()
        return JSONResponse(
            status_code=422,
            content={
                "error_code": "SILENCE_DETECTED",
                "detail": "No voice detected. Please speak louder or move closer to the microphone.",
            },
        )

    if audio_quality["duration"] < 0.5:
        if staged_audio_path.exists():
            staged_audio_path.unlink()
        return JSONResponse(
            status_code=422,
            content={
                "error_code": "TOO_SHORT",
                "detail": "Recording too short. Hold the button and speak a full word or phrase.",
            },
        )

    if audio_quality["clipping_ratio"] > 0.015:
        if staged_audio_path.exists():
            staged_audio_path.unlink()
        return JSONResponse(
            status_code=422,
            content={
                "error_code": "AUDIO_QUALITY_LOW",
                "detail": "Recording clipped. Move slightly away from the microphone and try again.",
            },
        )

    if audio_quality["peak_level"] > 0 and (
        audio_quality["noise_floor"] / max(audio_quality["peak_level"], 1e-6)
    ) > 0.32:
        if staged_audio_path.exists():
            staged_audio_path.unlink()
        return JSONResponse(
            status_code=422,
            content={
                "error_code": "AUDIO_QUALITY_LOW",
                "detail": "Too much background noise. Try recording in a quieter space.",
            },
        )

    if audio_quality["voiced_fraction"] < 0.18:
        if staged_audio_path.exists():
            staged_audio_path.unlink()
        return JSONResponse(
            status_code=422,
            content={
                "error_code": "TOO_SHORT",
                "detail": "Recording too short. Hold the button and speak a full word or phrase.",
            },
        )

    prior_embeddings = [
        sample_embedding
        for sample_embedding in (
            _load_embedding(path) for path in _list_sample_embedding_files(card_dir) if path.stem != f"sample_embedding_{sample_index}"
        )
        if sample_embedding is not None
    ]
    if prior_embeddings:
        previous_prototype = _normalize_vector(np.mean(np.stack(prior_embeddings, axis=0), axis=0))
        consistency_similarity = _cosine_similarity(embedding, previous_prototype)
        if consistency_similarity < 0.72:
            if staged_audio_path.exists():
                staged_audio_path.unlink()
            return JSONResponse(
                status_code=422,
                content={
                    "error_code": "CONSISTENCY_MISMATCH",
                    "detail": "This take sounded too different from the earlier ones. Try matching your previous pace and tone.",
                },
            )

    await asyncio.to_thread(save_feature_bundle_at, staged_feature_path, features)
    await asyncio.to_thread(save_vector_file, staged_embedding_path, embedding)

    prototype_stats: Dict[str, object]
    slot_backups: List[Tuple[Path, Path]] = []
    commit_completed = False

    async with STATE_LOCK:
        try:
            for existing_path in _list_slot_artifacts(card_dir, sample_index):
                backup_path = existing_path.with_name(f"{existing_path.name}.{commit_id}.bak")
                await asyncio.to_thread(existing_path.replace, backup_path)
                slot_backups.append((existing_path, backup_path))

            await asyncio.to_thread(staged_audio_path.replace, final_audio_path)
            await asyncio.to_thread(staged_feature_path.replace, final_feature_path)
            await asyncio.to_thread(staged_embedding_path.replace, final_embedding_path)

            prototype_stats = compute_prototype_stats(card_dir, user_dir, safe_card_id)
            prototype = prototype_stats.get("prototype")
            if isinstance(prototype, np.ndarray):
                await asyncio.to_thread(save_vector_file, card_dir / "prototype.npy", prototype)
            signature_prototype = prototype_stats.get("signature_prototype")
            if isinstance(signature_prototype, np.ndarray):
                await asyncio.to_thread(save_vector_file, card_dir / "signature_prototype.npy", signature_prototype)

            meta_payload = {
                "label": label,
                "id": safe_card_id,
                "phrase_output": phrase_output or label,
                "consistency_score": prototype_stats["consistency_score"],
                "prototype_threshold": prototype_stats["prototype_threshold"],
                "margin_threshold": prototype_stats["margin_threshold"],
                "enrollment_quality": prototype_stats["enrollment_quality"],
                "distinctiveness_status": prototype_stats["distinctiveness_status"],
                "recommended_action": prototype_stats["recommended_action"],
                "confusable_with": prototype_stats["confusable_with"],
                "confusable_similarity": prototype_stats["confusable_similarity"],
                "updated_at": time.time(),
            }
            await asyncio.to_thread(write_json_atomic, card_dir / "meta.json", meta_payload)
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

    sample_count = int(prototype_stats["sample_count"])

    return {
        "status": "success",
        "sound_card_id": safe_card_id,
        "sample_count": sample_count,
        "sample_index": sample_index,
        "enrollment_quality": prototype_stats["enrollment_quality"],
        "distinctiveness_status": prototype_stats["distinctiveness_status"],
        "consistency_score": prototype_stats["consistency_score"],
        "recommended_action": prototype_stats["recommended_action"],
    }


async def _recognize(audio: UploadFile, current_username: str):
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
        normalize_audio(raw_path, temp_path, file_format)
        input_features = extract_features(temp_path)
        input_embedding = extract_embedding(temp_path)
        input_signature = build_feature_signature(input_features) if input_features is not None else None

        if input_features is None and input_embedding is None:
            raise HTTPException(status_code=400, detail="Could not extract features from input")

        ranked_matches = []
        user_dir = SAMPLES_DIR / current_username
        if not user_dir.exists():
            return {
                "match_label": None,
                "sound_card_id": None,
                "confidence": 0.0,
                "phrase_output": None,
                "message": "No trained samples are available yet.",
                "decision_source": "hybrid_acoustic_match",
                "best_similarity": 0.0,
                "second_best_similarity": None,
                "support_score": 0.0,
                "active_signal_count": 0,
                "rejection_reason": "no_samples",
            }

        active_cards = await asyncio.to_thread(select_active_demo_cards, user_dir)
        for card_path, meta, _meta_path, _sample_count in active_cards:

            card_similarity: Optional[float] = None
            best_sample_similarity: Optional[float] = None
            best_embedding_similarity: Optional[float] = None
            best_signature_similarity: Optional[float] = None
            best_dtw_similarity: Optional[float] = None
            decision_source = "hybrid_acoustic_match"
            prototype = _load_embedding(card_path / "prototype.npy")
            signature_prototype = _load_embedding(card_path / "signature_prototype.npy")
            sample_representations = load_card_sample_representations(card_path)

            sample_scores: List[Dict[str, float]] = []
            if input_features is not None:
                for sample in sample_representations:
                    features = sample.get("features")
                    if not isinstance(features, dict):
                        continue
                    sample_scores.append(
                        compute_hybrid_similarity(
                            input_features,
                            features,
                            input_embedding,
                            sample.get("embedding") if isinstance(sample.get("embedding"), np.ndarray) else None,
                            input_signature,
                            sample.get("signature") if isinstance(sample.get("signature"), np.ndarray) else None,
                        )
                    )

            if sample_scores:
                top_scores = sorted(sample_scores, key=lambda item: item["combined"], reverse=True)
                best_scores = top_scores[: min(2, len(top_scores))]
                card_similarity = float(np.mean([item["combined"] for item in best_scores]))
                best_sample_similarity = float(top_scores[0]["combined"])
                best_embedding_similarity = float(top_scores[0]["embedding"])
                best_signature_similarity = float(top_scores[0]["signature"])
                best_dtw_similarity = float(top_scores[0]["dtw"])

                if input_embedding is not None and prototype is not None:
                    prototype_similarity = _cosine_similarity(input_embedding, prototype)
                    card_similarity = (card_similarity * 0.78) + (prototype_similarity * 0.22)

                if input_signature is not None and signature_prototype is not None:
                    signature_similarity = _cosine_similarity(input_signature, signature_prototype)
                    card_similarity = (card_similarity * 0.82) + (signature_similarity * 0.18)

            elif input_embedding is not None and prototype is not None:
                card_similarity = _cosine_similarity(input_embedding, prototype)
                best_sample_similarity = card_similarity
                best_embedding_similarity = card_similarity
                decision_source = "prototype_acoustic_fallback"

            if card_similarity is not None:
                ranked_matches.append(
                    {
                        "similarity": card_similarity,
                        "best_sample_similarity": best_sample_similarity,
                        "best_embedding_similarity": best_embedding_similarity,
                        "best_signature_similarity": best_signature_similarity,
                        "best_dtw_similarity": best_dtw_similarity,
                        "label": meta.get("label"),
                        "sound_card_id": meta.get("id"),
                        "phrase_output": meta.get("phrase_output") or meta.get("label"),
                        "decision_source": decision_source,
                        "consistency_score": float(meta.get("consistency_score") or 0.0),
                        "prototype_threshold": float(meta.get("prototype_threshold") or 0.74),
                        "margin_threshold": float(meta.get("margin_threshold") or 0.08),
                        "enrollment_quality": meta.get("enrollment_quality"),
                        "distinctiveness_status": meta.get("distinctiveness_status"),
                        "recommended_action": meta.get("recommended_action"),
                    }
                )

        if not ranked_matches:
            return {
                "match_label": None,
                "sound_card_id": None,
                "confidence": 0.0,
                "phrase_output": None,
                "message": "No trained samples are available yet.",
                "decision_source": "hybrid_acoustic_match",
                "best_similarity": 0.0,
                "second_best_similarity": None,
                "support_score": 0.0,
                "active_signal_count": 0,
                "rejection_reason": "no_samples",
            }

        ranked_matches.sort(key=lambda item: float(item["similarity"]), reverse=True)
        best_match = ranked_matches[0]
        second_best_similarity = float(ranked_matches[1]["similarity"]) if len(ranked_matches) > 1 else None
        best_similarity = float(best_match["similarity"])
        support_components = [
            float(best_match["best_embedding_similarity"])
            if isinstance(best_match.get("best_embedding_similarity"), (int, float))
            else None,
            float(best_match["best_signature_similarity"])
            if isinstance(best_match.get("best_signature_similarity"), (int, float))
            else None,
            float(best_match["best_dtw_similarity"])
            if isinstance(best_match.get("best_dtw_similarity"), (int, float))
            else None,
        ]
        support_values = [value for value in support_components if value is not None]
        support_score = float(np.mean(support_values)) if support_values else best_similarity
        active_signal_count = sum(
            1
            for value in support_values
            if value >= max(float(best_match["prototype_threshold"]) - 0.08, 0.72)
        )
        confidence_ratio = score_embedding_confidence(
            best_similarity,
            float(best_match["prototype_threshold"]),
            second_best_similarity,
            float(best_match["margin_threshold"]),
            float(best_match["consistency_score"]),
            support_score,
        )
        confidence = round(confidence_ratio * 100, 2)
        margin = best_similarity - second_best_similarity if second_best_similarity is not None else 1.0
        corroborated = (
            (
                isinstance(best_match.get("best_signature_similarity"), (int, float))
                and float(best_match["best_signature_similarity"]) >= max(float(best_match["prototype_threshold"]) - 0.08, 0.7)
            )
            + (
                isinstance(best_match.get("best_embedding_similarity"), (int, float))
                and float(best_match["best_embedding_similarity"]) >= max(float(best_match["prototype_threshold"]) - 0.08, 0.7)
            )
            + (
                isinstance(best_match.get("best_dtw_similarity"), (int, float))
                and float(best_match["best_dtw_similarity"]) >= 0.72
            )
        )
        strong_absolute_match = (
            best_similarity >= max(float(best_match["prototype_threshold"]) + 0.015, 0.94)
            and support_score >= 0.88
            and corroborated >= 2
            and (
                second_best_similarity is None
                or margin >= 0.065
            )
        )
        accepted = (
            best_similarity >= float(best_match["prototype_threshold"])
            and corroborated >= 2
            and (
                margin >= float(best_match["margin_threshold"])
                or strong_absolute_match
            )
        )

        if accepted:
            return {
                "match_label": best_match["label"],
                "sound_card_id": best_match["sound_card_id"],
                "confidence": confidence,
                "phrase_output": best_match["phrase_output"],
                "decision_source": best_match["decision_source"],
                "best_similarity": round(best_similarity, 4),
                "second_best_similarity": round(second_best_similarity, 4) if second_best_similarity is not None else None,
                "support_score": round(support_score, 4),
                "active_signal_count": int(active_signal_count),
                "rejection_reason": None,
            }

        return {
            "match_label": None,
            "sound_card_id": None,
            "confidence": confidence,
            "phrase_output": None,
            "message": best_match.get("recommended_action") or "No trained card matched that sound yet.",
            "decision_source": best_match["decision_source"],
            "best_similarity": round(best_similarity, 4),
            "second_best_similarity": round(second_best_similarity, 4) if second_best_similarity is not None else None,
            "support_score": round(support_score, 4),
            "active_signal_count": int(active_signal_count),
            "rejection_reason": "below_threshold" if best_similarity < float(best_match["prototype_threshold"]) else "low_margin",
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
    return await _recognize(audio, current_username)


@app.post("/predict")
async def predict(
    audio: UploadFile = File(...),
    current_username: str = Depends(get_current_username),
):
    return await _recognize(audio, current_username)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
