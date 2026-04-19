function playTrack(id) {
    // Останавливаем все другие треки, если они играют
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach(track => {
        track.pause();
        track.currentTime = 0;
    });

    // Запускаем нужный
    const player = document.getElementById(id);
    player.play();
}

function pauseTrack(id) {
    const player = document.getElementById(id);
    player.pause();
}

// Запрещаем правую кнопку мыши, чтобы сложнее было найти ссылку на файл
document.addEventListener('contextmenu', event => event.preventDefault());