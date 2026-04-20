import math
from typing import Any, Dict, List, Sequence, Tuple

import numpy as np

from audio_pipeline import (
    ANALYSIS_DURATION_SECONDS,
    FEATURE_QUALITY_FLAGS_KEY,
    MAX_CARD_SAMPLES,
    N_MFCC,
    normalize_vector,
    quality_rejection_reason,
    readiness_thresholds,
    sample_readiness,
)


def cosine_similarity(vec_a: Any, vec_b: Any) -> float:
    if vec_a is None or vec_b is None:
        return 0.0
    a = normalize_vector(np.asarray(vec_a, dtype=np.float32))
    b = normalize_vector(np.asarray(vec_b, dtype=np.float32))
    if a.size == 0 or b.size == 0 or a.size != b.size:
        return 0.0
    return float(max(-1.0, min(1.0, float(np.dot(a, b)))))


def euclidean_similarity(vec_a: Any, vec_b: Any) -> float:
    if vec_a is None or vec_b is None:
        return 0.0
    a = normalize_vector(np.asarray(vec_a, dtype=np.float32))
    b = normalize_vector(np.asarray(vec_b, dtype=np.float32))
    if a.size == 0 or b.size == 0 or a.size != b.size:
        return 0.0
    distance = float(np.linalg.norm(a - b) / max(math.sqrt(a.size), 1.0))
    return float(max(0.0, min(1.0, math.exp(-distance * 4.2))))


def compute_similarity_components(
    input_bundle: Dict[str, Any],
    candidate_bundle: Dict[str, Any],
) -> Dict[str, float]:
    vector_cos = cosine_similarity(input_bundle.get("vector"), candidate_bundle.get("vector"))
    vector_euclidean = euclidean_similarity(input_bundle.get("vector"), candidate_bundle.get("vector"))
    shape_cos = cosine_similarity(input_bundle.get("shape_signature"), candidate_bundle.get("shape_signature"))

    input_duration = float(input_bundle.get("duration", 0.0))
    candidate_duration = float(candidate_bundle.get("duration", 0.0))
    if input_duration <= 1e-6 or candidate_duration <= 1e-6:
        duration_similarity = 0.85
    else:
        duration_similarity = float(
            max(0.0, min(1.0, math.exp(-abs(math.log((input_duration + 1e-6) / (candidate_duration + 1e-6))) * 1.2)))
        )

    combined = (
        (vector_cos * 0.42)
        + (vector_euclidean * 0.2)
        + (shape_cos * 0.26)
        + (duration_similarity * 0.12)
    )
    return {
        "combined": float(max(0.0, min(1.0, combined))),
        "vector_cosine": float(max(0.0, min(1.0, vector_cos))),
        "vector_euclidean": float(max(0.0, min(1.0, vector_euclidean))),
        "shape_cosine": float(max(0.0, min(1.0, shape_cos))),
        "duration_similarity": float(max(0.0, min(1.0, duration_similarity))),
    }


