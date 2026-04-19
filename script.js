// СПИСОК ТРЕКОВ
const tracks = [
    { name: "PROJECT SEVER - CORE", file: "track1.mp3" },
    { name: "CONCRETE DREAMS", file: "track2.mp3" }
];

const playlist = document.getElementById('playlist');

// Функция создания плееров (обновленная структура HTML внутри)
tracks.forEach((track, index) => {
    const id = index + 1;
    const card = document.createElement('div');
    card.className = 'track-card';
    card.innerHTML = `
        <div class="track-name">${track.name}</div>
        <div class="controls-row">
            <div class="btns">
                <button id="toggle${id}" onclick="toggleAudio(${id})">▶</button>
                <button onclick="stopAudio(${id})">■</button>
            </div>
            <div class="seek-container">
                <div class="seek-line-base"></div> <div id="progress${id}" class="seek-line-progress"></div> <input type="range" class="seek-bar" id="seek${id}" value="0" step="0.1">
            </div>
            <audio id="audio${id}" src="audio/${track.file}"></audio>
        </div>
    `;
    playlist.appendChild(card);
});

function toggleAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const btn = document.getElementById(`toggle${id}`);
    const seek = document.getElementById(`seek${id}`);
    const progress = document.getElementById(`progress${id}`); // Находим линию прогресса

    if (audio.paused) {
        // Остановить другие
        document.querySelectorAll('audio').forEach((a, idx) => {
            if (a.id !== `audio${id}`) {
                a.pause();
                document.getElementById(`toggle${idx + 1}`).innerText = "▶";
                // Сбрасываем линии прогресса других треков
                const otherProgress = document.getElementById(`progress${idx+1}`);
                if (otherProgress) otherProgress.style.width = '0%';
            }
        });

        audio.play();
        btn.innerText = "Ⅱ";
    } else {
        audio.pause();
        btn.innerText = "▶";
    }

    audio.ontimeupdate = () => {
        if (audio.duration) {
            seek.max = audio.duration;
            seek.value = audio.currentTime;
            
            // ОБНОВЛЕНИЕ ЛИНИИ ПРОГРЕССА В %
            const pct = (audio.currentTime / audio.duration) * 100;
            progress.style.width = pct + '%';
        }
    };

    seek.oninput = () => { audio.currentTime = seek.value; };
}

function stopAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const btn = document.getElementById(`toggle${id}`);
    const progress = document.getElementById(`progress${id}`);
    
    audio.pause();
    audio.currentTime = 0;
    btn.innerText = "▶";
    
    // СБРОС ЛИНИИ ПРОГРЕССА
    progress.style.width = '0%';
}

document.addEventListener('contextmenu', e => e.preventDefault());
