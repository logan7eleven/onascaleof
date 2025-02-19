document.addEventListener('DOMContentLoaded', function () {
    const mainContainer = document.getElementById('main-container');
    const albumImage = document.getElementById('album-image');
    const scaleImage = document.getElementById('scale-image');
    const personLeft = document.getElementById('person-left');
    const personRight = document.getElementById('person-right');
    const buttonEnter = document.getElementById('button-enter');
    const buttonNext = document.getElementById('button-next');
    const buttonPersonLeft = document.getElementById('button-person-left');
    const buttonPersonRight = document.getElementById('button-person-right');
    const buttonInfo = document.getElementById('button-info');
    const albumInfoText = document.getElementById('album-info-text');
    const personLeftInfoText = document.getElementById('person-left-info-text');
    const personRightInfoText = document.getElementById('person-right-info-text');
    const albumContainer = document.getElementById('album-container');
    const personArrowContainer = document.getElementById('person-arrow-container');

    let albums = [];
    let people = { left: {}, right: {} };
    let currentAlbumIndex = 0;
    let currentVote = 0;
    let voteSubmitted = false;
    let peopleID = 1; // Manually set the active peopleID
    let infoMode = false;

    // Firebase setup
    const firebaseConfig = {
        apiKey: "AIzaSyCUt5sTKJRYe-gguuon8U7SlyZtttawTSA",
        authDomain: "onascaleof-2e3b4.firebaseapp.com",
        projectId: "onascaleof-2e3b4",
        storageBucket: "onascaleof-2e3b4",
        messagingSenderId: "96599540311",
        appId: "1:96599540311:web:47c86e4e6fce30e3065912"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    function resizeMainContainer() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let containerWidth = viewportHeight * 0.6 * 0.9; // 90% height * aspect ratio (2:3)
        let containerHeight = viewportHeight * 0.9;

        if (containerWidth > viewportWidth * 0.9) {
            containerWidth = viewportWidth * 0.9;
            containerHeight = containerWidth * 1.5;
        }

        mainContainer.style.width = `${containerWidth}px`;
        mainContainer.style.height = `${containerHeight}px`;
    }

    // Call it initially
    resizeMainContainer();

    // And on window resize
    window.addEventListener('resize', resizeMainContainer);

    function fetchAlbums(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.split('\n');
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
                const lines = csv.split('\n');
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

    function loadPeople(data) {
        const filteredPeople = data.filter(person => person.peopleID === peopleID);

        const leftPerson = filteredPeople.find(person => person.side === 'L');
        const rightPerson = filteredPeople.find(person => person.side === 'R');

        if (leftPerson) {
            people.left = leftPerson;
            personLeft.src = leftPerson.url;
        }

        if (rightPerson) {
            people.right = rightPerson;
            personRight.src = rightPerson.url;
        }
    }

    function updateDisplay() {
        const album = albums[currentAlbumIndex];
        albumImage.src = album.url;
        albumImage.style.outline = '';
        voteSubmitted = false;
        buttonEnter.disabled = false;
    }

    function getRandomAlbum() {
        currentAlbumIndex = Math.floor(Math.random() * albums.length);
        currentVote = 0;
        updateDisplay();
        updateScale(); //Make Sure the scale also resets here
    }

    //Dynamic Scale
    const scaleSegmentsLeft = document.getElementById('scale-segments-left');
    const scaleSegmentsRight = document.getElementById('scale-segments-right');
    const numSegments = 20; // Segments on each side

    // Function to create scale segments
    function createScaleSegments() {
        for (let i = 0; i < numSegments; i++) {
            const leftSegment = document.createElement('div');
            leftSegment.classList.add('scale-segment');
            scaleSegmentsLeft.appendChild(leftSegment);

            const rightSegment = document.createElement('div');
            rightSegment.classList.add('scale-segment');
            scaleSegmentsRight.appendChild(rightSegment);
        }
    }

    // Function to update the scale based on currentVote
    function updateScale() {
        const leftActiveSegments = Math.max(0, Math.min(numSegments, -currentVote / 5)); // Number of active left segments
        const rightActiveSegments = Math.max(0, Math.min(numSegments, currentVote / 5)); // Number of active right segments

        // Clear all active classes
        document.querySelectorAll('.scale-segment').forEach(segment => {
            segment.classList.remove('active-left', 'active-right');
        });

        // Add active classes to left segments
        for (let i = 0; i < leftActiveSegments; i++) {
            scaleSegmentsLeft.children[i].classList.add('active-left');
        }

        // Add active classes to right segments
        for (let i = 0; i < rightActiveSegments; i++) {
            scaleSegmentsRight.children[i].classList.add('active-right');
        }
    }

    function moveScale(direction) {
        if (!voteSubmitted) {
            if (direction === "right") {
                currentVote = Math.min(100, currentVote + 5);
            } else if (direction === "left") {
                currentVote = Math.max(-100, currentVote - 5);
            }
            updateScale(); // Update the scale visually
        }
    }

    //End Dynamic Scale

    function submitVote() {
        if (!voteSubmitted) {
            let outlineColor = currentVote > 0 ? '#F7B73D' : currentVote < 0 ? '#BAA0FA' : '';
            albumImage.style.outline = outlineColor ? `0.3rem solid ${outlineColor}` : '';
            buttonEnter.disabled = true;
            voteSubmitted = true;

            const albumID = albums[currentAlbumIndex].albumID;

            db.collection("votes").add({
                albumID: albumID,
                vote_value: currentVote,
                peopleID: peopleID,
            })
                .then(() => {
                    console.log("Vote submitted:", { albumID: albumID, vote_value: currentVote, peopleID });
                })
                .catch(error => {
                    console.error("Error submitting vote:", error);
                });
        }
    }

    buttonNext.addEventListener('click', async () => {
        if (!voteSubmitted) {
            try {
                const albumID = albums[currentAlbumIndex].albumID;
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
        getRandomAlbum();
    });

    const albumsCSV = '/albums.csv';
    const peopleCSV = '/people.csv';

    Promise.all([fetchAlbums(albumsCSV), fetchPeople(peopleCSV)])
        .then(([albumData, peopleData]) => {
            albums = albumData;
            loadPeople(peopleData);
            createScaleSegments(); // Create scale segments
            updateScale();  //Initializes the scale
            buttonPersonLeft.addEventListener('click', () => moveScale('left'));
            buttonPersonRight.addEventListener('click', () => moveScale('right'));
            buttonEnter.addEventListener('click', submitVote);

            document.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') {
                    moveScale('left');
                } else if (event.key === 'ArrowRight') {
                    moveScale('right');
                }
            });
            albumImage.addEventListener('click', () => {
                const album = albums[currentAlbumIndex];
            });

            getRandomAlbum();
        })
        .catch(error => console.error('Error loading data:', error));
    
    buttonInfo.addEventListener('click', () => {
        infoMode = !infoMode;

        // Album
        albumImage.classList.toggle('image-faded', infoMode);
        albumInfoText.textContent = infoMode ? `${albums[currentAlbumIndex].name} by ${albums[currentAlbumIndex].artist}` : '';
        albumInfoText.style.display = infoMode ? 'flex' : 'none';

        // Person Left
        personLeft.classList.toggle('image-faded', infoMode);
        personLeftInfoText.textContent = infoMode ? people.left.name : '';
        personLeftInfoText.style.display = infoMode ? 'flex' : 'none';

        // Person Right
        personRight.classList.toggle('image-faded', infoMode);
        personRightInfoText.textContent = infoMode ? people.right.name : '';
        personRightInfoText.style.display = infoMode ? 'flex' : 'none';
    });

    // Dynamic Text Resizing
    function adjustFontSize(element) {
        const container = element.parentElement;
        const maxWidth = container.offsetWidth;
        const maxHeight = container.offsetHeight;
        let fontSize = parseInt(window.getComputedStyle(element).fontSize);

        // Track the previous state of the text (too large or too small)
        let previousState = null; // Can be "tooLarge", "tooSmall", or null

        // Safeguard: Maximum iterations to prevent infinite loops
        const maxIterations = 100;
        let iterations = 0;

        while (iterations < maxIterations) {
            const isTooLarge = element.scrollWidth > maxWidth || element.scrollHeight > maxHeight;
            const isTooSmall = element.scrollWidth <= maxWidth && element.scrollHeight <= maxHeight;

            // Check for oscillation (tooLarge followed by tooSmall or vice versa)
            if (
                (previousState === "tooLarge" && isTooSmall) ||
                (previousState === "tooSmall" && isTooLarge)
            ) {
                // Oscillation detected: use the smaller font size
                fontSize = Math.min(fontSize, parseInt(window.getComputedStyle(element).fontSize));
                break;
            }

            // Update the previous state
            previousState = isTooLarge ? "tooLarge" : "tooSmall";

            // Adjust the font size
            if (isTooLarge) {
                fontSize--;
            } else if (isTooSmall) {
                fontSize++;
            }

            // Apply the new font size
            element.style.fontSize = `${fontSize}px`;

            iterations++;
        }

        // Log the final font size for debugging
        console.log(`Adjusted font size for ${element.id}: ${fontSize}px`);
    }

    // Adjust font size on page load
    adjustFontSize(document.getElementById('album-info-text'));
    adjustFontSize(document.getElementById('person-left-info-text'));
    adjustFontSize(document.getElementById('person-right-info-text'));

    // Adjust font size on window resize
    window.addEventListener('resize', () => {
        adjustFontSize(document.getElementById('album-info-text'));
        adjustFontSize(document.getElementById('person-left-info-text'));
        adjustFontSize(document.getElementById('person-right-info-text'));
    });
});
