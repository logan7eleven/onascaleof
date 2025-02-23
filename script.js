document.addEventListener('DOMContentLoaded', function () {
    // -------------------------------
    // DOM Element References
    // -------------------------------
    const mainContainer = document.getElementById('main-container');
    const albumContainer = document.getElementById('album-container');
    const albumImage = document.getElementById('album-image');
    const siteTitle = document.getElementById('site-title');
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
    const scaleContainer = document.getElementById('scale-container');
    const scale = document.getElementById('scale');
    const scaleSegmentsLeft = document.getElementById('scale-segments-left');
    const scaleDivider = document.getElementById('scale-divider');
    const scaleSegmentsRight = document.getElementById('scale-segments-right');
    const personArrowContainer = document.getElementById('person-arrow-container');
    const buttonRow = document.getElementById('button-row');

    // -------------------------------
    // Global Variables
    // -------------------------------
    let albums = [];
    let shuffledAlbums = [];
    let people = { left: {}, right: {} };
    let currentAlbumIndex = 0;
    let currentVote = 0; // Ranges from -100 to 100, increments of 5
    let voteSubmitted = false;
    let peopleID = 2; // Current active people ID for filtering people data
    let infoMode = false;
    const totalScaleSegments = 40; // 40 segments total (20 left, 20 right)

    // -------------------------------
    // Firebase Setup
    // -------------------------------
    const firebaseConfig = {
        apiKey: "AIzaSyCUt5sTKJRYe-gguuon8U7SlyZtttawTSA",
        authDomain: "onascaleof-2e3b4.firebaseapp.com",
        projectId: "onascaleof-2e3b4",
        storageBucket: "onascaleof-2e3b4.firebaseapp.com",
        messagingSenderId: "96599540311",
        appId: "1:96599540311:web:47c86e4e6fce30e3065912"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // -------------------------------
    // 1. Resize Main Container & Related Elements
    // -------------------------------
    function resizeMainContainer() {
        // Determine base dimension from 90% of viewport height and width (pick the smaller)
        const viewHeight = window.innerHeight * 0.9;
        const viewWidth = window.innerWidth * 0.9;
        const baseSize = Math.min(viewHeight, viewWidth);
        // Main container: height = baseSize, width to follow a 2:3 ratio (width = 2/3 * height)
        mainContainer.style.height = `${baseSize}px`;
        mainContainer.style.width = `${(baseSize * 2) / 3}px`;
        mainContainer.style.fontSize = `${baseSize * 0.015}px`;

        // Update scale container: 90% width of main container, 7.5% height of main container
        const mainRect = mainContainer.getBoundingClientRect();
        scaleContainer.style.width = `${mainRect.width * 0.9}px`;
        scaleContainer.style.height = `${mainRect.height * 0.075}px`;

        // Update person arrow container and button row: should take 80% of main container width
        personArrowContainer.style.width = `${mainRect.width * 0.80}px`;
        buttonRow.style.width = `${mainRect.width * 0.80}px`;

        // Update person arrow button widths: gap equals 5% of main container width
        const gapForArrows = mainRect.width * 0.05;
        const totalArrowWidth = mainRect.width * 0.80;
        const personButtonWidth = (totalArrowWidth - gapForArrows) / 2;
        buttonPersonLeft.style.width = `${personButtonWidth}px`;
        buttonPersonRight.style.width = `${personButtonWidth}px`;
        // Set their background to light grey
        buttonPersonLeft.style.backgroundColor = "#d3d3d3";
        buttonPersonRight.style.backgroundColor = "#d3d3d3";

        // Update three-button row widths: gaps equal to 5% of main container width
        const gapForButtons = mainRect.width * 0.05;
        const totalButtonsWidth = mainRect.width * 0.80;
        const numButtons = 3;
        const buttonWidth = (totalButtonsWidth - (numButtons - 1) * gapForButtons) / numButtons;
        document.querySelectorAll("#button-row .app-button").forEach(btn => {
            btn.style.width = `${buttonWidth}px`;
            btn.style.backgroundColor = "#d3d3d3";
        });

        // Update person image container sizes based on album container dimensions.
        setPersonImageContainerSize();

        // Ensure album image fills 90% of album container.
        albumImage.style.width = "90%";
        albumImage.style.height = "90%";
    }

    // -------------------------------
    // 2. Person Image Container Sizing (4:3 Ratio)
    // -------------------------------
    function setPersonImageContainerSize() {
        const albumHeight = albumContainer.offsetHeight;
        // Each person image container's height = 1/3 of album container height.
        const containerHeight = albumHeight / 3;
        // For a 4:3 (width:height) ratio, width = (4/3) * height.
        const containerWidth = containerHeight * (4 / 3);
        document.querySelectorAll('.person-image-container').forEach(container => {
            container.style.height = `${containerHeight}px`;
            container.style.width = `${containerWidth}px`;
            // Ensure container background remains black unless changed by vote action.
            container.style.backgroundColor = "black";
        });
    }

    // -------------------------------
    // 3. Fetch Albums & People Data from CSVs
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
    // 4. Load People Data
    // -------------------------------
    function loadPeople(data) {
        const filtered = data.filter(person => person.peopleID === peopleID);
        const left = filtered.find(person => person.side === 'L');
        const right = filtered.find(person => person.side === 'R');
        if (left) {
            people.left = left;
            personLeft.src = left.url;
            personLeftInfoText.textContent = left.name;
        }
        if (right) {
            people.right = right;
            personRight.src = right.url;
            personRightInfoText.textContent = right.name;
        }
    }

    // -------------------------------
    // 5. Album Display & Navigation
    // -------------------------------
    function updateDisplay() {
        let album = shuffledAlbums[currentAlbumIndex];
        albumImage.src = album.url;
        // Reset outlines on album image container (not album image) and person containers.
        albumContainer.style.outline = "";
        [personLeft, personRight].forEach(img => img.style.outline = "");
        // Reset vote variables.
        voteSubmitted = false;
        buttonEnter.disabled = false;
        currentVote = 0;
        updateScale();
    }

    // Fisher-Yates shuffle for random album order.
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function getNextAlbum() {
        currentAlbumIndex++;
        if (currentAlbumIndex >= shuffledAlbums.length) {
            shuffledAlbums = shuffleArray([...albums]);
            currentAlbumIndex = 0;
        }
        // Reset outlines to default (none)
        albumContainer.style.outline = "";
        [personLeft, personRight].forEach(img => img.style.outline = "");
        updateDisplay();
    }

    // -------------------------------
    // 6. Create and Update Scale Bar
    // -------------------------------
    function createScaleSegments() {
        // Clear any existing segments.
        scaleSegmentsLeft.innerHTML = "";
        scaleSegmentsRight.innerHTML = "";

        // For total 40 segments, split evenly.
        const segmentsPerSide = totalScaleSegments / 2; // 20 on each side.
        for (let i = 0; i < segmentsPerSide; i++) {
            const segLeft = document.createElement('div');
            segLeft.classList.add('scale-segment');
            scaleSegmentsLeft.appendChild(segLeft);

            const segRight = document.createElement('div');
            segRight.classList.add('scale-segment');
            scaleSegmentsRight.appendChild(segRight);
        }
        // Ensure the center divider (scale-divider) is styled as a darker center line.
        scaleDivider.style.backgroundColor = "#333";
    }

    function updateScale() {
        // Calculate active segments: each segment represents 5 vote points.
        const segmentsPerSide = totalScaleSegments / 2;
        const leftActive = Math.max(0, Math.min(segmentsPerSide, Math.floor(-currentVote / 5)));
        const rightActive = Math.max(0, Math.min(segmentsPerSide, Math.floor(currentVote / 5)));

        // Clear active classes.
        document.querySelectorAll('.scale-segment').forEach(seg => {
            seg.classList.remove('active-left', 'active-right');
        });
        // Update left segments.
        for (let i = 0; i < leftActive; i++) {
            scaleSegmentsLeft.children[i].classList.add('active-left');
        }
        // Update right segments.
        for (let i = 0; i < rightActive; i++) {
            scaleSegmentsRight.children[i].classList.add('active-right');
        }
    }

    // -------------------------------
    // 7. Outline/Color Updates on Vote Input
    // -------------------------------
    // When a person arrow button is clicked, update outlines immediately.
    function updateVoteOutline(clickedSide) {
        let outlineColor = "";
        if (currentVote > 0) {
            outlineColor = "#F7B73D";
        } else if (currentVote < 0) {
            outlineColor = "#BAA0FA";
        }
        // Update album image container outline (not album image itself)
        albumContainer.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
        // Update clicked person’s image container outline.
        if (clickedSide === 'left') {
            personLeft.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
        } else if (clickedSide === 'right') {
            personRight.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
        }
    }

    // -------------------------------
    // 8. Adjust Vote Value
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
            let outlineColor = currentVote > 0 ? "#F7B73D" : currentVote < 0 ? "#BAA0FA" : "";
            // Persist outline on album container.
            albumContainer.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
            // Persist outline on the winning person container.
            if (currentVote > 0) {
                personRight.style.outline = `0.3em solid ${outlineColor}`;
            } else if (currentVote < 0) {
                personLeft.style.outline = `0.3em solid ${outlineColor}`;
            }
            voteSubmitted = true;
            buttonEnter.disabled = true;
            const albumID = shuffledAlbums[currentAlbumIndex].albumID;
            db.collection("votes").add({
                albumID: albumID,
                vote_value: currentVote,
                peopleID: peopleID,
            }).then(() => {
                console.log("Vote submitted:", { albumID, vote_value: currentVote, peopleID });
            }).catch(error => {
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
    // 11. INFO Mode Toggle & Delayed Text Resize
    // -------------------------------
    buttonInfo.addEventListener('click', () => {
        infoMode = !infoMode;
        albumImage.classList.toggle('image-faded', infoMode);
        // The album title/artist should be visible when info mode is on.
        const album = shuffledAlbums[currentAlbumIndex];
        albumNameElement.textContent = infoMode ? album.name : '';
        albumArtistElement.textContent = infoMode ? album.artist : '';
        albumInfoText.style.display = infoMode ? 'flex' : 'none';

        // Delay text resizing to allow layout to settle.
        if (infoMode) {
            setTimeout(adjustAlbumInfoFontSize, 500);
        }

        // Toggle fade on person images and info texts.
        personLeft.classList.toggle('image-faded', infoMode);
        personLeftInfoText.style.display = infoMode ? 'flex' : 'none';
        personRight.classList.toggle('image-faded', infoMode);
        personRightInfoText.style.display = infoMode ? 'flex' : 'none';
    });

    function adjustAlbumInfoFontSize() {
        albumNameElement.style.fontSize = '';
        albumArtistElement.style.fontSize = '';
        const nameFontSize = getMaxFontSize(albumNameElement);
        const artistFontSize = getMaxFontSize(albumArtistElement);
        const finalFontSize = Math.min(nameFontSize, artistFontSize);
        albumNameElement.style.fontSize = `${finalFontSize}px`;
        albumArtistElement.style.fontSize = `${finalFontSize}px`;
    }

    // Binary search for maximum font size that fits.
    function getMaxFontSize(element) {
        const container = element.parentElement;
        const maxWidth = container.offsetWidth;
        const maxHeight = container.offsetHeight;
        let fontSize = 1;
        element.style.fontSize = `${fontSize}px`;
        let low = 1, high = 1000;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            element.style.fontSize = `${mid}px`;
            if (element.scrollWidth > maxWidth || element.scrollHeight > maxHeight) {
                high = mid - 1;
            } else {
                fontSize = mid;
                low = mid + 1;
            }
        }
        return fontSize;
    }

    // -------------------------------
    // Event Listeners for Arrow Buttons & Vote
    // -------------------------------
    buttonPersonLeft.addEventListener('click', () => moveScale('left', 'left'));
    buttonPersonRight.addEventListener('click', () => moveScale('right', 'right'));
    buttonEnter.addEventListener('click', submitVote);

    // -------------------------------
    // Initial Setup and Data Loading
    // -------------------------------
    resizeMainContainer();
    window.addEventListener('resize', resizeMainContainer);
    createScaleSegments();

    const albumsCSV = '/albums.csv';
    const peopleCSV = '/people.csv';

    Promise.all([fetchAlbums(albumsCSV), fetchPeople(peopleCSV)]).then(([albumData, peopleData]) => {
        albums = albumData;
        shuffledAlbums = shuffleArray([...albums]);
        loadPeople(peopleData);
        updateScale();
        currentAlbumIndex = 0;
        // Display the first album immediately.
        updateDisplay();
    });
});
