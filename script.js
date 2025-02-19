const albumInfoText = document.getElementById('album-info-text');
const albumNameElement = document.getElementById('album-name');
const albumArtistElement = document.getElementById('album-artist');

let albums = [];
let people = { left: {}, right: {} };
let currentAlbumIndex = 0;
let currentVote = 0;
let voteSubmitted = false;
let peopleID = 1; // Example: manually chosen
let infoMode = false;

// Firebase setup
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
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

// Initial call
resizeMainContainer();
// Listen for resize
window.addEventListener('resize', resizeMainContainer);

// Fetch CSV for albums
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

// Fetch CSV for people
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

// Load the two people for the given peopleID
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

// Update album display
function updateDisplay() {
    const album = albums[currentAlbumIndex];
    albumImage.src = album.url;
    albumImage.style.outline = '';
    voteSubmitted = false;
    buttonEnter.disabled = false;
}

// Get a random album (used by NEXT or if you want random)
function getRandomAlbum() {
    currentAlbumIndex = Math.floor(Math.random() * albums.length);
    currentVote = 0;
    updateDisplay();
    updateScale();
}

// Scale logic
const scaleSegmentsLeft = document.getElementById('scale-segments-left');
const scaleSegmentsRight = document.getElementById('scale-segments-right');
const numSegments = 20;

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

function updateScale() {
    const leftActiveSegments = Math.max(0, Math.min(numSegments, -currentVote / 5));
    const rightActiveSegments = Math.max(0, Math.min(numSegments, currentVote / 5));

    document.querySelectorAll('.scale-segment').forEach(segment => {
        segment.classList.remove('active-left', 'active-right');
    });

    for (let i = 0; i < leftActiveSegments; i++) {
        scaleSegmentsLeft.children[i].classList.add('active-left');
    }
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
        updateScale();
    }
}

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

// Skip / Next button
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

// CSV file paths
const albumsCSV = '/albums.csv';
const peopleCSV = '/people.csv';

// Fetch data from both CSVs
Promise.all([fetchAlbums(albumsCSV), fetchPeople(peopleCSV)])
    .then(([albumData, peopleData]) => {
        albums = albumData;
        loadPeople(peopleData);
        createScaleSegments();
        updateScale();

        // ── Show the first album immediately ──
        currentAlbumIndex = 0;
        updateDisplay();
        // ──────────────────────────────────────

        // Hook up listeners
        buttonPersonLeft.addEventListener('click', () => moveScale('left'));
        buttonPersonRight.addEventListener('click', () => moveScale('right'));
        buttonEnter.addEventListener('click', submitVote);
    });

// Toggling Info
buttonInfo.addEventListener('click', () => {
    infoMode = !infoMode;

    // Fades the album image if infoMode is on
    albumImage.classList.toggle('image-faded', infoMode);

    // Grab the current album
    const album = albums[currentAlbumIndex];

    // Show/hide text for album
    albumNameElement.textContent = infoMode ? album.name : '';
    albumArtistElement.textContent = infoMode ? album.artist : '';

    if (infoMode) {
        albumInfoText.style.display = 'flex';
        adjustFontSize(albumNameElement);
        adjustFontSize(albumArtistElement);
    } else {
        albumInfoText.style.display = 'none';
    }

    // Person Left
    personLeft.classList.toggle('image-faded', infoMode);
    const personLeftInfoText = document.getElementById('person-left-info-text');
    personLeftInfoText.textContent = infoMode ? people.left.name : '';
    personLeftInfoText.style.display = infoMode ? 'flex' : 'none';

    // Person Right
    personRight.classList.toggle('image-faded', infoMode);
    const personRightInfoText = document.getElementById('person-right-info-text');
    personRightInfoText.textContent = infoMode ? people.right.name : '';
    personRightInfoText.style.display = infoMode ? 'flex' : 'none';
});

// Dynamic Text Resizing
function adjustFontSize(element) {
    const container = element.parentElement;
    const maxWidth = container.offsetWidth;
    const maxHeight = container.offsetHeight;

    let fontSize = 1;
    element.style.fontSize = `${fontSize}px`;

    // Binary search for the largest fitting font size
    let low = 1;
    let high = 1000;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        element.style.fontSize = `${mid}px`;

        const isTooLarge = element.scrollWidth > maxWidth || element.scrollHeight > maxHeight;
        if (isTooLarge) {
            high = mid - 1;
        } else {
            low = mid + 1;
            fontSize = mid;
        }
    }
    element.style.fontSize = `${fontSize}px`;

    // Attempt to split lines if needed
    adjustMultilineText(element);
}

function adjustMultilineText(element) {
    const containerWidth = element.parentElement.offsetWidth;
    let words = element.textContent.split(" ");
    element.textContent = "";

    let line = "";
    for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i] + " ";
        element.textContent = testLine;
        if (element.scrollWidth > containerWidth && line !== "") {
            element.textContent = testLine.slice(0, testLine.length - words[i].length - 1);
            line = words[i] + " ";
            break;
        } else if (element.scrollWidth > containerWidth && line === "") {
            // Single word too large
            element.textContent = words[i];
            break;
        } else {
            line = testLine;
        }
    }
    element.textContent = line;
}
