const GH_USER = "sever4user";
const GH_REPO = "lotuscomplex";

const logsContent = {
  ru: `> BOOT SEQUENCE: LOTUS COMPLEX 
> NODE: AUTHOR PROFILE INITIALIZED

Я создаю аудиовизуальные миры на стыке музыки, 3D и narrative-эстетики.
Проект LOTUS COMPLEX - это персональный архив звуков и артефактов
> Вся информация на сайте предоставлена в ознакомительных целях

Другие проекты:
- sever4user // артсит, экспериментальная электроника
https://band.link/sever4user

> LOG STREAM READY`,
  en: `> BOOT SEQUENCE: LOTUS COMPLEX 
> NODE: AUTHOR PROFILE INITIALIZED

I create audio-visual worlds at the intersection of music, 3D and narrative aesthetics.
LOTUS COMPLEX project is a personal archive of sounds and artifacts
> All information on the site is for informational purposes only

Other projects:
- sever4user // artsit, experimental electronics
https://band.link/sever4user

> LOG STREAM READY`
};

const contactsContent = {
  ru: `
> SECURE CHANNEL OPEN

MAIL: 1o7uscomp13x@gmail.com
INST: @lotuscomplex
TG: @lotuscomplex

> AWAITING NEW CONNECTION...`,
  en: `
> SECURE CHANNEL OPEN

MAIL: 1o7uscomp13x@gmail.com
INST: @lotuscomplex
TG: @lotuscomplex

> AWAITING NEW CONNECTION...`
};

const tabButtons = [...document.querySelectorAll(".tab")];
const panels = [...document.querySelectorAll(".panel")];
const statusLine = document.getElementById("statusLine");
const sfxToggle = document.getElementById("sfxToggle");
const langToggle = document.getElementById("langToggle");
const masterVolumeRange = document.getElementById("masterVolumeRange");
const typed = { 
  logs: { ru: false, en: false }, 
  contacts: { ru: false, en: false }
};

let currentTyping = {
  logs: { ru: 0, en: 0, animId: null },
  contacts: { ru: 0, en: 0, animId: null }
};
const AUDIO_TUNING = {
  masterDefault: 0.62,
  clickPeak: 0.044,     // Громкость UI-кликов (умножь на 2 чтобы увеличить)
  humMasterGain: 2.88   // Громкость фонового шума (уменьши если слишком громко)
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
  currentLang: "ru"
};

function detectLiteMode() {
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const saveData = navigator.connection?.saveData === true;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  
  // Только для очень слабых устройств
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
  if (sectionId === "music" && !state.loadedSections.music) {
    state.loadedSections.music = true;
    await renderMusic();
  }
  if (sectionId === "visuals" && !state.loadedSections.visuals) {
    state.loadedSections.visuals = true;
    await renderVisuals();
  }
}

function setTab(sectionId) {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === sectionId);
  });
  statusLine.textContent = `STATUS: ONLINE // SECTION: ${sectionId.toUpperCase()} // LANG: ${state.currentLang.toUpperCase()}`;
  playUiClick();

  if (sectionId === "logs" && !typed.logs[state.currentLang]) {
    startTypewriter("logsTypewriter", logsContent[state.currentLang]);
    typed.logs[state.currentLang] = true;
  }
  if (sectionId === "contacts" && !typed.contacts[state.currentLang]) {
    startTypewriter("contactsTypewriter", contactsContent[state.currentLang]);
    typed.contacts[state.currentLang] = true;
  }

  // Обновляем видимость языков при переключении вкладки
  updateLanguageVisibility(sectionId);

  ensureSectionLoaded(sectionId).catch(() => {
    statusLine.textContent = "LOAD ERROR";
  });
}

function updateLanguageVisibility(sectionId) {
  const targetId = sectionId === "logs" ? "logsTypewriter" : "contactsTypewriter";
  const target = document.getElementById(targetId);
  if (!target) return;

  const langSpans = target.querySelectorAll('[data-lang]');
  langSpans.forEach(span => {
    const lang = span.getAttribute('data-lang');
    span.style.display = lang === state.currentLang ? "inline" : "none";
  });
  
  // Устанавливаем display для новых панелей
  if (sectionId === "logs" || sectionId === "contacts") {
    const ruSpan = target.querySelector('[data-lang="ru"]');
    const enSpan = target.querySelector('[data-lang="en"]');
    if (ruSpan) ruSpan.style.display = state.currentLang === "ru" ? "inline" : "none";
    if (enSpan) enSpan.style.display = state.currentLang === "en" ? "inline" : "none";
  }
}

function toggleLanguage() {
  state.currentLang = state.currentLang === "ru" ? "en" : "ru";
  
  const activePanel = document.querySelector(".panel.active");
  if (activePanel) {
    const sectionId = activePanel.id;
    updateLanguageVisibility(sectionId);
  }
  
  const currentSection = document.querySelector(".tab.active")?.dataset.section || "logs";
  statusLine.textContent = `STATUS: ONLINE // SECTION: ${currentSection.toUpperCase()} // LANG: ${state.currentLang.toUpperCase()}`;
  playUiClick();
}

