import json
import math
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import librosa
import numpy as np
import soundfile as sf
from pydub import AudioSegment

SAMPLE_RATE = 16_000
ANALYSIS_DURATION_SECONDS = 2.5
ANALYSIS_SAMPLES = int(SAMPLE_RATE * ANALYSIS_DURATION_SECONDS)
FEATURE_BUNDLE_VERSION = 2
FRAME_LENGTH = 400
HOP_LENGTH = 160
N_FFT = 512
N_MFCC = 20
TARGET_DBFS = -18.0
TARGET_PEAK = 0.95
MAX_CARD_SAMPLES = 20
CORE_SAMPLE_COUNT = 3
PITCH_FMIN = librosa.note_to_hz("C2")
PITCH_FMAX = librosa.note_to_hz("C7")
FEATURE_QUALITY_FLAGS_KEY = "feature_quality_flags"


def write_json_atomic(path: Path, payload: Dict[str, Any]):
    temp_path = path.with_name(f"{path.name}.{uuid.uuid4().hex}.tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle)
    temp_path.replace(path)


def normalize_vector(vector: np.ndarray) -> np.ndarray:
    vector = np.asarray(vector, dtype=np.float32).reshape(-1)
    norm = float(np.linalg.norm(vector))
    if norm <= 1e-8:
        return vector
    return vector / norm


def safe_percentile(values: np.ndarray, percentile: float) -> float:
    if values.size == 0:
        return 0.0
    return float(np.percentile(values, percentile))


def safe_stats(values: np.ndarray) -> np.ndarray:
    values = np.asarray(values, dtype=np.float32).reshape(-1)
    if values.size == 0:
        return np.zeros(4, dtype=np.float32)
    return np.array(
        [
            float(np.mean(values)),
            float(np.std(values)),
            safe_percentile(values, 10),
            safe_percentile(values, 90),
        ],
        dtype=np.float32,
    )


def segment_stats(values: np.ndarray, segments: int = 4) -> np.ndarray:
    values = np.asarray(values, dtype=np.float32).reshape(-1)
    if values.size == 0:
        return np.zeros(segments * 2, dtype=np.float32)

    chunks = np.array_split(values, segments)
    parts: List[np.ndarray] = []
    for chunk in chunks:
        if chunk.size == 0:
            parts.append(np.zeros(2, dtype=np.float32))
            continue
        parts.append(np.array([float(np.mean(chunk)), float(np.std(chunk))], dtype=np.float32))
    return np.concatenate(parts).astype(np.float32)


def align_frames(values: np.ndarray, target_frames: int) -> np.ndarray:
    values = np.asarray(values, dtype=np.float32).reshape(-1)
    if target_frames <= 0:
        return np.zeros(0, dtype=np.float32)
    if values.size == target_frames:
        return values
    if values.size == 0:
        return np.zeros(target_frames, dtype=np.float32)
    if values.size == 1:
        return np.repeat(values, target_frames).astype(np.float32)

    source_positions = np.linspace(0.0, 1.0, num=values.size)
    target_positions = np.linspace(0.0, 1.0, num=target_frames)
    return np.interp(target_positions, source_positions, values).astype(np.float32)


def choose_energy_window(y: np.ndarray, target_samples: int) -> np.ndarray:
    if y.size <= target_samples:
        return y.astype(np.float32)

    rms = librosa.feature.rms(y=y, frame_length=max(256, FRAME_LENGTH), hop_length=max(128, HOP_LENGTH), center=True)[0]
    if rms.size == 0:
        return y[:target_samples].astype(np.float32)

    window_frames = max(1, int(math.ceil(target_samples / max(128, HOP_LENGTH))))
    best_index = 0
    best_energy = -1.0
    for index in range(max(1, rms.size - window_frames + 1)):
        energy = float(np.sum(rms[index : index + window_frames]))
        if energy > best_energy:
            best_energy = energy
            best_index = index

    start = best_index * max(128, HOP_LENGTH)
    end = min(y.size, start + target_samples)
    start = max(0, end - target_samples)
    return y[start:end].astype(np.float32)


def apply_peak_normalization(y: np.ndarray) -> np.ndarray:
    peak = float(np.max(np.abs(y))) if y.size else 0.0
    if peak <= 1e-6:
        return y.astype(np.float32)
    return np.clip((y / peak) * TARGET_PEAK, -1.0, 1.0).astype(np.float32)


def preprocess_audio(
    input_path: Path,
    output_path: Path,
    *,
    file_format: str = "wav",
    ffmpeg_available: bool = False,
) -> Dict[str, Any]:
    decode_path = output_path.with_name(f"{output_path.stem}.{uuid.uuid4().hex}.decode.wav")
    info: Dict[str, Any] = {
        "sample_rate": SAMPLE_RATE,
        "analysis_duration": ANALYSIS_DURATION_SECONDS,
        "raw_duration": 0.0,
        "trimmed_duration": 0.0,
        "leading_silence": 0.0,
        "trailing_silence": 0.0,
        "was_padded": False,
        "was_cropped": False,
        "peak_level": 0.0,
        "mean_rms": 0.0,
        "usable_signal": False,
    }

    try:
        load_path = input_path
        if ffmpeg_available:
            audio = AudioSegment.from_file(str(input_path), format=file_format)
            audio = audio.set_channels(1).set_frame_rate(SAMPLE_RATE)
            if audio.rms > 0 and np.isfinite(audio.dBFS):
                gain = max(-12.0, min(12.0, TARGET_DBFS - float(audio.dBFS)))
                audio = audio.apply_gain(gain)
            audio.export(str(decode_path), format="wav")
            load_path = decode_path

        y, sr = librosa.load(str(load_path), sr=SAMPLE_RATE, mono=True)
        y = np.asarray(y, dtype=np.float32)
        info["raw_duration"] = float(y.size / SAMPLE_RATE)

        if y.size == 0:
            sf.write(str(output_path), np.zeros(ANALYSIS_SAMPLES, dtype=np.float32), SAMPLE_RATE, format="WAV")
            return info

        trimmed, trim_indices = librosa.effects.trim(y, top_db=26)
        if trimmed.size == 0:
            trimmed = y
            trim_indices = np.array([0, y.size], dtype=np.int64)

        info["leading_silence"] = float(trim_indices[0] / SAMPLE_RATE)
        info["trailing_silence"] = float(max(0, y.size - trim_indices[1]) / SAMPLE_RATE)
        info["trimmed_duration"] = float(trimmed.size / SAMPLE_RATE)

        peak_before = float(np.max(np.abs(trimmed))) if trimmed.size else 0.0
        mean_rms = float(np.mean(librosa.feature.rms(y=trimmed, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)[0])) if trimmed.size else 0.0

        standardized = choose_energy_window(trimmed, ANALYSIS_SAMPLES)
        if standardized.size < ANALYSIS_SAMPLES:
            info["was_padded"] = True
            standardized = np.pad(standardized, (0, ANALYSIS_SAMPLES - standardized.size))
        elif standardized.size > ANALYSIS_SAMPLES:
            info["was_cropped"] = True
            standardized = standardized[:ANALYSIS_SAMPLES]

        standardized = apply_peak_normalization(standardized)
        info["peak_level"] = float(np.max(np.abs(standardized))) if standardized.size else peak_before
        info["mean_rms"] = mean_rms
        info["usable_signal"] = bool(info["trimmed_duration"] >= 0.12 and mean_rms >= 0.003 and peak_before >= 0.01)

        sf.write(str(output_path), standardized, sr, format="WAV")
        return info
    finally:
        if decode_path.exists():
            decode_path.unlink()


def load_audio(file_path: Path) -> Tuple[np.ndarray, int]:
    y, sr = librosa.load(str(file_path), sr=SAMPLE_RATE, mono=True)
    return np.asarray(y, dtype=np.float32), sr


def inspect_audio_quality(file_path: Path) -> Dict[str, float]:
    y, sr = load_audio(file_path)
    if y.size == 0:
        return {
            "duration": 0.0,
            "mean_rms": 0.0,
            "max_rms": 0.0,
            "clipping_ratio": 0.0,
            "noise_floor": 0.0,
            "peak_level": 0.0,
            "voiced_fraction": 0.0,
            "silence_fraction": 1.0,
            "zcr_mean": 0.0,
        }

    rms = librosa.feature.rms(y=y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)[0]
    zcr = librosa.feature.zero_crossing_rate(y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH, center=True)[0]
    mean_rms = float(np.mean(rms)) if rms.size else 0.0
    threshold = max(mean_rms * 0.55, 0.01)
    voiced_fraction = float(np.mean(rms >= threshold)) if rms.size else 0.0
    silence_fraction = float(np.mean(rms < max(mean_rms * 0.25, 0.004))) if rms.size else 1.0
    peak_level = float(np.max(np.abs(y))) if y.size else 0.0
    return {
        "duration": float(y.size / sr),
        "mean_rms": mean_rms,
        "max_rms": float(np.max(rms)) if rms.size else 0.0,
        "clipping_ratio": float(np.mean(np.abs(y) >= 0.985)),
        "noise_floor": safe_percentile(np.abs(y), 20),
        "peak_level": peak_level,
        "voiced_fraction": voiced_fraction,
        "silence_fraction": silence_fraction,
        "zcr_mean": float(np.mean(zcr)) if zcr.size else 0.0,
    }


def quality_rejection_reason(
    preprocessing: Dict[str, Any],
    quality: Dict[str, float],
) -> Optional[Tuple[str, str]]:
    if not preprocessing.get("usable_signal", False):
        return ("SILENCE_DETECTED", "The recording was too quiet or empty to learn from.")

    if preprocessing.get("trimmed_duration", 0.0) < 0.25 or quality["duration"] < 0.25:
        return ("TOO_SHORT", "That recording was too short. Hold the button for the whole sound.")

    if quality["clipping_ratio"] > 0.02:
        return ("AUDIO_QUALITY_LOW", "That recording clipped. Move slightly away from the microphone and try again.")

    if quality["mean_rms"] < 0.006:
        return ("SILENCE_DETECTED", "No strong voice signal was detected. Try making the sound a little louder.")

    if quality["noise_floor"] / max(quality["peak_level"], 1e-6) > 0.42:
        return ("AUDIO_QUALITY_LOW", "That recording has too much background noise to use safely.")

    return None


def normalize_pitch_track(f0: np.ndarray, voiced_mask: np.ndarray) -> np.ndarray:
    pitch_track = np.zeros_like(f0, dtype=np.float32)
    voiced_values = f0[voiced_mask > 0.5]
    if voiced_values.size == 0:
        return pitch_track

    logged = np.log2(np.maximum(voiced_values.astype(np.float32), 1e-6))
    mean = float(np.mean(logged))
    std = float(np.std(logged)) + 1e-6
    normalized = (logged - mean) / std
    pitch_track[voiced_mask > 0.5] = normalized.astype(np.float32)
    return pitch_track


def summarize_mfcc(mfcc: np.ndarray) -> np.ndarray:
    if mfcc.ndim != 2 or mfcc.shape[1] == 0:
        return np.zeros(N_MFCC * 4, dtype=np.float32)
    return np.concatenate(
        [
            np.mean(mfcc, axis=1),
            np.std(mfcc, axis=1),
            np.percentile(mfcc, 10, axis=1),
            np.percentile(mfcc, 90, axis=1),
        ]
    ).astype(np.float32)


def build_waveform_preview(y: np.ndarray, points: int = 96) -> np.ndarray:
    waveform = np.asarray(y, dtype=np.float32).reshape(-1)
    if waveform.size == 0:
        return np.zeros(points, dtype=np.float32)
    if waveform.size <= points:
        return align_frames(waveform, points)

    chunks = np.array_split(waveform, points)
    preview = np.array(
        [float(np.max(np.abs(chunk))) if chunk.size else 0.0 for chunk in chunks],
        dtype=np.float32,
    )
    return preview


def extract_feature_bundle(
    file_path: Path,
    *,
    preprocessing: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    try:
        y, sr = load_audio(file_path)
        if y.size == 0:
            return None

        mfcc = librosa.feature.mfcc(
            y=y,
            sr=sr,
            n_mfcc=N_MFCC,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH,
            win_length=FRAME_LENGTH,
            n_mels=40,
        ).astype(np.float32)
        delta = librosa.feature.delta(mfcc).astype(np.float32)
        delta2 = librosa.feature.delta(mfcc, order=2).astype(np.float32)
        rms = librosa.feature.rms(y=y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH, center=True)[0].astype(np.float32)
        zcr = librosa.feature.zero_crossing_rate(
            y,
            frame_length=FRAME_LENGTH,
            hop_length=HOP_LENGTH,
            center=True,
        )[0].astype(np.float32)

        f0 = np.zeros_like(rms, dtype=np.float32)
        voiced_mask = np.zeros_like(rms, dtype=np.float32)
        pitch_flags: List[str] = []
        try:
            pyin_f0, voiced_flag, _ = librosa.pyin(
                y,
                sr=sr,
                fmin=PITCH_FMIN,
                fmax=PITCH_FMAX,
                frame_length=N_FFT,
                hop_length=HOP_LENGTH,
            )
            if pyin_f0 is not None:
                f0 = align_frames(np.nan_to_num(pyin_f0, nan=0.0).astype(np.float32), rms.size)
                if voiced_flag is not None:
                    voiced_mask = align_frames(voiced_flag.astype(np.float32), rms.size)
        except Exception:
            pitch_flags.append("pitch_tracking_failed")

        voiced_ratio = float(np.mean(voiced_mask > 0.5)) if voiced_mask.size else 0.0
        if voiced_ratio < 0.08:
            pitch_flags.append("low_pitch_confidence")

        normalized_pitch = normalize_pitch_track(f0, voiced_mask)
        sequence = np.vstack(
            [
                mfcc,
                delta,
                delta2,
                rms.reshape(1, -1),
                zcr.reshape(1, -1),
                normalized_pitch.reshape(1, -1),
                voiced_mask.reshape(1, -1),
            ]
        ).astype(np.float32)

        sequence_mean = np.mean(sequence, axis=1, keepdims=True)
        sequence_std = np.std(sequence, axis=1, keepdims=True) + 1e-6
        sequence = ((sequence - sequence_mean) / sequence_std).astype(np.float32)

        voiced_f0 = f0[voiced_mask > 0.5]
        pitch_summary = np.concatenate(
            [
                safe_stats(voiced_f0),
                np.array(
                    [
                        voiced_ratio,
                        float(np.ptp(voiced_f0)) if voiced_f0.size else 0.0,
                        float(np.mean(np.abs(np.diff(voiced_f0)))) if voiced_f0.size > 1 else 0.0,
                        float(np.mean(normalized_pitch)) if normalized_pitch.size else 0.0,
                    ],
                    dtype=np.float32,
                ),
                segment_stats(normalized_pitch),
            ]
        ).astype(np.float32)
        rms_summary = np.concatenate([safe_stats(rms), segment_stats(rms)]).astype(np.float32)
        zcr_summary = np.concatenate([safe_stats(zcr), segment_stats(zcr)]).astype(np.float32)
        mfcc_summary = summarize_mfcc(mfcc)

        raw_duration = (
            float(preprocessing.get("trimmed_duration", 0.0))
            if isinstance(preprocessing, dict)
            else float(y.size / sr)
        )
        quality_vector = np.array(
            [
                raw_duration,
                float(np.mean(rms)) if rms.size else 0.0,
                float(np.std(rms)) if rms.size else 0.0,
                float(np.mean(zcr)) if zcr.size else 0.0,
                voiced_ratio,
            ],
            dtype=np.float32,
        )

        segment_parts: List[np.ndarray] = []
        shape_base = np.vstack(
            [
                mfcc[:8],
                delta[:4],
                delta2[:4],
                rms.reshape(1, -1),
                normalized_pitch.reshape(1, -1),
                voiced_mask.reshape(1, -1),
            ]
        ).astype(np.float32)
        for segment in np.array_split(shape_base, 4, axis=1):
            if segment.shape[1] == 0:
                segment_parts.append(np.zeros(shape_base.shape[0] * 2, dtype=np.float32))
                continue
            segment_parts.append(
                np.concatenate(
                    [
                        np.mean(segment, axis=1).astype(np.float32),
                        np.std(segment, axis=1).astype(np.float32),
                    ]
                )
            )

        aggregate = np.concatenate(
            [
                mfcc_summary,
                rms_summary,
                zcr_summary,
                pitch_summary,
                quality_vector,
            ]
        ).astype(np.float32)
        vector = normalize_vector(aggregate)
        shape_signature = normalize_vector(np.concatenate(segment_parts).astype(np.float32))

        quality_summary = {
            "duration": raw_duration,
            "analysis_duration": ANALYSIS_DURATION_SECONDS,
            "mean_rms": float(np.mean(rms)) if rms.size else 0.0,
            "zcr_mean": float(np.mean(zcr)) if zcr.size else 0.0,
            "pitch_mean": float(np.mean(voiced_f0)) if voiced_f0.size else 0.0,
            "pitch_variance": float(np.var(voiced_f0)) if voiced_f0.size else 0.0,
            "voiced_ratio": voiced_ratio,
        }

        return {
            "version": FEATURE_BUNDLE_VERSION,
            "sequence": sequence.astype(np.float32),
            "aggregate": aggregate.astype(np.float32),
            "vector": vector.astype(np.float32),
            "shape_signature": shape_signature.astype(np.float32),
            "duration": float(raw_duration),
            "analysis_duration": ANALYSIS_DURATION_SECONDS,
            "mfcc_summary": mfcc_summary.astype(np.float32),
            "rms_summary": rms_summary.astype(np.float32),
            "zcr_summary": zcr_summary.astype(np.float32),
            "pitch_summary": pitch_summary.astype(np.float32),
            "pitch_contour": normalized_pitch.astype(np.float32),
            "voiced_mask": voiced_mask.astype(np.float32),
            "waveform_preview": build_waveform_preview(y),
            "quality_summary": quality_summary,
            FEATURE_QUALITY_FLAGS_KEY: pitch_flags,
        }
    except Exception:
        return None


def save_feature_bundle_at(target_path: Path, features: Dict[str, Any]):
    temp_path = target_path.with_name(f"{target_path.stem}.{uuid.uuid4().hex}.npz")
    np.savez(
        str(temp_path),
        version=np.asarray(features["version"], dtype=np.int32),
        sequence=np.asarray(features["sequence"], dtype=np.float32),
        aggregate=np.asarray(features["aggregate"], dtype=np.float32),
        vector=np.asarray(features["vector"], dtype=np.float32),
        shape_signature=np.asarray(features["shape_signature"], dtype=np.float32),
        duration=np.asarray(features["duration"], dtype=np.float32),
        analysis_duration=np.asarray(features.get("analysis_duration", ANALYSIS_DURATION_SECONDS), dtype=np.float32),
        mfcc_summary=np.asarray(features["mfcc_summary"], dtype=np.float32),
        rms_summary=np.asarray(features["rms_summary"], dtype=np.float32),
        zcr_summary=np.asarray(features["zcr_summary"], dtype=np.float32),
        pitch_summary=np.asarray(features["pitch_summary"], dtype=np.float32),
        pitch_contour=np.asarray(features["pitch_contour"], dtype=np.float32),
        voiced_mask=np.asarray(features["voiced_mask"], dtype=np.float32),
        waveform_preview=np.asarray(features["waveform_preview"], dtype=np.float32),
    )
    temp_path.replace(target_path)


def load_feature_bundle(
    feature_path: Path,
    *,
    audio_path: Optional[Path] = None,
    rewrite_legacy: bool = True,
) -> Optional[Dict[str, Any]]:
    try:
        if feature_path.suffix == ".npz" and feature_path.exists():
            bundle = np.load(str(feature_path))
            version = int(bundle["version"]) if "version" in bundle.files else 1
            if version >= FEATURE_BUNDLE_VERSION and {"sequence", "aggregate", "vector", "shape_signature"}.issubset(bundle.files):
                return {
                    "version": version,
                    "sequence": bundle["sequence"].astype(np.float32),
                    "aggregate": bundle["aggregate"].astype(np.float32),
                    "vector": bundle["vector"].astype(np.float32),
                    "shape_signature": bundle["shape_signature"].astype(np.float32),
                    "duration": float(bundle["duration"]),
                    "analysis_duration": float(bundle["analysis_duration"]) if "analysis_duration" in bundle.files else ANALYSIS_DURATION_SECONDS,
                    "mfcc_summary": bundle["mfcc_summary"].astype(np.float32) if "mfcc_summary" in bundle.files else np.zeros(N_MFCC * 4, dtype=np.float32),
                    "rms_summary": bundle["rms_summary"].astype(np.float32) if "rms_summary" in bundle.files else np.zeros(12, dtype=np.float32),
                    "zcr_summary": bundle["zcr_summary"].astype(np.float32) if "zcr_summary" in bundle.files else np.zeros(12, dtype=np.float32),
                    "pitch_summary": bundle["pitch_summary"].astype(np.float32) if "pitch_summary" in bundle.files else np.zeros(16, dtype=np.float32),
                    "pitch_contour": bundle["pitch_contour"].astype(np.float32) if "pitch_contour" in bundle.files else np.zeros(0, dtype=np.float32),
                    "voiced_mask": bundle["voiced_mask"].astype(np.float32) if "voiced_mask" in bundle.files else np.zeros(0, dtype=np.float32),
                    "waveform_preview": bundle["waveform_preview"].astype(np.float32) if "waveform_preview" in bundle.files else np.zeros(96, dtype=np.float32),
                    "quality_summary": {
                        "duration": float(bundle["duration"]),
                        "analysis_duration": float(bundle["analysis_duration"]) if "analysis_duration" in bundle.files else ANALYSIS_DURATION_SECONDS,
                        "mean_rms": float(bundle["rms_summary"][0]) if "rms_summary" in bundle.files and bundle["rms_summary"].size else 0.0,
                        "zcr_mean": float(bundle["zcr_summary"][0]) if "zcr_summary" in bundle.files and bundle["zcr_summary"].size else 0.0,
                        "pitch_mean": float(bundle["pitch_summary"][0]) if "pitch_summary" in bundle.files and bundle["pitch_summary"].size else 0.0,
                        "pitch_variance": float(bundle["pitch_summary"][1] ** 2) if "pitch_summary" in bundle.files and bundle["pitch_summary"].size > 1 else 0.0,
                        "voiced_ratio": float(bundle["pitch_summary"][4]) if "pitch_summary" in bundle.files and bundle["pitch_summary"].size > 4 else 0.0,
                    },
                    FEATURE_QUALITY_FLAGS_KEY: [],
                }

        if audio_path is not None and audio_path.exists():
            rebuilt = extract_feature_bundle(audio_path)
            if rebuilt is None:
                return None
            if rewrite_legacy:
                save_feature_bundle_at(feature_path.with_suffix(".npz"), rebuilt)
            return rebuilt

        if feature_path.exists() and feature_path.suffix == ".npy":
            legacy = np.asarray(np.load(str(feature_path)), dtype=np.float32).reshape(-1)
            vector = normalize_vector(legacy)
            return {
                "version": 1,
                "sequence": np.tile(vector.reshape(-1, 1), (1, 2)).astype(np.float32),
                "aggregate": legacy.astype(np.float32),
                "vector": vector.astype(np.float32),
                "shape_signature": vector.astype(np.float32),
                "duration": 0.0,
                "analysis_duration": ANALYSIS_DURATION_SECONDS,
                "mfcc_summary": np.zeros(N_MFCC * 4, dtype=np.float32),
                "rms_summary": np.zeros(12, dtype=np.float32),
                "zcr_summary": np.zeros(12, dtype=np.float32),
                "pitch_summary": np.zeros(16, dtype=np.float32),
                "pitch_contour": np.zeros(0, dtype=np.float32),
                "voiced_mask": np.zeros(0, dtype=np.float32),
                "waveform_preview": np.zeros(96, dtype=np.float32),
                "quality_summary": {
                    "duration": 0.0,
                    "analysis_duration": ANALYSIS_DURATION_SECONDS,
                    "mean_rms": 0.0,
                    "zcr_mean": 0.0,
                    "pitch_mean": 0.0,
                    "pitch_variance": 0.0,
                    "voiced_ratio": 0.0,
                },
                FEATURE_QUALITY_FLAGS_KEY: ["legacy_feature_bundle"],
            }
    except Exception:
        return None

    return None


def sample_readiness(sample_count: int) -> str:
    if sample_count <= 2:
        return "low_data"
    if sample_count <= 5:
        return "learning"
    return "mature"


def readiness_thresholds(readiness: str) -> Dict[str, float]:
    if readiness == "low_data":
        return {"similarity": 0.86, "margin": 0.08}
    if readiness == "learning":
        return {"similarity": 0.82, "margin": 0.06}
    return {"similarity": 0.78, "margin": 0.04}
