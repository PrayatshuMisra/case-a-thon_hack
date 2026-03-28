from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor


MODEL_VERSION = "v1.0-trained"

SPECIES_INDEX = {
    "seer fish": 0,
    "pomfret": 1,
    "prawns": 2,
    "sardine": 3,
}

STRATEGIES: dict[str, dict[str, Any]] = {
    "premium_fresh": {
        "min_fresh": 90,
        "max_fresh": 100,
        "yield": 1.0,
        "price_mult": 1.25,
        "proc_cost": 18,
        "demand_mult": 0.95,
        "industrial": False,
        "species": None,
    },
    "standard_retail": {
        "min_fresh": 80,
        "max_fresh": 90,
        "yield": 1.0,
        "price_mult": 1.08,
        "proc_cost": 22,
        "demand_mult": 1.12,
        "industrial": False,
        "species": None,
    },
    "flash_drop": {
        "min_fresh": 70,
        "max_fresh": 80,
        "yield": 1.0,
        "price_mult": 0.88,
        "proc_cost": 10,
        "demand_mult": 1.45,
        "industrial": False,
        "species": None,
    },
    "pickling": {
        "min_fresh": 55,
        "max_fresh": 80,
        "yield": 0.86,
        "price_mult": 1.5,
        "proc_cost": 65,
        "demand_mult": 0.9,
        "industrial": False,
        "species": None,
    },
    "drying_salting": {
        "min_fresh": 45,
        "max_fresh": 75,
        "yield": 0.72,
        "price_mult": 1.35,
        "proc_cost": 48,
        "demand_mult": 0.84,
        "industrial": False,
        "species": None,
    },
    "minced_products": {
        "min_fresh": 50,
        "max_fresh": 75,
        "yield": 0.8,
        "price_mult": 1.45,
        "proc_cost": 78,
        "demand_mult": 0.96,
        "industrial": False,
        "species": None,
    },
    "fish_silage": {
        "min_fresh": 20,
        "max_fresh": 55,
        "yield": 0.9,
        "price_mult": 0.62,
        "proc_cost": 32,
        "demand_mult": 0.78,
        "industrial": True,
        "species": None,
    },
    "fishmeal": {
        "min_fresh": 10,
        "max_fresh": 50,
        "yield": 0.68,
        "price_mult": 0.95,
        "proc_cost": 40,
        "demand_mult": 0.82,
        "industrial": True,
        "species": None,
    },
    "collagen": {
        "min_fresh": 15,
        "max_fresh": 60,
        "yield": 0.18,
        "price_mult": 4.2,
        "proc_cost": 110,
        "demand_mult": 0.5,
        "industrial": True,
        "species": {"seer fish", "pomfret"},
    },
    "chitosan": {
        "min_fresh": 10,
        "max_fresh": 60,
        "yield": 0.24,
        "price_mult": 2.8,
        "proc_cost": 95,
        "demand_mult": 0.56,
        "industrial": True,
        "species": {"prawns"},
    },
    "fertilizer": {
        "min_fresh": 0,
        "max_fresh": 25,
        "yield": 0.95,
        "price_mult": 0.4,
        "proc_cost": 20,
        "demand_mult": 0.7,
        "industrial": True,
        "species": None,
    },
}

STRATEGY_INDEX = {sid: idx for idx, sid in enumerate(STRATEGIES.keys())}


@dataclass
class MlArtifacts:
    feasible_model: RandomForestClassifier
    profit_model: RandomForestRegressor
    wastage_model: RandomForestRegressor
    trained_at: str
    samples_trained: int


def _model_path() -> Path:
    root = Path(__file__).resolve().parents[2]
    model_dir = root / "ml_models"
    model_dir.mkdir(parents=True, exist_ok=True)
    return model_dir / "pilot_model.joblib"


def _waste_penalty(freshness: float) -> float:
    if freshness >= 85:
        return 12
    if freshness >= 70:
        return 18
    if freshness >= 50:
        return 24
    return 32


def _feature_vector(
    species: str,
    strategy_id: str,
    freshness: float,
    health: float,
    available: float,
    demand: float,
    base_price: float,
    cold_chain: bool,
) -> np.ndarray:
    species_idx = SPECIES_INDEX.get(species.lower(), 0)
    strategy_idx = STRATEGY_INDEX.get(strategy_id, 0)
    return np.array(
        [
            float(species_idx),
            float(strategy_idx),
            float(freshness),
            float(health),
            float(available),
            float(demand),
            float(base_price),
            1.0 if cold_chain else 0.0,
        ],
        dtype=np.float64,
    )


def _simulate_outcome(
    species: str,
    strategy_id: str,
    freshness: float,
    health: float,
    available: float,
    demand: float,
    base_price: float,
    cold_chain: bool,
) -> tuple[int, float, float]:
    s = STRATEGIES[strategy_id]
    species_name = species.lower()

    feasible = s["min_fresh"] <= freshness <= s["max_fresh"]
    if s["species"] and species_name not in s["species"]:
        feasible = False

    demand_adj = demand * s["demand_mult"]
    if s["industrial"]:
        demand_adj = max(demand_adj, demand * 0.45)
    else:
        demand_adj = max(demand_adj, demand * 0.9)

    processable = available * s["yield"]
    fulfillment = min(processable, demand_adj)
    utilized_raw = min(available, fulfillment / max(s["yield"], 0.01))
    wastage_kg = max(0.0, available - utilized_raw)
    wastage_pct = (wastage_kg / available * 100.0) if available > 0 else 100.0

    quality_boost = 1 + (health - 80) / 200
    cold_boost = 1.03 if cold_chain else 0.94
    sell_price = base_price * s["price_mult"] * quality_boost * cold_boost

    revenue = fulfillment * sell_price
    processing_cost = available * s["proc_cost"]
    sourcing_cost = available * base_price * 0.48
    waste_penalty = wastage_kg * _waste_penalty(freshness)

    profit = revenue - (processing_cost + sourcing_cost + waste_penalty)

    if not feasible:
        profit = profit - (base_price * 0.15)
        wastage_pct = max(wastage_pct, 95.0)

    noise_p = np.random.normal(0, max(120.0, abs(profit) * 0.03))
    noise_w = np.random.normal(0, 1.8)

    return int(feasible), float(profit + noise_p), float(np.clip(wastage_pct + noise_w, 0, 100))


