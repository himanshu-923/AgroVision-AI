# 🌾 Agro Vision AI

<div align="center">
  <img src="Agro-Vision-UI\client\public\agro-logo.jpg"" alt="Agro Vision AI Logo" width="120" />
  <h3>AI‑Powered Crop Disease Assistant for Farmers</h3>
  <p><i>Empowering illiterate and newbie farmers with instant, multilingual disease diagnosis and voice guidance</i></p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-4.0-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi" />
  <img src="https://img.shields.io/badge/TensorFlow-2.13-FF6F00?logo=tensorflow" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

## 📖 Overview

**Agro Vision AI** is a multilingual, AI‑powered web application that helps farmers detect crop diseases by simply taking a photo of an infected leaf. Designed specifically for **illiterate and newbie farmers in Punjab**, the app provides:

- Instant disease identification with confidence score
- Severity level and estimated treatment time
- Step‑by‑step treatment, precautions, and pesticide advice
- Voice guidance in **English, Hindi, and Punjabi** (browser TTS – no internet required)
- Printable reports and WhatsApp sharing
- Local storage history of recent scans

The application bridges the gap between cutting‑edge deep learning and grassroots agricultural needs.

---

## ✨ Features

### 📷 Image Input
- **Gallery upload** – select an existing leaf photo
- **Drag & drop** – intuitive file dropping
- **Live camera capture** – uses device camera (rear‑facing preferred) with manual capture

### 🧠 AI Analysis
- Disease classification using a fine‑tuned **MobileNetV2** model trained on the PlantVillage dataset and augmented with Punjab‑specific crop data.
- Confidence score displayed as a circular progress bar.
- Severity automatically derived from confidence:
  - **High** (≥90%)
  - **Medium** (≥75%)
  - **Low** (<75%)
- Estimated treatment window (rule‑based).

### 📋 Advisory
- Three expandable sections: **Treatment**, **Precautions**, **Pesticides**
- Icon‑based headers for visual recognition
- Multilingual content (EN/HI/PA)

### 🎧 Voice Guidance
- **Hear Guidance** button reads the advice aloud in the selected language
- Uses browser's built‑in **SpeechSynthesis** (instant, offline, no API calls)
- Fallback to backend gTTS if needed (but primary is browser)

### 🌐 Multilingual UI
- Top‑right language selector: **English / हिन्दी / ਪੰਜਾਬੀ**
- All labels, disease names, and advice switch instantly

### 📊 Reporting
- Dedicated result and advice screens
- **Printable report** with analysis summary and leaf image
- **Share on WhatsApp** – one‑click sharing of formatted results

### 🕒 History
- Stores last 10 scans in browser `localStorage`
- Click any past scan to reload results
- Clear history option

### 🎨 UX & Design
- 5‑step progress stepper (Upload → Preview → Result → Advice → Report)
- Global **Back** and **Cancel** buttons on every screen
- Light / Dark mode toggle
- Custom logo and subtle background image
- Fully responsive, mobile‑first design

---

## 🧱 Tech Stack

| **Layer**       | **Technologies**                                                                 |
|-----------------|----------------------------------------------------------------------------------|
| **Frontend**    | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons           |
| **Backend**     | Python 3.10+, FastAPI, Uvicorn                                                   |
| **ML Model**    | TensorFlow / Keras, MobileNetV2, Transfer Learning                               |
| **Data**        | PlantVillage dataset + custom Punjab crop disease info                           |
| **Storage**     | Browser localStorage (history), in‑memory storage (backend)                      |
| **Deployment**  | Local (for hackathon) – can be exposed via ngrok / Cloudflare Tunnel             |

---

## 📁 Repository Structure
agro-vision-ai/
├── backend/ # Python FastAPI backend
│ ├── api_server.py # Main API server
│ ├── predict.py # Model loading & prediction
│ ├── agrovision_model.pth # Trained MobileNetV2 weights
│ ├── class_to_idx.json # Class → index mapping
│ ├── disease_info.json # Multilingual disease advice
│ ├── classes.txt # List of disease class names
│ ├── requirements.txt # Python dependencies
│ └── ... (other utility files)
├── frontend/ # React frontend
│ ├── public/ # Static assets (logo, background)
│ ├── src/ # Source code
│ │ ├── components/ # Reusable UI components
│ │ ├── hooks/ # Custom hooks (use-audio, use-analysis)
│ │ ├── lib/ # i18n, utilities
│ │ ├── pages/ # Home page (main flow)
│ │ └── ...
│ ├── package.json # Node dependencies
│ ├── vite.config.ts # Vite configuration
│ ├── tailwind.config.ts # Tailwind setup
│ └── .env.example # Example environment variables
├── .gitignore # Git ignore rules
└── README.md # This file

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm (for frontend)
- **Python** 3.10+ and pip (for backend)
- Git

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/agro-vision-ai.git
cd agro-vision-ai
cd backend
python -m venv .venv                # Create virtual environment
# Activate it:
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt      # Install Python packages

# Ensure all required files are present:
# agrovision_model.pth, class_to_idx.json, disease_info.json, classes.txt

uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
The backend will start at http://localhost:8000.
Swagger docs are available at http://localhost:8000/docs.

3️⃣ Frontend Setup
Open a new terminal and navigate to the frontend folder:

cd frontend
npm install                          # Install Node dependencies
Create a .env file in the frontend root (see .env.example):

VITE_API_BASE_URL=http://localhost:8000
Start the development server:

npm run dev
The app will be available at http://localhost:5173.

4️⃣ Test the Full Flow
Upload or capture a leaf image.

Click Analyze – after a short delay, results appear.

Switch languages and click Hear Guidance to listen to advice.

Generate a report, share via WhatsApp, or check history.
🌐 Environment Variables
Frontend (.env)
Variable	Description	Default
VITE_API_BASE_URL	URL of the backend API	http://localhost:8000
(Backend does not require environment variables; configuration is hardcoded for simplicity.)
🏆 Team Members
[Aryan] – UI/Frontend Developer

[Aditya Saumya] – ML Engineer

[Himanshu Kumar] – Data & Integration Specialist

Built during Hack‑N‑Win 3.0 (March 7–8, 2026) at CGC University, Mohali.

🙏Acknowledgments
PlantVillage dataset for providing a solid foundation for plant disease classification.

Punjab Agricultural University (PAU) for research data on local crop diseases.

D4 Community for organizing Hack‑N‑Win 3.0.

All mentors and volunteers who supported us during the hackathon.
