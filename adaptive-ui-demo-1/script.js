const dashboard = document.getElementById("dashboard");
const cards = Array.from(document.querySelectorAll(".card"));
const aiToggle = document.getElementById("aiToggle");
const status = document.getElementById("status");

let aiEnabled = false;

// Score storage
const scores = {};
cards.forEach(card => {
  scores[card.dataset.id] = 0;
});

// Toggle AI Mode
aiToggle.addEventListener("change", () => {
  aiEnabled = aiToggle.checked;
  status.textContent = aiEnabled ? "AI Mode: ON (Learning...)" : "AI Mode: OFF";
});

// Click tracking
cards.forEach(card => {
  card.addEventListener("click", () => {
    if (!aiEnabled) return;

    const id = card.dataset.id;
    scores[id] += 1;

    reorderCards();
  });
});

// Reorder logic
function reorderCards() {
  const sorted = [...cards].sort((a, b) => {
    return scores[b.dataset.id] - scores[a.dataset.id];
  });

  sorted.forEach(card => {
    dashboard.appendChild(card);

    // Scale based on score
    const score = scores[card.dataset.id];
    const scale = 1 + score * 0.05;
    card.style.transform = `scale(${scale})`;
  });
}

// Time decay (recency weighting)
setInterval(() => {
  if (!aiEnabled) return;

  for (let key in scores) {
    scores[key] *= 0.9;
  }

  reorderCards();
}, 5000);