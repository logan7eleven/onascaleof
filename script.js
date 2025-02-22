document.addEventListener('DOMContentLoaded', function() {
    const mainContainer = document.getElementById('main-container');
    const albumImage = document.getElementById('album-image');
    const scaleImage = document.getElementById('scale-image');
    const personLeft = document.getElementById('person-left');
    const personRight = document.getElementById('person-right');
    const personLeftName = document.getElementById('person-left-name');
    const personRightName = document.getElementById('person-right-name');
    const buttonEnter = document.getElementById('button-enter');
    const buttonNext = document.getElementById('button-next');
    const albumTooltip = document.getElementById('album-tooltip');
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
                console.log("Processing line:", line);/*Add this line*/
                const parts = line.split(',');
                if (parts.length !== 4) {
                    console.warn("Skipping malformed line in people.csv:", line);
                    return null; // Skip this line
                }
                const [name, url, id, side] = parts.map(part => part.trim()); // Trim whitespace
                const peopleID = parseInt(id); // Parse the ID
                if (isNaN(peopleID)) {
                    console.warn("Invalid peopleID in line:", line);
                    return null; // Skip this line
                }

                return { 
                    name: name, 
                    url: url, 
                    peopleID: peopleID, 
                    side: side
                };
            }).filter(person => person !== null); // Remove skipped lines
        });
}

function loadPeople(data) {
        const filteredPeople = data.filter(person => person.peopleID === peopleID);
        
        const leftPerson = filteredPeople.find(person => person.side === 'L');
        const rightPerson = filteredPeople.find(person => person.side === 'R');

        if (leftPerson) {
            people.left = leftPerson;
            personLeft.src = leftPerson.url;
            console.log("Left person's URL:", leftPerson.url);/*Add this line*/
        }
        
        if (rightPerson) {
            people.right = rightPerson;
            personRight.src = rightPerson.url;
            console.log("Right person's URL:", rightPerson.url);/*Add this line*/
        }
    }

    function updateDisplay() {
        const album = albums[currentAlbumIndex];
        albumImage.src = album.url;
        scaleImage.src = `images/scale.png`;
        albumImage.style.outline = '';
        voteSubmitted = false;
        buttonEnter.disabled = false;
    }

    function getRandomAlbum() {
        currentAlbumIndex = Math.floor(Math.random() * albums.length);
        currentVote = 0;
        updateDisplay();
    }

    function moveScale(direction) {
        if (!voteSubmitted) {
            if (direction === "right") {
                currentVote = Math.min(100, currentVote + 5);
            } else if (direction === "left") {
                currentVote = Math.max(-100, currentVote - 5);
            }

            let scaleName = currentVote !== 0 ? `scale_${Math.abs(currentVote)}${currentVote > 0 ? 'R' : 'L'}.png` : 'scale.png';
            scaleImage.src = `images/scale.png`;
        }
    }

    function submitVote() {
        if (!voteSubmitted) {
            let pickName = currentVote !== 0 ? `pick_${Math.abs(currentVote)}${currentVote > 0 ? 'R' : 'L'}.png` : 'scale.png';
            let outlineColor = currentVote > 0 ? '#F7B73D' : currentVote < 0 ? '#BAA0FA' : '';
            scaleImage.src = `images/scale.png`;
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
});
