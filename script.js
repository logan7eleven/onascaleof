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

    // Variables related to albums, votes, scale, and people
    let albums = [];
    let shuffledAlbums = [];
    let people = { left: {}, right: {} };
    let currentAlbumIndex = 0;
    let currentVote = 0;
    let voteSubmitted = false;
    let peopleID = 2; // Active peopleID to filter people data
    let infoMode = false;
    const numSegments = 20; // Total segments on each side

    // Firebase initialization
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

    // -------------------------------
    // 1. Main Container Resizing
    // -------------------------------
    function resizeMainContainer() {
        let viewHeight = window.innerHeight * 0.9;
        let viewWidth = window.innerWidth * 0.9;
        let baseSize = Math.min(viewHeight, viewWidth);
        mainContainer.style.height = `${baseSize}px`;
        mainContainer.style.width = `${(baseSize * 2) / 3}px`;
        mainContainer.style.fontSize = `${baseSize * 0.015}px`;
        setPersonImageContainerSize();
    }

    // -------------------------------
    // 2. Person Image Container Sizing
    // -------------------------------
    function setPersonImageContainerSize() {
        let albumHeight = albumContainer.offsetHeight;
        // Each person image container should be 1/3 the height of the album container
        const personContainerHeight = albumHeight / 3;
        const personContainerWidth = personContainerHeight * 0.75; // 4:3 ratio

        document.querySelectorAll('.person-image-container').forEach(container => {
            container.style.height = `${personContainerHeight}px`;
            container.style.width = `${personContainerWidth}px`;
        });
    }

    // -------------------------------
    // 3. Fetch Albums & People CSV Data
    // -------------------------------
    function fetchAlbums(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.split('\n').filter(line => line.trim().length > 0);
                return lines.map((line, index) => {
                    const [name, artist, url] = line.split(',');
                    return {
                        name: name.trim(),
                        artist: artist.trim(),
                        url: url.trim(),
                        albumID: index + 1
                    };
                });
            });
    }

    function fetchPeople(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.split('\n').filter(line => line.trim().length > 0);
                return lines.map(line => {
                    const parts = line.split(',');
                    if (parts.length !== 4) {
                        console.warn("Skipping malformed line in people.csv:", line);
                        return null;
                    }
                    const [name, url, id, side] = parts.map(part => part.trim());
                    const peopleID = parseInt(id);
                    if (isNaN(peopleID)) {
                        console.warn("Invalid peopleID in line:", line);
                        return null;
                    }
                    return {
                        name: name,
                        url: url,
                        peopleID: peopleID,
                        side: side
                    };
                }).filter(person => person !== null);
            });
    }

    // -------------------------------
    // 4. Load People Data into UI
    // -------------------------------
    function loadPeople(data) {
        const filteredPeople = data.filter(person => person.peopleID === peopleID);
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

    // -------------------------------
    // 5. Album Display and Navigation
    // -------------------------------
    function updateDisplay() {
        let album = shuffledAlbums[currentAlbumIndex];
        albumImage.src = album.url;
        // Reset albumImage outline and vote state
        albumImage.style.outline = "";
        voteSubmitted = false;
        buttonEnter.disabled = false;
        currentVote = 0;
        updateScale();
        // Reset person outlines
        personLeft.style.outline = "";
        personRight.style.outline = "";
    }

    // Fisher-Yates Shuffle
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Move to Next Album
    function getNextAlbum() {
        currentAlbumIndex++;
        if (currentAlbumIndex >= shuffledAlbums.length) {
            shuffledAlbums = shuffleArray([...albums]);
            currentAlbumIndex = 0;
        }
        updateDisplay();
    }

    // -------------------------------
    // 6. Dynamic Scale
    // -------------------------------
    function createScaleSegments() {
        // Clear existing segments first
        scaleSegmentsLeft.innerHTML = '';
        scaleSegmentsRight.innerHTML = '';
        
        // Create new segments
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
        // Calculate number of active segments
        const leftActiveSegments = Math.max(0, Math.min(numSegments, Math.floor(-currentVote / 5)));
        const rightActiveSegments = Math.max(0, Math.min(numSegments, Math.floor(currentVote / 5)));

        // Clear all segments
        document.querySelectorAll('.scale-segment').forEach(segment => {
            segment.classList.remove('active-left', 'active-right');
        });

        // Mark segments as active
        const leftSegments = scaleSegmentsLeft.querySelectorAll('.scale-segment');
        for (let i = 0; i < leftActiveSegments; i++) {
            if (leftSegments[i]) {
                leftSegments[i].classList.add('active-left');
            }
        }
        
        const rightSegments = scaleSegmentsRight.querySelectorAll('.scale-segment');
        for (let i = 0; i < rightActiveSegments; i++) {
            if (rightSegments[i]) {
                rightSegments[i].classList.add('active-right');
            }
        }
    }

    // -------------------------------
    // 7. Outline Update Helper
    // -------------------------------
    function updateVoteOutline(clickedSide) {
        // Determine color based on currentVote value, not necessarily the button pressed.
        let outlineColor = "";
        if (currentVote > 0) {
            outlineColor = "#F7B73D";
        } else if (currentVote < 0) {
            outlineColor = "#BAA0FA";
        }
        // Immediately update outlines on album image container
        albumImage.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
        // Update clicked person's container outline
        if (clickedSide === 'left') {
            personLeft.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
            personRight.style.outline = "";
        } else if (clickedSide === 'right') {
            personRight.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
            personLeft.style.outline = "";
        }
    }

    // -------------------------------
    // 8. Move Scale on Arrow Button Click
    // -------------------------------
    function moveScale(direction, clickedSide) {
        if (!voteSubmitted) {
            if (direction === "right") {
                currentVote = Math.min(100, currentVote + 5);
            } else if (direction === "left") {
                currentVote = Math.max(-100, currentVote - 5);
            }
            updateScale();
            updateVoteOutline(clickedSide);
        }
    }

    // -------------------------------
    // 9. Submit Vote
    // -------------------------------
    function submitVote() {
        if (!voteSubmitted) {
            // Set album outline persist based on currentVote
            let outlineColor = currentVote > 0 ? "#F7B73D" : currentVote < 0 ? "#BAA0FA" : "";
            albumImage.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
            // Persist outline on winning person container
            if (currentVote > 0) {
                personRight.style.outline = `0.3em solid ${outlineColor}`;
                personLeft.style.outline = "";
            } else if (currentVote < 0) {
                personLeft.style.outline = `0.3em solid ${outlineColor}`;
                personRight.style.outline = "";
            }
            buttonEnter.disabled = true;
            voteSubmitted = true;
            const albumID = shuffledAlbums[currentAlbumIndex].albumID;
            db.collection("votes").add({
                albumID: albumID,
                vote_value: currentVote,
                peopleID: peopleID,
            })
            .then(() => {
                console.log("Vote submitted:", { albumID, vote_value: currentVote, peopleID });
            })
            .catch(error => {
                console.error("Error submitting vote:", error);
            });
        }
    }

    // -------------------------------
    // 10. Next Button Handler
    // -------------------------------
    buttonNext.addEventListener('click', async () => {
        if (!voteSubmitted) {
            try {
                const albumID = shuffledAlbums[currentAlbumIndex].albumID;
                await db.collection("votes").add({
                    albumID: albumID,
                    peopleID: peopleID,
                    skips: 1
                });
                console.log("Skip recorded for album:", albumID);
            } catch (error) {
                console.error("Error logging skip:", error);
            }
        }
        getNextAlbum();
    });

    // -------------------------------
    // 11. INFO Mode Toggling and Delayed Text Resizing
    // -------------------------------
    buttonInfo.addEventListener('click', () => {
        infoMode = !infoMode;

        // Toggle album image fade and overlay text visibility
        albumImage.classList.toggle('image-faded', infoMode);
        const album = shuffledAlbums[currentAlbumIndex];
        albumNameElement.textContent = infoMode ? album.name : '';
        albumArtistElement.textContent = infoMode ? album.artist : '';

        if (infoMode) {
            albumInfoText.style.display = 'flex';
            // Delay adjustment to allow layout to settle (e.g., 500ms)
            setTimeout(adjustAlbumInfoFontSize, 500);
        } else {
            albumInfoText.style.display = 'none';
        }

        // Toggle fade on person images and info texts
        personLeft.classList.toggle('image-faded', infoMode);
        personLeftInfoText.style.display = infoMode ? 'flex' : 'none';
        personRight.classList.toggle('image-faded', infoMode);
        personRightInfoText.style.display = infoMode ? 'flex' : 'none';
    });

    function adjustAlbumInfoFontSize() {
        // Reset font sizes to allow recalculation
        albumNameElement.style.fontSize = '';
        albumArtistElement.style.fontSize = '';
        const nameFontSize = getMaxFontSize(albumNameElement);
        const artistFontSize = getMaxFontSize(albumArtistElement);
        // Use the smaller of the two to ensure both fit nicely
        const finalFontSize = Math.min(nameFontSize, artistFontSize);
        albumNameElement.style.fontSize = `${finalFontSize}px`;
        albumArtistElement.style.fontSize = `${finalFontSize}px`;
    }

    // Binary search for maximum font size that fits within element container
    function getMaxFontSize(element) {
        const container = element.parentElement;
        const maxWidth = container.offsetWidth;
        const maxHeight = element.offsetHeight;
        let fontSize = 1;
        element.style.fontSize = `${fontSize}px`;
        let low = 1;
        let high = 1000;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            element.style.fontSize = `${mid}px`;
            const isTooLarge = element.scrollWidth > maxWidth || element.scrollHeight > maxHeight;
            if (isTooLarge) {
                high = mid - 1;
            } else {
                fontSize = mid;
                low = mid + 1;
            }
        }
        return fontSize;
    }

    // -------------------------------
    // Event Listeners & Initial Calls
    // -------------------------------
    // Arrow button events
    buttonPersonLeft.addEventListener('click', () => moveScale('left', 'left'));
    buttonPersonRight.addEventListener('click', () => moveScale('right', 'right'));
    buttonEnter.addEventListener('click', submitVote);

    // Window resize event
    window.addEventListener('resize', resizeMainContainer);

    // Initialize container sizes and scale
    resizeMainContainer();
    createScaleSegments();

    // Load initial data
    Promise.all([
        fetchAlbums('/albums.csv'),
        fetchPeople('/people.csv')
    ]).then(([albumsData, peopleData]) => {
        albums = albumsData;
        shuffledAlbums = shuffleArray([...albums]);
        loadPeople(peopleData);
        updateScale();
        updateDisplay();
    }).catch(error => {
        console.error('Error loading data:', error);
    });
});
