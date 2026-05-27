// ============================================
// dashboard.js — Jour 7 : tableau de bord
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  const historique = JSON.parse(localStorage.getItem("historique") || "[]");

  if (historique.length === 0) {
    document.getElementById("zone-vide").style.display = "block";
    document.getElementById("zone-dashboard").style.display = "none";
    return;
  }

  document.getElementById("zone-vide").style.display = "none";
  document.getElementById("zone-dashboard").style.display = "block";

  afficherKPIs(historique);
  afficherGraphiqueEvolution(historique);
  afficherGraphiqueMatieres(historique);
  afficherGraphiqueNiveaux(historique);
  afficherHistorique(historique);
});


// ─────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────
function afficherKPIs(historique) {
  const scores = historique.map(r => r.score);
  const scoreMoyen  = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const meilleurScore = Math.max(...scores);
  const matieres = [...new Set(historique.map(r => r.matiere))].length;

  document.getElementById("kpi-score-moyen").textContent   = scoreMoyen + "/100";
  document.getElementById("kpi-total-tests").textContent   = historique.length;
  document.getElementById("kpi-meilleur-score").textContent = meilleurScore + "/100";
  document.getElementById("kpi-matieres").textContent      = matieres;
}


// ─────────────────────────────────────────────
// GRAPHIQUE 1 : Évolution des scores dans le temps
// ─────────────────────────────────────────────
function afficherGraphiqueEvolution(historique) {
  const ctx = document.getElementById("graphique-evolution").getContext("2d");

  const labels = historique.map((r, i) => `Test ${i + 1}\n${r.matiere}`);
  const scores = historique.map(r => r.score);

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Score cognitif",
        data: scores,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 2.5,
        pointBackgroundColor: "#6366f1",
        pointRadius: 5,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` Score : ${ctx.raw}/100`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            callback: v => v + "/100"
          },
          grid: { color: "#f3f4f6" }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}


// ─────────────────────────────────────────────
// GRAPHIQUE 2 : Score moyen par matière
// ─────────────────────────────────────────────
function afficherGraphiqueMatieres(historique) {
  const ctx = document.getElementById("graphique-matieres").getContext("2d");

  // Regroupe les scores par matière
  const parMatiere = {};
  historique.forEach(r => {
    if (!parMatiere[r.matiere]) parMatiere[r.matiere] = [];
    parMatiere[r.matiere].push(r.score);
  });

  const matieres = Object.keys(parMatiere);
  const moyennes = matieres.map(m => {
    const scores = parMatiere[m];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });

  const couleurs = [
    "#6366f1", "#8b5cf6", "#ec4899",
    "#14b8a6", "#f59e0b", "#10b981"
  ];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: matieres,
      datasets: [{
        label: "Score moyen",
        data: moyennes,
        backgroundColor: matieres.map((_, i) => couleurs[i % couleurs.length] + "cc"),
        borderColor:     matieres.map((_, i) => couleurs[i % couleurs.length]),
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` Moyenne : ${ctx.raw}/100`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: { color: "#f3f4f6" },
          ticks: { callback: v => v + "/100" }
        },
        x: { grid: { display: false } }
      }
    }
  });
}


// ─────────────────────────────────────────────
// GRAPHIQUE 3 : Répartition des niveaux (donut)
// ─────────────────────────────────────────────
function afficherGraphiqueNiveaux(historique) {
  const ctx = document.getElementById("graphique-niveaux").getContext("2d");

  const comptage = { "Excellent": 0, "Avancé": 0, "Moyen": 0, "Débutant": 0 };
  historique.forEach(r => {
    if (comptage[r.niveau_obtenu] !== undefined) comptage[r.niveau_obtenu]++;
  });

  // Filtre les niveaux avec 0
  const labels  = Object.keys(comptage).filter(k => comptage[k] > 0);
  const data    = labels.map(k => comptage[k]);
  const couleurs = {
    "Excellent": "#22c55e",
    "Avancé":    "#6366f1",
    "Moyen":     "#f59e0b",
    "Débutant":  "#ef4444"
  };

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map(l => couleurs[l]),
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 16, font: { size: 13 } }
        }
      },
      cutout: "65%"
    }
  });
}


// ─────────────────────────────────────────────
// HISTORIQUE DES TESTS
// ─────────────────────────────────────────────
function afficherHistorique(historique) {
  const conteneur = document.getElementById("liste-historique");
  conteneur.innerHTML = "";

  // Du plus récent au plus ancien
  [...historique].reverse().forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "historique-item";

    const couleurNiveau = {
      "Excellent": "#22c55e", "Avancé": "#6366f1",
      "Moyen": "#f59e0b",     "Débutant": "#ef4444"
    };

    div.innerHTML = `
      <div class="historique-gauche">
        <span class="historique-matiere">${r.matiere}</span>
        <span class="historique-date">${r.date} · ${r.bonnes_reponses}/${r.total_questions} bonnes réponses</span>
      </div>
      <div class="historique-droite">
        <span class="historique-score">${r.score}<small>/100</small></span>
        <span class="historique-niveau" style="color:${couleurNiveau[r.niveau_obtenu]}">
          ${r.niveau_obtenu}
        </span>
      </div>
    `;
    conteneur.appendChild(div);
  });
}


// ─────────────────────────────────────────────
// EFFACER L'HISTORIQUE
// ─────────────────────────────────────────────
function effacerHistorique() {
  if (confirm("Effacer tout l'historique ? Cette action est irréversible.")) {
    localStorage.removeItem("historique");
    window.location.reload();
  }
}