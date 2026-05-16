import json
import math
from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


BASE_DIR = Path(__file__).resolve().parent
ACCIDENT_DATA = BASE_DIR / "accident_sensor_data.csv"
SUPPLY_DATA = BASE_DIR / "medical_supply_houses.csv"
MAP_DATA = BASE_DIR / "map_data.json"

FEATURES = [
    "latitude",
    "longitude",
    "accident_count",
    "speed_kmph",
    "traffic_density",
    "weather_severity",
    "impact_force",
    "fire_detected",
    "bleeding_detected",
]

ZONE_COLORS = {
    "red": "#e53935",
    "blue": "#1e88e5",
    "green": "#43a047",
}


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate road-point distance using the haversine formula."""
    earth_radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius_km * c


def build_knn_model(data: pd.DataFrame) -> Pipeline:
    """Train KNN to classify a road point into red, blue, or green threat zone."""
    preprocessor = ColumnTransformer(
        transformers=[("numeric", StandardScaler(), FEATURES)],
        remainder="drop",
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("knn", KNeighborsClassifier(n_neighbors=3, weights="distance")),
        ]
    )
    model.fit(data[FEATURES], data["zone"])
    return model


def required_supplies(sensor_row: dict) -> list[str]:
    """Choose supplies from sensor readings and predicted severity."""
    supplies = ["ambulance", "trauma_kit"]

    if sensor_row["impact_force"] >= 7 or sensor_row["zone"] == "red":
        supplies.extend(["oxygen", "blood_bags"])

    if sensor_row["fire_detected"]:
        supplies.append("burn_kit")

    if sensor_row["bleeding_detected"]:
        supplies.append("blood_bags")

    return sorted(set(supplies))


def nearest_supply_house(sensor_row: dict, supply_houses: pd.DataFrame, supplies: list[str]) -> dict:
    """Find nearest supply house that has every required item available."""
    candidates = supply_houses.copy()

    for supply in supplies:
        candidates = candidates[candidates[supply] > 0]

    if candidates.empty:
        return {
            "name": "No complete supply house found",
            "distance_km": None,
            "latitude": None,
            "longitude": None,
        }

    candidates = candidates.assign(
        distance_km=candidates.apply(
            lambda row: distance_km(
                sensor_row["latitude"],
                sensor_row["longitude"],
                row["latitude"],
                row["longitude"],
            ),
            axis=1,
        )
    )

    nearest = candidates.sort_values("distance_km").iloc[0]
    return {
        "name": nearest["name"],
        "distance_km": round(float(nearest["distance_km"]), 2),
        "latitude": float(nearest["latitude"]),
        "longitude": float(nearest["longitude"]),
    }


def create_alert(sensor_row: dict, supply_house: dict, supplies: list[str]) -> dict:
    return {
        "message": (
            f"{sensor_row['zone'].upper()} zone accident on {sensor_row['road_name']}. "
            f"Send {', '.join(supplies)} from {supply_house['name']}."
        ),
        "road_name": sensor_row["road_name"],
        "zone": sensor_row["zone"],
        "required_supplies": supplies,
        "supply_house": supply_house,
    }


def export_map_data(rows: list[dict], alerts: list[dict]) -> None:
    map_points = []
    for row in rows:
        map_points.append(
            {
                "roadName": row["road_name"],
                "lat": row["latitude"],
                "lng": row["longitude"],
                "zone": row["zone"],
                "color": ZONE_COLORS[row["zone"]],
                "accidentCount": row["accident_count"],
                "impactForce": row["impact_force"],
            }
        )

    MAP_DATA.write_text(
        json.dumps({"points": map_points, "alerts": alerts}, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    accident_data = pd.read_csv(ACCIDENT_DATA)
    supply_houses = pd.read_csv(SUPPLY_DATA)

    model = build_knn_model(accident_data)

    # Replace or extend this list with live IoT/sensor readings from roads.
    live_sensor_rows = [
        {
            "road_name": "Popular Road Junction",
            "latitude": 12.97220,
            "longitude": 77.59510,
            "accident_count": 11,
            "speed_kmph": 76,
            "traffic_density": 86,
            "weather_severity": 3,
            "impact_force": 8.1,
            "fire_detected": 0,
            "bleeding_detected": 1,
        },
        {
            "road_name": "Market Main Road",
            "latitude": 12.97610,
            "longitude": 77.60620,
            "accident_count": 2,
            "speed_kmph": 33,
            "traffic_density": 44,
            "weather_severity": 1,
            "impact_force": 1.6,
            "fire_detected": 0,
            "bleeding_detected": 0,
        },
    ]

    predictions = []
    alerts = []

    for sensor_row in live_sensor_rows:
        predicted_zone = model.predict(pd.DataFrame([sensor_row])[FEATURES])[0]
        sensor_row["zone"] = predicted_zone
        predictions.append(sensor_row)

        supplies = required_supplies(sensor_row)
        supply_house = nearest_supply_house(sensor_row, supply_houses, supplies)
        alerts.append(create_alert(sensor_row, supply_house, supplies))

    export_map_data(predictions, alerts)

    for alert in alerts:
        print(alert["message"])

    print(f"\nMap data written to: {MAP_DATA}")


if __name__ == "__main__":
    main()
