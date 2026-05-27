// api/groq.js — Fonction serverless Vercel
// Gère les appels à l'API Groq de manière sécurisée (clé en secret)

export default async function handler(req, res) {
  // Autoriser uniquement POST et OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model = 'llama-3.3-70b-versatile' } = req.body;

  // Valider le prompt
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  // Vérifier que la clé API existe
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API error:', error);
      return res.status(response.status).json({
        error: error.error?.message || 'API error',
      });
    }

    const data = await response.json();

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({
      content: data.choices[0].message.content,
    });
  } catch (error) {
    console.error('Function error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
