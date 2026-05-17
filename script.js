const GH_USER = "sever4user";
const GH_REPO = "sever4user";

const logsContent = `> BOOT SEQUENCE: sever4user // NODE: ARTIST PROFILE INITIALIZED

I create audio-visual worlds at the intersection of music, 3D and narrative aesthetics.
sever4user is a personal archive of sounds and experimental electronic artifacts.
> All information on the site is for informational purposes only

Other projects:
- sever4user // artsit, experimental electronics
https://band.link/sever4user

> LOG STREAM READY`;

const contactsContent = `> SECURE CHANNEL OPEN

MAIL: sever4user@gmail.com
INST: @sever4user
TG: @sever4user

> AWAITING NEW CONNECTION...`;

// Soundtrack categories mapping to GitHub folders
const soundtrackCategories = {
  kletka: { name: "KLETKA", folder: "soundtracks/kletka" },
  privet: { name: "PRIVET", folder: "soundtracks/privet" },
  lights: { name: "AS THE LIGHTS FADE AWAY", folder: "soundtracks/lights" },
  mystuff: { name: "MY STUFF", folder: "soundtracks/mystuff" }
};

// My own music releases (edit this array to add/remove releases)
const ownMusicReleases = [
  {
    title: "Release Title Example",
    cover: "visuals/covers/release1.jpg",
    links: [
      { platform: "spotify", label: "Spotify", url: "https://open.spotify.com/..." },
      { platform: "apple", label: "Apple Music", url: "https://music.apple.com/..." },
      { platform: "youtube", label: "YouTube", url: "https://youtube.com/..." }
    ]
  }
  // Add more releases here
];

const tabButtons = [...document.querySelectorAll(".tab")];
const panels = [...document.querySelectorAll(".panel")];
const statusLine = document.getElementById("statusLine");
const sfxToggle = document.getElementById("sfxToggle");
const masterVolumeRange = document.getElementById("masterVolumeRange");
const musicSubTabs = document.getElementById("musicTabs");
const soundtrackDropdowns = document.getElementById("soundtrackDropdowns");

let currentTyping = {
  logs: { text: 0, animId: null },
  contacts: { text: 0, animId: null }
};

const AUDIO_TUNING = {
  masterDefault: 0.62,
  clickPeak: 0.044,
  humMasterGain: 2.88
};

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
  activeMusicCount: 0,
  masterVolume: AUDIO_TUNING.masterDefault,
  rerenderAscii: null,
  liteMode: false,
  loadedSections: {
    music: false,
    visuals: false
  },
  typedSections: {
    logs: false,
    contacts: false
  },
  currentMusicCategory: "soundtracks",
  currentSoundtrackCategory: "kletka"
};

function detectLiteMode() {
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const saveData = navigator.connection?.saveData === true;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  
  return saveData || reducedMotion || memory <= 2 || cores <= 2;
}

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
  gain.gain.exponentialRampToValueAtTime(AUDIO_TUNING.clickPeak * state.masterVolume, now + 0.02);
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

  const brownFilter = ctx.createBiquadFilter();
  const lowpass = ctx.createBiquadFilter();
  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const master = ctx.createGain();

  bass.type = "sine";
  bass.frequency.value = 53;
  bassGain.gain.value = 0.0012;

  brownFilter.type = "lowshelf";
  brownFilter.frequency.value = 190;
  brownFilter.gain.value = 9;
  lowpass.type = "lowpass";
  lowpass.frequency.value = 520;
  lowpass.Q.value = 0.6;

  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < bufferSize; i += 1) {
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.022 * white) / 1.015;
    data[i] = brown * 3.2;
  }
  noise.buffer = buffer;
  noise.loop = true;

  noiseGain.gain.value = 0.0042;
  master.gain.value = AUDIO_TUNING.humMasterGain * state.masterVolume;

  bass.connect(bassGain);
  bassGain.connect(master);
  noise.connect(noiseGain);
  noiseGain.connect(brownFilter);
  brownFilter.connect(lowpass);
  lowpass.connect(master);
  master.connect(ctx.destination);

  bass.start();
  noise.start();
  state.humNodes = { noise, bass, master };
}

function stopTerminalHum() {
  if (!state.humNodes) return;
  state.humNodes.noise.stop();
  state.humNodes.bass.stop();
  state.humNodes = null;
}

function updateHumState() {
  if (!state.sfxEnabled) return;
  if (state.activeMusicCount > 0) stopTerminalHum();
  else startTerminalHum();
}

