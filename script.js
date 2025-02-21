document.addEventListener('DOMContentLoaded', function () {
    const mainContainer = document.getElementById('main-container');
    const albumImage = document.getElementById('album-image');
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
    let shuffledAlbums = [];
    let people = { left: {}, right: {} };
    let currentAlbumIndex = 0;
    let currentVote = 0;
    let voteSubmitted = false;
    let peopleID = 2;
    let infoMode = false;

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

    function setPersonImageContainerSize() {
        const albumContainerHeight = albumContainer.offsetHeight;
        const personImageContainerHeight = albumContainerHeight / 3;
        const personImageContainerWidth = personImageContainerHeight * 0.75; // 3:4 ratio

        document.querySelectorAll('.person-image-container').forEach(container => {
            container.style.height = `${personImageContainerHeight}px`;
            container.style.width = `${personImageContainerWidth}px`;
        });
    }

    function resizeMainContainer() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let containerWidth = viewportHeight * 0.6 * 0.9;
        let containerHeight = viewportHeight * 0.9;

        if (containerWidth > viewportWidth * 0.9) {
            containerWidth = viewportWidth * 0.9;
            containerHeight = containerWidth * 1.5;
        }

        mainContainer.style.width = `${containerWidth}px`;
        mainContainer.style.height = `${containerHeight}px`;

        const containerHeightPx = mainContainer.offsetHeight;
        const baseFontSize = containerHeightPx * 0.015;
        mainContainer.style.fontSize = `${baseFontSize}px`;
        setPersonImageContainerSize();
    }

    resizeMainContainer();
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
        console.log("loadPeople called with data:", data);
        const filteredPeople = data.filter(person => person.peopleID === peopleID);
        console.log("filteredPeople:", filteredPeople);

        const leftPerson = filteredPeople.find(person => person.side === 'L');
        const rightPerson = filteredPeople.find(person => person.side === 'R');

        console.log("leftPerson:", leftPerson);
        console.log("rightPerson:", rightPerson);

        if (leftPerson) {
            people.left = leftPerson;
            personLeft.src = leftPerson.url;
            console.log("personLeft.src set to:", personLeft.src);
        }

        if (rightPerson) {
            people.right = rightPerson;
            if (rightPerson.url) {
                personRight.src = rightPerson.url;
                console.log("personRight.src set to:", personRight.src);
            } else {
                console.warn("rightPerson.url is undefined/empty!");
            }
        }
    }

    function updateDisplay() {
        const album = shuffledAlbums[currentAlbumIndex];
        albumImage.src = album.url;
        albumImage.style.outline = '';
        voteSubmitted = false;
        buttonEnter.disabled = false;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function getNextAlbum() {
        currentVote = 0;
        currentAlbumIndex++;

        if (currentAlbumIndex >= shuffledAlbums.length) {
            shuffledAlbums = shuffleArray([...albums]);
            currentAlbumIndex = 0;
        }
        updateDisplay();
        updateScale();
    }

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
            albumImage.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : '';
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

    const albumsCSV = '/albums.csv';
    const peopleCSV = '/people.csv';

    Promise.all([fetchAlbums(albumsCSV), fetchPeople(peopleCSV)])
        .then(([albumData, peopleData]) => {
            albums = albumData;
            shuffledAlbums = shuffleArray([...albums]);
            loadPeople(peopleData);
            createScaleSegments();
            updateScale();

            currentAlbumIndex = 0;
            updateDisplay();

            buttonPersonLeft.addEventListener('click', () => moveScale('left'));
            buttonPersonRight.addEventListener('click', () => moveScale('right'));
            buttonEnter.addEventListener('click', submitVote);
        });

    buttonInfo.addEventListener('click', () => {
        infoMode = !infoMode;

        albumImage.classList.toggle('image-faded', infoMode);
        const album = shuffledAlbums[currentAlbumIndex];
        document.getElementById('album-name').textContent = infoMode ? album.name : '';
        document.getElementById('album-artist').textContent = infoMode ? album.artist : '';

        if (infoMode) {
            albumInfoText.style.display = 'flex';
            adjustAlbumInfoFontSize();
        } else {
            albumInfoText.style.display = 'none';
        }

        personLeft.classList.toggle('image-faded', infoMode);
        personLeftInfoText.textContent = infoMode ? people.left.name : '';
        personLeftInfoText.style.display = infoMode ? 'flex' : 'none';

        personRight.classList.toggle('image-faded', infoMode);
        personRightInfoText.textContent = infoMode ? people.right.name : '';
        personRightInfoText.style.display = infoMode ? 'flex' : 'none';
    });

    function adjustAlbumInfoFontSize() {
        const albumNameElement = document.getElementById('album-name');
        const albumArtistElement = document.getElementById('album-artist');

        albumNameElement.style.fontSize = '';
        albumArtistElement.style.fontSize = '';

        const nameFontSize = getMaxFontSize(albumNameElement);
        const artistFontSize = getMaxFontSize(albumArtistElement);

        const minFontSize = Math.min(nameFontSize, artistFontSize);

        albumNameElement.style.fontSize = `${minFontSize}px`;
        albumArtistElement.style.fontSize = `${minFontSize}px`;
    }

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
                low = mid + 1;
                fontSize = mid;
            }
        }
        return fontSize;
    }
});
