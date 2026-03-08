import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import multer from "multer";


const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

interface ModelResponse {
  predicted_label: string;
  final_label: string;
  confidence: number;
  threshold: number;
  is_unknown_fallback: boolean;
  info?: {
    name_en?: string;
    name_hi?: string;
    name_pa?: string;
    advice_en?: string;
    advice_hi?: string;
    advice_pa?: string;
    precautions_en?: string;
    precautions_hi?: string;
    precautions_pa?: string;
    pesticides_en?: string;
    pesticides_hi?: string;
    pesticides_pa?: string;
  };
}

function pickByLanguage(data: ModelResponse["info"] | undefined, language: string, key: "name" | "advice" | "precautions" | "pesticides") {
  if (!data) return "";
  const langKey = `${key}_${language}` as keyof typeof data;
  const enKey = `${key}_en` as keyof typeof data;
  return (data[langKey] as string) || (data[enKey] as string) || "";
}

function severityFromConfidence(confidence: number) {
  if (confidence >= 90) return "High";
  if (confidence >= 75) return "Medium";
  return "Low";
}

function normalizeGttsLang(language?: string) {
  const input = (language || "en").toLowerCase();
  if (input.startsWith("hi")) return "hi-IN";
  if (input.startsWith("pa") || input.startsWith("punjabi")) return "pa-IN";
  return "en-IN";
}

function splitForTts(text: string, maxLen = 180) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const parts: string[] = [];
  let remaining = clean;

  while (remaining.length > maxLen) {
    let idx = remaining.lastIndexOf(".", maxLen);
    if (idx < 0) idx = remaining.lastIndexOf(" ", maxLen);
    if (idx < 0) idx = maxLen;

    parts.push(remaining.slice(0, idx).trim());
    remaining = remaining.slice(idx).trim();
  }

  if (remaining) parts.push(remaining);
  return parts.filter(Boolean);
}

async function translateText(text: string, language?: string) {
  const ttsLang = normalizeGttsLang(language);
  const tl = ttsLang.split("-")[0];
  if (tl === "en") return text;

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", tl);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!response.ok) return text;

  const data = (await response.json()) as any[];
  const translated = Array.isArray(data?.[0])
    ? data[0].map((chunk: any[]) => chunk?.[0] || "").join("")
    : text;

  return translated || text;
}

async function synthesizeWithGoogleTts(text: string, language?: string) {
  const tl = normalizeGttsLang(language);
  const chunks = splitForTts(text);
  if (chunks.length === 0) throw new Error("No text for gTTS");

  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const url = new URL("https://translate.google.com/translate_tts");
    url.searchParams.set("ie", "UTF-8");
    url.searchParams.set("q", chunk);
    url.searchParams.set("tl", tl);
    url.searchParams.set("client", "tw-ob");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://translate.google.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`gTTS request failed (${response.status})`);
    }

    buffers.push(Buffer.from(await response.arrayBuffer()));
  }

  return Buffer.concat(buffers);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.post(api.analyses.analyze.path, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image is required" });
      }

      const language = (req.body.language || "en") as "en" | "hi" | "pa";
      const modelBase = process.env.AGRO_MODEL_API_BASE || "http://127.0.0.1:8000";

      const formData = new FormData();
      formData.append("file", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || "image.jpg");
      formData.append("threshold", "0.70");

      const modelRes = await fetch(`${modelBase}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!modelRes.ok) {
        const text = await modelRes.text();
        return res.status(502).json({ message: `Model API failed: ${modelRes.status} ${text}` });
      }

      const modelData = (await modelRes.json()) as ModelResponse;
      const confidence = Math.round((modelData.confidence || 0) * 100);

      const diseaseNameRaw = pickByLanguage(modelData.info, language, "name") || modelData.final_label || "Unknown";
      const treatmentRaw = pickByLanguage(modelData.info, language, "advice") || "Consult an expert.";
      const precautionsRaw = pickByLanguage(modelData.info, language, "precautions") || "Follow standard crop safety practices.";
      const pesticidesRaw = pickByLanguage(modelData.info, language, "pesticides") || "Use recommended fungicide as advised locally.";

      const [diseaseName, treatment, precautions, pesticides] = await Promise.all([
        translateText(diseaseNameRaw, language),
        translateText(treatmentRaw, language),
        translateText(precautionsRaw, language),
        translateText(pesticidesRaw, language),
      ]);

      const analysisData = {
        imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        diseaseName,
        confidence,
        severity: severityFromConfidence(confidence),
        treatmentTime: modelData.final_label === "Unknown" ? "1-2 days" : "3-7 days",
        treatment,
        precautions,
        pesticides,
        modelName: "AgroVision CNN v2.1",
        language,
      };

      const analysis = await storage.createAnalysis(analysisData);
      res.json(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  app.get(api.analyses.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Not found" });
      }
      res.json(analysis);
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.audio.speak.path, async (req, res) => {
    try {
      const { text, language } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const lang = String(language || "en");
      const localizedText = await translateText(String(text), lang);
      const buffer = await synthesizeWithGoogleTts(localizedText, lang);
      res.set("Content-Type", "audio/mpeg");
      res.send(buffer);
    } catch (error) {
      console.error("Audio error:", error);
      res.status(500).json({ message: "Failed to generate gTTS audio" });
    }
  });

  return httpServer;
}
