const GH_USER = "sever4user";
const GH_REPO = "sever4user";

const logsContent = `> welcome to the world of my creations!

i am a composer, sound designer, and visual artist who works at the intersection of technology and emotion. 
i have been creating music for over five years and am currently working on soundtracks for games (KLETKA, visual novels, and more), as well as learning 3D modeling.
here you can find my works and contact information.

> all content on this website is intended for informational purposes only.`;

const contactsContent = `> SECURE CHANNEL OPEN
MAIL: sever4user@gmail.com
INST: @sever4user
TG: @sever4user
AWAITING NEW CONNECTION...`;

const tabButtons = [...document.querySelectorAll(".tab[data-section]")];
const panels = [...document.querySelectorAll(".panel")];
const statusLine = document.getElementById("statusLine");
const sfxToggle = document.getElementById("sfxToggle");
const masterVolumeRange = document.getElementById("masterVolumeRange");
const musicSubTabs = document.getElementById("musicTabs");
const soundtrackDropdowns = document.getElementById("soundtrackDropdowns");
const logsSubTabs = document.getElementById("logsSubTabs");
const logsTabBtns = logsSubTabs ? [...logsSubTabs.querySelectorAll(".music-tab")] : [];

let currentTyping = { logs: { text: 0, animId: null }, contacts: { text: 0, animId: null } };

const AUDIO_TUNING = { masterDefault: 0.62, clickPeak: 0.044, humMasterGain: 2.88 };
const mediaExtensions = {
  audio: [".mp3", ".ogg", ".wav", ".m4a"],
  visuals: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]
};

const state = {
  sfxEnabled: false, audioCtx: null, humNodes: null,
  masterVolume: AUDIO_TUNING.masterDefault, liteMode: false,
  loadedSections: { music: false, visuals: false },
  typedSections: { logs: false, contacts: false },
  currentMusicCategory: "soundtracks"
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
  if (value) startTerminalHum();
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
  bass.type = "sine"; bass.frequency.value = 53; bassGain.gain.value = 0.0012;
  brownFilter.type = "lowshelf"; brownFilter.frequency.value = 190; brownFilter.gain.value = 9;
  lowpass.type = "lowpass"; lowpass.frequency.value = 520; lowpass.Q.value = 0.6;
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < bufferSize; i += 1) {
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.022 * white) / 1.015;
    data[i] = brown * 3.2;
  }
  noise.buffer = buffer; noise.loop = true; noiseGain.gain.value = 0.0042;
  master.gain.value = AUDIO_TUNING.humMasterGain * state.masterVolume;
  bass.connect(bassGain); bassGain.connect(master);
  noise.connect(noiseGain); noiseGain.connect(brownFilter);
  brownFilter.connect(lowpass); lowpass.connect(master);
  master.connect(ctx.destination);
  bass.start(); noise.start();
  state.humNodes = { noise, bass, master };
}

function stopTerminalHum() {
  if (!state.humNodes) return;
  state.humNodes.noise.stop();
  state.humNodes.bass.stop();
  state.humNodes = null;
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
    const coverSrc = encodeURI(release.cover);
    card.innerHTML = `
      <div class="own-music-cover"><img src="${coverSrc}" alt="${release.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:#1f2937;display:flex;align-items:center;justify-content:center;color:#58a6ff;font-size:10px\\'>NO COVER</div>'"></div>
      <div class="own-music-info"><h3 class="own-music-title">${release.title}</h3><a class="release-link streaming" href="${release.streamingUrl}" target="_blank" rel="noopener noreferrer">STREAMINGS</a></div>`;
    grid.appendChild(card);
  });
}

function renderProjects() {
  const grid = document.getElementById("projectsGrid");
  if (grid.children.length > 0) return;
  grid.innerHTML = "";

  projectsData.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = "project-card";
    card.style.opacity = "0";
    card.style.transform = "translateY(10px)";
    
    const tagsHtml = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    const linksHtml = project.links.map(link => `<a class="project-link" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label}</a>`).join('');

    card.innerHTML = `
      <div class="project-card-cover"><img src="${project.cover}" alt="${project.title}" loading="lazy" onerror="this.style.display='none'"></div>
      <div class="project-info">
        <h3 class="project-title">${project.title}</h3>
        <div class="project-meta"><span>${project.year}</span><span>|</span><span>${project.role}</span></div>
        <div class="project-tags">${tagsHtml}</div>
        <div class="project-desc">${project.desc}</div>
        <div class="project-links">${linksHtml}</div>
      </div>
    `;
    grid.appendChild(card);
    
    setTimeout(() => {
      card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, index * 100);
  });
}

