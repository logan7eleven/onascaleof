document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');
    const playPauseButton = document.getElementById('play-pause-button');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const alphabetGrid = document.getElementById('alphabet-grid');

    const playlist = [
        {
            title: 'Apples',
            artist: 'Whodini',
            album: 'Jumper',
            artwork: 'https://firebasestorage.googleapis.com/v0/b/onascaleof-2e3b4.firebasestorage.app/o/artwork%2FIMG_7870-VSCO.jpeg?alt=media&token=00d8a8b5-c7dd-42c9-8976-687e5436efa3',
            url: 'https://firebasestorage.googleapis.com/v0/b/onascaleof-2e3b4.firebasestorage.app/o/audio%2Fsample-6s.mp3?alt=media&token=3d5a4b43-d46e-49b9-8bbb-1afc2375f39f'
        },
        {
            title: 'Bananas',
            artist: 'hoover',
            album: 'jons',
            artwork: 'https://firebasestorage.googleapis.com/v0/b/onascaleof-2e3b4.firebasestorage.app/o/artwork%2FPXL_20241228_171628899.MP.jpg?alt=media&token=81500387-e364-4e7c-938b-821d33e3f142',
            url: 'https://firebasestorage.googleapis.com/v0/b/onascaleof-2e3b4.firebasestorage.app/o/audio%2Fsample-9s.mp3?alt=media&token=9b596802-7b08-4488-871c-e39c8aef4511'
        },
    ];
    for (let i = playlist.length; i < 26; i++) {
        playlist.push({ title: `Song ${String.fromCharCode(65 + i)}`, artist: 'Unknown Artist', album: 'Unknown Album', artwork: 'images/screen.png', url: '' });
    }

    let currentSongIndex = 0;

    // --- STATE PERSISTENCE ---

    function saveState() {
        const state = {
            songIndex: currentSongIndex,
            time: audioPlayer.currentTime
        };
        localStorage.setItem('audioPlayerState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('audioPlayerState');
        if (savedState) {
            const state = JSON.parse(savedState);
            currentSongIndex = state.songIndex;
            loadSong(currentSongIndex, (wasPlaying) => {
                // Set the time after the song is loaded
                audioPlayer.currentTime = state.time;
            });
        } else {
            // Load the first song if no state
            loadSong(0);
        }
    }


    // --- PLAYER LOGIC ---

    function loadSong(songIndex, callback) {
        const song = playlist[songIndex];
        if (!song || !song.url) return;

        audioPlayer.src = song.url;
        currentSongIndex = songIndex;
        updateMediaSession();

        // When metadata is loaded, execute the callback (used for setting time)
        if (callback) {
            audioPlayer.addEventListener('loadedmetadata', callback, { once: true });
        }
    }

    function playSong() {
        if (!audioPlayer.src && playlist[0].url) {
            loadSong(0);
        }
        if (audioPlayer.src) {
            audioPlayer.play().then(() => {
                playPauseButton.textContent = 'PAUSE';
            }).catch(error => console.error("Playback failed:", error));
        }
    }

    function pauseSong() {
        audioPlayer.pause();
        playPauseButton.textContent = 'PLAY';
    }

    function prevSong() {
        let newIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
        while (!playlist[newIndex].url) {
            newIndex = (newIndex - 1 + playlist.length) % playlist.length;
        }
        loadSong(newIndex);
        playSong();
    }

    function nextSong() {
        let newIndex = (currentSongIndex + 1) % playlist.length;
        while (!playlist[newIndex].url) {
            newIndex = (newIndex + 1) % playlist.length;
        }
        loadSong(newIndex);
        playSong();
    }

    // --- MEDIA SESSION API ---

    function updateMediaSession() {
        if ('mediaSession' in navigator) {
            const song = playlist[currentSongIndex];
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist,
                album: song.album,
                artwork: [{ src: song.artwork, sizes: '96x96', type: 'image/png' }]
            });
            navigator.mediaSession.setActionHandler('play', playSong);
            navigator.mediaSession.setActionHandler('pause', pauseSong);
            navigator.mediaSession.setActionHandler('previoustrack', prevSong);
            navigator.mediaSession.setActionHandler('nexttrack', nextSong);
        }
    }

    // --- DYNAMIC GRID CREATION ---

    function createGrid() {
        playlist.forEach((song, index) => {
            const letter = String.fromCharCode(65 + index);
            const card = document.createElement('div');
            card.className = 'alphabet-card';
            card.dataset.songIndex = index;
            card.innerHTML = `<div class="card-inner"><div class="card-front">${letter}</div><div class="card-back"><img class="album-art-thumb" src="${song.artwork}" alt="Art for ${song.title}"><div class="track-name-thumb">${song.title}</div><div class="artist-name-thumb">${song.artist}</div></div></div>`;
            
            card.addEventListener('click', () => {
                if (card.classList.contains('is-flipped')) {
                    const songIndex = parseInt(card.dataset.songIndex);
                    loadSong(songIndex);
                    playSong();
                } else {
                    card.classList.add('is-flipped');
                }
            });
            alphabetGrid.appendChild(card);
        });
    }

    // --- EVENT LISTENERS ---
    playPauseButton.addEventListener('click', () => { audioPlayer.paused ? playSong() : pauseSong(); });
    nextButton.addEventListener('click', nextSong);
    prevButton.addEventListener('click', prevSong);
    audioPlayer.addEventListener('ended', nextSong);

    // Save state before unloading the page
    window.addEventListener('beforeunload', saveState);
    // Also save state periodically during playback
    audioPlayer.addEventListener('timeupdate', () => {
        // Throttle saving to once every 5 seconds to avoid performance issues
        if (audioPlayer.currentTime > 0 && Math.floor(audioPlayer.currentTime) % 5 === 0) {
            saveState();
        }
    });

    // --- INITIALIZE ---
    createGrid();
    loadState();
});