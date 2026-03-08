import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, Leaf, AlertTriangle, Clock, Activity,
  Download, Home as HomeIcon, Pill, ShieldAlert, Bug, Volume2,
  Loader2, Moon, Sun, X, History, Share2, ArrowLeft
} from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { t, langCodes, type Language } from '@/lib/i18n';
import { useAnalyzeImage } from '@/hooks/use-analysis';
import { speakGuidance, stopGuidance, type UiLanguage } from '../hooks/use-audio';
import { CircularProgress } from '@/components/CircularProgress';
import { Accordion, AccordionItem } from '@/components/ui/accordion';


type Step = 1 | 2 | 3 | 4 | 5;

type ScanHistoryItem = {
  id: string;
  diseaseName: string;
  confidence: number;
  severity: string;
  treatmentTime: string;
  treatment: string;
  precautions: string;
  pesticides: string;
  modelName: string;
  language: string;
  createdAt: string;
};

export default function Home() {
  const { language, setLanguage, isDarkMode, toggleTheme, analysisData, setAnalysisData } = useAppContext();
  const lang = t[language];

  const [step, setStep] = useState<Step>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  const analyzeMutation = useAnalyzeImage();

  // Load history from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('agrovision_scan_history_v1');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ScanHistoryItem[];
      if (Array.isArray(parsed)) setScanHistory(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('agrovision_scan_history_v1', JSON.stringify(scanHistory));
  }, [scanHistory]);

  // Cleanup camera stream and any ongoing speech on unmount
  useEffect(() => {
    return () => {
      stopGuidance();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStep(2);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStep(2);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setCameraError(null);

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraModalOpen(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setCameraError('Camera permission denied. Opening file picker instead.');
      cameraInputRef.current?.click();
    }
  };

  const closeCamera = () => {
    setCameraModalOpen(false);
    stopCameraStream();
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStep(2);
      setAnalysisData(null);
      closeCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleAnalyze = () => {
    if (!imageFile) return;

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('language', language);

    const start = Date.now();

    analyzeMutation.mutate(formData, {
      onSuccess: (data) => {
        const elapsed = Date.now() - start;
        const minDelay = 1400;
        const wait = Math.max(0, minDelay - elapsed);

        setTimeout(() => {
          setAnalysisData(data);
          setStep(3);

          const item: ScanHistoryItem = {
            id: `${Date.now()}`,
            diseaseName: data.diseaseName,
            confidence: data.confidence,
            severity: data.severity,
            treatmentTime: data.treatmentTime,
            treatment: data.treatment,
            precautions: data.precautions,
            pesticides: data.pesticides,
            modelName: data.modelName,
            language,
            createdAt: new Date().toISOString(),
          };

          setScanHistory(prev => [item, ...prev].slice(0, 10));
        }, wait);
      }
    });
  };

  const handlePlayGuidance = () => {
    if (!analysisData) return;

    if (isPlayingAudio) {
      stopGuidance();
      setIsPlayingAudio(false);
      return;
    }

    const text = `${lang.diseaseName}: ${analysisData.diseaseName}. 
                  ${lang.treatment}: ${analysisData.treatment}. 
                  ${lang.precautions}: ${analysisData.precautions}. 
                  ${lang.pesticides}: ${analysisData.pesticides}.`;

    // Map app language to the locale expected by speakGuidance
    let ttsLang: UiLanguage = 'en-IN';
    if (language === 'hi') ttsLang = 'hi-IN';
    if (language === 'pa') ttsLang = 'pa-IN'; // will fallback to hi-IN

    setIsPlayingAudio(true);
    speakGuidance(text, ttsLang);

    // Rough estimate of speech duration – stop playing state after 5 seconds
    setTimeout(() => setIsPlayingAudio(false), 5000);
  };

  const resetFlow = () => {
    setStep(1);
    setImageFile(null);
    setImagePreview(null);
    setAnalysisData(null);
    stopGuidance();
    setIsPlayingAudio(false);
    closeCamera();
  };

  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('agrovision_scan_history_v1');
  };

  const goBack = () => {
    if (step > 1) setStep(prev => Math.max(1, prev - 1) as Step);
  };

  const cancelFlow = resetFlow;

  const loadFromHistory = (item: ScanHistoryItem) => {
    setAnalysisData(item);
    setStep(3);
  };

  const shareOnWhatsApp = () => {
    if (!analysisData) return;
    const msg = [
      `🌾 AGRO VISION Result`,
      `${lang.diseaseName}: ${analysisData.diseaseName}`,
      `${lang.confidence}: ${analysisData.confidence}%`,
      `${lang.severity}: ${analysisData.severity}`,
      `${lang.treatmentTime}: ${analysisData.treatmentTime}`,
      `${lang.treatment}: ${analysisData.treatment}`,
      `${lang.precautions}: ${analysisData.precautions}`,
      `${lang.pesticides}: ${analysisData.pesticides}`,
    ].join('\n');
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const downloadPdfReport = () => {
    if (!analysisData) return;
    const reportImage = analysisData.imageUrl || imagePreview || '';
    const reportWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!reportWindow) return;

    const html = `
      <html>
      <head>
        <title>Agro Vision Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
          .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #e5e7eb; padding-bottom:12px; margin-bottom:16px; }
          .brand { font-size: 24px; font-weight: 800; color:#166534; }
          .meta { font-size:12px; color:#6b7280; text-align:right; }
          .brand-row { display:flex; align-items:center; gap:10px; }
          .brand-logo { width:48px; height:36px; object-fit:contain; mix-blend-mode:multiply; opacity:.9; filter: contrast(1.02) saturate(1.02); }
          .image-wrap { margin: 16px 0; }
          .image-wrap img { width: 100%; max-height: 320px; object-fit: cover; border-radius: 10px; border:1px solid #d1d5db; }
          .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0 18px; }
          .card { border:1px solid #e5e7eb; border-radius:10px; padding:10px; }
          .k { font-size: 11px; color:#6b7280; margin-bottom:6px; }
          .v { font-size: 16px; font-weight:700; }
          .section { margin-top: 12px; border:1px solid #e5e7eb; border-radius:10px; padding:12px; }
          .section h3 { margin:0 0 8px; font-size: 14px; }
          .section p { margin:0; white-space: pre-wrap; line-height:1.45; }
          .footer { margin-top:18px; font-size:11px; color:#6b7280; text-align:center; }
          @media print { .no-print{display:none;} body{padding:10px;} }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-row">
              <img class="brand-logo" src="${window.location.origin}/agro-logo.png" alt="logo" />
              <div class="brand">AGRO VISION AI</div>
            </div>
            <div style="font-size:12px;color:#6b7280;">Crop Disease Analysis Report</div>
          </div>
          <div class="meta">
            <div>${lang.date}: ${new Date().toLocaleString()}</div>
            <div>${lang.modelName}: ${analysisData.modelName || 'AgroVision'}</div>
          </div>
        </div>
        ${reportImage ? `<div class="image-wrap"><img src="${reportImage}" alt="Scanned leaf"/></div>` : ''}
        <div class="grid">
          <div class="card"><div class="k">${lang.diseaseName}</div><div class="v">${analysisData.diseaseName}</div></div>
          <div class="card"><div class="k">${lang.confidence}</div><div class="v">${analysisData.confidence}%</div></div>
          <div class="card"><div class="k">${lang.severity}</div><div class="v">${analysisData.severity}</div></div>
          <div class="card"><div class="k">${lang.treatmentTime}</div><div class="v">${analysisData.treatmentTime}</div></div>
        </div>
        <div class="section"><h3>${lang.treatment}</h3><p>${analysisData.treatment}</p></div>
        <div class="section"><h3>${lang.precautions}</h3><p>${analysisData.precautions}</p></div>
        <div class="section"><h3>${lang.pesticides}</h3><p>${analysisData.pesticides}</p></div>
        <div class="footer">Generated by AGRO VISION AI</div>
        <script>window.onload = () => { window.print(); };</script>
      </body>
      </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  const renderProgressBar = () => {
    const steps = [lang.upload, lang.preview, lang.result, lang.advice, lang.report];
    return (
      <div className="w-full mb-8 no-print">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border/50 rounded-full z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />
          {steps.map((s, i) => {
            const num = i + 1;
            const isActive = step >= num;
            const isCurrent = step === num;
            return (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-card text-muted-foreground border-2 border-border/50'
                } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                  {num}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium transition-colors ${isCurrent ? 'text-primary' : 'text-muted-foreground'} hidden sm:block`}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center relative pb-20">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.06] blur-[1px] no-print">
        <img src="/agro-bg.jpg" alt="Agro background" className="w-full h-full object-cover" />
      </div>

      <div className="w-full max-w-[480px] bg-background/50 relative z-10 flex flex-col px-4 sm:px-6 pt-6">

        {/* Header */}
        <header className="flex flex-col gap-4 mb-8 no-print">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight flex items-center gap-2">
                <img src="/agro-logo.png" alt="Agro Vision Logo" className="w-12 h-9 object-contain mix-blend-multiply opacity-90 [filter:contrast(1.02)_saturate(1.02)]" />
                <span className="text-primary">AGRO</span>
                <span className="text-wheat">VISION</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md self-start mt-1">AI</span>
              </h1>
              <p className="text-sm font-medium text-muted-foreground mt-1">{lang.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 bg-card p-1.5 rounded-xl border border-border shadow-sm">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer pr-1 text-foreground"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
              </select>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        {renderProgressBar()}

        <div className="mb-4 flex gap-2 no-print">
          <button
            onClick={goBack}
            disabled={step === 1}
            className="flex-1 py-2.5 rounded-xl border border-border bg-card/70 text-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition"
          >
            <ArrowLeft size={16} /> {lang.back}
          </button>
          <button
            onClick={cancelFlow}
            className="flex-1 py-2.5 rounded-xl border border-red-300/60 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300 font-semibold hover:bg-red-100/60 dark:hover:bg-red-950/40 transition"
          >
            {lang.cancel}
          </button>
        </div>

        {/* Recent Scans */}
        <section className="mb-6 no-print">
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><History size={16} /> {lang.recentScans}</h3>
              {scanHistory.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">{lang.clearHistory}</button>
              )}
            </div>
            {scanHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">{lang.noRecentScans}</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-auto pr-1">
                {scanHistory.map(item => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="w-full text-left rounded-xl border border-border/60 bg-card/70 p-3 hover:bg-card transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{item.diseaseName}</p>
                      <span className="text-xs font-bold text-primary">{item.confidence}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <main className="flex-1 w-full relative">
          <AnimatePresence mode="wait">
            {/* STEP 1: UPLOAD */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

                <button onClick={openCamera} className="glass-panel p-6 flex flex-col items-center justify-center gap-4 rounded-2xl hover:bg-primary hover:text-primary-foreground group transition-all duration-300">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-colors">
                    <Camera size={32} />
                  </div>
                  <span className="font-bold text-lg">{lang.openCamera}</span>
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="glass-panel p-6 flex flex-col items-center justify-center gap-4 rounded-2xl hover:border-primary hover:shadow-lg transition-all duration-300">
                  <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                    <Upload size={32} />
                  </div>
                  <span className="font-bold text-lg">{lang.uploadPhoto}</span>
                </button>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`mt-4 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card/30'
                  }`}
                >
                  <Leaf className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium">{lang.dropImage}</p>
                </div>
                {cameraError && <p className="text-xs text-amber-600 text-center">{cameraError}</p>}
              </motion.div>
            )}

            {/* STEP 2: PREVIEW */}
            {step === 2 && imagePreview && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="rounded-3xl overflow-hidden glass-panel p-2 shadow-xl relative">
                  <img src={imagePreview} alt="Preview" className="w-full aspect-[4/5] object-cover rounded-2xl" />
                  <AnimatePresence>
                    {analyzeMutation.isPending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-2 rounded-2xl overflow-hidden pointer-events-none"
                      >
                        <div className="absolute inset-0 bg-cyan-400/10" />
                        <div
                          className="absolute inset-0 opacity-35"
                          style={{
                            backgroundImage:
                              'linear-gradient(to right, rgba(34,211,238,.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,211,238,.2) 1px, transparent 1px)',
                            backgroundSize: '26px 26px',
                          }}
                        />
                        <motion.div
                          initial={{ top: '-18%' }}
                          animate={{ top: '100%' }}
                          transition={{ duration: 1.35, repeat: Infinity, ease: 'linear' }}
                          className="absolute left-0 w-full h-16 bg-gradient-to-b from-transparent via-cyan-300/65 to-transparent"
                        />
                        <div className="absolute inset-0 border border-cyan-300/70 rounded-2xl" />
                        <div className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-cyan-300/90 rounded-tl-md" />
                        <div className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-cyan-300/90 rounded-tr-md" />
                        <div className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-cyan-300/90 rounded-bl-md" />
                        <div className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-cyan-300/90 rounded-br-md" />
                        <div className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold rounded bg-black/55 text-cyan-200 tracking-wide flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                          AI SCANNING...
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {lang.analyzing}
                    </>
                  ) : (
                    <>
                      <Activity size={24} />
                      {lang.analyzeLeaf}
                    </>
                  )}
                </button>
                <button onClick={resetFlow} className="text-muted-foreground font-medium py-2 hover:text-foreground">
                  Cancel
                </button>
              </motion.div>
            )}

            {/* STEP 3: RESULT */}
            {step === 3 && analysisData && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col items-center relative overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
                  <h2 className="text-2xl font-display font-bold text-center mb-8">{lang.result}</h2>
                  <CircularProgress value={analysisData.confidence} size={140} strokeWidth={12} className="mb-8" />
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-center p-4 bg-card rounded-xl border border-border/50">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Bug className="w-5 h-5 text-primary" />
                        <span className="font-medium">{lang.diseaseName}</span>
                      </div>
                      <span className="font-bold text-foreground text-right max-w-[50%]">{analysisData.diseaseName}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-card rounded-xl border border-border/50">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <AlertTriangle className="w-5 h-5 text-[#D4A373]" />
                        <span className="font-medium">{lang.severity}</span>
                      </div>
                      <span className={`font-bold px-3 py-1 rounded-lg text-sm ${
                        analysisData.severity.toLowerCase().includes('high') ? 'bg-red-500/10 text-red-500' :
                        analysisData.severity.toLowerCase().includes('medium') ? 'bg-orange-500/10 text-orange-500' :
                        'bg-green-500/10 text-green-600 dark:text-green-400'
                      }`}>
                        {analysisData.severity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-card rounded-xl border border-border/50">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">{lang.treatmentTime}</span>
                      </div>
                      <span className="font-bold text-foreground">{analysisData.treatmentTime}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-4 rounded-2xl font-bold text-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  {lang.next}
                </button>
              </motion.div>
            )}

            {/* STEP 4: ADVICE */}
            {step === 4 && analysisData && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex justify-between items-end mb-2">
                  <h2 className="text-2xl font-display font-bold">{lang.advice}</h2>
                  <button
                    onClick={handlePlayGuidance}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                      isPlayingAudio
                        ? 'bg-accent text-accent-foreground animate-pulse'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                    {isPlayingAudio ? lang.playingAudio : lang.hearGuidance}
                  </button>
                </div>
                <Accordion>
                  <AccordionItem title={lang.treatment} icon={<Pill />} defaultOpen>
                    {analysisData.treatment}
                  </AccordionItem>
                  <AccordionItem title={lang.precautions} icon={<ShieldAlert />}>
                    {analysisData.precautions}
                  </AccordionItem>
                  <AccordionItem title={lang.pesticides} icon={<Bug />}>
                    {analysisData.pesticides}
                  </AccordionItem>
                </Accordion>
                <div className="mt-4 pt-6 border-t border-border/50">
                  <button
                    onClick={() => setStep(5)}
                    className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {lang.generateReport}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: REPORT */}
            {step === 5 && analysisData && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-6"
              >
                <div id="printable-report" className="glass-panel p-6 sm:p-8 rounded-3xl bg-card">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🌾</span>
                      <div>
                        <h3 className="font-display font-bold text-lg leading-tight text-foreground">AGRO VISION AI</h3>
                        <p className="text-xs text-muted-foreground">{lang.report}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-medium">{lang.date}</p>
                      <p className="font-bold text-sm text-foreground">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                    <div><p className="text-xs text-muted-foreground font-medium mb-1">{lang.diseaseName}</p><p className="font-bold text-foreground text-lg">{analysisData.diseaseName}</p></div>
                    <div><p className="text-xs text-muted-foreground font-medium mb-1">{lang.confidence}</p><p className="font-bold text-primary text-lg">{analysisData.confidence}%</p></div>
                    <div><p className="text-xs text-muted-foreground font-medium mb-1">{lang.severity}</p><p className="font-bold text-foreground">{analysisData.severity}</p></div>
                    <div><p className="text-xs text-muted-foreground font-medium mb-1">{lang.treatmentTime}</p><p className="font-bold text-foreground">{analysisData.treatmentTime}</p></div>
                  </div>
                  <div className="pt-6 border-t border-border"><p className="text-xs text-muted-foreground font-medium mb-1">{lang.modelName}</p><p className="font-mono text-sm font-semibold text-foreground/80">{analysisData.modelName}</p></div>
                </div>
                <div className="flex flex-col gap-3 no-print">
                  <button onClick={downloadPdfReport} className="w-full py-4 rounded-2xl font-bold text-lg bg-primary text-primary-foreground flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <Download size={20} /> {lang.downloadReport}
                  </button>
                  <button onClick={shareOnWhatsApp} className="w-full py-4 rounded-2xl font-bold text-lg bg-green-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-green-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <Share2 size={20} /> {lang.shareWhatsApp}
                  </button>
                  <button onClick={resetFlow} className="w-full py-4 rounded-2xl font-bold text-lg bg-card text-foreground border-2 border-border hover:bg-muted hover:border-primary/50 transition-all duration-300 flex items-center justify-center gap-2">
                    <HomeIcon size={20} /> {lang.backToHome}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {cameraModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 no-print">
            <div className="w-full max-w-md rounded-2xl bg-card border border-border p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{lang.openCamera}</h3>
                <button onClick={closeCamera} className="p-1 rounded-md hover:bg-muted"><X size={18} /></button>
              </div>
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl bg-black aspect-[4/3] object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={closeCamera} className="py-2 rounded-xl border border-border hover:bg-muted">Cancel</button>
                <button onClick={captureFromCamera} className="py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90">Capture</button>
              </div>
            </div>
          </div>
        )}

        <footer className="w-full py-6 text-center text-sm font-medium text-muted-foreground/60 no-print mt-auto">
          Powered by <span className="text-primary/70 font-bold">Neural Nest</span>
        </footer>
      </div>
    </div>
  );
}