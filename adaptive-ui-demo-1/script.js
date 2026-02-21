const pageUrlInput = document.getElementById("pageUrlInput");
const loadPageBtn = document.getElementById("loadPageBtn");
const loadStatus = document.getElementById("loadStatus");
const sourceContent = document.getElementById("sourceContent");

const formatSelect = document.getElementById("formatSelect");
const audienceSelect = document.getElementById("audienceSelect");
const emphasisSelect = document.getElementById("emphasisSelect");
const pointsRange = document.getElementById("pointsRange");
const pointsValue = document.getElementById("pointsValue");
const reconfigureBtn = document.getElementById("reconfigureBtn");
const outputMeta = document.getElementById("outputMeta");
const outputList = document.getElementById("outputList");

const defaultText = [
  "Teams are experimenting with browser-based assistants that can turn dense documentation into guided outputs.",
  "Judges care about clear user value, execution feasibility, and demo quality.",
  "Current pain points include information overload, fragmented context across tabs, and poor task follow-through.",
  "Potential risks include inaccurate summaries, weak personalization, and privacy concerns around tab data."
].join(" ");

let loadedPageLabel = "Default sample";
let sourceText = defaultText;

const focusKeywords = {
  opportunities: ["value", "improve", "reduce", "assist", "opportunity", "clear", "quality", "users"],
  risks: ["risk", "concern", "privacy", "weak", "inaccurate", "overload", "block", "failure"],
  decisions: ["should", "decide", "choose", "define", "prioritize", "determine", "need", "must"]
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

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function maybeHighlightKeywords(text) {
  const keywords = ["privacy", "demo", "users", "value", "risk", "quality", "decision"];
  return keywords.reduce((updatedText, keyword) => {
    const regex = new RegExp(`\\b(${keyword})\\w*\\b`, "gi");
    return updatedText.replace(regex, '<span class="keyword">$&</span>');
  }, escapeHtml(text));
}

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);
}

function scoreSentence(sentence, emphasis) {
  const words = sentence.toLowerCase();
  const matches = focusKeywords[emphasis].reduce((count, keyword) => {
    return count + (words.includes(keyword) ? 1 : 0);
  }, 0);
  return matches * 10 + Math.min(sentence.length / 40, 5);
}

function buildOutput() {
  const emphasis = emphasisSelect.value;
  const audience = audienceSelect.value;
  const format = formatSelect.value;
  const maxPoints = Number(pointsRange.value);

  const ranked = splitSentences(sourceText)
    .map(sentence => ({
      sentence,
      score: scoreSentence(sentence, emphasis)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPoints);

  outputMeta.textContent = `${audiencePrefix[audience]} • ${format} • Focused on ${emphasis} • Source: ${loadedPageLabel}`;
  outputList.innerHTML = "";

  ranked.forEach((entry, index) => {
    const item = document.createElement("li");
    const label = `${formatPrefix[format]} ${index + 1}`;
    item.innerHTML = `<strong>${label}:</strong> ${maybeHighlightKeywords(entry.sentence)}`;
    outputList.appendChild(item);
  });

  if (!ranked.length) {
    const item = document.createElement("li");
    item.textContent = "No extractable text found. Try another page URL.";
    outputList.appendChild(item);
  }
}

function renderSource(title, text, subtitle) {
  sourceContent.innerHTML = `
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(subtitle)}</p>
    <p>${escapeHtml(text)}</p>
  `;
}

function parseWikipediaTitle(url) {
  const match = url.match(/wikipedia\.org\/wiki\/([^#?]+)/i);
  if (!match) return null;
  return decodeURIComponent(match[1].replaceAll("_", " "));
}

async function loadWikipediaSummary(url) {
  const title = parseWikipediaTitle(url);
  if (!title) {
    throw new Error("Please enter a valid Wikipedia article URL.");
  }

  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Wikipedia page could not be loaded.");
  }

  const data = await response.json();
  const extract = data.extract || "No summary extract found.";

  loadedPageLabel = data.title || title;
  sourceText = extract;
  renderSource(
    data.title || title,
    extract,
    "Loaded from Wikipedia REST API."
  );
}

loadPageBtn.addEventListener("click", async () => {
  const url = pageUrlInput.value.trim();
  if (!url) {
    loadStatus.textContent = "Enter a page URL first (Wikipedia URL recommended).";
    return;
  }

  loadStatus.textContent = "Loading page content...";

  try {
    await loadWikipediaSummary(url);
    loadStatus.textContent = "Loaded successfully. Click Reconfigure This Page.";
    buildOutput();
  } catch (error) {
    loadStatus.textContent = error.message;
  }
});

reconfigureBtn.addEventListener("click", buildOutput);

buildOutput();
