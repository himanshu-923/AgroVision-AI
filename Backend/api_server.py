from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from predict import AgroVisionPredictor


app = FastAPI(title="AgroVision Inference API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = AgroVisionPredictor(threshold=0.70)


@app.get("/health")
def health():
    return {"ok": True, "service": "agrovision-inference"}


@app.post("/predict")
async def predict(file: UploadFile = File(...), threshold: float = Form(0.70)):
    content = await file.read()

    # Optional per-request threshold override
    predictor.threshold = threshold

    result = predictor.predict_image_bytes(content)
    return result
