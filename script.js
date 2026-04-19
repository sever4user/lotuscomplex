let currentInterval;

function playTrack(audioId, seekId) {
    const player = document.getElementById(audioId);
    const seekBar = document.getElementById(seekId);

    // Останавливаем все остальные треки
    document.querySelectorAll('audio').forEach(audio => {
        if (audio.id !== audioId) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    clearInterval(currentInterval);

    player.play();

    // Синхронизация ползунка со звуком
    player.onloadedmetadata = () => {
        seekBar.max = player.duration;
    };

    currentInterval = setInterval(() => {
        seekBar.value = player.currentTime;
    }, 500);

    // Перемотка при ручном перемещении ползунка
    seekBar.oninput = () => {
        player.currentTime = seekBar.value;
    };
}

function pauseTrack(audioId) {
    const player = document.getElementById(audioId);
    player.pause();
    clearInterval(currentInterval);
}

// Запрет контекстного меню
document.addEventListener('contextmenu', e => e.preventDefault());