async function ensureSectionLoaded(sectionId) {
  if (sectionId === "visuals" && !state.loadedSections.visuals) {
    state.loadedSections.visuals = true;
    await renderVisuals();
  }
}

function renderOwnMusic() {
  const grid = document.getElementById("ownMusicGrid");
  
  if (!ownMusicReleases.length) {
    grid.innerHTML = `<p class="empty">No releases yet. Add your music in script.js</p>`;
    return;
  }

  grid.innerHTML = "";
  
  ownMusicReleases.forEach((release) => {
    const card = document.createElement("article");
    card.className = "own-music-card";
    
    const linksHtml = release.links.map(link => 
      `<a class="release-link ${link.platform}" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`
    ).join("");
    
    card.innerHTML = `
      <div class="own-music-cover">
        <img src="${release.cover}" alt="${release.title}" loading="lazy">
      </div>
      <div class="own-music-info">
        <h3 class="own-music-title">${release.title}</h3>
        <div class="own-music-links">${linksHtml}</div>
      </div>
    `;
    
    grid.appendChild(card);
  });
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

  // Показываем подтабы для Music
  if (sectionId === "music") {
    musicSubTabs.style.display = "flex";
    renderSoundtrackDropdowns();
    loadSoundtrackCategory("kletka");
  } else {
    musicSubTabs.style.display = "none";
    document.getElementById("soundtrackCategoryList").innerHTML = "";
  }

  if (sectionId === "logs" && !state.typedSections.logs) {
    state.typedSections.logs = true;
    startTypewriter("logsTypewriter");
  }
  if (sectionId === "contacts" && !state.typedSections.contacts) {
    state.typedSections.contacts = true;
    startTypewriter("contactsTypewriter");
  }

  if (sectionId === "visuals" && !state.loadedSections.visuals) {
    state.loadedSections.visuals = true;
    renderVisuals();
  }

  ensureSectionLoaded(sectionId).catch(() => {
    statusLine.textContent = "LOAD ERROR";
  });
}

function loadMusicCategory(category) {
  state.currentMusicCategory = category;
  
  if (category === "soundtracks") {
    document.getElementById("soundtracksSection").style.display = "block";
    document.getElementById("ownMusicSection").style.display = "none";
    loadSoundtrackCategory("kletka");
  } else {
    document.getElementById("soundtracksSection").style.display = "none";
    document.getElementById("ownMusicSection").style.display = "block";
    renderOwnMusic();
  }
}

