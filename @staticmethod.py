    @staticmethod
    def _elapsed(start: Optional[float], timestamp: float) -> float:
        if start is None:
            return 0.0
        return timestamp - start


def draw_dashboard(frame, result: Dict[str, object]) -> None:
    warnings = result["warnings"]
    danger = bool(warnings)
    color = (0, 0, 255) if danger else (0, 180, 0)

    lines = [
        f"EAR: {result['ear']:.3f}  Closed: {result['eyes_closed']}",
        f"PERCLOS: {result['perclos']:.2%}",
        f"Blink rate: {result['blink_rate']:.1f}/min  Avg blink: {result['avg_blink_duration']:.2f}s",
        f"Head pitch/yaw/roll: {result['pitch']:.1f}, {result['yaw']:.1f}, {result['roll']:.1f}",
        f"Gaze: {result['gaze']} ({result['gaze_offset']:+.2f})  MAR: {result['mar']:.2f}",
    ]

    y = 28
    for line in lines:
        cv2.putText(frame, line, (12, y), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (255, 255, 255), 2)
        cv2.putText(frame, line, (12, y), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (20, 20, 20), 1)
        y += 26

    if warnings:
        cv2.rectangle(frame, (0, frame.shape[0] - 90), (frame.shape[1], frame.shape[0]), (0, 0, 180), -1)
        alert_text = " | ".join(warnings[:3])
        cv2.putText(
            frame,
            alert_text,
            (12, frame.shape[0] - 36),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.72,
            (255, 255, 255),
            2,
        )

    status = "ALERT" if danger else "OK"
    cv2.putText(frame, status, (frame.shape[1] - 130, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.85, color, 2)


def draw_landmark_points(frame, landmarks, width: int, height: int) -> None:
    points_to_draw = set(LEFT_EYE + RIGHT_EYE + LEFT_IRIS + RIGHT_IRIS + list(MOUTH.values()))
    for idx in points_to_draw:
        x, y = DriverConsciousnessDetector._landmark_2d(landmarks, idx, width, height)
        cv2.circle(frame, (int(x), int(y)), 2, (0, 255, 255), -1)


def parse_args() -> DetectorConfig:
    parser = argparse.ArgumentParser(description="MediaPipe driver consciousness detector")
    parser.add_argument("--camera", type=int, default=0, help="OpenCV camera index")
    parser.add_argument("--window", type=float, default=60.0, help="Rolling PERCLOS/blink window in seconds")
    parser.add_argument("--ear-threshold", type=float, default=0.20, help="EAR threshold below which eyes are closed")
    parser.add_argument("--perclos-threshold", type=float, default=0.35, help="Drowsy PERCLOS warning threshold")
    parser.add_argument("--long-blink", type=float, default=0.70, help="Long blink / eye closure seconds")
    parser.add_argument("--mar-threshold", type=float, default=0.60, help="Mouth aspect ratio yawn threshold")
    args = parser.parse_args()

    return DetectorConfig(
        camera_index=args.camera,
        window_seconds=args.window,
        ear_closed_threshold=args.ear_threshold,
        perclos_drowsy_threshold=args.perclos_threshold,
        long_blink_seconds=args.long_blink,
        yawning_mar_threshold=args.mar_threshold,
    )


def main() -> None:
    config = parse_args()
    detector = DriverConsciousnessDetector(config)

    mp_face_mesh = mp.solutions.face_mesh
    cap = cv2.VideoCapture(config.camera_index)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open camera index {config.camera_index}")

    with mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=config.min_detection_confidence,
        min_tracking_confidence=config.min_tracking_confidence,
    ) as face_mesh:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            frame = cv2.flip(frame, 1)
            height, width = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = face_mesh.process(rgb)
            rgb.flags.writeable = True

            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0].landmark
                output = detector.update(landmarks, width, height, time.time())
                draw_landmark_points(frame, landmarks, width, height)
                draw_dashboard(frame, output)
            else:
                cv2.putText(
                    frame,
                    "No face detected",
                    (12, 32),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2,
                )

            cv2.imshow("Driver Consciousness Detection", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if key == ord("r"):
                detector.reset()

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()