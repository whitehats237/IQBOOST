// ============================================
// gemini.js — Connexion à l'API Groq (Llama 3)
// ============================================

// ─────────────────────────────────────────────
// FONCTION PRINCIPALE : Envoyer un message à Groq
// ─────────────────────────────────────────────
async function appelGemini(prompt) {
  if (!prompt || prompt.trim() === "") {
    throw new Error("Le prompt est vide — vérifie que matiere et niveau sont bien dans localStorage");
  }

  // Détection : est-on en local ou sur Vercel ?
  const estLocal = window.location.hostname === "localhost" ||
                   window.location.hostname === "127.0.0.1" ||
                   window.location.protocol === "file:";

  try {
    let reponse;

    if (estLocal) {
      // ── MODE LOCAL : appel direct à Groq avec la clé API ──
      reponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + CONFIG.GROQ_API_KEY,
        },
        body: JSON.stringify({
          model: CONFIG.GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (!reponse.ok) {
        const erreur = await reponse.json();
        throw new Error("Erreur API : " + erreur.error?.message);
      }

      const data = await reponse.json();
      return data.choices[0].message.content;

    } else {
      // ── MODE VERCEL : appel via la fonction serverless /api/groq ──
      reponse = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          model: CONFIG.GROQ_MODEL,
        }),
      });

      if (!reponse.ok) {
        const erreur = await reponse.json();
        throw new Error("Erreur API : " + (erreur.error || erreur.message));
      }

      const data = await reponse.json();
      return data.content;
    }

  } catch (erreur) {
    console.error("❌ Erreur Groq :", erreur.message);
    throw erreur;
  }
}


// ─────────────────────────────────────────────
// FONCTION : Générer des questions pour un quiz
// ─────────────────────────────────────────────
async function genererQuestions(matiere, niveau, nombre = CONFIG.NB_QUESTIONS) {

  const prompt = `
Tu es un professeur expert en ${matiere}.
Génère exactement ${nombre} questions QCM pour un étudiant de niveau ${niveau}.

RÈGLES IMPORTANTES :
- Réponds UNIQUEMENT avec du JSON valide, rien d'autre
- Pas de texte avant, pas de texte après
- Pas de balises markdown, pas de \`\`\`json
- Juste le tableau JSON directement

FORMAT EXACT à respecter :
[
  {
    "question": "Texte de la question ?",
    "choix": {
      "A": "Premier choix",
      "B": "Deuxième choix",
      "C": "Troisième choix",
      "D": "Quatrième choix"
    },
    "bonne_reponse": "B",
    "explication": "Courte explication pourquoi c'est B"
  }
]

Matière : ${matiere}
Niveau : ${niveau}
Nombre de questions : ${nombre}
`;

  const texte = await appelGemini(prompt);
  const texteNettoye = texte.replace(/```json/g, "").replace(/```/g, "").trim();
  const questions = JSON.parse(texteNettoye);

  return questions.map(q => {
    const choixNormalise = {};
    for (const cle in q.choix) {
      choixNormalise[cle.toUpperCase()] = q.choix[cle];
    }
    let bonne = q.bonne_reponse || "";
    bonne = bonne.trim().toUpperCase().charAt(0);
    return {
      question:      q.question,
      choix:         choixNormalise,
      bonne_reponse: bonne,
      explication:   q.explication || ""
    };
  });
}


// ─────────────────────────────────────────────
// FONCTION : Générer un programme d'étude
// ─────────────────────────────────────────────
async function genererProgramme(resultats) {
  const prompt = `
Tu es un conseiller pédagogique expert.

Un étudiant vient de passer un test avec ces résultats :
- Matière : ${resultats.matiere}
- Score : ${resultats.score}/100
- Niveau obtenu : ${resultats.niveau}
- Questions ratées sur les notions : ${resultats.notions_faibles.join(", ")}

Génère un programme de révision personnalisé pour 7 jours.

RÈGLES :
- Réponds UNIQUEMENT avec du JSON valide, rien d'autre
- Pas de texte avant ni après

FORMAT EXACT :
{
  "message_motivationnel": "Un message encourageant et personnalisé (2-3 phrases)",
  "programme": [
    {
      "jour": "Jour 1",
      "titre": "Titre court de la séance",
      "description": "Ce que l'étudiant doit faire concrètement",
      "duree": "30 min"
    }
  ],
  "conseil_general": "Un conseil global pour progresser rapidement"
}
`;

  const texte = await appelGemini(prompt);
  const texteNettoye = texte.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(texteNettoye);
}


// ─────────────────────────────────────────────
// FONCTION : Générer un rapport hebdomadaire
// ─────────────────────────────────────────────
async function genererRapportHebdo(historique) {
  const prompt = `
Tu es un analyste pédagogique.

Voici les résultats d'un étudiant cette semaine :
${JSON.stringify(historique, null, 2)}

Génère un rapport hebdomadaire complet.

RÈGLES :
- Réponds UNIQUEMENT avec du JSON valide
- Pas de texte avant ni après

FORMAT EXACT :
{
  "bilan": "Résumé de la semaine en 2-3 phrases",
  "points_forts": ["point fort 1", "point fort 2"],
  "points_faibles": ["point faible 1", "point faible 2"],
  "recommandation_semaine_prochaine": "Ce sur quoi se concentrer la semaine prochaine",
  "score_moyen": 0
}
`;

  const texte = await appelGemini(prompt);
  const texteNettoye = texte.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(texteNettoye);
}