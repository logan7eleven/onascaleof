const currentPeopleID = 1; // Change manually when needed
let currentVote = 0;
let albums = [];
let people = {};
let currentAlbumIndex = 0;
let voteSubmitted = false;
let shuffledAlbumIndexes = [];

// Initialize Firebase
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

    function fetchCSV(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.split('\n').filter(line => line.trim() !== '');
                return lines.map(line => {
                    const [name, artist, url, albumID] = line.split(',');
                    return {
                        name: name.trim(),
                        artist: artist.trim(),
                        url: url.trim(),
                        albumID: parseInt(albumID.trim(), 10)
                    };
                });
            });
    }

    function fetchPeopleCSV(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.split('\n').filter(line => line.trim() !== '');
                const peopleList = lines.map(line => {
                    const [name, imgUrl, peopleID, side] = line.split(',');
                    return {
                        name: name.trim(),
                        imgUrl: imgUrl.trim(),
                        peopleID: parseInt(peopleID.trim(), 10),
                        side: side.trim()
                    };
                });
                const personL = peopleList.find(person => person.peopleID === currentPeopleID && person.side === "L");
                const personR = peopleList.find(person => person.peopleID === currentPeopleID && person.side === "R");
                return { personL, personR };
            });
    }

    function shuffleAlbums() {
        shuffledAlbumIndexes = [...Array(albums.length).keys()].sort(() => Math.random() - 0.5);
        currentAlbumIndex = 0;
    }

    function updateDisplay() {
        const album = albums[shuffledAlbumIndexes[currentAlbumIndex]];
        albumImage.src = album.url;
        albumTooltip.textContent = `${album.name} by ${album.artist}`;
        scaleImage.src = `images/scale.png`;
        personLeft.src = people.personL.imgUrl;
        personRight.src = people.personR.imgUrl;
        personLeftName.textContent = people.personL.name;
        personRightName.textContent = people.personR.name;
        albumTooltip.style.display = 'none';
        albumImage.style.outline = '';
        voteSubmitted = false;
        buttonEnter.disabled = false;
    }

    function moveScale(direction) {
        if (!voteSubmitted) {
            if (direction === "right") {
                currentVote = Math.min(100, currentVote + 5);
            } else if (direction === "left") {
                currentVote = Math.max(-100, currentVote - 5);
            }

            let scaleName = "";
            if (currentVote > 0) {
                scaleName = `scale_${currentVote}R.png`;
            } else if (currentVote < 0) {
                scaleName = `scale_${Math.abs(currentVote)}L.png`;
            } else {
                scaleName = `scale.png`;
            }
            scaleImage.src = `images/${scaleName}`;
        }
    }

    function submitVote() {
        if (!voteSubmitted) {
            const album = albums[shuffledAlbumIndexes[currentAlbumIndex]];
            submitToDatabase(album.albumID, currentVote, currentPeopleID, 0);
            voteSubmitted = true;
            buttonEnter.disabled = true;
        }
    }

    function skipAlbum() {
        const album = albums[shuffledAlbumIndexes[currentAlbumIndex]];
        submitToDatabase(album.albumID, 0, currentPeopleID, 1);
    }

    function submitToDatabase(albumID, voteValue, peopleID, skipValue) {
        db.collection("votes").add({
            albumID,
            vote_value: voteValue,
            peopleID,
            skip: skipValue,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => console.log("Vote recorded"))
          .catch(error => console.error("Error saving vote: ", error));
    }

    function nextAlbum() {
        if (currentAlbumIndex < shuffledAlbumIndexes.length - 1) {
            currentAlbumIndex++;
        } else {
            shuffleAlbums();
            currentAlbumIndex = 0;
        }
        currentVote = 0;
        updateDisplay();
    }

    arrowLeft.addEventListener("click", () => moveScale('left'));
    arrowRight.addEventListener("click", () => moveScale('right'));
    buttonEnter.addEventListener("click", submitVote);
    buttonNext.addEventListener("click", () => {
        skipAlbum();
        nextAlbum();
    });
    albumImage.addEventListener("click", () => {
        albumTooltip.style.display = (albumTooltip.style.display === 'none') ? 'block' : 'none';
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            moveScale('left');
        } else if (event.key === 'ArrowRight') {
            moveScale('right');
        }
    });

    Promise.all([fetchCSV('albums.csv'), fetchPeopleCSV('people.csv')])
        .then(([albumData, peopleData]) => {
            albums = albumData;
            people = peopleData;
            shuffleAlbums();
            updateDisplay();
        })
        .catch(error => console.error("Error loading data:", error));
});
