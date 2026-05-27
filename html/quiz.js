// ============================================
// quiz.js — Jour 4 : avec minuterie
// ============================================

// ─────────────────────────────────────────────
// VARIABLES GLOBALES
// ─────────────────────────────────────────────
let questions        = [];
let indexQuestion    = 0;
let score            = 0;
let reponsesDetaillees = [];

// Minuterie
let tempsRestant     = 0;
let intervalTimer    = null;
let tempsDebutQuestion = 0; // pour mesurer la rapidité

const DUREE_QUESTION = CONFIG.TIMER_DUREE; // 20 secondes

const matiere = localStorage.getItem("matiere_choisie") || "Mathématiques";
const niveau  = localStorage.getItem("niveau_choisi")  || "Intermédiaire";

console.log("Matière lue :", matiere, "| Niveau lu :", niveau);


// ─────────────────────────────────────────────
// ÉTAPE 1 : Charger les questions
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

  // Barre de progression
  const progression = (indexQuestion / questions.length) * 100;
  document.getElementById("barre-progression").style.width = progression + "%";
  document.getElementById("compteur").textContent =
    `Question ${indexQuestion + 1} / ${questions.length}`;

  // Texte et choix
  document.getElementById("texte-question").textContent = q.question;
  ["A", "B", "C", "D"].forEach(lettre => {
    const bouton = document.getElementById("choix-" + lettre);
    bouton.textContent = lettre + ". " + q.choix[lettre];
    bouton.className = "btn-choix";
    bouton.disabled = false;
  });

  document.getElementById("btn-suivant").style.display = "none";
  document.getElementById("explication").style.display = "none";

  // Lance la minuterie
  demarrerTimer();
}


// ─────────────────────────────────────────────
// MINUTERIE
// ─────────────────────────────────────────────
function demarrerTimer() {
  // Remet à zéro si un timer tourne déjà
  arreterTimer();

  tempsRestant = DUREE_QUESTION;
  tempsDebutQuestion = Date.now();

  mettreAJourAffichageTimer();

  intervalTimer = setInterval(() => {
    tempsRestant--;
    mettreAJourAffichageTimer();

    if (tempsRestant <= 0) {
      arreterTimer();
      tempsEcoule(); // temps dépassé
    }
  }, 1000);
}

function arreterTimer() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}

function mettreAJourAffichageTimer() {
  const el = document.getElementById("timer-texte");
  const barre = document.getElementById("timer-barre");

  if (el) el.textContent = tempsRestant + "s";

  // Barre qui se vide de gauche à droite
  const pourcentage = (tempsRestant / DUREE_QUESTION) * 100;
  if (barre) {
    barre.style.width = pourcentage + "%";
    // Change couleur selon le temps restant
    if (tempsRestant <= 5)       barre.style.background = "#ef4444"; // rouge
    else if (tempsRestant <= 10) barre.style.background = "#f59e0b"; // orange
    else                         barre.style.background = "#6366f1"; // violet
  }
}

function tempsEcoule() {
  // Compte comme une mauvaise réponse
  const q = questions[indexQuestion];
  const bonneReponse = (q.bonne_reponse || "").trim().toUpperCase();

  // Désactive tous les boutons
  ["A", "B", "C", "D"].forEach(l => {
    document.getElementById("choix-" + l).disabled = true;
  });

  // Montre la bonne réponse en vert
  document.getElementById("choix-" + bonneReponse).classList.add("correct");

  // Sauvegarde comme raté (temps = 0)
  reponsesDetaillees.push({
    question:      q.question,
    repondu:       "—",
    bonne_reponse: bonneReponse,
    correct:       false,
    explication:   q.explication,
    temps:         DUREE_QUESTION // temps max = pas répondu
  });

  document.getElementById("texte-explication").textContent =
    "⏱️ Temps écoulé ! " + q.explication;
  document.getElementById("explication").style.display = "block";

  const btnSuivant = document.getElementById("btn-suivant");
  btnSuivant.style.display = "block";
  btnSuivant.textContent =
    indexQuestion < questions.length - 1 ? "Question suivante →" : "Voir mes résultats →";
}


