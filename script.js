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
    let people = { left: {}, right: {} };
    let currentAlbumIndex = 0;
    let currentVote = 0;
    let voteSubmitted = false;
    let peopleID = 1; // Manually set the active peopleID

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
                return lines.map((line, index) => {
                    const [name, url, id, side] = line.split(',');
                    return { 
                        name: name.trim(), 
                        url: url.trim(), 
                        peopleID: parseInt(id.trim()), 
                        side: side.trim(),
                        albumID: index + 1 // Ensure correct albumID assignment
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
            personLeftName.textContent = leftPerson.name;
        }
        
        if (rightPerson) {
            people.right = rightPerson;
            personRight.src = rightPerson.url;
            personRightName.textContent = rightPerson.name;
        }
    }

    function updateDisplay() {
        const album = albums[currentAlbumIndex];
        albumImage.src = album.url;
        albumTooltip.textContent = `${album.name} by ${album.artist}`;
        scaleImage.src = `images/scale.png`;
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

    Promise.all([fetchCSV('albums.csv'), fetchCSV('people.csv')])
        .then(([albumData, peopleData]) => {
            albums = albumData;
            loadPeople(peopleData);

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
