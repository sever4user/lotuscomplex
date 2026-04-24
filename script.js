// --- КОНФИГУРАЦИЯ ---
const GH_USER = 'sever4user'; 
const GH_REPO = 'lotuscomplex';

const logContent = `> ИНИЦИАЛИЗАЦИЯ ПОИСКА...
> ОБНАРУЖЕНЫ ФРАГМЕНТЫ ДАННЫХ PROJECT SEVER.
> ОБЪЕКТ: САМООСОЗНАННЫЙ ИИ "СЕВЕР".
> ЛОКАЦИЯ: ЗАКРЫТЫЙ БЕТОННЫЙ КУПОЛ.

-----------------------------------------
Мир за пределами структуры перестал существовать. 
Мы лишь эхо в бетонных коридорах. 

Каждый звук — это попытка связи. 
Каждый кадр — это фрагмент памяти.
-----------------------------------------
> КОНЕЦ ЗАПИСИ.`;

const contactContent = `> УСТАНОВКА СОЕДИНЕНИЯ...
> КАНАЛ СВЯЗИ ОТКРЫТ.

TG: @твой_ник
MAIL: contact@sever.com

STATUS: WAITING_FOR_RESPONSE...`;

let typedSections = { logs: false, contacts: false };

// --- ПЕРЕКЛЮЧЕНИЕ СЕКЦИЙ ---
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`${sectionId}-section`);
    if (target) target.classList.add('active');

    document.getElementById('status-line').innerText = `STATUS: ONLINE // SECTION: ${sectionId.toUpperCase()}`;

    // Печать для Логов
    if(sectionId === 'logs' && !typedSections.logs) {
        startTypewriter('typewriter-logs', logContent);
        typedSections.logs = true;
    }
    // Печать для Контактов
    if(sectionId === 'contacts' && !typedSections.contacts) {
        startTypewriter('contact-data', contactContent);
        typedSections.contacts = true;
    }
}

// --- ЭФФЕКТ ПЕЧАТИ ---
function startTypewriter(elementId, text) {
    const container = document.getElementById(elementId);
    if (!container) return;
    let i = 0;
    container.textContent = "";

    function type() {
        if (i < text.length) {
            container.textContent = text.substring(0, i + 1);
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            container.appendChild(cursor);
            i++;
            // Задержки для атмосферности
            let delay = (text[i-1] === '.' || text[i-1] === ':') ? 400 : 25;
            if (text[i-1] === '\n') delay = 150;
            setTimeout(type, delay);
        }
    }
    type();
}

// --- МУЗЫКАЛЬНЫЙ ПЛЕЕР ---
async function loadAudio() {
    const playlist = document.getElementById('playlist');
    const url = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/audio`;
    
    try {
        const res = await fetch(url);
        const files = await res.json();
        const audios = files.filter(f => f.name.endsWith('.mp3') || f.name.endsWith('.ogg'));
        
        audios.forEach((file, index) => {
            const id = index + 1;
            const card = document.createElement('div');
            card.className = 'track-card';
            card.innerHTML = `
                <div class="track-name">${file.name.replace(/_/g, ' ').replace('.mp3', '')}</div>
                <div class="controls-row">
                    <div class="btns">
                        <button onclick="toggleAudio(${id})"><div class="icon-play" id="icon${id}"></div></button>
                        <button onclick="stopAudio(${id})"><div class="icon-stop"></div></button>
                    </div>
                    <div class="seek-container">
                        <div class="seek-line-base"></div>
                        <div id="progress${id}" class="seek-line-progress"></div>
                        <input type="range" class="seek-bar" id="seek${id}" value="0" step="0.1" min="0">
                    </div>
                    <audio id="audio${id}" src="${file.download_url}" preload="metadata"></audio>
                </div>`;
            playlist.appendChild(card);
            
            const audio = document.getElementById(`audio${id}`);
            const seek = document.getElementById(`seek${id}`);
            const prog = document.getElementById(`progress${id}`);

            // Обновление прогресса при проигрывании
            audio.ontimeupdate = () => {
                if (!isNaN(audio.duration)) {
                    seek.max = audio.duration;
                    seek.value = audio.currentTime;
                    const percent = (audio.currentTime / audio.duration) * 100;
                    prog.style.width = percent + "%";
                }
            };

            // Перемотка
            seek.oninput = () => {
                audio.currentTime = seek.value;
                const percent = (seek.value / audio.duration) * 100;
                prog.style.width = percent + "%";
            };
        });
    } catch (e) { console.error("Audio Load Error:", e); }
}

function toggleAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const icon = document.getElementById(`icon${id}`);

    if (audio.paused) {
        // Ставим на паузу все остальные треки
        document.querySelectorAll('audio').forEach(a => a.pause());
        document.querySelectorAll('[id^="icon"]').forEach(i => i.className = 'icon-play');
        
        audio.play();
        icon.className = "icon-pause";
    } else {
        audio.pause();
        icon.className = "icon-play";
    }
}

function stopAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    audio.pause();
    audio.currentTime = 0;
    document.getElementById(`icon${id}`).className = "icon-play";
    document.getElementById(`progress${id}`).style.width = "0%";
}

// --- ГАЛЕРЕЯ ---
async function loadVisuals() {
    const gallery = document.querySelector('.gallery-grid');
    const overlay = document.getElementById('overlay-bg');
    const url = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/visuals`;
    
    try {
        const res = await fetch(url);
        const files = await res.json();
        const images = files.filter(f => /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name));
        
        gallery.innerHTML = '';
        images.forEach(f => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<img src="${f.download_url}" loading="lazy">`;
            
            item.onclick = function() {
                const isZoomed = this.classList.toggle('zoomed');
                overlay.style.display = isZoomed ? 'block' : 'none';
                document.body.style.overflow = isZoomed ? 'hidden' : 'auto';
            };
            gallery.appendChild(item);
        });

        overlay.onclick = () => {
            document.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('zoomed'));
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    } catch (e) { console.error("Visuals Load Error:", e); }
}

// Инициализация системы
window.onload = () => {
    loadAudio();
    loadVisuals();
    showSection('logs');
};