def summarize_card_profile(
    *,
    card_id: str,
    label: str,
    phrase_output: str,
    samples: Sequence[Dict[str, Any]],
    sibling_cards: Sequence[Dict[str, Any]],
) -> Dict[str, Any]:
    sample_count = len(samples)
    readiness = sample_readiness(sample_count)
    thresholds = readiness_thresholds(readiness)

    if sample_count == 0:
        return {
            "sound_card_id": card_id,
            "label": label,
            "phrase_output": phrase_output,
            "sample_count": 0,
            "readiness": readiness,
            "sample_cap": MAX_CARD_SAMPLES,
            "feature_bundle_version": 2,
            "prototype": None,
            "shape_prototype": None,
            "consistency_score": 0.0,
            "similarity_threshold": thresholds["similarity"],
            "margin_threshold": thresholds["margin"],
            "confusable_cards": [],
            "recommended_action": "Record one or two consistent samples to start learning this sound.",
        }

    vectors = [np.asarray(sample["features"]["vector"], dtype=np.float32) for sample in samples]
    shapes = [np.asarray(sample["features"]["shape_signature"], dtype=np.float32) for sample in samples]
    prototype = normalize_vector(np.mean(np.stack(vectors, axis=0), axis=0))
    shape_prototype = normalize_vector(np.mean(np.stack(shapes, axis=0), axis=0))

    pairwise_scores: List[float] = []
    for left_index, left_sample in enumerate(samples):
        for right_sample in samples[left_index + 1 :]:
            pairwise_scores.append(
                compute_similarity_components(left_sample["features"], right_sample["features"])["combined"]
            )
    prototype_scores = [cosine_similarity(sample["features"]["vector"], prototype) for sample in samples]
    consistency_score = float(np.mean(pairwise_scores)) if pairwise_scores else float(np.mean(prototype_scores))

    confusable_cards: List[Dict[str, Any]] = []
    for sibling in sibling_cards:
        sibling_proto = sibling.get("prototype")
        sibling_shape = sibling.get("shape_prototype")
        if sibling_proto is None:
            continue
        vector_score = cosine_similarity(prototype, sibling_proto)
        shape_score = cosine_similarity(shape_prototype, sibling_shape) if sibling_shape is not None else vector_score
        similarity = float((vector_score * 0.6) + (shape_score * 0.4))
        confusable_cards.append(
            {
                "sound_card_id": sibling.get("sound_card_id"),
                "label": sibling.get("label"),
                "score": round(similarity, 4),
            }
        )

    confusable_cards.sort(key=lambda item: float(item["score"]), reverse=True)
    confusable_cards = confusable_cards[:3]
    nearest_confusion = float(confusable_cards[0]["score"]) if confusable_cards else 0.0

    similarity_threshold = thresholds["similarity"]
    margin_threshold = thresholds["margin"]
    if nearest_confusion >= 0.88:
        similarity_threshold = max(similarity_threshold, 0.9)
        margin_threshold = max(margin_threshold, 0.08)
    elif nearest_confusion >= 0.8:
        similarity_threshold = max(similarity_threshold, thresholds["similarity"] + 0.03)
        margin_threshold = max(margin_threshold, thresholds["margin"] + 0.02)

    recommended_action = None
    if readiness == "low_data":
        recommended_action = "Keep adding clean repeats so this card can move beyond low-data matching."
    elif nearest_confusion >= 0.8 and confusable_cards:
        recommended_action = f'This sound is close to "{confusable_cards[0]["label"]}". Make it more distinct if possible.'
    elif consistency_score < 0.76:
        recommended_action = "Your saved samples vary a lot. Try matching pace, loudness, and sustain more closely."

    return {
        "sound_card_id": card_id,
        "label": label,
        "phrase_output": phrase_output,
        "sample_count": sample_count,
        "readiness": readiness,
        "sample_cap": MAX_CARD_SAMPLES,
        "feature_bundle_version": 2,
        "prototype": prototype,
        "shape_prototype": shape_prototype,
        "consistency_score": round(consistency_score, 4),
        "similarity_threshold": round(similarity_threshold, 4),
        "margin_threshold": round(margin_threshold, 4),
        "confusable_cards": confusable_cards,
        "recommended_action": recommended_action,
    }


def build_card_debug_summary(card_profile: Dict[str, Any], samples: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        "soundCardId": card_profile["sound_card_id"],
        "label": card_profile["label"],
        "phraseOutput": card_profile["phrase_output"],
        "sampleCount": card_profile["sample_count"],
        "readiness": card_profile["readiness"],
        "sampleCap": card_profile["sample_cap"],
        "featureBundleVersion": card_profile["feature_bundle_version"],
        "similarityThreshold": card_profile["similarity_threshold"],
        "marginThreshold": card_profile["margin_threshold"],
        "consistencyScore": card_profile["consistency_score"],
        "recommendedAction": card_profile["recommended_action"],
        "confusableCards": card_profile["confusable_cards"],
        "samples": [
            {
                "sampleIndex": sample.get("sample_index"),
                "source": sample.get("source"),
                "createdAt": sample.get("created_at"),
                "duration": sample.get("duration"),
                "qualitySummary": sample.get("quality_summary"),
                "featureQualityFlags": sample.get(FEATURE_QUALITY_FLAGS_KEY, []),
            }
            for sample in samples
        ],
    }


