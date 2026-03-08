// client/src/hooks/use-audio.ts

export type UiLanguage = "en-IN" | "hi-IN" | "pa-IN";

function mapLanguageToLocale(lang: UiLanguage): string {
if (lang === "hi-IN") return "hi-IN";
if (lang === "pa-IN") {
// Punjabi browser voices are rare – use Hindi as best-effort fallback
return "hi-IN";
}
return "en-IN";
}

export function speakGuidance(text: string, lang: UiLanguage) {
if (typeof window === "undefined" || !("speechSynthesis" in window)) {
console.warn("Speech synthesis not supported in this browser");
return;
}

const synthesis = window.speechSynthesis;
synthesis.cancel(); // stop anything currently speaking

// Short-circuit if nothing to say
const trimmed = text.trim();
if (!trimmed) return;

const utterance = new SpeechSynthesisUtterance(trimmed);
utterance.lang = mapLanguageToLocale(lang);
utterance.rate = 1.0;
utterance.pitch = 1.0;

synthesis.speak(utterance);
}

export function stopGuidance() {
if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
window.speechSynthesis.cancel();
}
