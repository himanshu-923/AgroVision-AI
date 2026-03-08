# AGRO VISION - Quick Test Guide

## 1) Setup Python env
```powershell
cd "C:\Users\himan\.openclaw\workspace\AGRO VISION"
python -m venv .venv
.\.venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 2) Validate mapping consistency
```powershell
python verify_mapping.py --base .
```
Expected: `All checks passed`

## 3) Single image CLI test
Use any sample image path.
```powershell
python predict.py "C:\path\to\leaf.jpg" --threshold 0.70
```
You will get JSON output with:
- `predicted_label`
- `final_label` (may become `Unknown` if confidence < threshold)
- `confidence`
- `info` (from disease_info.json)

## 4) API test (for frontend integration)
Start API:
```powershell
uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
```

Health check:
```powershell
curl http://127.0.0.1:8000/health
```

Predict request (PowerShell):
```powershell
curl -X POST "http://127.0.0.1:8000/predict" ^
  -F "file=@C:\path\to\leaf.jpg" ^
  -F "threshold=0.70"
```

## 5) Optional webcam test
```powershell
python agro_capture_stable.py
```
Keys:
- `c` capture result
- `r` resume scan
- `q` quit

## Notes
- Keep `classes.txt`, `disease_info.json`, and model file in sync.
- If model/class order changes, regenerate mapping files from classes.txt.