function renderSoundtrackDropdowns() {
  soundtrackDropdowns.innerHTML = "";
  
  Object.entries(soundtrackCategories).forEach(([key, { name, folder }]) => {
    const dropdown = document.createElement("div");
    dropdown.className = "soundtrack-dropdown";
    dropdown.dataset.category = key;
    
    const header = document.createElement("button");
    header.className = "dropdown-header";
    header.innerHTML = `<span>[ ${name} ]</span>`;
    
    const content = document.createElement("div");
    content.className = "dropdown-content";
    const contentInner = document.createElement("div");
    contentInner.className = "dropdown-content-inner";
    contentInner.id = `tracks-${key}`;
    content.appendChild(contentInner);
    
    header.addEventListener("click", async () => {
      playUiClick();
      const isOpen = header.classList.contains("active");
      
      // Закрыть все остальные
      document.querySelectorAll(".dropdown-header").forEach(h => {
        h.classList.remove("active");
      });
      document.querySelectorAll(".dropdown-content").forEach(c => {
        c.classList.remove("open");
      });
      
      if (!isOpen) {
        header.classList.add("active");
        content.classList.add("open");
        
        // Загрузить треки если ещё не загружены
        if (!contentInner.dataset.loaded) {
          const files = await resolveFiles(folder);
          
          if (!files.length) {
            contentInner.innerHTML = `<p class="empty">No tracks found.</p>`;
          } else {
            contentInner.innerHTML = "";
            const target = contentInner;
            
            files.forEach((file, index) => {
              const card = document.createElement("article");
              card.className = "track";
              card.innerHTML = `
                <p class="track-title">${file.name}</p>
                <div class="track-controls">
                  <div class="track-btns">
                    <button type="button" class="track-btn play-btn" aria-label="Play or pause"></button>
                    <button type="button" class="track-btn stop-btn" aria-label="Stop"></button>
                  </div>
                  <div class="seek-wrap">
                    <div class="seek-base"></div>
                    <div class="seek-progress"></div>
                    <input class="seek" type="range" min="0" max="100" step="0.01" value="0" aria-label="Track position">
                  </div>
                </div>
                <audio preload="metadata" controlslist="nodownload noplaybackrate" crossorigin="anonymous"></audio>
              `;
              
              const audio = card.querySelector("audio");
              const playButton = card.querySelector(".play-btn");
              const stopButton = card.querySelector(".stop-btn");
              const seek = card.querySelector(".seek");
              const progress = card.querySelector(".seek-progress");
              
              audio.src = file.url;
              audio.volume = state.masterVolume;
              
              playButton.addEventListener("click", async () => {
                playUiClick();
                if (audio.paused) {
                  stopAllPlayers(-1);
                  try {
                    await audio.play();
                    playButton.classList.add("is-playing");
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
              
              seek.addEventListener("input", () => {
                if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
                audio.currentTime = Number(seek.value);
                updateSeekVisual(seek, progress, audio);
              });
              
              audio.addEventListener("timeupdate", () => {
                updateSeekDebounced(seek, progress, audio);
              });
              
              audio.addEventListener("play", () => {
                playButton.classList.add("is-playing");
              });
              
              audio.addEventListener("pause", () => {
                playButton.classList.remove("is-playing");
              });
              
              target.appendChild(card);
            });
            
            contentInner.dataset.loaded = "true";
          }
        }
      }
    });
    
    dropdown.appendChild(header);
    dropdown.appendChild(content);
    soundtrackDropdowns.appendChild(dropdown);
  });
}

function loadSoundtrackCategory(category) {
  state.currentSoundtrackCategory = category;
  
  // Открыть соответствующий dropdown
  const header = document.querySelector(`.dropdown-header[data-category="${category}"]`);
  if (header) {
    header.click();
  }
}

function enhanceInteractiveText(target) {
  const plain = target.textContent || "";
  
  const withLinks = plain.replace(
    /(https?:\/\/[^\s]+|(?:github\.com|t\.me|instagram\.com|band\.link)\/[^\s]+)/gi,
    (match) => {
      const href = match.startsWith("http") ? match : `https://${match}`;
      return `<a class="inline-link" target="_blank" rel="noopener noreferrer" href="${href}">${match}</a>`;
    }
  );
  
  const withEmail = withLinks.replace(
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g,
    (match) => `<button type="button" class="copy-mention" data-copy="${match}">${match}</button>`
  );
  
  const withMentions = withEmail.replace(
    /(^|[\s(])(@[a-zA-Z0-9_.-]+)/g,
    (full, prefix, mention) =>
      `${prefix}<button type="button" class="copy-mention" data-copy="${mention}">${mention}</button>`
  );
  target.innerHTML = withMentions;
}

function startTypewriter(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const section = targetId === "logsTypewriter" ? "logs" : "contacts";
  currentTyping[section].text = 0;

  const text = section === "logs" ? logsContent : contactsContent;

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  target.appendChild(cursor);
  
  const write = () => {
    if (currentTyping[section].text < text.length) {
      const currentCursor = target.querySelector('.cursor');
      target.textContent = text.slice(0, currentTyping[section].text + 1);
      target.appendChild(currentCursor);
      currentTyping[section].text += 1;
      currentTyping[section].animId = requestAnimationFrame(write);
    } else {
      enhanceInteractiveText(target);
      const finalCursor = target.querySelector('.cursor');
      if (finalCursor) finalCursor.style.display = 'none';
    }
  };

  write();
}

function extensionMatch(fileName, allowed) {
  const lower = fileName.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext));
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
  progress.style.width = `${Math.min(100, ratio)}%`;
}

let seekThrottle = null;
function updateSeekDebounced(seek, progress, audio) {
  if (seekThrottle) return;
  seekThrottle = true;
  requestAnimationFrame(() => {
    updateSeekVisual(seek, progress, audio);
    setTimeout(() => { seekThrottle = null; }, 32);
  });
}

function preloadNextTrack(currentIndex) {
  const next = state.players[currentIndex + 1];
  if (!next) return;
  if (next.audio.currentTime > 0 || next.preloaded) return;
  next.audio.preload = "auto";
  if (next.audio.readyState < 2) next.audio.load();
  next.preloaded = true;
}

function updateSfxVolume(value) {
  state.masterVolume = Math.max(0, Math.min(1, value));
  if (state.humNodes?.master) {
    state.humNodes.master.gain.value = AUDIO_TUNING.humMasterGain * state.masterVolume;
  }
  state.players.forEach((player) => {
    player.audio.volume = state.masterVolume;
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
    renderEmpty(visualGrid, "Images not found in visuals folder.");
    return;
  }

  visualGrid.innerHTML = "";
  let cursor = 0;
  const batchSize = state.liteMode ? 8 : 16;

  const appendBatch = () => {
    const slice = files.slice(cursor, cursor + batchSize);
    slice.forEach((file) => {
      const button = document.createElement("button");
      button.className = "visual-item";
      button.type = "button";
      button.setAttribute("aria-label", `Open ${file.name}`);
      button.innerHTML = `<img src="${file.url}" alt="${file.name}" loading="lazy" decoding="async">`;
      button.addEventListener("click", () => openLightbox(file.url));
      visualGrid.appendChild(button);
    });
    cursor += slice.length;
    if (cursor >= files.length) {
      loadMoreButton.remove();
    }
  };

  const loadMoreButton = document.createElement("button");
  loadMoreButton.className = "load-more-visuals";
  loadMoreButton.type = "button";
  loadMoreButton.textContent = "[ LOAD MORE ]";
  loadMoreButton.addEventListener("click", appendBatch);

  appendBatch();
  if (cursor < files.length) {
    visualGrid.after(loadMoreButton);
  }
}

function setupLazyImageLoading() {
  if (!("IntersectionObserver" in window)) return;
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          imageObserver.unobserve(img);
        }
      }
    });
  }, { rootMargin: "200px" });

  document.querySelectorAll(".visual-item img[data-src]").forEach((img) => {
    imageObserver.observe(img);
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
      state.rerenderAscii?.();
      playUiClick();
    }
    if (state.keyBuffer.includes("lotus")) {
      document.body.classList.remove("easter-sever");
      statusLine.textContent = "EASTER MODE: LOTUS";
      state.rerenderAscii?.();
      playUiClick();
    }
  });
}

