// ============================================
// quiz.js — Logique du quiz (Jour 3)
// ============================================
// Ce fichier gère :
//   1. Charger les questions depuis Groq
//   2. Afficher les questions une par une
//   3. Gérer les réponses et calculer le score

// ─────────────────────────────────────────────
// VARIABLES GLOBALES
// ─────────────────────────────────────────────
let questions = [];         // tableau de toutes les questions
let indexQuestion = 0;      // quelle question on affiche (0 = première)
let score = 0;              // nombre de bonnes réponses
let reponsesDetaillees = []; // pour la page résultats

// On récupère ce que l'étudiant a choisi dans matiere.html
const matiere = localStorage.getItem("matiere_choisie") || "Mathématiques";
const niveau  = localStorage.getItem("niveau_choisi")  || "Intermédiaire";


// ─────────────────────────────────────────────
// ÉTAPE 1 : Charger les questions au démarrage
// ─────────────────────────────────────────────
async function chargerQuestions() {
  try {
    afficherChargement(true);

    // On demande 10 questions à Groq
    questions = await genererQuestions(matiere, niveau, CONFIG.NB_QUESTIONS);

    afficherChargement(false);

    // On affiche la première question
    afficherQuestion();

  } catch (erreur) {
    console.error("Erreur chargement questions :", erreur);
    document.getElementById("zone-erreur").style.display = "block";
  }
}


// ─────────────────────────────────────────────
// ÉTAPE 2 : Afficher une question
// ─────────────────────────────────────────────
function afficherQuestion() {
  const q = questions[indexQuestion];

  // Met à jour la barre de progression en haut
  const progression = ((indexQuestion) / questions.length) * 100;
  document.getElementById("barre-progression").style.width = progression + "%";
  document.getElementById("compteur").textContent =
    `Question ${indexQuestion + 1} / ${questions.length}`;

  // Affiche le texte de la question
  document.getElementById("texte-question").textContent = q.question;

  // Affiche les 4 choix (A, B, C, D)
  const lettres = ["A", "B", "C", "D"];
  lettres.forEach(lettre => {
    const bouton = document.getElementById("choix-" + lettre);
    bouton.textContent = lettre + ". " + q.choix[lettre];
    bouton.className = "btn-choix"; // remet le style normal
    bouton.disabled = false;        // réactive le bouton
  });

  // Cache le bouton "Suivant" au début
  document.getElementById("btn-suivant").style.display = "none";
  document.getElementById("explication").style.display  = "none";
}


// ─────────────────────────────────────────────
// ÉTAPE 3 : Gérer le clic sur un choix
// ─────────────────────────────────────────────
function choisirReponse(lettre) {
  const q = questions[indexQuestion];
  const bonneReponse = q.bonne_reponse;
  const estCorrect = (lettre === bonneReponse);

  // On désactive tous les boutons (plus de clic possible)
  ["A", "B", "C", "D"].forEach(l => {
    document.getElementById("choix-" + l).disabled = true;
  });

  // On colore vert si correct, rouge si incorrect
  document.getElementById("choix-" + lettre).classList.add(
    estCorrect ? "correct" : "incorrect"
  );

  // Si mauvaise réponse, on montre aussi la bonne en vert
  if (!estCorrect) {
    document.getElementById("choix-" + bonneReponse).classList.add("correct");
  }

  // On met à jour le score
  if (estCorrect) score++;

  // On sauvegarde pour la page résultats
  reponsesDetaillees.push({
    question:      q.question,
    repondu:       lettre,
    bonne_reponse: bonneReponse,
    correct:       estCorrect,
    explication:   q.explication
  });

  // On affiche l'explication
  document.getElementById("texte-explication").textContent = q.explication;
  document.getElementById("explication").style.display = "block";

  // On affiche le bouton "Suivant" (ou "Voir les résultats" si c'est la dernière)
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
    // Quiz terminé → on sauvegarde et on redirige
    terminerQuiz();
  }
}


// ─────────────────────────────────────────────
// ÉTAPE 5 : Terminer le quiz
// ─────────────────────────────────────────────
function terminerQuiz() {
  // Calcul du score sur 100
  const scoreTotal = Math.round((score / questions.length) * 100);

  // Niveau de performance
  let niveau_obtenu;
  if (scoreTotal >= 85)      niveau_obtenu = "Excellent";
  else if (scoreTotal >= 65) niveau_obtenu = "Avancé";
  else if (scoreTotal >= 40) niveau_obtenu = "Moyen";
  else                       niveau_obtenu = "Débutant";

  // Notions faibles = questions ratées
  const notions_faibles = reponsesDetaillees
    .filter(r => !r.correct)
    .map(r => r.question.substring(0, 50)); // on prend les 50 premiers caractères

  // On sauvegarde tout pour la page résultats
  const resultats = {
    matiere:          matiere,
    niveau_test:      niveau,
    score:            scoreTotal,
    bonnes_reponses:  score,
    total_questions:  questions.length,
    niveau_obtenu:    niveau_obtenu,
    notions_faibles:  notions_faibles,
    reponses:         reponsesDetaillees,
    date:             new Date().toLocaleDateString("fr-FR")
  };

  localStorage.setItem("derniers_resultats", JSON.stringify(resultats));

  // On ajoute aussi à l'historique (pour le tableau de bord)
  const historique = JSON.parse(localStorage.getItem("historique") || "[]");
  historique.push(resultats);
  localStorage.setItem("historique", JSON.stringify(historique));

  // Redirection vers la page résultats
  window.location.href = "resultats.html";
}


// ─────────────────────────────────────────────
// UTILITAIRE : Afficher / cacher le chargement
// ─────────────────────────────────────────────
function afficherChargement(visible) {
  document.getElementById("zone-chargement").style.display = visible ? "flex" : "none";
  document.getElementById("zone-quiz").style.display       = visible ? "none" : "block";
}


// ─────────────────────────────────────────────
// DÉMARRAGE : On charge les questions dès que
// la page est prête
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", chargerQuestions);