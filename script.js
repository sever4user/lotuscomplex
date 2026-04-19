const tracks = [
    { name: "PROJECT SEVER - CORE", file: "track1.mp3" },
    { name: "CONCRETE DREAMS", file: "track2.mp3" }
];

const playlist = document.getElementById('playlist');

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
            <input type="range" class="seek-bar" id="seek${id}" value="0" step="0.1">
            <audio id="audio${id}" src="audio/${track.file}"></audio>
        </div>
    `;
    playlist.appendChild(card);
});

function toggleAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const btn = document.getElementById(`toggle${id}`);
    const seek = document.getElementById(`seek${id}`);

    if (audio.paused) {
        // Останавливаем все остальные перед включением
        document.querySelectorAll('audio').forEach((a, idx) => {
            if (a.id !== `audio${id}`) {
                a.pause();
                document.getElementById(`toggle${idx + 1}`).innerText = "▶";
            }
        });

        audio.play();
        btn.innerText = "Ⅱ"; // Меняем на паузу
    } else {
        audio.pause();
        btn.innerText = "▶"; // Меняем на плей
    }

    audio.ontimeupdate = () => {
        seek.max = audio.duration;
        seek.value = audio.currentTime;
    };

    seek.oninput = () => { audio.currentTime = seek.value; };
}

function stopAudio(id) {
    const audio = document.getElementById(`audio${id}`);
    const btn = document.getElementById(`toggle${id}`);
    audio.pause();
    audio.currentTime = 0;
    btn.innerText = "▶";
}

document.addEventListener('contextmenu', e => e.preventDefault());
