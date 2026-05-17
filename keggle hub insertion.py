import argparse
import json
import shutil
import time
from dataclasses import dataclass
from pathlib import Path

import cv2
import kagglehub
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
DATASET_DIR = BASE_DIR / "datasets"
OUTPUT_DIR = BASE_DIR / "vehicle_detection_output"

VEHICLE_CLASS_NAMES = {"car", "motorcycle", "bus", "truck"}


@dataclass
class DetectionSummary:
    total_vehicles: int
    by_type: dict[str, int]
    timestamp: float


def download_kaggle_dataset(dataset_slug: str, output_dir: Path | None) -> Path:
    """
    Download a Kaggle dataset using KaggleHub.

    Before running this, configure Kaggle credentials:
    1. Create an API token from Kaggle account settings.
    2. Place kaggle.json in C:\\Users\\<you>\\.kaggle\\kaggle.json.
    """
    downloaded_path = Path(kagglehub.dataset_download(dataset_slug))

    if output_dir is None:
        return downloaded_path

    output_dir.mkdir(parents=True, exist_ok=True)

    for item in downloaded_path.iterdir():
        target = output_dir / item.name
        if item.is_dir():
            shutil.copytree(item, target, dirs_exist_ok=True)
        else:
            shutil.copy2(item, target)

    return output_dir


def train_from_kaggle_dataset(
    dataset_yaml: Path,
    base_model: str,
    epochs: int,
    image_size: int,
    batch_size: int,
) -> Path:
    """
    Train a YOLO vehicle detector from a Kaggle dataset prepared in YOLO format.

    dataset_yaml must point to a YOLO data file with train/val paths and class names.
    """
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model = YOLO(base_model)
    results = model.train(
        data=str(dataset_yaml),
        epochs=epochs,
        imgsz=image_size,
        batch=batch_size,
        project=str(MODEL_DIR),
        name="vehicle_detector",
        exist_ok=True,
    )

    best_model = Path(results.save_dir) / "weights" / "best.pt"
    deployed_model = MODEL_DIR / "vehicle_detector_best.pt"
    shutil.copy2(best_model, deployed_model)
    return deployed_model


def summarize_vehicle_detections(result) -> DetectionSummary:
    names = result.names
    counts = {vehicle_type: 0 for vehicle_type in sorted(VEHICLE_CLASS_NAMES)}

    for box in result.boxes:
        class_id = int(box.cls[0])
        class_name = names[class_id]
        if class_name in VEHICLE_CLASS_NAMES:
            counts[class_name] += 1

    return DetectionSummary(
        total_vehicles=sum(counts.values()),
        by_type=counts,
        timestamp=time.time(),
    )


def save_detection_event(summary: DetectionSummary) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    event_path = OUTPUT_DIR / "latest_vehicle_event.json"
    event_path.write_text(
        json.dumps(
            {
                "total_vehicles": summary.total_vehicles,
                "by_type": summary.by_type,
                "timestamp": summary.timestamp,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def run_real_camera_detection(
    model_path: Path,
    camera_index: int,
    confidence: float,
    save_every_seconds: float,
) -> None:
    """
    Run vehicle detection from a separate real-camera input.

    Press q in the camera window to stop.
    """
    model = YOLO(str(model_path))
    camera = cv2.VideoCapture(camera_index)

    if not camera.isOpened():
        raise RuntimeError(f"Could not open camera index {camera_index}")

    last_saved = 0.0

    while True:
        ok, frame = camera.read()
        if not ok:
            break

        results = model.predict(frame, conf=confidence, verbose=False)
        result = results[0]
        annotated_frame = result.plot()
        summary = summarize_vehicle_detections(result)

        now = time.time()
        if now - last_saved >= save_every_seconds:
            save_detection_event(summary)
            last_saved = now

        cv2.putText(
            annotated_frame,
            f"Vehicles: {summary.total_vehicles}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
            cv2.LINE_AA,
        )
        cv2.imshow("Real Camera Vehicle Detection", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    camera.release()
    cv2.destroyAllWindows()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Vehicle detection module with Kaggle training input and real-camera input."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    download_parser = subparsers.add_parser("download-kaggle")
    download_parser.add_argument("--dataset-slug", required=True, help="Example: owner/dataset-name")
    download_parser.add_argument(
        "--output-dir",
        type=Path,
        default=DATASET_DIR / "kaggle_vehicle_dataset",
        help="Optional local copy destination. KaggleHub also keeps a cached copy.",
    )

    train_parser = subparsers.add_parser("train")
    train_parser.add_argument("--dataset-yaml", type=Path, required=True)
    train_parser.add_argument("--base-model", default="yolov8n.pt")
    train_parser.add_argument("--epochs", type=int, default=50)
    train_parser.add_argument("--image-size", type=int, default=640)
    train_parser.add_argument("--batch-size", type=int, default=8)

    camera_parser = subparsers.add_parser("camera")
    camera_parser.add_argument("--model", type=Path, default=MODEL_DIR / "vehicle_detector_best.pt")
    camera_parser.add_argument("--camera-index", type=int, default=0)
    camera_parser.add_argument("--confidence", type=float, default=0.35)
    camera_parser.add_argument("--save-every-seconds", type=float, default=2.0)

    return parser


def main() -> None:
    args = build_parser().parse_args()

    if args.command == "download-kaggle":
        dataset_path = download_kaggle_dataset(args.dataset_slug, args.output_dir)
        print(f"Kaggle dataset downloaded to: {dataset_path}")

    if args.command == "train":
        model_path = train_from_kaggle_dataset(
            dataset_yaml=args.dataset_yaml,
            base_model=args.base_model,
            epochs=args.epochs,
            image_size=args.image_size,
            batch_size=args.batch_size,
        )
        print(f"Trained model saved to: {model_path}")

    if args.command == "camera":
        run_real_camera_detection(
            model_path=args.model,
            camera_index=args.camera_index,
            confidence=args.confidence,
            save_every_seconds=args.save_every_seconds,
        )


if __name__ == "__main__":
    main()
