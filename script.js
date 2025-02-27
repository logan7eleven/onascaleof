document.addEventListener('DOMContentLoaded', function () {
    // Elements from the HTML
    const mainContainer = document.getElementById('main-container');
    const albumContainer = document.getElementById('album-container');
    const albumImage = document.getElementById('album-image');
    const personLeft = document.getElementById('person-left');
    const personRight = document.getElementById('person-right');
    const buttonEnter = document.getElementById('button-enter');
    const buttonNext = document.getElementById('button-next');
    const buttonPersonLeft = document.getElementById('button-person-left');
    const buttonPersonRight = document.getElementById('button-person-right');
    const buttonInfo = document.getElementById('button-info');
    const albumInfoText = document.getElementById('album-info-text');
    const albumNameElement = document.getElementById('album-name');
    const albumArtistElement = document.getElementById('album-artist');
    const personLeftInfoText = document.getElementById('person-left-info-text');
    const personRightInfoText = document.getElementById('person-right-info-text');
    const scaleSegmentsLeft = document.getElementById('scale-segments-left');
    const scaleSegmentsRight = document.getElementById('scale-segments-right');

    // Variables for functionality
    let albums = [];
    let shuffledAlbums = [];
    let people = { left: {}, right: {} };
    let currentAlbumIndex = 0;
    let currentVote = 0;
    let voteSubmitted = false;
    let peopleID = 2;
    let infoMode = false;
    const numSegments = 20;

    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCUt5sTKJRYe-gguuon8U7SlyZtttawTSA",
        authDomain: "onascaleof-2e3b4.firebaseapp.com",
        projectId: "onascaleof-2e3b4",
        storageBucket: "onascaleof-2e3b4.appspot.com",
        messagingSenderId: "96599540311",
        appId: "1:96599540311:web:47c86e4e6fce30e3065912"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Resizing function
    function resizeMainContainer() {
        // Calculate dimensions based on viewport
        const viewHeight = window.innerHeight * 0.9;
        const viewWidth = window.innerWidth * 0.9;
        const baseSize = Math.min(viewHeight, viewWidth * 1.5); // Maintain 2:3 ratio
        
        // Set main container dimensions
        mainContainer.style.height = `${baseSize}px`;
        mainContainer.style.width = `${baseSize * 2/3}px`;
        
        // Set base font size as 1.5% of container height
        mainContainer.style.fontSize = `${baseSize * 0.015}px`;
        
        // Update other container sizes
        const albumSize = baseSize * 0.8 * 0.4; // 80% of main container width
        albumContainer.style.height = `${albumSize}px`;
        albumContainer.style.width = `${albumSize}px`;
        
        // Person container sizing (1/3 of album container)
        const personContainerHeight = albumSize / 3;
        document.querySelectorAll('.person-image-container').forEach(container => {
            container.style.height = `${personContainerHeight}px`;
        });
    }

    // Scale creation and update functions remain largely the same
    function createScaleSegments() {
        scaleSegmentsLeft.innerHTML = '';
        scaleSegmentsRight.innerHTML = '';
        
        for (let i = 0; i < numSegments; i++) {
            const leftSegment = document.createElement('div');
            leftSegment.classList.add('scale-segment');
            leftSegment.style.width = `${100/numSegments}%`;
            scaleSegmentsLeft.appendChild(leftSegment);
            
            const rightSegment = document.createElement('div');
            rightSegment.classList.add('scale-segment');
            rightSegment.style.width = `${100/numSegments}%`;
            scaleSegmentsRight.appendChild(rightSegment);
        }
    }

    function updateScale() {
        const leftActiveSegments = Math.max(0, Math.min(numSegments, Math.floor(-currentVote / 5)));
        const rightActiveSegments = Math.max(0, Math.min(numSegments, Math.floor(currentVote / 5)));

        document.querySelectorAll('.scale-segment').forEach(segment => {
            segment.classList.remove('active-left', 'active-right');
        });

        Array.from(scaleSegmentsLeft.children)
            .slice(0, leftActiveSegments)
            .forEach(segment => segment.classList.add('active-left'));
        
        Array.from(scaleSegmentsRight.children)
            .slice(0, rightActiveSegments)
            .forEach(segment => segment.classList.add('active-right'));
    }

    function updateDisplay() {
        let album = shuffledAlbums[currentAlbumIndex];
        albumImage.src = album.url;
        albumImage.style.outline = "";
        voteSubmitted = false;
        buttonEnter.disabled = false;
        currentVote = 0;
        updateScale();
        personLeft.style.outline = "";
        personRight.style.outline = "";
        
        if (infoMode) {
            albumNameElement.textContent = album.name;
            albumArtistElement.textContent = album.artist;
            adjustAlbumInfoFontSize();
        }
    }

    // Event handlers
    buttonPersonLeft.addEventListener('click', () => moveScale('left', 'left'));
    buttonPersonRight.addEventListener('click', () => moveScale('right', 'right'));
    buttonEnter.addEventListener('click', submitVote);
    buttonNext.addEventListener('click', async () => {
        if (!voteSubmitted) {
            try {
                await db.collection("votes").add({
                    albumID: shuffledAlbums[currentAlbumIndex].albumID,
                    peopleID: peopleID,
                    skips: 1
                });
            } catch (error) {
                console.error("Error logging skip:", error);
            }
        }
        getNextAlbum();
    });

    // Info mode toggle
    buttonInfo.addEventListener('click', () => {
        infoMode = !infoMode;
        albumImage.classList.toggle('image-faded', infoMode);
        
        const album = shuffledAlbums[currentAlbumIndex];
        albumNameElement.textContent = infoMode ? album.name : '';
        albumArtistElement.textContent = infoMode ? album.artist : '';
        
        if (infoMode) {
            albumInfoText.style.display = 'flex';
            setTimeout(adjustAlbumInfoFontSize, 50);
        } else {
            albumInfoText.style.display = 'none';
        }

        personLeft.classList.toggle('image-faded', infoMode);
        personRight.classList.toggle('image-faded', infoMode);
        personLeftInfoText.style.display = infoMode ? 'flex' : 'none';
        personRightInfoText.style.display = infoMode ? 'flex' : 'none';
    });

    // Initialize
    resizeMainContainer();
    window.addEventListener('resize', resizeMainContainer);
    createScaleSegments();

    // Load data
    Promise.all([
        fetch('/albums.csv').then(response => response.text()),
        fetch('/people.csv').then(response => response.text())
    ]).then(([albumsData, peopleData]) => {
        // Parse albums
        albums = albumsData.split('\n')
            .filter(line => line.trim())
            .map((line, index) => {
                const [name, artist, url] = line.split(',');
                return {
                    name: name.trim(),
                    artist: artist.trim(),
                    url: url.trim(),
                    albumID: index + 1
                };
            });

        // Parse people
        const peopleList = peopleData.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [name, url, id, side] = line.split(',');
                return {
                    name: name.trim(),
                    url: url.trim(),
                    peopleID: parseInt(id),
                    side: side.trim()
                };
            });

        // Load initial data
        shuffledAlbums = shuffleArray([...albums]);
        loadPeople(peopleList);
        updateScale();
        updateDisplay();
    });

    // Helper functions
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function loadPeople(peopleList) {
        const filteredPeople = peopleList.filter(person => person.peopleID === peopleID);
        const leftPerson = filteredPeople.find(person => person.side === 'L');
        const rightPerson = filteredPeople.find(person => person.side === 'R');

        if (leftPerson) {
            people.left = leftPerson;
            personLeft.src = leftPerson.url;
            personLeftInfoText.textContent = leftPerson.name;
        }
        if (rightPerson) {
            people.right = rightPerson;
            personRight.src = rightPerson.url;
            personRightInfoText.textContent = rightPerson.name;
        }
    }

    function adjustAlbumInfoFontSize() {
        const maxWidth = albumInfoText.offsetWidth * 0.9;
        const maxHeight = albumInfoText.offsetHeight * 0.4;
        
        let fontSize = 1;
        while (fontSize < 100) {
            albumNameElement.style.fontSize = `${fontSize}px`;
            albumArtistElement.style.fontSize = `${fontSize}px`;
            
            if (albumNameElement.scrollWidth > maxWidth ||
                albumNameElement.scrollHeight > maxHeight ||
                albumArtistElement.scrollWidth > maxWidth ||
                albumArtistElement.scrollHeight > maxHeight) {
                fontSize--;
                break;
            }
            fontSize++;
        }
        
        albumNameElement.style.fontSize = `${fontSize}px`;
        albumArtistElement.style.fontSize = `${fontSize}px`;
    }
});
