const WIKI_SAMPLE_URL = "https://en.wikipedia.org/wiki/Artificial_intelligence";

const pageUrlInput = document.getElementById("pageUrlInput");
const loadPageBtn = document.getElementById("loadPageBtn");
const loadSampleBtn = document.getElementById("loadSampleBtn");
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

let loadedPageLabel = "Not loaded yet";
let sourceText = "";

const wikiCache = new Map();

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
    item.textContent = "No extractable text found. Load a Wikipedia URL and try again.";
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

async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWikipediaData(title) {
  const cacheKey = title.toLowerCase();
  if (wikiCache.has(cacheKey)) {
    return wikiCache.get(cacheKey);
  }

  const summaryEndpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const response = await fetchWithTimeout(summaryEndpoint, 5000);
    if (!response.ok) {
      throw new Error("Summary API not available");
    }

    const data = await response.json();
    const parsed = {
      title: data.title || title,
      extract: data.extract || "No summary extract found.",
      source: "Wikipedia REST summary"
    };

    wikiCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    const fallbackEndpoint = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(title)}`;
    const fallbackResponse = await fetchWithTimeout(fallbackEndpoint, 7000);

    if (!fallbackResponse.ok) {
      throw new Error("Wikipedia could not be loaded right now.");
    }

    const fallbackData = await fallbackResponse.json();
    const pages = fallbackData?.query?.pages || {};
    const firstPage = Object.values(pages)[0];

    if (!firstPage || !firstPage.extract) {
      throw new Error("Wikipedia article text was not available.");
    }

    const parsed = {
      title: firstPage.title || title,
      extract: firstPage.extract,
      source: "Wikipedia API fallback"
    };

    wikiCache.set(cacheKey, parsed);
    return parsed;
  }
}

async function loadWikipediaSummary(url) {
  const title = parseWikipediaTitle(url);
  if (!title) {
    throw new Error("Please enter a valid Wikipedia article URL.");
  }

  const data = await fetchWikipediaData(title);
  loadedPageLabel = data.title;
  sourceText = data.extract;
  renderSource(loadedPageLabel, sourceText, `Loaded from ${data.source}.`);
}

function setLoadingState(isLoading) {
  loadPageBtn.disabled = isLoading;
  loadSampleBtn.disabled = isLoading;
  reconfigureBtn.disabled = isLoading;
}

async function loadFromInputUrl() {
  const url = pageUrlInput.value.trim();
  if (!url) {
    loadStatus.textContent = "Enter a page URL first (Wikipedia URL recommended).";
    return;
  }
}

reconfigureBtn.addEventListener("click", buildOutput);

  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Wikipedia page could not be loaded.");
  }

  const data = await response.json();
  const extract = data.extract || "No summary extract found.";

  loadedPageLabel = data.title || title;
  sourceText = extract;
  renderSource(loadedPageLabel, extract, "Loaded from Wikipedia REST API.");
}

async function loadFromInputUrl() {
  const url = pageUrlInput.value.trim();
  if (!url) {
    loadStatus.textContent = "Enter a page URL first (Wikipedia URL recommended).";
    return;
  }

  loadStatus.textContent = "Loading page content...";

  try {
    await loadWikipediaSummary(url);
    loadStatus.textContent = `Loaded ${loadedPageLabel}. Click Reconfigure This Page.`;
    buildOutput();
  } catch (error) {
    loadStatus.textContent = error.message;
  }
}

loadPageBtn.addEventListener("click", loadFromInputUrl);

loadSampleBtn.addEventListener("click", async () => {
  pageUrlInput.value = WIKI_SAMPLE_URL;
  await loadFromInputUrl();
});

pageUrlInput.addEventListener("keydown", async event => {
  if (event.key === "Enter") {
    event.preventDefault();
    await loadFromInputUrl();
  }
});

reconfigureBtn.addEventListener("click", buildOutput);

  const start = performance.now();
  setLoadingState(true);
  loadStatus.textContent = "Loading page content...";

  try {
    await loadWikipediaSummary(url);
    const elapsed = ((performance.now() - start) / 1000).toFixed(1);
    loadStatus.textContent = `Loaded ${loadedPageLabel} in ${elapsed}s. Click Reconfigure This Page.`;
    buildOutput();
  } catch (error) {
    loadStatus.textContent = `${error.message} Try Load Sample Wiki or retry.`;
  } finally {
    setLoadingState(false);
  }
}

loadPageBtn.addEventListener("click", loadFromInputUrl);

loadSampleBtn.addEventListener("click", async () => {
  pageUrlInput.value = WIKI_SAMPLE_URL;
  await loadFromInputUrl();
});

pageUrlInput.addEventListener("keydown", async event => {
  if (event.key === "Enter") {
    event.preventDefault();
    await loadFromInputUrl();
  }
});

reconfigureBtn.addEventListener("click", buildOutput);

buildOutput();