function setupAsciiVines() {
  const backdrop = document.getElementById("asciiVines");
  if (!backdrop) return;

  const motifs = {
    lotus: " --=<❀>=-- ",
    buttercup: " --‹( ✿ )›-- "
  };

  const renderPattern = () => {
    const motif = document.body.classList.contains("easter-sever") ? motifs.buttercup : motifs.lotus;
    
    const fontPx = Math.max(14, Math.min(18, window.innerWidth * 0.022));
    const charWidth = fontPx * 0.6;
    const charHeight = fontPx * 1.35;
    const patternWidth = motif.length * charWidth;
    
    const columns = Math.ceil(window.innerWidth / patternWidth) + 2;
    const rows = Math.ceil(window.innerHeight / charHeight) + 2;
    
    let result = "";
    for (let y = 0; y < rows; y += 1) {
      const offset = y % 2 === 0 ? "" : " ".repeat(3);
      const line = Array(columns).fill(motif).join(" ".repeat(2));
      result += `${offset}${line}\n`;
    }
    backdrop.textContent = result;
  };

  state.rerenderAscii = renderPattern;
  renderPattern();

  let resizeRaf = null;
  let resizeTimeout = null;
  window.addEventListener("resize", () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    
    resizeTimeout = setTimeout(() => {
      resizeRaf = requestAnimationFrame(() => {
        renderPattern();
        resizeRaf = null;
      });
    }, 300);
  });
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.section));
});

// Music sub-tabs
if (musicSubTabs) {
  musicSubTabs.querySelectorAll(".music-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      playUiClick();
      document.querySelectorAll(".music-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      loadMusicCategory(tab.dataset.category);
    });
  });
}

sfxToggle.addEventListener("click", () => {
  setSfxEnabled(!state.sfxEnabled);
  playUiClick();
});

masterVolumeRange?.addEventListener("input", () => {
  updateSfxVolume(Number(masterVolumeRange.value));
});

async function init() {
  state.liteMode = detectLiteMode();
  document.body.classList.toggle("lite-mode", state.liteMode);

  if (masterVolumeRange) {
    masterVolumeRange.value = String(AUDIO_TUNING.masterDefault);
  }
  updateSfxVolume(AUDIO_TUNING.masterDefault);
  
  setTab("logs");
  setupClipboardMentions();
  setupEasterEggs();
  setupAsciiVines();
  setupLazyImageLoading();
}

init();