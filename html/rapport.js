// ============================================
// rapport.js — Rapport hebdomadaire (Jour 8)
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  const historique = JSON.parse(localStorage.getItem("historique") || "[]");

  // Filtre les 7 derniers jours
  const maintenant = new Date();
  const il7Jours   = new Date(maintenant - 7 * 24 * 60 * 60 * 1000);

  const testsSemaine = historique.filter(r => {
    // La date est au format "dd/mm/yyyy"
    const parts = r.date.split("/");
    const dateTest = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return dateTest >= il7Jours;
  });

  // Si pas assez de données
  if (testsSemaine.length < 2) {
    document.getElementById("zone-insuffisant").style.display = "block";
    document.getElementById("zone-rapport").style.display     = "none";
    return;
  }

  // Affiche les stats
  afficherStats(testsSemaine);
  afficherGraphique(testsSemaine);

  // Génère le bilan IA
  await genererBilanIA(testsSemaine);
});


// ─────────────────────────────────────────────
// STATS DE LA SEMAINE
// ─────────────────────────────────────────────
function afficherStats(tests) {
  const scores    = tests.map(r => r.score);
  const moyenne   = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const meilleur  = Math.max(...scores);

  // Progression : compare première et dernière moitié
  const moitie     = Math.floor(tests.length / 2);
  const debut      = tests.slice(0, moitie);
  const fin        = tests.slice(moitie);
  const moyDebut   = debut.reduce((a, b) => a + b.score, 0) / debut.length;
  const moyFin     = fin.reduce((a, b) => a + b.score, 0) / fin.length;
  const progression = Math.round(moyFin - moyDebut);

  document.getElementById("stat-tests").textContent     = tests.length;
  document.getElementById("stat-moyenne").textContent   = moyenne + "/100";
  document.getElementById("stat-meilleur").textContent  = meilleur + "/100";
  document.getElementById("stat-progression").textContent =
    (progression >= 0 ? "+" : "") + progression + " pts";
  document.getElementById("stat-progression").style.color =
    progression >= 0 ? "#22c55e" : "#ef4444";
}


// ─────────────────────────────────────────────
// GRAPHIQUE DE LA SEMAINE
// ─────────────────────────────────────────────
function afficherGraphique(tests) {
  const ctx = document.getElementById("graphique-semaine").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: tests.map((r, i) => `${r.matiere} (${r.date})`),
      datasets: [{
        label: "Score",
        data:  tests.map(r => r.score),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.1)",
        borderWidth: 2.5,
        pointBackgroundColor: tests.map(r => {
          if (r.score >= 85) return "#22c55e";
          if (r.score >= 65) return "#6366f1";
          if (r.score >= 40) return "#f59e0b";
          return "#ef4444";
        }),
        pointRadius: 6,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0, max: 100,
          ticks: { callback: v => v + "/100", color: "#8a96b5" },
          grid: { color: "rgba(255,255,255,0.05)" }
        },
        x: {
          ticks: { color: "#8a96b5", maxRotation: 30 },
          grid: { display: false }
        }
      }
    }
  });
}


// ─────────────────────────────────────────────
// BILAN GÉNÉRÉ PAR GROQ
// ─────────────────────────────────────────────
async function genererBilanIA(tests) {
  try {
    document.getElementById("rapport-chargement").style.display = "flex";

    const rapport = await genererRapportHebdo(tests);

    document.getElementById("rapport-chargement").style.display = "none";
    document.getElementById("zone-bilan").style.display         = "block";

    // Bilan texte
    document.getElementById("rapport-bilan-texte").textContent = rapport.bilan;

    // Points forts
    const listeFortes = document.getElementById("rapport-points-forts");
    listeFortes.innerHTML = "";
    (rapport.points_forts || []).forEach(point => {
      const li = document.createElement("li");
      li.textContent = point;
      listeFortes.appendChild(li);
    });

    // Points faibles
    const listeFaibles = document.getElementById("rapport-points-faibles");
    listeFaibles.innerHTML = "";
    (rapport.points_faibles || []).forEach(point => {
      const li = document.createElement("li");
      li.textContent = point;
      listeFaibles.appendChild(li);
    });

    // Recommandation
    document.getElementById("rapport-recommandation").textContent =
      rapport.recommandation_semaine_prochaine;

  } catch (erreur) {
    console.error("Erreur rapport IA :", erreur);
    document.getElementById("rapport-chargement").style.display = "none";
    document.getElementById("rapport-bilan-texte").textContent  =
      "Impossible de générer l'analyse IA. Tes statistiques sont affichées ci-dessus.";
    document.getElementById("zone-bilan").style.display = "block";
  }
}