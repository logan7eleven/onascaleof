const currentPeopleID = "1"; // Change manually when needed
let currentVote = 0;

function fetchCSV(url) {
    return fetch(url)
        .then(response => response.text())
        .then(csv => {
            const lines = csv.split('\n').filter(line => line.trim() !== '');
            return lines.map(line => {
                const [albumID, name, artist, url] = line.split(',');
                return {
                    albumID: albumID.trim(),
                    name: name.trim(),
                    artist: artist.trim(),
                    url: url.trim()
                };
            });
        });
}

function fetchPeopleCSV(url) {
    return fetch(url)
        .then(response => response.text())
        .then(csv => {
            const lines = csv.split('\n').filter(line => line.trim() !== '');
            const people = lines.map(line => {
                const [name, imgUrl, peopleID, side] = line.split(',');
                return {
                    name: name.trim(),
                    imgUrl: imgUrl.trim(),
                    peopleID: peopleID.trim(),
                    side: side.trim()
                };
            });
            const personL = people.find(person => person.peopleID === currentPeopleID && person.side === "L");
            const personR = people.find(person => person.peopleID === currentPeopleID && person.side === "R");
            return { personL, personR };
        });
}

function moveScale(direction) {
    if (direction === 'left' && currentVote > -100) {
        currentVote -= 5;
    } else if (direction === 'right' && currentVote < 100) {
        currentVote += 5;
    }
    console.log("Current Vote Value:", currentVote);
    // Update scale bar visually here
}

document.getElementById("leftButton").addEventListener("click", () => moveScale('left'));
document.getElementById("rightButton").addEventListener("click", () => moveScale('right'));

document.getElementById("enterButton").addEventListener("click", () => {
    const albumID = "someAlbumID"; // Replace with actual albumID
    submitVote(albumID, currentVote, currentPeopleID);
});

document.getElementById("nextButton").addEventListener("click", () => {
    const albumID = "someAlbumID"; // Replace with actual albumID
    skipAlbum(albumID);
    console.log("Next album loading...");
});

function submitVote(albumID, voteValue, peopleID) {
    const voteData = {
        albumID,
        vote_value: voteValue,
        peopleID
    };
    console.log("Submitting vote:", voteData);
    // Firestore submission logic goes here
}

function skipAlbum(albumID) {
    console.log("Skipping album:", albumID);
    // Firestore submission logic for skips goes here
}

// Example usage
fetchCSV('albums.csv').then(albums => {
    console.log("Loaded Albums:", albums);
});

fetchPeopleCSV('people.csv').then(({ personL, personR }) => {
    console.log("Left Person:", personL);
    console.log("Right Person:", personR);
});
