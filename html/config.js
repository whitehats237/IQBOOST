// ============================================
// config.js — Configuration de l'application
// ============================================
// IMPORTANT : Ne jamais partager ce fichier publiquement
// Ne jamais le mettre sur GitHub sans le cacher dans .gitignore

// config.js
const CONFIG = {
  // Clé Groq — obtenir sur console.groq.com
  GROQ_API_KEY: "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",

  // Modèle à utiliser
  GROQ_MODEL: "llama-3.3-70b-versatile",

  // URL de l'API Groq
  GROQ_URL: "https://api.groq.com/openai/v1/chat/completions",

  // Nombre de questions par défaut
  NB_QUESTIONS: 10,

  // Durée du timer par question (en secondes)
  TIMER_DUREE: 20,
};