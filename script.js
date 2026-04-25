const GH_USER = "sever4user";
const GH_REPO = "lotuscomplex";

const logsContent = `> BOOT SEQUENCE: LOTUS COMPLEX
> NODE: AUTHOR PROFILE INITIALIZED

Я создаю аудиовизуальные миры на стыке 3D, музыки и narrative-эстетики.
Проект LOTUS COMPLEX - это персональный архив артефактов, звука и кода.
TG: @sever4user
GITHUB: https://github.com/sever4user

Другие проекты:
- SEVER SIGNALS // экспериментальные саунд-капсулы
- CONCRETE DOME // серия 3D-сцен
- ECHO FRAME // визуальные исследования материалов

> LOG STREAM READY`;

const contactsContent = `> SECURE CHANNEL OPEN

TG: @sever4user
MAIL: hello@lotuscomplex.art
INST: @lotuscomplex
GITHUB: https://github.com/sever4user

> AWAITING NEW CONNECTION...`;

const tabButtons = [...document.querySelectorAll(".tab")];
const panels = [...document.querySelectorAll(".panel")];
const statusLine = document.getElementById("statusLine");
const sfxToggle = document.getElementById("sfxToggle");
const typed = { logs: false, contacts: false };
const mediaExtensions = {
  audio: [".mp3", ".ogg", ".wav", ".m4a"],
  visuals: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]
};

const state = {
  sfxEnabled: false,
  audioCtx: null,
  humNodes: null,
  players: [],
  keyBuffer: ""
};

function playUiClick() {
  if (!state.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(780, now);
  osc.frequency.exponentialRampToValueAtTime(330, now + 0.05);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.018, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!state.audioCtx) state.audioCtx = new AudioCtx();
  if (state.audioCtx.state === "suspended") state.audioCtx.resume();
  return state.audioCtx;
}

function setSfxEnabled(value) {
  state.sfxEnabled = value;
  sfxToggle.textContent = value ? "SFX: ON" : "SFX: OFF";
  sfxToggle.setAttribute("aria-pressed", value ? "true" : "false");
  if (value) startTerminalHum();
  else stopTerminalHum();
}

function startTerminalHum() {
  const ctx = getAudioContext();
  if (!ctx || state.humNodes) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 58;
  gain.gain.value = 0.0008;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  state.humNodes = { osc, gain };
}

function stopTerminalHum() {
  if (!state.humNodes) return;
  state.humNodes.osc.stop();
  state.humNodes = null;
}

function setTab(sectionId) {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === sectionId);
  });
  statusLine.textContent = `STATUS: ONLINE // SECTION: ${sectionId.toUpperCase()}`;
  playUiClick();

  if (sectionId === "logs" && !typed.logs) {
    startTypewriter("logsTypewriter", logsContent);
    typed.logs = true;
  }
  if (sectionId === "contacts" && !typed.contacts) {
    startTypewriter("contactsTypewriter", contactsContent);
    typed.contacts = true;
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function enhanceInteractiveText(target) {
  const plain = target.textContent || "";
  const withLinks = plain.replace(
    /(https?:\/\/[^\s]+|(?:github\.com|t\.me|instagram\.com)\/[^\s]+)/gi,
    (match) => {
      const href = match.startsWith("http") ? match : `https://${match}`;
      return `<a class="inline-link" target="_blank" rel="noopener noreferrer" href="${href}">${match}</a>`;
    }
  );
  const withMentions = withLinks.replace(
    /(^|[\s(])(@[a-zA-Z0-9_а-яА-Я.-]+)/g,
    (full, prefix, mention) =>
      `${prefix}<button type="button" class="copy-mention" data-copy="${mention}">${mention}</button>`
  );
  target.innerHTML = withMentions;
}

function startTypewriter(targetId, text) {
  const target = document.getElementById(targetId);
  if (!target) return;

  let index = 0;
  target.textContent = "";

  const write = () => {
    if (index <= text.length) {
      target.textContent = text.slice(0, index);
      const cursor = document.createElement("span");
      cursor.className = "cursor";
      target.appendChild(cursor);
      index += 1;

      const previousChar = text[index - 1];
      let delay = 18;
      if (previousChar === "\n") delay = 95;
      if (previousChar === "." || previousChar === ":" || previousChar === "-") delay = 120;
      setTimeout(write, delay);
      return;
    }
    enhanceInteractiveText(target);
  };
  write();
}

function extensionMatch(fileName, allowed) {
  const lower = fileName.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext));
}

function formatTrackName(fileName) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

