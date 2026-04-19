const tracks = [
    { name: "PROJECT SEVER - CORE", file: "track1.mp3" },
    { name: "CONCRETE DREAMS", file: "track2.mp3" }
];

const playlist = document.getElementById('playlist');

// ГЕНЕРАЦИЯ ПЛЕЕРОВ
tracks.forEach((track, index) => {
    const id = index + 1;
    const card = document.createElement('div');
    card.className = 'track-card';
    card.innerHTML = `
        <div class="track-name">${track.name}</div>
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
            <audio id="audio${id}" src="audio/${track.file}"></audio>
        </div>
    `;
    playlist.appendChild(card);
});

// ПЕРЕКЛЮЧЕНИЕ СЕКЦИЙ
function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionName}-section`).classList.add('active');
    document.getElementById('status-line').innerText = `STATUS: ONLINE // SECTION: ${sectionName.toUpperCase()}`;
}

// ПЛЕЕР ЛОГИКА
function toggleAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const icon = document.getElementById(`icon${id}`);
    const seek = document.getElementById(`seek${id}`);
    const progress = document.getElementById(`progress${id}`);

    if (audio.paused) {
        document.querySelectorAll('audio').forEach((a, idx) => {
            if (a.id !== `audio${id}`) {
                a.pause();
                const otherIcon = document.getElementById(`icon${idx + 1}`);
                if (otherIcon) otherIcon.className = "icon-play";
            }
        });
        audio.play();
        icon.className = "icon-pause";
    } else {
        audio.pause();
        icon.className = "icon-play";
    }

    audio.ontimeupdate = () => {
        if (audio.duration) {
            seek.max = audio.duration;
            seek.value = audio.currentTime;
            progress.style.width = (audio.currentTime / audio.duration) * 100 + '%';
        }
    };
    seek.oninput = () => audio.currentTime = seek.value;
}

function stopAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    audio.pause();
    audio.currentTime = 0;
    document.getElementById(`icon${id}`).className = "icon-play";
    document.getElementById(`progress${id}`).style.width = '0%';
}