// ─────────────────────────────────────────────
// ÉTAPE 3 : Gérer le clic sur un choix
// ─────────────────────────────────────────────
function choisirReponse(lettre) {
  arreterTimer();

  const tempsReponse = Math.round((Date.now() - tempsDebutQuestion) / 1000);

  const q = questions[indexQuestion];
  const bonneReponse    = (q.bonne_reponse || "").trim().toUpperCase();
  const lettreNormalisee = lettre.trim().toUpperCase();
  const estCorrect       = (lettreNormalisee === bonneReponse);

  // Bloque les boutons
  ["A", "B", "C", "D"].forEach(l => {
    document.getElementById("choix-" + l).disabled = true;
  });

  // Colorie
  document.getElementById("choix-" + lettreNormalisee).classList.add(
    estCorrect ? "correct" : "incorrect"
  );
  if (!estCorrect) {
    document.getElementById("choix-" + bonneReponse).classList.add("correct");
  }

  if (estCorrect) score++;

  reponsesDetaillees.push({
    question:      q.question,
    repondu:       lettreNormalisee,
    bonne_reponse: bonneReponse,
    correct:       estCorrect,
    explication:   q.explication,
    temps:         tempsReponse
  });

  document.getElementById("texte-explication").textContent = q.explication;
  document.getElementById("explication").style.display = "block";

  const btnSuivant = document.getElementById("btn-suivant");
  btnSuivant.style.display = "block";
  btnSuivant.textContent =
    indexQuestion < questions.length - 1 ? "Question suivante →" : "Voir mes résultats →";
}


// ─────────────────────────────────────────────
// ÉTAPE 4 : Question suivante
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
// ÉTAPE 5 : Terminer le quiz + score cognitif
// ─────────────────────────────────────────────
function terminerQuiz() {
  arreterTimer();

  const bonnesReponses = reponsesDetaillees.filter(r => r.correct).length;

  // Calcul du score cognitif :
  // 70% basé sur les bonnes réponses
  // 30% basé sur la rapidité moyenne
  const scorePrecision = (bonnesReponses / questions.length) * 70;

  const tempsMoyen = reponsesDetaillees.reduce((acc, r) => acc + r.temps, 0)
                     / reponsesDetaillees.length;
  // Plus c'est rapide → plus le score de rapidité est élevé
  const scoreRapidite = Math.max(0, (1 - tempsMoyen / DUREE_QUESTION)) * 30;

  const scoreTotal = Math.round(scorePrecision + scoreRapidite);

  let niveau_obtenu;
  if (scoreTotal >= 85)      niveau_obtenu = "Excellent";
  else if (scoreTotal >= 65) niveau_obtenu = "Avancé";
  else if (scoreTotal >= 40) niveau_obtenu = "Moyen";
  else                       niveau_obtenu = "Débutant";

  const notions_faibles = reponsesDetaillees
    .filter(r => !r.correct)
    .map(r => r.question.substring(0, 60));

  const resultats = {
    matiere,
    niveau_test:     niveau,
    score:           scoreTotal,
    bonnes_reponses: bonnesReponses,
    total_questions: questions.length,
    niveau_obtenu,
    notions_faibles,
    reponses:        reponsesDetaillees,
    temps_moyen:     Math.round(tempsMoyen),
    date:            new Date().toLocaleDateString("fr-FR")
  };

  localStorage.setItem("derniers_resultats", JSON.stringify(resultats));

  const historique = JSON.parse(localStorage.getItem("historique") || "[]");
  historique.push(resultats);
  localStorage.setItem("historique", JSON.stringify(historique));

  window.location.href = "resultats.html";
}


// ─────────────────────────────────────────────
// UTILITAIRE
// ─────────────────────────────────────────────
function afficherChargement(visible) {
  document.getElementById("zone-chargement").style.display = visible ? "flex" : "none";
  document.getElementById("zone-quiz").style.display       = visible ? "none" : "block";
}

document.addEventListener("DOMContentLoaded", chargerQuestions);