function setTab(sectionId) {
  tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.section === sectionId));
  panels.forEach((panel) => panel.classList.toggle("active", panel.id === `${sectionId}Panel`));
  statusLine.textContent = `STATUS: ONLINE // SECTION: ${sectionId.toUpperCase()}`;
  playUiClick();

  if (sectionId === "logs") {
    logsSubTabs.style.display = "flex";
    musicSubTabs.style.display = "none";
    loadLogsTab("about");
  } else if (sectionId === "music") {
    logsSubTabs.style.display = "none";
    musicSubTabs.style.display = "flex";
    renderSoundtrackDropdowns();
    loadMusicCategory("soundtracks");
  } else {
    logsSubTabs.style.display = "none";
    musicSubTabs.style.display = "none";
  }

  if (sectionId === "logs" && !state.typedSections.logs) { state.typedSections.logs = true; startTypewriter("logsTypewriter"); }
  if (sectionId === "contacts" && !state.typedSections.contacts) { state.typedSections.contacts = true; startTypewriter("contactsTypewriter"); }
  if (sectionId === "visuals" && !state.loadedSections.visuals) { state.loadedSections.visuals = true; renderVisuals(); }
  
  ensureSectionLoaded(sectionId).catch(() => { statusLine.textContent = "LOAD ERROR"; });
}

function loadLogsTab(tab) {
  logsTabBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.logTab === tab));
  document.getElementById("aboutContent").classList.toggle("active", tab === "about");
  document.getElementById("projectsContent").classList.toggle("active", tab === "projects");
  
  if (tab === "about" && !state.typedSections.logs) {
    state.typedSections.logs = true;
    startTypewriter("logsTypewriter");
  } else if (tab === "projects") {
    renderProjects();
  }
}

function loadMusicCategory(category) {
  state.currentMusicCategory = category;
  document.getElementById("soundtracksSection").style.display = category === "soundtracks" ? "block" : "none";
  document.getElementById("ownMusicSection").style.display = category === "ownmusic" ? "block" : "none";
  if (category === "ownmusic") renderOwnMusic();
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function renderSoundtrackDropdowns() {
  if (soundtrackDropdowns.children.length > 0) return;
  const categoryPromises = Object.entries(soundtrackCategories).map(async ([key, { name, folder }]) => {
    const files = await resolveFiles(folder);
    return { key, name, files };
  });
  const results = await Promise.all(categoryPromises);

  results.forEach(({ key, name, files }, index) => {
    const dropdown = document.createElement("div");
    dropdown.className = "soundtrack-dropdown";
    dropdown.dataset.category = key;

    const header = document.createElement("button");
    header.className = "dropdown-header";
    header.innerHTML = `<span>[ ▶ ${name} ]</span>`;

    const content = document.createElement("div");
    content.className = "dropdown-content";
    const contentInner = document.createElement("div");
    contentInner.className = "dropdown-content-inner";

    if (!files.length) {
      contentInner.innerHTML = `<p class="empty">No tracks found.</p>`;
    } else {
      files.forEach(file => {
        const card = document.createElement("article");
        card.className = "track";
        card.innerHTML = `
          <p class="track-title">${file.name}</p>
          <div class="track-controls">
            <div class="track-btns">
              <button type="button" class="track-btn play-btn" aria-label="Play"></button>
              <button type="button" class="track-btn stop-btn" aria-label="Stop"></button>
            </div>
            <div class="seek-wrap">
              <input class="seek" type="range" min="0" max="100" step="0.01" value="0" aria-label="Seek">
              <span class="track-time">0:00 / 0:00</span>
            </div>
          </div>
          <audio preload="metadata" controlslist="nodownload noplaybackrate" crossorigin="anonymous"></audio>`;

        const audio = card.querySelector("audio");
        const playBtn = card.querySelector(".play-btn");
        const stopBtn = card.querySelector(".stop-btn");
        const seek = card.querySelector(".seek");
        const timeEl = card.querySelector(".track-time");

        audio.src = file.url;
        audio.volume = state.masterVolume;

        playBtn.addEventListener("click", async () => {
          playUiClick();
          if (audio.paused) {
            document.querySelectorAll("audio").forEach(aud => {
              if (aud !== audio) {
                aud.pause();
                aud.closest(".track")?.querySelector(".play-btn")?.classList.remove("is-playing");
              }
            });
            try { await audio.play(); playBtn.classList.add("is-playing"); } catch { playBtn.classList.remove("is-playing"); }
          } else {
            audio.pause();
            playBtn.classList.remove("is-playing");
          }
        });

        stopBtn.addEventListener("click", () => {
          playUiClick();
          audio.pause();
          audio.currentTime = 0;
          playBtn.classList.remove("is-playing");
          seek.value = "0";
          timeEl.textContent = "0:00 / 0:00";
        });

        seek.addEventListener("input", () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            audio.currentTime = Number(seek.value);
          }
        });

        const updateUI = () => {
          if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
          seek.max = String(audio.duration);
          seek.value = String(audio.currentTime);
          timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        };

        audio.addEventListener("timeupdate", updateUI);
        audio.addEventListener("loadedmetadata", updateUI);
        audio.addEventListener("play", () => playBtn.classList.add("is-playing"));
        audio.addEventListener("pause", () => playBtn.classList.remove("is-playing"));

        contentInner.appendChild(card);
      });
    }

    content.appendChild(contentInner);
    header.addEventListener("click", () => {
      playUiClick();
      const isOpen = header.classList.toggle("active");
      header.innerHTML = `<span>[ ${isOpen ? "▼" : "▶"} ${name} ]</span>`;
      content.classList.toggle("open", isOpen);
    });

    dropdown.appendChild(header);
    dropdown.appendChild(content);
    soundtrackDropdowns.appendChild(dropdown);
    setTimeout(() => dropdown.classList.add("visible"), index * 80);
  });
}

