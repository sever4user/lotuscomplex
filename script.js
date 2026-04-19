// СПИСОК ТРЕКОВ: просто добавляй сюда новые объекты
const tracks = [
    { name: "PROJECT SEVER - CORE", file: "track1.mp3" },
    { name: "CONCRETE DREAMS", file: "track2.mp3" },
    { name: "INDUSTRIAL LOTUS", file: "track3.mp3" }
];

const playlist = document.getElementById('playlist');

// Функция создания плееров
tracks.forEach((track, index) => {
    const id = index + 1;
    const card = document.createElement('div');
    card.className = 'track-card';
    card.innerHTML = `
        <div class="track-name">${track.name}</div>
        <div class="controls-row">
            <div class="btns">
                <button onclick="playAudio(${id})">▶</button>
                <button onclick="pauseAudio(${id})">Ⅱ</button>
                <button class="btn-stop" onclick="stopAudio(${id})">■</button>
            </div>
            <input type="range" class="seek-bar" id="seek${id}" value="0" step="0.1">
            <audio id="audio${id}" src="audio/${track.file}"></audio>
        </div>
    `;
    playlist.appendChild(card);
});

function playAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const seek = document.getElementById(`seek${id}`);
    
    // Остановить другие
    document.querySelectorAll('audio').forEach(a => { if(a.id !== `audio${id}`) a.pause(); });

    audio.play();

    audio.ontimeupdate = () => {
        seek.max = audio.duration;
        seek.value = audio.currentTime;
    };

    seek.oninput = () => { audio.currentTime = seek.value; };
}

function pauseAudio(id) {
    document.getElementById(`audio${id}`).pause();
}

function stopAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    audio.pause();
    audio.currentTime = 0; // Сброс в начало
}

document.addEventListener('contextmenu', e => e.preventDefault());