async function listRepoFolderByApi(folder) {
  const apiUrl = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${folder}`;
  const response = await fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((entry) => entry.type === "file")
    .map((entry) => ({
      name: entry.name,
      url: entry.download_url || `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/main/${folder}/${entry.name}`
    }));
}

async function resolveFiles(folder) {
  const files = await listRepoFolderByApi(folder);
  return files.filter((file) => extensionMatch(file.name, mediaExtensions[folder]));
}

function renderEmpty(target, text) {
  target.innerHTML = `<p class="empty">${text}</p>`;
}

function stopAllPlayers(exceptIndex = -1) {
  state.players.forEach((playerState, idx) => {
    if (idx === exceptIndex) return;
    playerState.audio.pause();
    playerState.playButton.classList.remove("is-playing");
  });
}

function updateSeekVisual(seek, progress, audio) {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  seek.max = String(audio.duration);
  seek.value = String(audio.currentTime);
  const ratio = (audio.currentTime / audio.duration) * 100;
  progress.style.width = `${ratio}%`;
}

function preloadNextTrack(currentIndex) {
  const next = state.players[currentIndex + 1];
  if (!next) return;
  if (next.audio.preload !== "auto") next.audio.preload = "auto";
  next.audio.load();
}

async function renderMusic() {
  const musicList = document.getElementById("musicList");
  const files = await resolveFiles("audio");

  if (!files.length) {
    renderEmpty(musicList, "Треки не найдены в папке audio репозитория.");
    return;
  }

  musicList.innerHTML = "";
  state.players = [];

  files.forEach((file, index) => {
    const card = document.createElement("article");
    card.className = "track";
    card.innerHTML = `
      <p class="track-title">${file.name}</p>
      <div class="track-controls">
        <div class="track-btns">
          <button type="button" class="track-btn play-btn" aria-label="Play or pause"><span class="icon-play"></span></button>
          <button type="button" class="track-btn stop-btn" aria-label="Stop"><span class="icon-stop"></span></button>
        </div>
        <div class="seek-wrap">
          <div class="seek-base"></div>
          <div class="seek-progress"></div>
          <input class="seek" type="range" min="0" max="100" step="0.01" value="0" aria-label="Track position">
        </div>
      </div>
      <audio preload="metadata" controlslist="nodownload noplaybackrate"></audio>
    `;

    const audio = card.querySelector("audio");
    const playButton = card.querySelector(".play-btn");
    const stopButton = card.querySelector(".stop-btn");
    const seek = card.querySelector(".seek");
    const progress = card.querySelector(".seek-progress");

    audio.src = file.url;

    playButton.addEventListener("click", async () => {
      playUiClick();
      if (audio.paused) {
        stopAllPlayers(index);
        await audio.play();
        playButton.classList.add("is-playing");
        preloadNextTrack(index);
      } else {
        audio.pause();
        playButton.classList.remove("is-playing");
      }
    });

    stopButton.addEventListener("click", () => {
      playUiClick();
      audio.pause();
      audio.currentTime = 0;
      playButton.classList.remove("is-playing");
      progress.style.width = "0%";
      seek.value = "0";
    });

    seek.addEventListener("input", () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      audio.currentTime = Number(seek.value);
      updateSeekVisual(seek, progress, audio);
    });

    audio.addEventListener("timeupdate", () => {
      updateSeekVisual(seek, progress, audio);
      if (audio.currentTime > 2) preloadNextTrack(index);
    });

    audio.addEventListener("ended", () => {
      playButton.classList.remove("is-playing");
      const next = state.players[index + 1];
      if (next) {
        stopAllPlayers(index + 1);
        next.audio.play();
        next.playButton.classList.add("is-playing");
        preloadNextTrack(index + 1);
      }
    });

    musicList.appendChild(card);
    state.players.push({ audio, playButton });
  });
}

function configureLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const closeButton = document.getElementById("closeLightbox");

  const close = () => {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    document.body.style.overflow = "";
  };

  closeButton.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  return (imageUrl) => {
    lightboxImage.src = imageUrl;
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
}

async function renderVisuals() {
  const visualGrid = document.getElementById("visualGrid");
  const files = await resolveFiles("visuals");
  const openLightbox = configureLightbox();

  if (!files.length) {
    renderEmpty(visualGrid, "Изображения не найдены в папке visuals репозитория.");
    return;
  }

  visualGrid.innerHTML = "";
  files.forEach((file) => {
    const button = document.createElement("button");
    button.className = "visual-item";
    button.type = "button";
    button.setAttribute("aria-label", `Open ${file.name}`);
    button.innerHTML = `<img src="${file.url}" alt="${file.name}" loading="lazy">`;
    button.addEventListener("click", () => openLightbox(file.url));
    visualGrid.appendChild(button);
  });
}

function setupClipboardMentions() {
  document.addEventListener("click", async (event) => {
    const target = event.target.closest(".copy-mention");
    if (!target) return;
    const value = target.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(value);
      statusLine.textContent = `COPIED TO CLIPBOARD: ${value}`;
      setTimeout(() => {
        const active = document.querySelector(".tab.active")?.dataset.section || "logs";
        statusLine.textContent = `STATUS: ONLINE // SECTION: ${active.toUpperCase()}`;
      }, 1200);
    } catch {
      statusLine.textContent = "CLIPBOARD ACCESS BLOCKED";
    }
  });
}

function setupEasterEggs() {
  document.addEventListener("keydown", (event) => {
    if (event.key.length !== 1) return;
    state.keyBuffer = (state.keyBuffer + event.key.toLowerCase()).slice(-18);
    if (state.keyBuffer.includes("debug")) {
      document.body.classList.toggle("easter-debug");
      statusLine.textContent = "EASTER MODE: DEBUG";
      playUiClick();
    }
    if (state.keyBuffer.includes("sever")) {
      document.body.classList.toggle("easter-sever");
      statusLine.textContent = "EASTER MODE: SEVER";
      playUiClick();
    }
  });
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.section));
});

sfxToggle.addEventListener("click", () => {
  setSfxEnabled(!state.sfxEnabled);
  playUiClick();
});

async function init() {
  setTab("logs");
  setupClipboardMentions();
  setupEasterEggs();
  await Promise.all([renderMusic(), renderVisuals()]);
}

init();