function enhanceInteractiveText(target) {
  const plain = target.textContent || "";
  const withLinks = plain.replace(
    /(https?:\/\/[^\s]+|(?:github\.com|t\.me|instagram\.com|band\.link)\/[^\s]+)/gi,
    (match) => `<a class="inline-link" target="_blank" rel="noopener noreferrer" href="${match.startsWith("http") ? match : `https://${match}`}">${match}</a>`
  );
  const withEmail = withLinks.replace(
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g,
    (match) => `<button type="button" class="copy-mention" data-copy="${match}">${match}</button>`
  );
  target.innerHTML = withEmail.replace(/(^|[\s(])(@[a-zA-Z0-9_.-]+)/g, (full, prefix, mention) => `${prefix}<button type="button" class="copy-mention" data-copy="${mention}">${mention}</button>`);
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
      const c = target.querySelector('.cursor');
      target.textContent = text.slice(0, currentTyping[section].text + 1);
      target.appendChild(c);
      currentTyping[section].text += 1;
      currentTyping[section].animId = requestAnimationFrame(write);
    } else {
      enhanceInteractiveText(target);
      const fc = target.querySelector('.cursor');
      if (fc) fc.style.display = 'none';
    }
  };
  write();
}

function extensionMatch(fileName, allowed) {
  const lower = fileName.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext));
}

async function listRepoFolderByApi(folder) {
  const response = await fetch(`https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/${folder}`, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.filter(e => e.type === "file").map(e => ({
    name: e.name,
    url: e.download_url || `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/main/${folder}/${e.name}`
  }));
}

async function resolveFiles(folder) {
  const files = await listRepoFolderByApi(folder);
  const ext = folder.startsWith("visuals") ? mediaExtensions.visuals : mediaExtensions.audio;
  return files.filter(f => extensionMatch(f.name, ext));
}

function updateSfxVolume(value) {
  state.masterVolume = Math.max(0, Math.min(1, value));
  if (state.humNodes?.master) state.humNodes.master.gain.value = AUDIO_TUNING.humMasterGain * state.masterVolume;
  document.querySelectorAll("audio").forEach(a => a.volume = state.masterVolume);
}

function configureLightbox() {
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImage");
  const close = () => { lb.classList.remove("active"); lb.setAttribute("aria-hidden", "true"); img.src = ""; document.body.style.overflow = ""; };
  document.getElementById("closeLightbox").addEventListener("click", close);
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  return (url) => { img.src = url; lb.classList.add("active"); lb.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; };
}

async function renderVisuals() {
  const grid = document.getElementById("visualGrid");
  const files = await resolveFiles("visuals");
  const openLb = configureLightbox();
  if (!files.length) { grid.innerHTML = `<p class="empty">Images not found in visuals folder.</p>`; return; }
  grid.innerHTML = "";
  let cursor = 0;
  const batchSize = state.liteMode ? 8 : 16;
  const append = () => {
    const slice = files.slice(cursor, cursor + batchSize);
    slice.forEach(f => {
      const btn = document.createElement("button");
      btn.className = "visual-item"; btn.type = "button"; btn.setAttribute("aria-label", `Open ${f.name}`);
      btn.innerHTML = `<img src="${f.url}" alt="${f.name}" loading="lazy" decoding="async">`;
      btn.addEventListener("click", () => openLb(f.url));
      grid.appendChild(btn);
    });
    cursor += slice.length;
    if (cursor >= files.length) loadMore.remove();
  };
  const loadMore = document.createElement("button");
  loadMore.className = "load-more-visuals"; loadMore.type = "button"; loadMore.textContent = "[ LOAD MORE ]";
  loadMore.addEventListener("click", append);
  append();
  if (cursor < files.length) grid.after(loadMore);
}

function setupLazyImageLoading() {
  if (!("IntersectionObserver" in window)) return;
  const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.src = e.target.dataset.src; obs.unobserve(e.target); } }), { rootMargin: "200px" });
  document.querySelectorAll(".visual-item img[data-src]").forEach(img => obs.observe(img));
}

