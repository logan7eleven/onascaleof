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
    const scale = document.getElementById('scale');
    const voteMarker = document.getElementById('vote-marker');

    // Variables related to albums, votes, scale, and people
    let albums = [];
    let shuffledAlbums = [];
    let people = { left: {}, right: {} };
    let currentAlbumIndex = 0;
    let currentVote = 0;
    let voteSubmitted = false;
    let peopleID = 1;
    let infoMode = false;
    const numSegments = 20;

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

    function resizeMainContainer() {
        mainContainer.style.width = '';
        mainContainer.style.height = '';
       
        let maxHeight = window.innerHeight * 0.9; // 90% of viewport height
        let maxWidth = window.innerWidth * 0.9;   // 90% of viewport width
    
        // Calculate dimensions maintaining 2:3 aspect ratio
        let containerWidth, containerHeight;
    
        // Calculate both possible dimensions
        let heightBasedWidth = (maxHeight * 2) / 3;  // Width if height is constraint
        let widthBasedHeight = (maxWidth * 3) / 2;   // Height if width is constraint
    
        // Choose the dimension that fits within both constraints
        if (widthBasedHeight <= maxHeight) {
            // Width is the constraint
            containerWidth = maxWidth;
            containerHeight = widthBasedHeight;
        } else {
            // Height is the constraint
            containerWidth = heightBasedWidth;
            containerHeight = maxHeight;
        }
    
        mainContainer.style.width = `${Math.floor(containerWidth)}px`;
        mainContainer.style.height = `${Math.floor(containerHeight)}px`;
        mainContainer.style.fontSize = `${Math.floor(containerWidth * 0.015)}px`;
    
        setPersonImageContainerSize();
    }

    function setPersonImageContainerSize() {
        let albumHeight = albumContainer.offsetHeight;
        const personContainerHeight = albumHeight / 3;
        const personContainerWidth = personContainerHeight * 0.75;

        document.querySelectorAll('.person-image-container').forEach(container => {
            container.style.height = `${personContainerHeight}px`;
            container.style.width = `${personContainerWidth}px`;
        });
    }

    function calculateOptimalFontSize(element, containerHeight, containerWidth, maxHeightPercent) {
        element.style.fontSize = '';
        
        // Set proper display for measurement
        const originalDisplay = element.style.display;
        element.style.display = 'flex';

        // Ensure proper word break behavior
        element.style.wordBreak = 'keep-all';
        element.style.overflowWrap = 'break-word';
        
        // Calculate maximum dimensions based on percentages
        const maxHeight = containerHeight * (maxHeightPercent / 100);
        const maxWidth = containerWidth * 0.88;  // 88% of container width
        
        let fontSize = 1;
        let low = 1;
        let high = 1000;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            element.style.fontSize = `${mid}px`;
            
            const rect = element.getBoundingClientRect();
            const fits = rect.width <= maxWidth && rect.height <= maxHeight;
            
            if (fits) {
                fontSize = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        
        // Restore original display property
        element.style.display = originalDisplay;
        return fontSize;
    }

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
        
        voteMarker.style.display = 'none';
        voteMarker.style.left = '50%';
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

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

        scale.style.setProperty('--middle-line-opacity', currentVote === 0 ? '1' : '0');
    }

    function submitVote() {
        if (!voteSubmitted) {
            let outlineColor = currentVote > 0 ? "#F7B73D" : currentVote < 0 ? "#BAA0FA" : "";
            albumImage.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
            
            if (currentVote > 0) {
                personRight.style.outline = `0.3em solid ${outlineColor}`;
                personLeft.style.outline = "";
            } else if (currentVote < 0) {
                personLeft.style.outline = `0.3em solid ${outlineColor}`;
                personRight.style.outline = "";
            }

            voteMarker.style.display = 'block';
            if (currentVote > 0) {
                voteMarker.style.left = `${50 + (currentVote/2)}%`;
            } else if (currentVote < 0) {
                voteMarker.style.left = `${50 + (currentVote/2)}%`;
            } else {
                voteMarker.style.left = '50%';
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

    function updateVoteOutline(clickedSide) {
        let outlineColor = currentVote > 0 ? "#F7B73D" : currentVote < 0 ? "#BAA0FA" : "";
        albumImage.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
        
        if (clickedSide === 'left') {
            personLeft.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
            personRight.style.outline = "";
        } else if (clickedSide === 'right') {
            personRight.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
            personLeft.style.outline = "";
        }
    }

    function getNextAlbum() {
        currentAlbumIndex++;
        if (currentAlbumIndex >= shuffledAlbums.length) {
            shuffledAlbums = shuffleArray([...albums]);
            currentAlbumIndex = 0;
        }
        updateDisplay();
    }

    // Event Listeners
    buttonPersonLeft.addEventListener('click', () => moveScale('left', 'left'));
    buttonPersonRight.addEventListener('click', () => moveScale('right', 'right'));
    buttonEnter.addEventListener('click', submitVote);
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

    buttonInfo.addEventListener('click', () => {
        infoMode = !infoMode;

        // Handle album image and info
        albumImage.classList.toggle('image-faded', infoMode);
        
        if (infoMode) {
            const album = shuffledAlbums[currentAlbumIndex];
            const wrapper = document.querySelector('.album-image-wrapper');
            const containerHeight = wrapper.offsetHeight;
            const containerWidth = wrapper.offsetWidth;
            
            // Set content
            albumNameElement.textContent = album.name;
            albumArtistElement.textContent = album.artist;
            albumInfoText.style.display = 'flex';

            // Calculate available height for each element based on their CSS percentages
            const nameHeight = containerHeight * 0.35;  // 35% of container
            const artistHeight = containerHeight * 0.35; // 35% of container
            
            // Calculate and set font sizes based on actual content
            const nameSize = calculateOptimalFontSize(albumNameElement, containerHeight, containerWidth, 35);
            const artistSize = calculateOptimalFontSize(albumArtistElement, containerHeight, containerWidth, 35);

            // Apply calculated sizes
            albumNameElement.style.fontSize = `${nameSize}px`;
            albumArtistElement.style.fontSize = `${artistSize}px`;

            // Simply set 'by' text to 15% of container height
            document.getElementById('album-by').style.fontSize = `${Math.floor(containerHeight * 0.15)}px`;
            
            // Handle person info text sizes
            const personContainers = document.querySelectorAll('.person-image-container');
            personContainers.forEach(container => {
                const infoText = container.querySelector('.overlay-text');
                if (infoText) {
                    const personHeight = container.offsetHeight;
                    const personWidth = container.offsetWidth;
                    const personFontSize = calculateOptimalFontSize(infoText, personHeight, personWidth, 88);
                    infoText.style.fontSize = `${personFontSize}px`;
                    infoText.style.display = 'flex';
                }
            });
        } else {
            albumInfoText.style.display = 'none';
            personLeftInfoText.style.display = 'none';
            personRightInfoText.style.display = 'none';
        }

        // Toggle person image effects
        personLeft.classList.toggle('image-faded', infoMode);
        personRight.classList.toggle('image-faded', infoMode);
    });

    // Window resize event handlers
    window.addEventListener('resize', resizeMainContainer);
    window.addEventListener('load', resizeMainContainer);
    window.addEventListener('orientationchange', resizeMainContainer);

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
        scale.style.setProperty('--middle-line-opacity', '1');
    }).catch(error => {
        console.error('Error loading data:', error);
    });
});
