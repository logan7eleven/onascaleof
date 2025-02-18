document.addEventListener('DOMContentLoaded', function() {
    const albumImage = document.getElementById('album-image');
    const scaleImage = document.getElementById('scale-image');
    const personLeft = document.getElementById('person-left');
    const personRight = document.getElementById('person-right');
    const personLeftName = document.getElementById('person-left-name');
    const personRightName = document.getElementById('person-right-name');
    const arrowLeft = document.getElementById('arrow-left');
    const arrowRight = document.getElementById('arrow-right');
    const buttonEnter = document.getElementById('button-enter');
    const buttonNext = document.getElementById('button-next');
    const albumTooltip = document.getElementById('album-tooltip');

    let albums = [];
    let people = {};
    let currentAlbumIndex = 0;
    let currentVote = 0;
    let voteSubmitted = false;
    let peopleID = 0; // Will be set dynamically from people.csv

    // Firebase setup
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

    function fetchCSV(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.split('\n');
                return lines.slice(1).map(line => {
                    const [name, artist, url] = line.split(',');
                    return { name: name.trim(), artist: artist.trim(), url: url.trim() };
                });
            });
    }

    function fetchPeople(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.split('\n');
                const firstPerson = lines[1].split(','); // Assuming first row is a header

                return {
                    left: firstPerson[0].trim(),
                    right: firstPerson[1].trim(),
                    peopleID: firstPerson[2].trim() // Extract peopleID
                };
            });
    }

    function updateDisplay() {
        const album = albums[currentAlbumIndex];
        albumImage.src = album.url;
        albumTooltip.textContent = `${album.name} by ${album.artist}`;
        scaleImage.src = `images/scale.png`;
        personLeft.src = `images/person1.png`;
        personRight.src = `images/person2.png`;
        personLeftName.textContent = people.left;
        personRightName.textContent = people.right;
        peopleID = people.peopleID; // Set peopleID from CSV
        albumTooltip.style.display = 'none';
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
            scaleImage.src = `images/${scaleName}`;
        }
    }

    function submitVote() {
        if (!voteSubmitted) {
            let pickName = currentVote !== 0 ? `pick_${Math.abs(currentVote)}${currentVote > 0 ? 'R' : 'L'}.png` : 'scale.png';
            let outlineColor = currentVote > 0 ? '#F7B73D' : currentVote < 0 ? '#BAA0FA' : '';
            scaleImage.src = `images/${pickName}`;
            albumImage.style.outline = outlineColor ? `0.3rem solid ${outlineColor}` : '';
            buttonEnter.disabled = true;
            voteSubmitted = true;

            const album = albums[currentAlbumIndex];

            db.collection("votes").add({
                albumID: currentAlbumIndex, 
                vote_value: currentVote, 
                peopleID: peopleID, 
            })
            .then(() => {
                console.log("Vote submitted:", { albumID: currentAlbumIndex, vote_value: currentVote, peopleID });
            })
            .catch(error => {
                console.error("Error submitting vote:", error);
            });
        }
    }

    buttonNext.addEventListener('click', async () => {
        if (!voteSubmitted) {  
            try {
                await db.collection("votes").add({
                    albumID: currentAlbumIndex, 
                    skip: 1, 
                    peopleID: peopleID,
                });
                console.log("Skip recorded for album:", currentAlbumIndex);
            } catch (error) {
                console.error("Error logging skip:", error);
            }
        }
        getRandomAlbum();
    });

    personLeft.src = `images/person1.png`;
    personRight.src = `images/person2.png`;

    Promise.all([fetchCSV('albums.csv'), fetchPeople('people.csv')])
        .then(([albumData, peopleData]) => {
            albums = albumData;
            people = peopleData;

            arrowLeft.addEventListener('click', () => moveScale('left'));
            arrowRight.addEventListener('click', () => moveScale('right'));

            document.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') {
                    moveScale('left');
                } else if (event.key === 'ArrowRight') {
                    moveScale('right');
                }
            });

            buttonEnter.addEventListener('click', submitVote);
            albumImage.addEventListener('click', () => {
                const album = albums[currentAlbumIndex];
                albumTooltip.textContent = `${album.name} by ${album.artist}`;
                albumTooltip.style.display = albumTooltip.style.display === 'none' ? 'block' : 'none';
            });

            updateDisplay();
            getRandomAlbum();
        })
        .catch(error => console.error('Error loading data:', error));
});
