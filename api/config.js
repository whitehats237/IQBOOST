// api/config.js
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    const CONFIG = {
      GROQ_API_KEY: "${process.env.GROQ_API_KEY}",
      GROQ_URL: "https://api.groq.com/openai/v1/chat/completions",
      GROQ_MODEL: "llama3-8b-8192",
      NB_QUESTIONS: 10
    };
  `);
}

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    const CONFIG = {
      GROQ_API_KEY: "${process.env.GROQ_API_KEY}",
      GROQ_URL: "https://api.groq.com/openai/v1/chat/completions",
      GROQ_API_ENDPOINT: "/api/groq",
      GROQ_MODEL: "llama-3.3-70b-versatile",
      NB_QUESTIONS: 10
    };
  `);
}