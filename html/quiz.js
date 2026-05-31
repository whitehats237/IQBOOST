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

  // ── Calcul de l'indice cognitif ──────────────
  // Chaque question a un poids selon sa difficulté
  let pointsObtenus = 0;
  let pointsMax     = 0;

  reponsesDetaillees.forEach(r => {
    const poids = r.difficulte || 1; // 1=facile, 2=moyen, 3=difficile
    pointsMax    += poids * 10;
    if (r.correct) {
      // Bonus si réponse rapide (moins de 10s)
      const bonusVitesse = r.temps <= 10 ? poids * 2 : 0;
      pointsObtenus += poids * 10 + bonusVitesse;
    }
  });

  const scoreBrut = pointsObtenus / pointsMax; // 0 à 1

  // Conversion en indice IQ (70–145)
  // Distribution normale centrée sur 100
  const iqEstime = Math.round(70 + scoreBrut * 75);

  // Niveau verbal
  let niveau_obtenu;
  if      (iqEstime >= 130) niveau_obtenu = "Excellent";
  else if (iqEstime >= 115) niveau_obtenu = "Avancé";
  else if (iqEstime >= 85)  niveau_obtenu = "Moyen";
  else                      niveau_obtenu = "Débutant";

  // Label IQ plus précis
  let label_iq;
  if      (iqEstime >= 130) label_iq = "Supérieur";
  else if (iqEstime >= 120) label_iq = "Très élevé";
  else if (iqEstime >= 110) label_iq = "Au-dessus de la moyenne";
  else if (iqEstime >= 90)  label_iq = "Dans la moyenne";
  else if (iqEstime >= 80)  label_iq = "En dessous de la moyenne";
  else                      label_iq = "À renforcer";

  const scoreTotal = Math.round(scoreBrut * 100);

  const notions_faibles = reponsesDetaillees
    .filter(r => !r.correct)
    .map(r => r.question.substring(0, 60));

  const resultats = {
    matiere,
    niveau_test:     niveau,
    score:           scoreTotal,
    iq_estime:       iqEstime,
    label_iq,
    bonnes_reponses: reponsesDetaillees.filter(r => r.correct).length,
    total_questions: questions.length,
    niveau_obtenu,
    notions_faibles,
    reponses:        reponsesDetaillees,
    temps_moyen:     Math.round(
      reponsesDetaillees.reduce((a, r) => a + r.temps, 0) / reponsesDetaillees.length
    ),
    date: new Date().toLocaleDateString("fr-FR")
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