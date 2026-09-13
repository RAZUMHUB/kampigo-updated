import logging

from PIL import Image

from .base import ObjectDetectionAdapter

logger = logging.getLogger(__name__)


class YoloDetectionAdapter(ObjectDetectionAdapter):
    """
    YOLO-family object detector, used to crop to the primary object before
    embedding (reduces background-clutter noise in the vision embedding).
    Lazily imports `ultralytics` so the service can run without it when
    detection-based cropping is disabled.
    """

    def __init__(self, model_name: str = "yolov8n"):
        self.model_name = model_name
        self._model = None

    def _get_model(self):
        if self._model is None:
            from ultralytics import YOLO  # lazy import - heavy dependency

            self._model = YOLO(f"{self.model_name}.pt")
        return self._model

    def detect(self, image: Image.Image) -> list[dict]:
        try:
            model = self._get_model()
            results = model.predict(image, verbose=False)
            detections = []
            for result in results:
                for box in result.boxes:
                    detections.append(
                        {
                            "label": result.names[int(box.cls[0])],
                            "confidence": float(box.conf[0]),
                            "bbox": [float(x) for x in box.xyxy[0].tolist()],
                        }
                    )
            return detections
        except Exception:
            logger.exception("YOLO detection failed")
            return []
