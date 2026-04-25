const logsContent = `> BOOT SEQUENCE: LOTUS COMPLEX
> NODE: AUTHOR PROFILE INITIALIZED

Я создаю аудиовизуальные миры на стыке 3D, музыки и narrative-эстетики.
Проект LOTUS COMPLEX - это персональный архив артефактов, звука и кода.

Другие проекты:
- SEVER SIGNALS // экспериментальные саунд-капсулы
- CONCRETE DOME // серия 3D-сцен
- ECHO FRAME // визуальные исследования материалов

> LOG STREAM READY`;

const contactsContent = `> SECURE CHANNEL OPEN

TG: @your_nickname
MAIL: hello@lotuscomplex.art
INST: @lotuscomplex
GITHUB: github.com/your_account

> AWAITING NEW CONNECTION...`;

const tabButtons = [...document.querySelectorAll(".tab")];
const panels = [...document.querySelectorAll(".panel")];
const statusLine = document.getElementById("statusLine");
const typed = { logs: false, contacts: false };

const mediaExtensions = {
  audio: [".mp3", ".ogg", ".wav", ".m4a"],
  visuals: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]
};

function setTab(sectionId) {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === sectionId);
  });

  statusLine.textContent = `STATUS: ONLINE // SECTION: ${sectionId.toUpperCase()}`;

  if (sectionId === "logs" && !typed.logs) {
    startTypewriter("logsTypewriter", logsContent);
    typed.logs = true;
  }
  if (sectionId === "contacts" && !typed.contacts) {
    startTypewriter("contactsTypewriter", contactsContent);
    typed.contacts = true;
  }
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
      let delay = 16;
      if (previousChar === "\n") delay = 110;
      if (previousChar === "." || previousChar === ":" || previousChar === "-") delay = 140;
      setTimeout(write, delay);
    }
  };

  write();
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.section));
});

function deriveGithubContext() {
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname.split("/").filter(Boolean);

  if (host.endsWith(".github.io")) {
    const owner = host.replace(".github.io", "");
    const repo = path[0] || `${owner}.github.io`;
    return { owner, repo };
  }
  return null;
}

async function listRepoFolderByApi(folder) {
  const gh = deriveGithubContext();
  if (!gh) return [];

  const apiUrl = `https://api.github.com/repos/${gh.owner}/${gh.repo}/contents/${folder}`;
  const response = await fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) return [];

  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter((entry) => entry.type === "file")
    .map((entry) => ({ name: entry.name, url: entry.download_url || `${folder}/${entry.name}` }));
}

async function loadManifest(manifestPath) {
  try {
    const res = await fetch(manifestPath, { cache: "no-store" });
    if (!res.ok) return [];
    const list = await res.json();
    if (!Array.isArray(list)) return [];
    return list.map((item) => String(item));
  } catch (error) {
    return [];
  }
}

function extensionMatch(file, allowed) {
  const lower = file.toLowerCase();
  return allowed.some((ext) => lower.endsWith(ext));
}

function formatTrackName(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

async function resolveFiles(folder) {
  const manifestName = folder === "audio" ? "tracks.json" : "images.json";
  const fromManifest = await loadManifest(`${folder}/${manifestName}`);

  if (fromManifest.length > 0) {
    return fromManifest
      .filter((file) => extensionMatch(file, mediaExtensions[folder]))
      .map((file) => ({ name: file, url: `${folder}/${file}` }));
  }

  const fromApi = await listRepoFolderByApi(folder);
  return fromApi.filter((file) => extensionMatch(file.name, mediaExtensions[folder]));
}

function renderEmpty(target, text) {
  target.innerHTML = `<p class="empty">${text}</p>`;
}

async function renderMusic() {
  const musicList = document.getElementById("musicList");
  const files = await resolveFiles("audio");

  if (!files.length) {
    renderEmpty(
      musicList,
      "Треки не найдены. Добавьте аудио-файлы в папку audio или создайте audio/tracks.json с массивом имён файлов."
    );
    return;
  }

  musicList.innerHTML = "";
  for (const file of files) {
    const card = document.createElement("article");
    card.className = "track";

    const title = document.createElement("p");
    title.className = "track-title";
    title.textContent = `> ${formatTrackName(file.name)}`;

    const player = document.createElement("audio");
    player.src = file.url;
    player.controls = true;
    player.controlsList = "nodownload noplaybackrate";
    player.preload = "metadata";

    card.append(title, player);
    musicList.appendChild(card);
  }
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
    renderEmpty(
      visualGrid,
      "Изображения не найдены. Добавьте файлы в папку visuals или создайте visuals/images.json с массивом имён файлов."
    );
    return;
  }

  visualGrid.innerHTML = "";
  for (const file of files) {
    const button = document.createElement("button");
    button.className = "visual-item";
    button.type = "button";
    button.setAttribute("aria-label", `Open ${file.name}`);

    const img = document.createElement("img");
    img.src = file.url;
    img.alt = file.name;
    img.loading = "lazy";
    button.appendChild(img);
    button.addEventListener("click", () => openLightbox(file.url));

    visualGrid.appendChild(button);
  }
}

async function init() {
  setTab("logs");
  await Promise.all([renderMusic(), renderVisuals()]);
}

init();
