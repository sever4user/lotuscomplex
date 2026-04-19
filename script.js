// 1. СПИСОК ТРЕКОВ
// Просто добавляй сюда новые строки, когда появятся новые файлы в папке audio
const tracks = [
    { name: "PROJECT SEVER - CORE", file: "track1.mp3" },
    { name: "CONCRETE DREAMS", file: "track2.mp3" }
];

const playlist = document.getElementById('playlist');

// 2. ГЕНЕРАЦИЯ ПЛЕЕРОВ НА СТРАНИЦЕ
tracks.forEach((track, index) => {
    const id = index + 1;
    const card = document.createElement('div');
    card.className = 'track-card';
    card.innerHTML = `
        <div class="track-name">${track.name}</div>
        <div class="controls-row">
            <div class="btns">
                <button id="btn-toggle${id}" onclick="toggleAudio(${id})">
                    <div class="icon-play" id="icon${id}"></div>
                </button>
                <button onclick="stopAudio(${id})">
                    <div class="icon-stop"></div>
                </button>
            </div>
            <div class="seek-container">
                <div class="seek-line-base"></div>
                <div id="progress${id}" class="seek-line-progress"></div>
                <input type="range" class="seek-bar" id="seek${id}" value="0" step="0.1">
            </div>
            <audio id="audio${id}" src="audio/${track.file}"></audio>
        </div>
    `;
    playlist.appendChild(card);
});

// 3. ЛОГИКА ИГРЫ / ПАУЗЫ
function toggleAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const icon = document.getElementById(`icon${id}`);
    const seek = document.getElementById(`seek${id}`);
    const progress = document.getElementById(`progress${id}`);

    if (audio.paused) {
        // Остановка всех остальных треков
        document.querySelectorAll('audio').forEach((a, idx) => {
            const otherId = idx + 1;
            if (a.id !== `audio${id}`) {
                a.pause();
                // Возвращаем иконку Play всем остальным
                const otherIcon = document.getElementById(`icon${otherId}`);
                if (otherIcon) otherIcon.className = "icon-play";
            }
        });

        audio.play();
        icon.className = "icon-pause"; // Меняем вид на Паузу
    } else {
        audio.pause();
        icon.className = "icon-play"; // Меняем вид на Плей
    }

    // Обновление ползунка и линии при проигрывании
    audio.ontimeupdate = () => {
        if (audio.duration) {
            seek.max = audio.duration;
            seek.value = audio.currentTime;
            const pct = (audio.currentTime / audio.duration) * 100;
            progress.style.width = pct + '%';
        }
    };

    // Перемотка пальцем/мышкой
    seek.oninput = () => {
        audio.currentTime = seek.value;
    };
}

// 4. ЛОГИКА СТОПА
function stopAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const icon = document.getElementById(`icon${id}`);
    const progress = document.getElementById(`progress${id}`);
    const seek = document.getElementById(`seek${id}`);

    audio.pause();
    audio.currentTime = 0;
    
    // Сбрасываем визуал
    icon.className = "icon-play";
    progress.style.width = '0%';
    seek.value = 0;
}

// Защита: отключаем контекстное меню
document.addEventListener('contextmenu', e => e.preventDefault());
