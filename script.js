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
  keyBuffer: "",
  activeMusicCount: 0
};

function playUiClick() {
  if (!state.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(360, now);
  osc.frequency.exponentialRampToValueAtTime(275, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.008, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
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
  if (value && state.activeMusicCount === 0) startTerminalHum();
  else stopTerminalHum();
}

function startTerminalHum() {
  const ctx = getAudioContext();
  if (!ctx || state.humNodes) return;
  const low = ctx.createOscillator();
  const high = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const merge = ctx.createGain();

  low.type = "sawtooth";
  low.frequency.value = 52;
  high.type = "triangle";
  high.frequency.value = 104;
  lfo.type = "sine";
  lfo.frequency.value = 0.23;
  lfoGain.gain.value = 7;
  lfo.connect(lfoGain);
  lfoGain.connect(low.frequency);

  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * 0.45;
  noise.buffer = buffer;
  noise.loop = true;

  noiseGain.gain.value = 0.0016;
  merge.gain.value = 0.0026;

  low.connect(merge);
  high.connect(merge);
  noise.connect(noiseGain);
  noiseGain.connect(merge);
  merge.connect(ctx.destination);

  low.start();
  high.start();
  lfo.start();
  noise.start();
  state.humNodes = { low, high, lfo, noise };
}

function stopTerminalHum() {
  if (!state.humNodes) return;
  state.humNodes.low.stop();
  state.humNodes.high.stop();
  state.humNodes.lfo.stop();
  state.humNodes.noise.stop();
  state.humNodes = null;
}

function updateHumState() {
  if (!state.sfxEnabled) return;
  if (state.activeMusicCount > 0) stopTerminalHum();
  else startTerminalHum();
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
  if (next.audio.currentTime > 0 || next.preloaded) return;
  next.audio.preload = "auto";
  if (next.audio.readyState < 2) next.audio.load();
  next.preloaded = true;
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
          <div class="volume-shell">
            <button type="button" class="track-btn volume-btn" aria-label="Volume"><span class="icon-volume"></span></button>
            <div class="volume-pop">
              <input class="volume-range" type="range" min="0" max="1" step="0.01" value="0.85" aria-label="Track volume">
            </div>
          </div>
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
    const volumeRange = card.querySelector(".volume-range");
    const seek = card.querySelector(".seek");
    const progress = card.querySelector(".seek-progress");

    audio.src = file.url;
    audio.volume = Number(volumeRange.value);

    playButton.addEventListener("click", async () => {
      playUiClick();
      if (audio.paused) {
        stopAllPlayers(index);
        try {
          await audio.play();
          playButton.classList.add("is-playing");
          preloadNextTrack(index);
        } catch {
          playButton.classList.remove("is-playing");
        }
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

    volumeRange.addEventListener("input", () => {
      audio.volume = Number(volumeRange.value);
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
        next.audio.play().then(() => {
          next.playButton.classList.add("is-playing");
        }).catch(() => {});
        preloadNextTrack(index + 1);
      }
    });

    audio.addEventListener("play", () => {
      state.activeMusicCount = Math.max(0, state.activeMusicCount) + 1;
      updateHumState();
      playButton.classList.add("is-playing");
    });

    audio.addEventListener("pause", () => {
      state.activeMusicCount = Math.max(0, state.activeMusicCount - 1);
      updateHumState();
      if (!audio.ended) playButton.classList.remove("is-playing");
    });

    musicList.appendChild(card);
    state.players.push({ audio, playButton, preloaded: false });
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
    if (state.keyBuffer.includes("sever")) {
      document.body.classList.add("easter-sever");
      statusLine.textContent = "EASTER MODE: SEVER";
      playUiClick();
    }
    if (state.keyBuffer.includes("lotus")) {
      document.body.classList.remove("easter-sever");
      statusLine.textContent = "EASTER MODE: LOTUS";
      playUiClick();
    }
  });
}

function setupAsciiVines() {
  const vines = document.getElementById("asciiVines");
  if (!vines) return;

  vines.textContent = `
~^~  //\\\\   __/\\\\\\\\\\__      .  .   //\\\\
  \\\\//  \\\\_//  /\\  /\\  \\_  _/|\\/|\\_//  \\\\
__/\\____/\\\\__/  \\/  \\/\\__\\/  /\\  /\\__\\___
\\  //\\  //  \\  /\\  /  /  /_/  \\/  \\_  /  /
 \\\\// \\\\//    \\/  \\/__/  /  /\\__/\\  \\ \\/\\/
 /\\   /\\   .--..--.  _.-'  /  /  \\  \\  /\\
//\\\\ //\\\\ /  /\\/\\  \\/  _.-'__/____\\__\\/  \\
`;

  const move = (clientX, clientY) => {
    const mx = (clientX / window.innerWidth - 0.5) * 1.2;
    const my = (clientY / window.innerHeight - 0.5) * 0.8;
    vines.style.transform = `translate(${mx}rem, ${my}rem)`;
  };
  document.addEventListener("mousemove", (event) => move(event.clientX, event.clientY));
  document.addEventListener("touchmove", (event) => {
    const t = event.touches[0];
    if (t) move(t.clientX, t.clientY);
  }, { passive: true });
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
  setupAsciiVines();
  await Promise.all([renderMusic(), renderVisuals()]);
}

init();
