function playTrack(audioId, seekId) {
    const player = document.getElementById(audioId);
    const seekBar = document.getElementById(seekId);

    // Останавливаем все остальные треки перед запуском нового
    document.querySelectorAll('audio').forEach(audio => {
        if (audio.id !== audioId) {
            audio.pause();
        }
    });

    player.play();

    // Каждую секунду обновляем положение ползунка
    player.ontimeupdate = () => {
        if (player.duration) {
            seekBar.max = player.duration;
            seekBar.value = player.currentTime;
        }
    };

    // Когда пользователь тянет ползунок — перематываем аудио
    seekBar.oninput = () => {
        player.currentTime = seekBar.value;
    };
}

function pauseTrack(audioId) {
    const player = document.getElementById(audioId);
    player.pause();
}

// Защита: запрет правой кнопки мыши
document.addEventListener('contextmenu', e => e.preventDefault());