function setupClipboardMentions() {
  document.addEventListener("click", async (e) => {
    const t = e.target.closest(".copy-mention");
    if (!t) return;
    const val = t.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(val);
      statusLine.textContent = `COPIED TO CLIPBOARD: ${val}`;
      setTimeout(() => { const a = document.querySelector(".tab.active")?.dataset.section || "logs"; statusLine.textContent = `STATUS: ONLINE // SECTION: ${a.toUpperCase()}`; }, 1200);
    } catch { statusLine.textContent = "CLIPBOARD ACCESS BLOCKED"; }
  });
}

function setupAsciiVines() {
  const backdrop = document.getElementById("asciiVines");
  if (!backdrop) return;
  const motif = " --=<❀>=-- ";
  const render = () => {
    const font = Math.max(14, Math.min(18, window.innerWidth * 0.022));
    const cw = font * 0.6, ch = font * 1.35, pw = motif.length * cw;
    const cols = Math.ceil(window.innerWidth / pw) + 2, rows = Math.ceil(window.innerHeight / ch) + 2;
    let res = "";
    for (let y = 0; y < rows; y++) res += `${y % 2 === 0 ? "" : "   "}${Array(cols).fill(motif).join("  ")}\n`;
    backdrop.textContent = res;
  };
  render();
  let raf = null, t = null;
  window.addEventListener("resize", () => { clearTimeout(t); if (raf) cancelAnimationFrame(raf); t = setTimeout(() => { raf = requestAnimationFrame(() => { render(); raf = null; }); }, 300); });
}

// Инициализация событий
tabButtons.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.section)));
logsTabBtns.forEach(btn => btn.addEventListener("click", () => { playUiClick(); loadLogsTab(btn.dataset.logTab); }));

if (musicSubTabs) {
  musicSubTabs.querySelectorAll(".music-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      playUiClick();
      document.querySelectorAll("#musicTabs .music-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      loadMusicCategory(tab.dataset.category);
    });
  });
}

sfxToggle.addEventListener("click", () => { setSfxEnabled(!state.sfxEnabled); playUiClick(); });

if (masterVolumeRange) {
  masterVolumeRange.style.setProperty('--progress', `${Number(masterVolumeRange.value) * 100}%`);
  masterVolumeRange.addEventListener("input", () => {
    updateSfxVolume(Number(masterVolumeRange.value));
    masterVolumeRange.style.setProperty('--progress', `${Number(masterVolumeRange.value) * 100}%`);
  });
}

const volShell = document.querySelector(".master-volume-shell");
const volPop = document.querySelector(".master-volume-pop");
let volTimer = null;
if (volShell && volPop) {
  const show = () => { clearTimeout(volTimer); volPop.classList.add("active"); };
  const hide = () => { clearTimeout(volTimer); volTimer = setTimeout(() => volPop.classList.remove("active"), 1000); };
  volShell.addEventListener("mouseenter", show); volShell.addEventListener("mouseleave", hide);
  volPop.addEventListener("mouseenter", show); volPop.addEventListener("mouseleave", hide);
}

async function init() {
  state.liteMode = detectLiteMode();
  document.body.classList.toggle("lite-mode", state.liteMode);
  if (masterVolumeRange) masterVolumeRange.value = String(AUDIO_TUNING.masterDefault);
  updateSfxVolume(AUDIO_TUNING.masterDefault);
  setTab("logs");
  setupClipboardMentions();
  setupAsciiVines();
  setupLazyImageLoading();
}

init();
