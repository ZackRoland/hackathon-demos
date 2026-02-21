const formatSelect = document.getElementById("formatSelect");
const audienceSelect = document.getElementById("audienceSelect");
const emphasisSelect = document.getElementById("emphasisSelect");
const pointsRange = document.getElementById("pointsRange");
const pointsValue = document.getElementById("pointsValue");
const reconfigureBtn = document.getElementById("reconfigureBtn");
const outputMeta = document.getElementById("outputMeta");
const outputList = document.getElementById("outputList");

const insightPool = {
  opportunities: [
    "A customizable summary layer can reduce reading time for dense pages by surfacing only key points.",
    "Extension controls let users adapt output to their role, increasing day-to-day usefulness.",
    "Transparent editing can build trust because users can tune or fix generated summaries quickly.",
    "Strong demo storytelling can convert this from a feature concept into a product direction.",
    "Context-aware outputs across tabs could create a unique competitive moat if done responsibly.",
    "A clear before/after view is likely to impress judges during live demos.",
    "Role-based presets simplify onboarding for non-technical users."
  ],
  risks: [
    "Summary quality may drift if source pages are noisy or ambiguous.",
    "Users may distrust outputs if reasoning or source mapping is not visible.",
    "Privacy concerns can block adoption unless tab-level data handling is explicit.",
    "Too many settings can overwhelm first-time users and reduce activation.",
    "Latency spikes could make the extension feel intrusive during browsing.",
    "A weak fallback path may break the experience on unsupported page structures.",
    "Over-compression could remove nuance required for high-stakes decisions."
  ],
  decisions: [
    "Decide whether summaries should be generated locally, remotely, or through a hybrid model.",
    "Choose the default audience profile shown on first run for strongest relevance.",
    "Define how users can edit and pin important points across sessions.",
    "Set guardrails for when the extension should avoid summarizing sensitive content.",
    "Prioritize one killer workflow for the hackathon demo rather than broad feature coverage.",
    "Choose metrics to prove value, such as time saved or action completion.",
    "Determine if exported summaries should be plain text, tasks, or slide-ready bullets."
  ]
};

const audiencePrefix = {
  founder: "Business lens",
  engineer: "Technical lens",
  investor: "Investment lens"
};

const formatPrefix = {
  brief: "Bullet",
  checklist: "Checklist item",
  timeline: "Step"
};

pointsRange.addEventListener("input", () => {
  pointsValue.textContent = `${pointsRange.value} points`;
});

function maybeHighlightKeywords(text) {
  const keywords = ["privacy", "demo", "users", "value", "risk", "quality"];
  return keywords.reduce((updatedText, keyword) => {
    const regex = new RegExp(`\\b(${keyword})\\b`, "gi");
    return updatedText.replace(regex, '<span class="keyword">$1</span>');
  }, text);
}

function buildOutput() {
  const emphasis = emphasisSelect.value;
  const audience = audienceSelect.value;
  const format = formatSelect.value;
  const maxPoints = Number(pointsRange.value);

  const selectedInsights = insightPool[emphasis].slice(0, maxPoints);

  outputMeta.textContent = `${audiencePrefix[audience]} • ${format} • Focused on ${emphasis}`;

  outputList.innerHTML = "";

  selectedInsights.forEach((insight, index) => {
    const item = document.createElement("li");
    const label = `${formatPrefix[format]} ${index + 1}`;
    item.innerHTML = `<strong>${label}:</strong> ${maybeHighlightKeywords(insight)}`;
    outputList.appendChild(item);
  });
}

reconfigureBtn.addEventListener("click", buildOutput);

buildOutput();
