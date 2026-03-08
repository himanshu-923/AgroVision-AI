import cv2
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from collections import deque
import statistics

# 1. Setup
device = torch.device("cpu")
with open('classes.txt', 'r') as f:
    class_names = [line.strip() for line in f.readlines()]

model = models.mobilenet_v2(weights=None)
model.classifier[1] = nn.Linear(model.last_channel, len(class_names))
model.load_state_dict(torch.load('agrovision_model.pth', map_location=device))
model.eval()

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

cap = cv2.VideoCapture(0)
captured_result = "Ready"
is_frozen = False
prediction_buffer = deque(maxlen=15)

print("--- AgroVision Unlocked Scanner ---")
print("Press 'c' to Capture ANYTIME | 'r' to Resume Scan")

while True:
    ret, frame = cap.read()
    if not ret: break
    display_frame = frame.copy()

    # A. FOCUS & CONFIDENCE CHECK (Sirf Guidance ke liye)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    focus_score = cv2.Laplacian(gray, cv2.CV_64F).var()

    if not is_frozen:
        img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        input_tensor = preprocess(img_pil).unsqueeze(0)
        
        with torch.no_grad():
            output = model(input_tensor)
            prob = torch.nn.functional.softmax(output[0], dim=0)
            conf, idx = torch.max(prob, 0)
            
            # Prediction Buffer (Smoothing ke liye)
            prediction_buffer.append(idx.item())

            # Guidance logic (Sirf hints dene ke liye)
            if focus_score < 70:
                guidance = "HINT: Move Back (Blurry)"
                gui_color = (0, 165, 255) # Orange
            elif conf.item() < 0.70:
                guidance = "HINT: Come Closer"
                gui_color = (0, 0, 255) # Red
            else:
                guidance = "System: STABLE"
                gui_color = (0, 255, 0) # Green

            # Majority Result Selection
            stable_idx = statistics.mode(prediction_buffer)
            live_label = f"Scanning: {class_names[stable_idx]}"
    else:
        guidance = "RESULT LOCKED"
        gui_color = (255, 255, 0)
        live_label = "FREEZE MODE"

    key = cv2.waitKey(1)
    
    # B. UNLOCKED CAPTURE (Ab koi restriction nahi hai)
    if key & 0xFF == ord('c') and not is_frozen:
        # Buffer se jo bhi best result hai, usey turant lock karo
        if len(prediction_buffer) > 0:
            stable_idx = statistics.mode(prediction_buffer)
            captured_result = class_names[stable_idx]
            is_frozen = True
            print(f"Captured: {captured_result}")
        else:
            captured_result = "Nothing Detected"
            is_frozen = True

    # C. RESUME
    if key & 0xFF == ord('r'):
        is_frozen = False
        prediction_buffer.clear()
        captured_result = "Ready"

    # UI Design
    # Top Bar (Guidance)
    cv2.putText(display_frame, guidance, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, gui_color, 2)
    cv2.putText(display_frame, live_label, (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

    # Bottom Bar (Final Result for Voice/Integration)
    cv2.rectangle(display_frame, (0, 420), (640, 480), (0, 0, 0), -1)
    res_text = f"FINAL: {captured_result}" if is_frozen else "Press 'C' to Capture Result"
    cv2.putText(display_frame, res_text, (15, 460), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    cv2.imshow('AgroVision Unlocked', display_frame)
    if key & 0xFF == ord('q'): break

cap.release()
cv2.destroyAllWindows()