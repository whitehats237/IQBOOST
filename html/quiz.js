// ============================================
// quiz.js — Logique du quiz (Jour 3)
// ============================================

// ─────────────────────────────────────────────
// VARIABLES GLOBALES
// ─────────────────────────────────────────────
let questions = [];
let indexQuestion = 0;
let score = 0;
let reponsesDetaillees = [];

const matiere = localStorage.getItem("matiere_choisie") || "Mathématiques";
const niveau  = localStorage.getItem("niveau_choisi")  || "Intermédiaire";

console.log("Matière lue :", matiere, "| Niveau lu :", niveau);


// ─────────────────────────────────────────────
// ÉTAPE 1 : Charger les questions au démarrage
// ─────────────────────────────────────────────
async function chargerQuestions() {
  try {
    afficherChargement(true);
    questions = await genererQuestions(matiere, niveau, CONFIG.NB_QUESTIONS);
    afficherChargement(false);
    afficherQuestion();
  } catch (erreur) {
    console.error("Erreur chargement questions :", erreur);
    afficherChargement(false);
    document.getElementById("zone-erreur").style.display = "block";
  }
}


// ─────────────────────────────────────────────
// ÉTAPE 2 : Afficher une question
// ─────────────────────────────────────────────
function afficherQuestion() {
  const q = questions[indexQuestion];

  const progression = (indexQuestion / questions.length) * 100;
  document.getElementById("barre-progression").style.width = progression + "%";
  document.getElementById("compteur").textContent =
    `Question ${indexQuestion + 1} / ${questions.length}`;

  document.getElementById("texte-question").textContent = q.question;

  ["A", "B", "C", "D"].forEach(lettre => {
    const bouton = document.getElementById("choix-" + lettre);
    bouton.textContent = lettre + ". " + q.choix[lettre];
    bouton.className = "btn-choix";
    bouton.disabled = false;
  });

  document.getElementById("btn-suivant").style.display = "none";
  document.getElementById("explication").style.display = "none";
}


// ─────────────────────────────────────────────
// ÉTAPE 3 : Gérer le clic sur un choix
// ─────────────────────────────────────────────
function choisirReponse(lettre) {
  const q = questions[indexQuestion];
  const bonneReponse = (q.bonne_reponse || "").trim().toUpperCase();
  const lettreNormalisee = lettre.trim().toUpperCase();
  const estCorrect = (lettreNormalisee === bonneReponse);

  // Bloque tous les boutons
  ["A", "B", "C", "D"].forEach(l => {
    document.getElementById("choix-" + l).disabled = true;
  });

  // Colorie vert ou rouge
  document.getElementById("choix-" + lettreNormalisee).classList.add(
    estCorrect ? "correct" : "incorrect"
  );

  // Si mauvaise réponse → montre aussi la bonne en vert
  if (!estCorrect) {
    document.getElementById("choix-" + bonneReponse).classList.add("correct");
  }

  if (estCorrect) score++;

  reponsesDetaillees.push({
    question:      q.question,
    repondu:       lettreNormalisee,
    bonne_reponse: bonneReponse,
    correct:       estCorrect,
    explication:   q.explication
  });

  document.getElementById("texte-explication").textContent = q.explication;
  document.getElementById("explication").style.display = "block";

  const btnSuivant = document.getElementById("btn-suivant");
  btnSuivant.style.display = "block";
  btnSuivant.textContent =
    indexQuestion < questions.length - 1 ? "Question suivante →" : "Voir mes résultats →";
}


// ─────────────────────────────────────────────
// ÉTAPE 4 : Passer à la question suivante
// ─────────────────────────────────────────────
function questionSuivante() {
  indexQuestion++;
  if (indexQuestion < questions.length) {
    afficherQuestion();
  } else {
    terminerQuiz();
  }
}


// ─────────────────────────────────────────────
// ÉTAPE 5 : Terminer le quiz
// ─────────────────────────────────────────────
function terminerQuiz() {
  const scoreTotal = Math.round((score / questions.length) * 100);

  let niveau_obtenu;
  if (scoreTotal >= 85)      niveau_obtenu = "Excellent";
  else if (scoreTotal >= 65) niveau_obtenu = "Avancé";
  else if (scoreTotal >= 40) niveau_obtenu = "Moyen";
  else                       niveau_obtenu = "Débutant";

  const notions_faibles = reponsesDetaillees
    .filter(r => !r.correct)
    .map(r => r.question.substring(0, 50));

  const resultats = {
    matiere:         matiere,
    niveau_test:     niveau,
    score:           scoreTotal,
    bonnes_reponses: score,
    total_questions: questions.length,
    niveau_obtenu:   niveau_obtenu,
    notions_faibles: notions_faibles,
    reponses:        reponsesDetaillees,
    date:            new Date().toLocaleDateString("fr-FR")
  };

  localStorage.setItem("derniers_resultats", JSON.stringify(resultats));

  const historique = JSON.parse(localStorage.getItem("historique") || "[]");
  historique.push(resultats);
  localStorage.setItem("historique", JSON.stringify(historique));

  window.location.href = "resultats.html";
}


// ─────────────────────────────────────────────
// UTILITAIRE : Afficher / cacher le chargement
// ─────────────────────────────────────────────
function afficherChargement(visible) {
  document.getElementById("zone-chargement").style.display = visible ? "flex" : "none";
  document.getElementById("zone-quiz").style.display       = visible ? "none"  : "block";
}


// ─────────────────────────────────────────────
// DÉMARRAGE
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", chargerQuestions);