import argparse
import json
from io import BytesIO
from pathlib import Path
from typing import Dict, Any

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "agrovision_model.pth"
CLASSES_PATH = BASE_DIR / "classes.txt"
DISEASE_INFO_PATH = BASE_DIR / "disease_info.json"


class AgroVisionPredictor:
    def __init__(self, threshold: float = 0.70, device: str = "cpu"):
        self.threshold = threshold
        self.device = torch.device(device)

        self.class_names = self._load_classes(CLASSES_PATH)
        self.disease_info = self._load_json(DISEASE_INFO_PATH)

        self.model = models.mobilenet_v2(weights=None)
        self.model.classifier[1] = nn.Linear(self.model.last_channel, len(self.class_names))
        state = torch.load(MODEL_PATH, map_location=self.device)
        self.model.load_state_dict(state)
        self.model.to(self.device)
        self.model.eval()

        self.preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    @staticmethod
    def _load_classes(path: Path):
        return [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

    @staticmethod
    def _load_json(path: Path) -> Dict[str, Any]:
        return json.loads(path.read_text(encoding="utf-8"))

    def _run_tensor(self, image_tensor: torch.Tensor) -> Dict[str, Any]:
        image_tensor = image_tensor.unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(image_tensor)
            probs = torch.nn.functional.softmax(logits[0], dim=0)
            confidence, pred_idx = torch.max(probs, dim=0)

        confidence = float(confidence.item())
        pred_idx = int(pred_idx.item())
        predicted_label = self.class_names[pred_idx]

        final_label = predicted_label if confidence >= self.threshold else "Unknown"
        info = self.disease_info.get(final_label, self.disease_info.get("Unknown", {}))

        return {
            "predicted_label": predicted_label,
            "final_label": final_label,
            "confidence": round(confidence, 4),
            "threshold": self.threshold,
            "is_unknown_fallback": final_label == "Unknown" and predicted_label != "Unknown",
            "info": info,
        }

    def predict_image_path(self, image_path: str) -> Dict[str, Any]:
        img = Image.open(image_path).convert("RGB")
        tensor = self.preprocess(img)
        return self._run_tensor(tensor)

    def predict_image_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        tensor = self.preprocess(img)
        return self._run_tensor(tensor)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AgroVision single-image predictor")
    parser.add_argument("image", help="Path to input image")
    parser.add_argument("--threshold", type=float, default=0.70, help="Unknown fallback threshold")
    args = parser.parse_args()

    predictor = AgroVisionPredictor(threshold=args.threshold)
    result = predictor.predict_image_path(args.image)
    print(json.dumps(result, ensure_ascii=False, indent=2))
