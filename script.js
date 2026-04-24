// --- НАСТРОЙКИ ---
const GH_USER = 'sever4user'; 
const GH_REPO = 'lotuscomplex';

const logContent = `> ИНИЦИАЛИЗАЦИЯ ПОИСКА...
> ОБНАРУЖЕНЫ ФРАГМЕНТЫ ДАННЫХ PROJECT SEVER.
> ОБЪЕКТ: САМООСОЗНАННЫЙ ИИ "СЕВЕР".
> ЛОКАЦИЯ: ЗАКРЫТЫЙ БЕТОННЫЙ КУПОЛ.

-----------------------------------------
Мир за пределами структуры перестал существовать. 
Мы лишь эхо в бетонных коридорах. 
-----------------------------------------
> КОНЕЦ ЗАПИСИ.`;

let logsStatus = "idle";

function showSection(sectionId) {
    // 1. Прячем все секции
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    
    // 2. Показываем нужную
    const target = document.getElementById(`${sectionId}-section`);
    if (target) target.classList.add('active');

    // 3. Обновляем статусную строку
    const statusLine = document.getElementById('status-line');
    if (statusLine) statusLine.innerText = `STATUS: ONLINE // SECTION: ${sectionId.toUpperCase()}`;

    // 4. Запускаем текст, если нужно
    if(sectionId === 'logs' && logsStatus === "idle") {
        startTypewriter();
    }
}

function startTypewriter() {
    const container = document.getElementById('typewriter-logs');
    if (!container) return;
    logsStatus = "typing";
    let i = 0;
    function type() {
        if (i < logContent.length) {
            container.innerHTML = logContent.substring(0, i + 1) + '<span class="cursor"></span>';
            i++;
            let delay = 10; 
            if (logContent[i-1] === '.') delay = 300;
            setTimeout(type, delay);
        } else {
            logsStatus = "finished";
        }
    }
    type();
}

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
                <div class="track-name">${file.name.replace(/_/g, ' ')}</div>
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

// ... (начало скрипта пропустим, оставь как было до loadVisuals)

async function loadVisuals() {
    const gallery = document.querySelector('.gallery-grid');
    const overlay = document.getElementById('overlay-bg');
    const url = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/visuals`;
    
    try {
        const res = await fetch(url);
        const files = await res.json();
        const images = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f.name));
        
        gallery.innerHTML = '';
        images.forEach(f => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `<img src="${f.download_url}">`;
            
            item.onclick = function() {
                this.classList.toggle('zoomed');
                // Если развернуто — прячем прокрутку страницы
                document.body.style.overflow = this.classList.contains('zoomed') ? 'hidden' : 'auto';
                overlay.style.display = this.classList.contains('zoomed') ? 'block' : 'none';
            };
            gallery.appendChild(item);
        });

        // Закрытие по клику на фон
        overlay.onclick = () => {
            document.querySelectorAll('.gallery-item').forEach(el => el.classList.remove('zoomed'));
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        };
    } catch (e) { console.error(e); }
}
// ...