def predict_vocalization(
    *,
    input_bundle: Dict[str, Any],
    input_quality: Dict[str, float],
    input_preprocessing: Dict[str, Any],
    cards: Sequence[Dict[str, Any]],
) -> Dict[str, Any]:
    if not cards:
        return {
            "predictedCard": "unknown",
            "confidence": 0.0,
            "topMatches": [],
            "accepted": False,
            "reason": "no_samples",
            "message": "No trained samples are available yet.",
            "debug": {
                "accepted": False,
                "reason": "no_samples",
                "audioQuality": input_quality,
                "preprocessing": input_preprocessing,
                "featureSummary": input_bundle.get("quality_summary", {}),
                "mfccSummary": input_bundle.get("mfcc_summary", np.zeros(N_MFCC * 4, dtype=np.float32)).tolist(),
                "waveformPreview": input_bundle.get("waveform_preview", np.zeros(96, dtype=np.float32)).tolist(),
                "topMatches": [],
            },
        }

    low_signal = quality_rejection_reason(input_preprocessing, input_quality)
    ranked_cards: List[Dict[str, Any]] = []

    for card in cards:
        samples = card.get("samples", [])
        sample_scores: List[Dict[str, Any]] = []
        for sample in samples:
            components = compute_similarity_components(input_bundle, sample["features"])
            sample_scores.append(
                {
                    "sampleIndex": sample.get("sample_index"),
                    "source": sample.get("source"),
                    "score": components["combined"],
                    "components": components,
                }
            )

        sample_scores.sort(key=lambda item: float(item["score"]), reverse=True)
        top_sample_scores = sample_scores[:2]
        sample_score = float(np.mean([item["score"] for item in top_sample_scores])) if top_sample_scores else 0.0
        prototype_bundle = {
            "vector": card.get("prototype"),
            "shape_signature": card.get("shape_prototype"),
            "duration": float(np.mean([sample.get("duration", 0.0) for sample in samples])) if samples else 0.0,
        }
        prototype_components = compute_similarity_components(input_bundle, prototype_bundle)
        card_score = float((prototype_components["combined"] * 0.58) + (sample_score * 0.42))

        ranked_cards.append(
            {
                "soundCardId": card.get("sound_card_id"),
                "label": card.get("label"),
                "phraseOutput": card.get("phrase_output"),
                "readiness": card.get("readiness"),
                "sampleCount": card.get("sample_count"),
                "thresholds": {
                    "similarity": card.get("similarity_threshold"),
                    "margin": card.get("margin_threshold"),
                },
                "score": card_score,
                "prototypeComponents": prototype_components,
                "topSample": sample_scores[0] if sample_scores else None,
                "topSamples": sample_scores[:3],
                "recommendedAction": card.get("recommended_action"),
                "consistencyScore": card.get("consistency_score", 0.0),
            }
        )

    ranked_cards.sort(key=lambda item: float(item["score"]), reverse=True)
    best = ranked_cards[0]
    second_score = float(ranked_cards[1]["score"]) if len(ranked_cards) > 1 else None
    margin = float(best["score"] - second_score) if second_score is not None else 1.0
    similarity_threshold = float(best["thresholds"]["similarity"])
    margin_threshold = float(best["thresholds"]["margin"])
    readiness = str(best["readiness"])
    top_matches = [
        {
            "label": str(item.get("label") or ""),
            "score": round(float(item["score"]), 4),
            "soundCardId": str(item.get("soundCardId") or ""),
            "readiness": str(item.get("readiness") or "low_data"),
            "sampleCount": int(item.get("sampleCount") or 0),
        }
        for item in ranked_cards[:3]
    ]

    support_values = [
        float(best["prototypeComponents"]["vector_cosine"]),
        float(best["prototypeComponents"]["vector_euclidean"]),
        float(best["prototypeComponents"]["shape_cosine"]),
    ]
    if best.get("topSample"):
        support_values.extend(
            [
                float(best["topSample"]["components"]["vector_cosine"]),
                float(best["topSample"]["components"]["vector_euclidean"]),
                float(best["topSample"]["components"]["shape_cosine"]),
            ]
        )
    support_score = float(np.mean(support_values))
    active_signal_count = sum(value >= max(similarity_threshold - 0.08, 0.72) for value in support_values)

    quality_penalty = 0.12 if low_signal else 0.0
    readiness_penalty = 0.1 if readiness == "low_data" else 0.04 if readiness == "learning" else 0.0
    similarity_confidence = max(0.0, min(1.0, (float(best["score"]) - similarity_threshold) / max(1.0 - similarity_threshold, 1e-6)))
    margin_confidence = max(0.0, min(1.0, margin / max(margin_threshold * 2.0, 0.05)))
    confidence = max(
        0.0,
        min(
            1.0,
            (similarity_confidence * 0.52)
            + (margin_confidence * 0.2)
            + (float(best["consistencyScore"]) * 0.16)
            + (support_score * 0.12)
            - quality_penalty
            - readiness_penalty,
        ),
    )

    accepted = True
    reason = None
    message = None
    if low_signal is not None:
        accepted = False
        reason = "low_signal"
        message = low_signal[1]
    elif float(best["score"]) < similarity_threshold:
        accepted = False
        reason = "low_similarity"
        message = best.get("recommendedAction") or "That sound did not match strongly enough."
    elif margin < margin_threshold:
        accepted = False
        reason = "low_margin_between_top_matches"
        message = "Two saved sounds were too close together to separate safely."
    elif readiness == "low_data" and not (float(best["score"]) >= 0.9 and margin >= 0.1 and support_score >= 0.82):
        accepted = False
        reason = "needs_confirmation_low_data"
        message = "This card is still learning, so TalkBridge needs confirmation before trusting this match."

    predicted_card = str(best["label"]) if accepted else "unknown"
    sound_card_id = str(best["soundCardId"]) if accepted else None
    phrase_output = str(best["phraseOutput"]) if accepted else None

    debug_payload = {
        "accepted": accepted,
        "reason": reason,
        "audioQuality": input_quality,
        "preprocessing": input_preprocessing,
        "featureSummary": input_bundle.get("quality_summary", {}),
        "mfccSummary": input_bundle.get("mfcc_summary", np.zeros(N_MFCC * 4, dtype=np.float32)).tolist(),
        "rmsSummary": input_bundle.get("rms_summary", np.zeros(12, dtype=np.float32)).tolist(),
        "zcrSummary": input_bundle.get("zcr_summary", np.zeros(12, dtype=np.float32)).tolist(),
        "pitchSummary": input_bundle.get("pitch_summary", np.zeros(16, dtype=np.float32)).tolist(),
        "waveformPreview": input_bundle.get("waveform_preview", np.zeros(96, dtype=np.float32)).tolist(),
        "featureQualityFlags": input_bundle.get(FEATURE_QUALITY_FLAGS_KEY, []),
        "topMatches": ranked_cards[:3],
    }

    return {
        "predictedCard": predicted_card,
        "confidence": round(confidence, 4),
        "topMatches": top_matches,
        "accepted": accepted,
        "reason": reason,
        "message": message,
        "sound_card_id": sound_card_id,
        "phrase_output": phrase_output,
        "best_similarity": round(float(best["score"]), 4),
        "second_best_similarity": round(second_score, 4) if second_score is not None else None,
        "support_score": round(support_score, 4),
        "active_signal_count": int(active_signal_count),
        "decision_source": "hybrid_acoustic_match",
        "debug": debug_payload,
    }


