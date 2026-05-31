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
  // Affiche l'IQ estimé au lieu du simple score
  document.getElementById("score-chiffre").textContent = r.iq_estime || r.score;
  document.getElementById("score-detail").textContent =
    `${r.bonnes_reponses}/${r.total_questions} correctes · ${r.label_iq || ""} · Temps moyen : ${r.temps_moyen}s`;

  const badge = document.getElementById("niveau-badge");
  badge.textContent = r.niveau_obtenu;
  badge.className   = "niveau-badge niveau-" + r.niveau_obtenu.toLowerCase();

  // Message selon l'IQ
  const messages = {
    "Excellent": `🧠 Indice cognitif exceptionnel (${r.iq_estime}) ! Tu figures parmi les meilleurs.`,
    "Avancé":    `🎯 Très bon indice cognitif (${r.iq_estime}). Au-dessus de la moyenne.`,
    "Moyen":     `📈 Indice cognitif dans la norme (${r.iq_estime}). De la progression est possible.`,
    "Débutant":  `💪 Indice cognitif de ${r.iq_estime}. Continue à t'entraîner, ça progresse !`
  };
  document.getElementById("message-niveau").textContent = messages[r.niveau_obtenu] || "";

  document.getElementById("info-matiere").textContent = r.matiere;
  document.getElementById("info-date").textContent    = r.date;

  // Anneau — couleur selon l'IQ
  const cercle = document.getElementById("cercle-score");
  if (cercle) {
    const pct = Math.min((r.iq_estime - 70) / 75, 1); // 70–145 → 0–1
    const circonf = 2 * Math.PI * 54;
    cercle.style.strokeDasharray  = circonf;
    cercle.style.strokeDashoffset = circonf * (1 - pct);
    cercle.style.stroke =
      r.iq_estime >= 130 ? "#22c55e" :
      r.iq_estime >= 115 ? "#6366f1" :
      r.iq_estime >= 85  ? "#f59e0b" : "#ef4444";
  }

  // ── Remplace "/100" par "IQ" sous le chiffre ──
  const scoreSur = document.querySelector(".score-sur");
  if (scoreSur) scoreSur.textContent = "IQ";
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