// ============================================
// test.js — Fichier de test (Jour 2)
// ============================================
// Ouvre test.html dans ton navigateur
// Appuie sur F12 → Console pour voir les résultats
// Ce fichier sert UNIQUEMENT à tester. 
// Tu peux le supprimer après le Jour 2.

// ─────────────────────────────────────────────
// TEST 1 : Connexion de base à Gemini
// ─────────────────────────────────────────────
async function test1_connexionDeBase() {
  console.log("═══════════════════════════════");
  console.log("TEST 1 : Connexion de base");
  console.log("═══════════════════════════════");

  try {
    console.log("⏳ Envoi du message à Gemini...");

    const reponse = await appelGemini("Dis juste 'Connexion réussie !' en français.");

    console.log("✅ Succès ! Réponse de Gemini :");
    console.log(reponse);
  } catch (erreur) {
    console.log("❌ Échec. Vérifie ta clé API dans config.js");
    console.log("Erreur :", erreur.message);
  }
}


// ─────────────────────────────────────────────
// TEST 2 : Générer 3 questions de maths en JSON
// ─────────────────────────────────────────────
async function test2_genererQuestions() {
  console.log("═══════════════════════════════");
  console.log("TEST 2 : Génération de questions");
  console.log("═══════════════════════════════");

  try {
    console.log("⏳ Demande à Groq de générer 3 questions de maths...");

    // On génère seulement 3 questions pour le test (plus rapide)
    const questions = await genererQuestions("Mathématiques", "Intermédiaire", 3);

    console.log("✅ Questions reçues :");
    console.log(questions); // Affiche le tableau complet

    // On affiche aussi la première question joliment
    console.log("\n📝 Première question :");
    console.log("Question :", questions[0].question);
    console.log("Choix A :", questions[0].choix.A);
    console.log("Choix B :", questions[0].choix.B);
    console.log("Choix C :", questions[0].choix.C);
    console.log("Choix D :", questions[0].choix.D);
    console.log("Bonne réponse :", questions[0].bonne_reponse);
    console.log("Explication :", questions[0].explication);

  } catch (erreur) {
    console.log("❌ Échec.");
    console.log("Erreur :", erreur.message);
  }
}


// ─────────────────────────────────────────────
// TEST 3 : Générer un programme d'étude
// ─────────────────────────────────────────────
async function test3_genererProgramme() {
  console.log("═══════════════════════════════");
  console.log("TEST 3 : Programme d'étude");
  console.log("═══════════════════════════════");

  // On simule de faux résultats pour le test
  const fauxResultats = {
    matiere: "Programmation",
    score: 45,
    niveau: "Moyen",
    notions_faibles: ["complexité algorithmique", "récursivité", "pointeurs"]
  };

  try {
    console.log("⏳ Génération du programme personnalisé...");

    const programme = await genererProgramme(fauxResultats);

    console.log("✅ Programme reçu :");
    console.log("\n💬 Message motivationnel :");
    console.log(programme.message_motivationnel);
    console.log("\n📅 Programme sur 7 jours :");
    programme.programme.forEach(jour => {
      console.log(`  ${jour.jour} (${jour.duree}) : ${jour.titre}`);
    });

  } catch (erreur) {
    console.log("❌ Échec.");
    console.log("Erreur :", erreur.message);
  }
}


// ─────────────────────────────────────────────
// LANCER TOUS LES TESTS
// ─────────────────────────────────────────────
async function lancerTousLesTests() {
  console.log("🚀 DÉMARRAGE DES TESTS — CogniTrack Jour 2");
  console.log("Vérifie ta clé API dans config.js avant de continuer.\n");

  await test1_connexionDeBase();
  console.log(""); // ligne vide

  await test2_genererQuestions();
  console.log("");

  await test3_genererProgramme();
  console.log("");

  console.log("🏁 TESTS TERMINÉS");
}

// On lance tout automatiquement au chargement de la page
lancerTousLesTests();