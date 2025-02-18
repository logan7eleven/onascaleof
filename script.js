const currentPeopleID = "1"; // Change manually when needed
let currentVote = 0;
let albums = [];
let people = {};
let currentAlbumIndex = 0;
let voteSubmitted = false;

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
                        albumID: albumID.trim()
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
                        peopleID: peopleID.trim(),
                        side: side.trim()
                    };
                });
                const personL = peopleList.find(person => person.peopleID === currentPeopleID && person.side === "L");
                const personR = peopleList.find(person => person.peopleID === currentPeopleID && person.side === "R");
                return { personL, personR };
            });
    }

    function updateDisplay() {
        const album = albums[currentAlbumIndex];
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
            const album = albums[currentAlbumIndex];
            submitVoteToDatabase(album.albumID, currentVote, currentPeopleID);
            voteSubmitted = true;
            buttonEnter.disabled = true;
        }
    }

    function submitVoteToDatabase(albumID, voteValue, peopleID) {
        const voteData = {
            albumID,
            vote_value: voteValue,
            peopleID
        };
        console.log("Submitting vote:", voteData);
        // Firestore submission logic here
    }

    function skipAlbum() {
        const album = albums[currentAlbumIndex];
        console.log("Skipping album:", album.albumID);
        // Firestore submission logic for skips
    }

    function getRandomAlbum() {
        currentAlbumIndex = Math.floor(Math.random() * albums.length);
        currentVote = 0;
        updateDisplay();
    }

    arrowLeft.addEventListener("click", () => moveScale('left'));
    arrowRight.addEventListener("click", () => moveScale('right'));
    buttonEnter.addEventListener("click", submitVote);
    buttonNext.addEventListener("click", () => {
        skipAlbum();
        getRandomAlbum();
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
            getRandomAlbum();
        })
        .catch(error => console.error("Error loading data:", error));
});