function enhanceInteractiveText(target) {
  const ruSpan = target.querySelector('[data-lang="ru"]');
  const enSpan = target.querySelector('[data-lang="en"]');
  
  if (ruSpan) {
    const plain = ruSpan.textContent || "";
    // Сначала ссылки
    const withLinks = plain.replace(
      /(https?:\/\/[^\s]+|(?:github\.com|t\.me|instagram\.com|band\.link)\/[^\s]+)/gi,
      (match) => {
        const href = match.startsWith("http") ? match : `https://${match}`;
        return `<a class="inline-link" target="_blank" rel="noopener noreferrer" href="${href}">${match}</a>`;
      }
    );
    // Затем email (копируется по клику)
    const withEmail = withLinks.replace(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g,
      (match) => `<button type="button" class="copy-mention" data-copy="${match}">${match}</button>`
    );
    // Затем упоминания
    const withMentions = withEmail.replace(
      /(^|[\s(])(@[a-zA-Z0-9_а-яА-Я.-]+)/g,
      (full, prefix, mention) =>
        `${prefix}<button type="button" class="copy-mention" data-copy="${mention}">${mention}</button>`
    );
    ruSpan.innerHTML = withMentions;
  }
  
  if (enSpan) {
    const plain = enSpan.textContent || "";
    // Сначала ссылки
    const withLinks = plain.replace(
      /(https?:\/\/[^\s]+|(?:github\.com|t\.me|instagram\.com|band\.link)\/[^\s]+)/gi,
      (match) => {
        const href = match.startsWith("http") ? match : `https://${match}`;
        return `<a class="inline-link" target="_blank" rel="noopener noreferrer" href="${href}">${match}</a>`;
      }
    );
    // Затем email (копируется по клику)
    const withEmail = withLinks.replace(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g,
      (match) => `<button type="button" class="copy-mention" data-copy="${match}">${match}</button>`
    );
    // Затем упоминания
    const withMentions = withEmail.replace(
      /(^|[\s(])(@[a-zA-Z0-9_а-яА-Я.-]+)/g,
      (full, prefix, mention) =>
        `${prefix}<button type="button" class="copy-mention" data-copy="${mention}">${mention}</button>`
    );
    enSpan.innerHTML = withMentions;
  }
}

function startTypewriter(targetId, text) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const section = targetId === "logsTypewriter" ? "logs" : "contacts";
  currentTyping[section].ru = 0;
  currentTyping[section].en = 0;

  // Создаём контейнеры для каждого языка (убираем отступы)
  target.innerHTML = `
    <span data-lang="ru" class="lang-content"></span>
    <span data-lang="en" class="lang-content"></span>
  `;

  const langSpans = {
    ru: target.querySelector('[data-lang="ru"]'),
    en: target.querySelector('[data-lang="en"]')
  };

  const textRu = section === "logs" ? logsContent.ru : contactsContent.ru;
  const textEn = section === "logs" ? logsContent.en : contactsContent.en;

  const write = () => {
    let shouldContinue = false;
    
    // Печатаем русский
    if (currentTyping[section].ru < textRu.length) {
      langSpans.ru.textContent = textRu.slice(0, currentTyping[section].ru + 1);
      currentTyping[section].ru += 1;
      shouldContinue = true;
    }
    
    // Печатаем английский
    if (currentTyping[section].en < textEn.length) {
      langSpans.en.textContent = textEn.slice(0, currentTyping[section].en + 1);
      currentTyping[section].en += 1;
      shouldContinue = true;
    }

    if (shouldContinue) {
      // Добавляем курсор
      let cursor = target.querySelector('.cursor');
      if (!cursor) {
        cursor = document.createElement('span');
        cursor.className = 'cursor';
        target.appendChild(cursor);
      }
      currentTyping[section].animId = requestAnimationFrame(write);
    } else {
      // Оба текста завершены
      enhanceInteractiveText(target);
      const cursor = target.querySelector('.cursor');
      if (cursor) cursor.style.display = 'none';
    }
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

    seek.addEventListener("input", () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      audio.currentTime = Number(seek.value);
      updateSeekVisual(seek, progress, audio);
    });

    audio.addEventListener("timeupdate", () => {
      updateSeekDebounced(seek, progress, audio);
      if (audio.currentTime > 2 && !audio.ended) preloadNextTrack(index);
    });

    audio.addEventListener("ended", () => {
      playButton.classList.remove("is-playing");
      state.activeMusicCount = Math.max(0, state.activeMusicCount - 1);
      updateHumState();
      
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
    
    // Размер шрифта в пикселях (одинаковый для всех устройств)
    const fontPx = Math.max(14, Math.min(18, window.innerWidth * 0.022));
    
    // Ширина одного символа примерно 0.6 от размера шрифта
    const charWidth = fontPx * 0.6;
    const charHeight = fontPx * 1.35;
    
    // Длина паттерна в пикселях
    const patternWidth = motif.length * charWidth;
    
    // Вычисляем количество столбцов и строк для заполнения экрана
    const columns = Math.ceil(window.innerWidth / patternWidth) + 2;
    const rows = Math.ceil(window.innerHeight / charHeight) + 2;
    
    let result = "";
    for (let y = 0; y < rows; y += 1) {
      // Простое смещение: каждый второй ряд сдвинут
      const offset = y % 2 === 0 ? "" : " ".repeat(3);
      const line = Array(columns).fill(motif).join(" ".repeat(2));
      result += `${offset}${line}\n`;
    }
    backdrop.textContent = result;
  };

  state.rerenderAscii = renderPattern;
  renderPattern();

  // Только resize, без анимации
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

sfxToggle.addEventListener("click", () => {
  setSfxEnabled(!state.sfxEnabled);
  playUiClick();
});

langToggle.addEventListener("click", () => {
  toggleLanguage();
  langToggle.textContent = `LANG: ${state.currentLang.toUpperCase()}`;
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
