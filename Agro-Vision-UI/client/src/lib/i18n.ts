export type Language = 'en' | 'hi' | 'pa';

type Translations = {
  [key in Language]: {
    subtitle: string;
    upload: string;
    preview: string;
    result: string;
    advice: string;
    report: string;
    openCamera: string;
    uploadPhoto: string;
    dropImage: string;
    analyzeLeaf: string;
    analyzing: string;
    diseaseName: string;
    confidence: string;
    severity: string;
    treatmentTime: string;
    modelName: string;
    treatment: string;
    precautions: string;
    pesticides: string;
    hearGuidance: string;
    generateReport: string;
    downloadReport: string;
    backToHome: string;
    next: string;
    date: string;
    playingAudio: string;
    recentScans: string;
    noRecentScans: string;
    clearHistory: string;
    shareWhatsApp: string;
    cancel: string;
    back: string;
  }
};

export const t: Translations = {
  en: {
    subtitle: "AI Plant Disease Assistant for Farmers",
    upload: "Upload",
    preview: "Preview",
    result: "Result",
    advice: "Advice",
    report: "Report",
    openCamera: "Open Camera",
    uploadPhoto: "Upload Photo",
    dropImage: "Drop leaf image here",
    analyzeLeaf: "Analyze Leaf",
    analyzing: "Analyzing...",
    diseaseName: "Disease Name",
    confidence: "Confidence",
    severity: "Severity Level",
    treatmentTime: "Estimated Treatment Time",
    modelName: "AI Model Name",
    treatment: "Treatment",
    precautions: "Precautions",
    pesticides: "Recommended Pesticides",
    hearGuidance: "Hear Guidance",
    generateReport: "Generate Crop Health Report",
    downloadReport: "Download Crop Health Report",
    backToHome: "Back to Home",
    next: "Next Steps",
    date: "Date",
    playingAudio: "Playing Guidance...",
    recentScans: "Recent Scans",
    noRecentScans: "No recent scans yet",
    clearHistory: "Clear History",
    shareWhatsApp: "Share on WhatsApp",
    cancel: "Cancel",
    back: "Back",
  },
  hi: {
    subtitle: "किसान के लिए एआई पौधा रोग सहायक",
    upload: "अपलोड",
    preview: "पूर्वावलोकन",
    result: "परिणाम",
    advice: "सलाह",
    report: "रिपोर्ट",
    openCamera: "कैमरा खोलें",
    uploadPhoto: "फोटो अपलोड करें",
    dropImage: "पत्ती की छवि यहाँ छोड़ें",
    analyzeLeaf: "पत्ती का विश्लेषण करें",
    analyzing: "विश्लेषण हो रहा है...",
    diseaseName: "बीमारी का नाम",
    confidence: "आत्मविश्वास",
    severity: "गंभीरता",
    treatmentTime: "उपचार का समय",
    modelName: "मॉडल का नाम",
    treatment: "उपचार",
    precautions: "सावधानियां",
    pesticides: "अनुशंसित कीटनाशक",
    hearGuidance: "मार्गदर्शन सुनें",
    generateReport: "फसल स्वास्थ्य रिपोर्ट तैयार करें",
    downloadReport: "फसल स्वास्थ्य रिपोर्ट डाउनलोड करें",
    backToHome: "होम पर वापस जाएं",
    next: "अगला कदम",
    date: "तारीख",
    playingAudio: "मार्गदर्शन चल रहा है...",
    recentScans: "हाल की स्कैन",
    noRecentScans: "अभी तक कोई हाल की स्कैन नहीं",
    clearHistory: "इतिहास साफ करें",
    shareWhatsApp: "व्हाट्सऐप पर शेयर करें",
    cancel: "रद्द करें",
    back: "वापस",
  },
  pa: {
    subtitle: "ਕਿਸਾਨ ਲਈ ਏਆਈ ਪੌਦਾ ਰੋਗ ਸਹਾਇਕ",
    upload: "ਅੱਪਲੋਡ",
    preview: "ਝਲਕ",
    result: "ਨਤੀਜਾ",
    advice: "ਸਲਾਹ",
    report: "ਰਿਪੋਰਟ",
    openCamera: "ਕੈਮਰਾ ਖੋਲ੍ਹੋ",
    uploadPhoto: "ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ",
    dropImage: "ਪੱਤੇ ਦਾ ਚਿੱਤਰ ਇੱਥੇ ਸੁੱਟੋ",
    analyzeLeaf: "ਪੱਤੇ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ",
    analyzing: "ਵਿਸ਼ਲੇਸ਼ਣ ਕਰ ਰਿਹਾ ਹੈ...",
    diseaseName: "ਬਿਮਾਰੀ ਦਾ ਨਾਮ",
    confidence: "ਭਰੋਸਾ",
    severity: "ਗੰਭੀਰਤਾ",
    treatmentTime: "ਇਲਾਜ ਦਾ ਸਮਾਂ",
    modelName: "ਮਾਡਲ ਦਾ ਨਾਮ",
    treatment: "ਇਲਾਜ",
    precautions: "ਸਾਵਧਾਨੀਆਂ",
    pesticides: "ਸਿਫਾਰਸ਼ ਕੀਤੇ ਕੀਟਨਾਸ਼ਕ",
    hearGuidance: "ਮਾਰਗਦਰਸ਼ਨ ਸੁਣੋ",
    generateReport: "ਫਸਲ ਸਿਹਤ ਰਿਪੋਰਟ ਤਿਆਰ ਕਰੋ",
    downloadReport: "ਫਸਲ ਸਿਹਤ ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ",
    backToHome: "ਮੁੱਖ ਪੰਨੇ 'ਤੇ ਵਾਪਸ ਜਾਓ",
    next: "ਅਗਲਾ ਕਦਮ",
    date: "ਮਿਤੀ",
    playingAudio: "ਮਾਰਗਦਰਸ਼ਨ ਚੱਲ ਰਿਹਾ ਹੈ...",
    recentScans: "ਤਾਜ਼ਾ ਸਕੈਨ",
    noRecentScans: "ਹਾਲੇ ਕੋਈ ਤਾਜ਼ਾ ਸਕੈਨ ਨਹੀਂ",
    clearHistory: "ਹਿਸਟਰੀ ਸਾਫ਼ ਕਰੋ",
    shareWhatsApp: "ਵਟਸਐਪ 'ਤੇ ਸਾਂਝਾ ਕਰੋ",
    cancel: "ਰੱਦ ਕਰੋ",
    back: "ਪਿੱਛੇ",
  }
};

export const langCodes = {
  en: 'en-IN',
  hi: 'hi-IN',
  pa: 'pa-IN'
};
