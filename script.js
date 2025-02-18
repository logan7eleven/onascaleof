document.addEventListener('DOMContentLoaded', function() {
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
    const personImageContainers = document.getElementsByClassName('person-image-container');

    let albums = [];
    let people = { left: {}, right: {} };
    let currentAlbumIndex = 0;
    let currentVote = 0;
    let voteSubmitted = false;
    let peopleID = 1;
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
                const [name, url, id, side] = line.split(',');
                return { 
                    name: name.trim(), 
                    url: url.trim(), 
                    peopleID: parseInt(id.trim()), 
                    side: side.trim()
                };
            });
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
                albumTooltip.textContent = `${album.name} by ${album.artist}`;
                albumTooltip.style.display = albumTooltip.style.display === 'none' ? 'block' : 'none';
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
            adjustTextSize(albumInfoText, albumContainer);

            // Person Left
            personLeft.classList.toggle('image-faded', infoMode);
            personLeftInfoText.textContent = infoMode ? people.left.name : '';
            personLeftInfoText.style.display = infoMode ? 'flex' : 'none';
            adjustTextSize(personLeftInfoText, personImageContainers[0]);

            // Person Right
            personRight.classList.toggle('image-faded', infoMode);
            personRightInfoText.textContent = infoMode ? people.right.name : '';
            personRightInfoText.style.display = infoMode ? 'flex' : 'none';
            adjustTextSize(personRightInfoText, personImageContainers[1]);
        });

        function adjustTextSize(textElement, containerElement) {
            if (infoMode) {
                let fontSize = 25; // Initial font size in vmin
                textElement.style.fontSize = fontSize + "vmin";

                while (textElement.scrollWidth > containerElement.offsetWidth || textElement.scrollHeight > containerElement.offsetHeight) {
                    fontSize -= 0.1; // Reduce font size
                    textElement.style.fontSize = fontSize + "vmin";

                    // Safety check to prevent infinite loop
                    if (fontSize <= 0.1) {
                        textElement.style.fontSize = "0.1vmin"; // Minimum size
                        break;
                    }
                }
            } else {
                textElement.style.fontSize = ""; // Reset to default
            }
        }
});