def leave_one_out_evaluation(cards: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
    evaluations: List[Dict[str, Any]] = []
    confusion_pairs: Dict[Tuple[str, str], int] = {}

    for card in cards:
        samples = list(card.get("samples", []))
        if len(samples) < 2:
            continue

        for held_out in samples:
            remaining_cards: List[Dict[str, Any]] = []
            for candidate_card in cards:
                candidate_samples = list(candidate_card.get("samples", []))
                if candidate_card.get("sound_card_id") == card.get("sound_card_id"):
                    candidate_samples = [
                        sample
                        for sample in candidate_samples
                        if sample.get("sample_index") != held_out.get("sample_index")
                    ]
                if not candidate_samples:
                    continue

                profile = summarize_card_profile(
                    card_id=str(candidate_card.get("sound_card_id") or ""),
                    label=str(candidate_card.get("label") or ""),
                    phrase_output=str(candidate_card.get("phrase_output") or candidate_card.get("label") or ""),
                    samples=candidate_samples,
                    sibling_cards=[],
                )
                remaining_cards.append({**profile, "samples": candidate_samples})

            prediction = predict_vocalization(
                input_bundle=held_out["features"],
                input_quality=held_out.get("quality_summary") or {},
                input_preprocessing={"usable_signal": True, "trimmed_duration": held_out.get("duration", 0.0)},
                cards=remaining_cards,
            )
            predicted = prediction["predictedCard"]
            accepted = bool(prediction["accepted"])
            expected = str(card.get("label") or "")
            evaluations.append(
                {
                    "expected": expected,
                    "predicted": predicted,
                    "accepted": accepted,
                    "reason": prediction.get("reason"),
                    "confidence": prediction.get("confidence"),
                }
            )
            if accepted and predicted != expected and predicted != "unknown":
                key = tuple(sorted([expected, predicted]))
                confusion_pairs[key] = confusion_pairs.get(key, 0) + 1

    confusion_summary = [
        {"cards": list(key), "count": count}
        for key, count in sorted(confusion_pairs.items(), key=lambda item: item[1], reverse=True)
    ]
    accuracy = (
        sum(1 for item in evaluations if item["accepted"] and item["predicted"] == item["expected"]) / len(evaluations)
        if evaluations
        else 0.0
    )
    rejection_rate = (
        sum(1 for item in evaluations if not item["accepted"]) / len(evaluations)
        if evaluations
        else 0.0
    )
    return {
        "sampleCount": len(evaluations),
        "acceptedAccuracy": round(float(accuracy), 4),
        "rejectionRate": round(float(rejection_rate), 4),
        "mostConfusableCards": confusion_summary[:5],
        "evaluations": evaluations,
    }
