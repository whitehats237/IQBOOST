// ============================================
// resultats.js — Jour 5 : page résultats
// ============================================
// Affiche le score, le niveau, les corrections
// et génère le programme de révision via Groq

// ─────────────────────────────────────────────
// DÉMARRAGE : on lit les résultats et on affiche
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const resultats = JSON.parse(localStorage.getItem("derniers_resultats"));

  if (!resultats) {
    // Pas de résultats → retour à l'accueil
    window.location.href = "index.html";
    return;
  }

  afficherScore(resultats);
  afficherCorrections(resultats);

  // Génère le programme via Groq
  await afficherProgramme(resultats);
});


// ─────────────────────────────────────────────
// AFFICHER LE SCORE ET LE NIVEAU
// ─────────────────────────────────────────────
function afficherScore(r) {
  // Score en chiffre
  document.getElementById("score-chiffre").textContent = r.score;
  document.getElementById("score-detail").textContent =
    `${r.bonnes_reponses} / ${r.total_questions} bonnes réponses · Temps moyen : ${r.temps_moyen}s`;

  // Niveau badge
  const badge = document.getElementById("niveau-badge");
  badge.textContent = r.niveau_obtenu;
  badge.className = "niveau-badge niveau-" + r.niveau_obtenu.toLowerCase();

  // Message selon le niveau
  const messages = {
    "Excellent": "🏆 Performance exceptionnelle ! Tu maîtrises très bien cette matière.",
    "Avancé":    "🎯 Très bon résultat ! Quelques points à peaufiner.",
    "Moyen":     "📈 Bon début ! Un peu de travail et tu progresseras vite.",
    "Débutant":  "💪 Ne te décourage pas, tout le monde commence quelque part !"
  };
  document.getElementById("message-niveau").textContent =
    messages[r.niveau_obtenu] || "";

  // Matière et date
  document.getElementById("info-matiere").textContent = r.matiere;
  document.getElementById("info-date").textContent    = r.date;

  // Anneau de score (SVG circulaire)
  const cercle = document.getElementById("cercle-score");
  if (cercle) {
    const circonference = 2 * Math.PI * 54; // rayon = 54
    const rempli = ((100 - r.score) / 100) * circonference;
    cercle.style.strokeDasharray  = circonference;
    cercle.style.strokeDashoffset = rempli;
    // Couleur selon le score
    if      (r.score >= 85) cercle.style.stroke = "#22c55e";
    else if (r.score >= 65) cercle.style.stroke = "#6366f1";
    else if (r.score >= 40) cercle.style.stroke = "#f59e0b";
    else                    cercle.style.stroke = "#ef4444";
  }
}


// ─────────────────────────────────────────────
// AFFICHER LES CORRECTIONS
// ─────────────────────────────────────────────
function afficherCorrections(r) {
  const conteneur = document.getElementById("liste-corrections");
  if (!conteneur) return;

  conteneur.innerHTML = "";

  r.reponses.forEach((rep, i) => {
    const div = document.createElement("div");
    div.className = "correction-item " + (rep.correct ? "correction-ok" : "correction-ko");

    div.innerHTML = `
      <div class="correction-numero">Q${i + 1}</div>
      <div class="correction-contenu">
        <div class="correction-question">${rep.question}</div>
        <div class="correction-reponse">
          ${rep.correct
            ? `✅ Bonne réponse : <strong>${rep.bonne_reponse}</strong>`
            : `❌ Tu as répondu <strong>${rep.repondu}</strong> · Bonne réponse : <strong>${rep.bonne_reponse}</strong>`
          }
          · <span class="correction-temps">${rep.temps}s</span>
        </div>
        <div class="correction-explication">💡 ${rep.explication}</div>
      </div>
    `;
    conteneur.appendChild(div);
  });
}


// ─────────────────────────────────────────────
// GÉNÉRER ET AFFICHER LE PROGRAMME (Groq)
// ─────────────────────────────────────────────
async function afficherProgramme(r) {
  const zone = document.getElementById("zone-programme");
  const zoneChargement = document.getElementById("programme-chargement");

  if (!zone) return;

  try {
    zoneChargement.style.display = "flex";

    const programme = await genererProgramme(r);

    zoneChargement.style.display = "none";

    // Message motivationnel
    document.getElementById("message-motivationnel").textContent =
      programme.message_motivationnel;

    // Programme sur 7 jours
    const listeProgramme = document.getElementById("liste-programme");
    listeProgramme.innerHTML = "";
    programme.programme.forEach(jour => {
      const div = document.createElement("div");
      div.className = "programme-jour";
      div.innerHTML = `
        <div class="jour-entete">
          <span class="jour-nom">${jour.jour}</span>
          <span class="jour-duree">⏱ ${jour.duree}</span>
        </div>
        <div class="jour-titre">${jour.titre}</div>
        <div class="jour-description">${jour.description}</div>
      `;
      listeProgramme.appendChild(div);
    });

    // Conseil général
    if (programme.conseil_general) {
      document.getElementById("conseil-general").textContent =
        programme.conseil_general;
    }

    zone.style.display = "block";

  } catch (erreur) {
    console.error("Erreur génération programme :", erreur);
    zoneChargement.style.display = "none";
    document.getElementById("programme-erreur").style.display = "block";
  }
}