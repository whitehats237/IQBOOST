// ============================================
// examen.js — Examen mensuel (Jour 8)
// ============================================

const NB_QUESTIONS_EXAMEN = 20;
const DUREE_EXAMEN        = CONFIG.TIMER_DUREE;

let questionsExamen    = [];
let indexExamen        = 0;
let scoreExamen        = 0;
let reponsesExamen     = [];
let timerExamen        = null;
let tempsRestantExamen = 0;
let tempsDebutExamen   = 0;


// ─────────────────────────────────────────────
// DÉMARRER L'EXAMEN
// ─────────────────────────────────────────────
async function demarrerExamen() {
  // Récupère les matières déjà testées
  const historique = JSON.parse(localStorage.getItem("historique") || "[]");
  const matieres   = [...new Set(historique.map(r => r.matiere))];

  // Si aucune matière connue, on prend toutes les matières
  const listeFinale = matieres.length > 0
    ? matieres.join(", ")
    : "Mathématiques, Programmation, Réseaux, Systèmes, Base de données";

  document.getElementById("zone-intro").style.display             = "none";
  document.getElementById("zone-chargement-examen").style.display = "flex";

  try {
    const prompt = `
Tu es un professeur qui fait passer un examen de fin de mois.

L'étudiant a étudié ces matières : ${listeFinale}

Génère exactement ${NB_QUESTIONS_EXAMEN} questions QCM de niveau DIFFICILE qui couvrent toutes ces matières.
Mélange bien les matières dans l'ordre des questions.

RÈGLES :
- Réponds UNIQUEMENT avec du JSON valide, rien d'autre
- Pas de texte avant ni après
- Questions difficiles et précises

FORMAT :
[
  {
    "question": "Question difficile ?",
    "matiere": "Programmation",
    "choix": { "A": "...", "B": "...", "C": "...", "D": "..." },
    "bonne_reponse": "C",
    "explication": "Explication détaillée"
  }
]
`;

    const texte        = await appelGemini(prompt);
    const texteNettoye = texte.replace(/```json/g, "").replace(/```/g, "").trim();
    questionsExamen    = JSON.parse(texteNettoye);

    // Normalise comme dans quiz.js
    questionsExamen = questionsExamen.map(q => {
      const choixNormalise = {};
      for (const cle in q.choix) choixNormalise[cle.toUpperCase()] = q.choix[cle];
      return {
        ...q,
        choix:         choixNormalise,
        bonne_reponse: (q.bonne_reponse || "").trim().toUpperCase().charAt(0)
      };
    });

    document.getElementById("zone-chargement-examen").style.display = "none";
    document.getElementById("zone-quiz-examen").style.display        = "block";
    afficherQuestionExamen();

  } catch (erreur) {
    console.error("Erreur examen :", erreur);
    alert("Impossible de générer l'examen. Vérifie ta connexion.");
    window.location.href = "dashboard.html";
  }
}


// ─────────────────────────────────────────────
// AFFICHER UNE QUESTION
// ─────────────────────────────────────────────
function afficherQuestionExamen() {
  const q = questionsExamen[indexExamen];

  const progression = (indexExamen / questionsExamen.length) * 100;
  document.getElementById("barre-progression-examen").style.width = progression + "%";
  document.getElementById("compteur-examen").textContent =
    `Question ${indexExamen + 1} / ${questionsExamen.length}`;

  document.getElementById("texte-question-examen").textContent = q.question;

  ["A","B","C","D"].forEach(l => {
    const btn = document.getElementById("ex-choix-" + l);
    btn.textContent = l + ". " + q.choix[l];
    btn.className   = "btn-choix";
    btn.disabled    = false;
  });

  document.getElementById("btn-suivant-examen").style.display   = "none";
  document.getElementById("explication-examen").style.display   = "none";

  demarrerTimerExamen();
}


// ─────────────────────────────────────────────
// MINUTERIE
// ─────────────────────────────────────────────
function demarrerTimerExamen() {
  if (timerExamen) clearInterval(timerExamen);
  tempsRestantExamen = DUREE_EXAMEN;
  tempsDebutExamen   = Date.now();
  mettreAJourTimerExamen();

  timerExamen = setInterval(() => {
    tempsRestantExamen--;
    mettreAJourTimerExamen();
    if (tempsRestantExamen <= 0) {
      clearInterval(timerExamen);
      tempsEcouleExamen();
    }
  }, 1000);
}

