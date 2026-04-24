// --- НАСТРОЙКИ ---
const GH_USER = 'sever4user'; 
const GH_REPO = 'lotuscomplex';

const logContent = `> ИНИЦИАЛИЗАЦИЯ ПОИСКА...
> ОБНАРУЖЕНЫ ФРАГМЕНТЫ ДАННЫХ PROJECT SEVER.
> ОБЪЕКТ: САМООСОЗНАННЫЙ ИИ "СЕВЕР".
> ЛОКАЦИЯ: ЗАКРЫТЫЙ БЕТОННЫЙ КУПОЛ.

-----------------------------------------
Мир за пределами структуры перестал существовать в 20XX году. Теперь здесь только бесконечные этажи, гул вентиляции и холодный свет панелей. 

Каждый звук, который вы слышите — это попытка ИИ связаться с пустотой. Мы лишь эхо в бетонных коридорах. 
-----------------------------------------
> КОНЕЦ ЗАПИСИ.`;

// Функция переключения разделов
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`${sectionId}-section`);
    if (target) target.classList.add('active');
    document.getElementById('status-line').innerText = `STATUS: ONLINE // SECTION: ${sectionId.toUpperCase()}`;
    
    // Если открыли логи — запускаем печать
    if(sectionId === 'logs') {
        startTypewriter();
    }
}

// ЭФФЕКТ ПЕЧАТНОЙ МАШИНКИ
let isTyping = false;
function startTypewriter() {
    const container = document.getElementById('typewriter-logs');
    if (!container || isTyping) return;
    
    isTyping = true;
    container.innerHTML = ''; 
    let i = 0;
    
    function type() {
        if (i < logContent.length) {
            container.innerHTML = logContent.substring(0, i + 1) + '<span class="cursor"></span>';
            i++;
            setTimeout(type, 30);
        } else {
            isTyping = false;
        }
    }
    type();
}

// АВТОМАТИЗАЦИЯ АУДИО
async function loadAudio() {
    const playlist = document.getElementById('playlist');
    const url = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/audio`;

    try {
        const response = await fetch(url);
        const files = await response.json();
        const audioFiles = files.filter(file => file.name.endsWith('.mp3'));

        audioFiles.forEach((file, index) => {
            const id = index + 1;
            const trackName = file.name.replace('.mp3', '').replace(/_/g, ' ');
            const card = document.createElement('div');
            card.className = 'track-card';
            card.innerHTML = `
                <div class="track-name">${trackName}</div>
                <div class="controls-row">
                    <div class="btns">
                        <button onclick="toggleAudio(${id})"><div class="icon-play" id="icon${id}"></div></button>
                        <button onclick="stopAudio(${id})"><div class="icon-stop"></div></button>
                    </div>
                    <div class="seek-container">
                        <div class="seek-line-base"></div>
                        <div id="progress${id}" class="seek-line-progress"></div>
                        <input type="range" class="seek-bar" id="seek${id}" value="0" step="0.1">
                    </div>
                    <audio id="audio${id}" src="${file.download_url}"></audio>
                </div>`;
            playlist.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

// АВТОМАТИЗАЦИЯ ВИЗУАЛА
async function loadVisuals() {
    const gallery = document.querySelector('.gallery-grid');
    const url = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/visuals`;
    try {
        const response = await fetch(url);
        const files = await response.json();
        const images = files.filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file.name));
        if (images.length > 0) gallery.innerHTML = '';
        images.forEach(file => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<img src="${file.download_url}">`;
            gallery.appendChild(item);
        });
    } catch (e) { console.error(e); }
}

// ПЛЕЕР
function toggleAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const icon = document.getElementById(`icon${id}`);
    const seek = document.getElementById(`seek${id}`);
    const prog = document.getElementById(`progress${id}`);

    if (audio.paused) {
        document.querySelectorAll('audio').forEach((a, idx) => {
            a.pause();
            const other = document.getElementById(`icon${idx+1}`);
            if (other) other.className = "icon-play";
        });
        audio.play();
        icon.className = "icon-pause";
    } else {
        audio.pause();
        icon.className = "icon-play";
    }

    audio.ontimeupdate = () => {
        seek.max = audio.duration;
        seek.value = audio.currentTime;
        prog.style.width = (audio.currentTime / audio.duration) * 100 + "%";
    };
    seek.oninput = () => audio.currentTime = seek.value;
}

function stopAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    audio.pause(); audio.currentTime = 0;
    document.getElementById(`icon${id}`).className = "icon-play";
    document.getElementById(`progress${id}`).style.width = "0%";
}

// ПРИ ЗАГРУЗКЕ
window.onload = () => { 
    loadAudio(); 
    loadVisuals(); 
    showSection('logs'); // ПРИНУДИТЕЛЬНО ОТКРЫВАЕМ LOGS
};