def _generate_training_data(samples: int = 3500) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    species_choices = list(SPECIES_INDEX.keys())
    strategy_choices = list(STRATEGIES.keys())

    base_price_ranges = {
        "seer fish": (310, 420),
        "pomfret": (360, 500),
        "prawns": (280, 460),
        "sardine": (120, 240),
    }

    X: list[np.ndarray] = []
    y_feasible: list[int] = []
    y_profit: list[float] = []
    y_wastage: list[float] = []

    for _ in range(samples):
        species = np.random.choice(species_choices)
        strategy_id = np.random.choice(strategy_choices)

        freshness = float(np.random.uniform(10, 99))
        health = float(np.random.uniform(45, 99))
        available = float(np.random.uniform(5, 90))
        demand = float(np.random.uniform(3, 95))
        p_min, p_max = base_price_ranges[species]
        base_price = float(np.random.uniform(p_min, p_max))
        cold_chain = bool(np.random.rand() > 0.25)

        feat = _feature_vector(species, strategy_id, freshness, health, available, demand, base_price, cold_chain)
        feasible, profit, wastage = _simulate_outcome(
            species,
            strategy_id,
            freshness,
            health,
            available,
            demand,
            base_price,
            cold_chain,
        )

        X.append(feat)
        y_feasible.append(feasible)
        y_profit.append(profit)
        y_wastage.append(wastage)

    return (
        np.vstack(X),
        np.array(y_feasible, dtype=np.int64),
        np.array(y_profit, dtype=np.float64),
        np.array(y_wastage, dtype=np.float64),
    )


def train_and_save_models(samples: int = 3500) -> MlArtifacts:
    global _MODEL_CACHE
    _MODEL_CACHE = None  # invalidate cache so next call reloads fresh model
    X, y_feasible, y_profit, y_wastage = _generate_training_data(samples)

    feasible_model = RandomForestClassifier(n_estimators=220, random_state=42, max_depth=14)
    profit_model = RandomForestRegressor(n_estimators=260, random_state=42, max_depth=16)
    wastage_model = RandomForestRegressor(n_estimators=260, random_state=42, max_depth=16)

    feasible_model.fit(X, y_feasible)
    profit_model.fit(X, y_profit)
    wastage_model.fit(X, y_wastage)

    artifacts = MlArtifacts(
        feasible_model=feasible_model,
        profit_model=profit_model,
        wastage_model=wastage_model,
        trained_at=datetime.now(timezone.utc).isoformat(),
        samples_trained=samples,
    )

    joblib.dump(
        {
            "model_version": MODEL_VERSION,
            "trained_at": artifacts.trained_at,
            "samples_trained": artifacts.samples_trained,
            "feasible_model": artifacts.feasible_model,
            "profit_model": artifacts.profit_model,
            "wastage_model": artifacts.wastage_model,
        },
        _model_path(),
    )

    return artifacts


_MODEL_CACHE: dict[str, Any] | None = None


def load_or_train_models() -> dict[str, Any]:
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE
    path = _model_path()
    if not path.exists():
        train_and_save_models()
    _MODEL_CACHE = joblib.load(path)
    return _MODEL_CACHE


def predict_scenario(payload: dict[str, Any]) -> dict[str, Any]:
    bundle = load_or_train_models()

    strategy_id = payload.get("strategy_id", "standard_retail")
    species = payload.get("species", "Seer Fish")

    x = _feature_vector(
        species=species,
        strategy_id=strategy_id,
        freshness=float(payload.get("freshness_score", 80)),
        health=float(payload.get("health_score", 80)),
        available=float(payload.get("available_kg", 20)),
        demand=float(payload.get("forecast_demand_kg", 20)),
        base_price=float(payload.get("base_price_per_kg", 300)),
        cold_chain=bool(payload.get("cold_chain_maintained", True)),
    ).reshape(1, -1)

    feasible_probs = bundle["feasible_model"].predict_proba(x)[0]
    feasible_probability = float(feasible_probs[1] if len(feasible_probs) > 1 else feasible_probs[0])

    predicted_profit = float(bundle["profit_model"].predict(x)[0])
    predicted_wastage = float(np.clip(bundle["wastage_model"].predict(x)[0], 0, 100))

    if feasible_probability >= 0.7 and predicted_profit > 0:
        recommended = "Execute selected strategy"
    elif feasible_probability >= 0.5:
        recommended = "Execute with caution and activate fallback mix"
    else:
        recommended = "Switch strategy; selected option is likely suboptimal"

    return {
        "model_version": bundle.get("model_version", MODEL_VERSION),
        "feasible_probability": round(feasible_probability, 4),
        "predicted_profit": round(predicted_profit, 2),
        "predicted_wastage_pct": round(predicted_wastage, 2),
        "recommended_action": recommended,
        "trained_at": bundle.get("trained_at"),
        "samples_trained": bundle.get("samples_trained", 0),
    }