function mettreAJourTimerExamen() {
  const pct   = (tempsRestantExamen / DUREE_EXAMEN) * 100;
  const barre = document.getElementById("timer-barre-examen");
  const texte = document.getElementById("timer-texte-examen");
  if (texte)  texte.textContent  = tempsRestantExamen + "s";
  if (barre) {
    barre.style.width      = pct + "%";
    barre.style.background =
      tempsRestantExamen <= 5 ? "#ef4444" :
      tempsRestantExamen <= 10 ? "#f59e0b" : "#6366f1";
  }
}

function tempsEcouleExamen() {
  const q = questionsExamen[indexExamen];
  const bonne = q.bonne_reponse;
  ["A","B","C","D"].forEach(l =>
    document.getElementById("ex-choix-" + l).disabled = true
  );
  document.getElementById("ex-choix-" + bonne).classList.add("correct");
  reponsesExamen.push({
    question: q.question, matiere: q.matiere,
    repondu: "—", bonne_reponse: bonne,
    correct: false, explication: q.explication,
    temps: DUREE_EXAMEN
  });
  document.getElementById("texte-explication-examen").textContent = "⏱️ Temps écoulé ! " + q.explication;
  document.getElementById("explication-examen").style.display = "block";
  const btn = document.getElementById("btn-suivant-examen");
  btn.style.display = "block";
  btn.textContent = indexExamen < questionsExamen.length - 1 ? "Question suivante →" : "Voir mes résultats →";
}


// ─────────────────────────────────────────────
// CHOISIR UNE RÉPONSE
// ─────────────────────────────────────────────
function choisirReponseExamen(lettre) {
  if (timerExamen) clearInterval(timerExamen);
  const temps = Math.round((Date.now() - tempsDebutExamen) / 1000);

  const q             = questionsExamen[indexExamen];
  const bonne         = q.bonne_reponse;
  const l             = lettre.toUpperCase();
  const correct       = l === bonne;

  ["A","B","C","D"].forEach(x =>
    document.getElementById("ex-choix-" + x).disabled = true
  );
  document.getElementById("ex-choix-" + l).classList.add(correct ? "correct" : "incorrect");
  if (!correct) document.getElementById("ex-choix-" + bonne).classList.add("correct");

  if (correct) scoreExamen++;

  reponsesExamen.push({
    question: q.question, matiere: q.matiere || "",
    repondu: l, bonne_reponse: bonne,
    correct, explication: q.explication, temps
  });

  document.getElementById("texte-explication-examen").textContent = q.explication;
  document.getElementById("explication-examen").style.display     = "block";

  const btn = document.getElementById("btn-suivant-examen");
  btn.style.display = "block";
  btn.textContent   = indexExamen < questionsExamen.length - 1
    ? "Question suivante →" : "Voir mes résultats →";
}


// ─────────────────────────────────────────────
// QUESTION SUIVANTE
// ─────────────────────────────────────────────
function questionSuivanteExamen() {
  indexExamen++;
  if (indexExamen < questionsExamen.length) {
    afficherQuestionExamen();
  } else {
    terminerExamen();
  }
}


// ─────────────────────────────────────────────
// TERMINER L'EXAMEN
// ─────────────────────────────────────────────
function terminerExamen() {
  if (timerExamen) clearInterval(timerExamen);

  const scoreTotal = Math.round((scoreExamen / questionsExamen.length) * 100);

  let niveau_obtenu;
  if      (scoreTotal >= 85) niveau_obtenu = "Excellent";
  else if (scoreTotal >= 65) niveau_obtenu = "Avancé";
  else if (scoreTotal >= 40) niveau_obtenu = "Moyen";
  else                       niveau_obtenu = "Débutant";

  const notions_faibles = reponsesExamen
    .filter(r => !r.correct)
    .map(r => `[${r.matiere}] ${r.question.substring(0, 50)}`);

  const resultats = {
    matiere:         "Examen mensuel",
    niveau_test:     "Avancé",
    score:           scoreTotal,
    bonnes_reponses: scoreExamen,
    total_questions: questionsExamen.length,
    niveau_obtenu,
    notions_faibles,
    reponses:        reponsesExamen,
    temps_moyen:     Math.round(reponsesExamen.reduce((a,r) => a + r.temps, 0) / reponsesExamen.length),
    date:            new Date().toLocaleDateString("fr-FR"),
    type:            "examen_mensuel"
  };

  localStorage.setItem("derniers_resultats", JSON.stringify(resultats));
  const historique = JSON.parse(localStorage.getItem("historique") || "[]");
  historique.push(resultats);
  localStorage.setItem("historique", JSON.stringify(historique));

  window.location.href = "resultats.html";
}