// ✅ Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCUt5sTKJRYe-gguuon8U7SlyZtttawTSA",
    authDomain: "onascaleof-2e3b4.firebaseapp.com",
    projectId: "onascaleof-2e3b4",
    storageBucket: "onascaleof-2e3b4.firebasestorage.app",
    messagingSenderId: "96599540311",
    appId: "1:96599540311:web:47c86e4e6fce30e3065912"
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ✅ Your existing album queue logic (untouched)
let albumQueue = [];
let currentAlbum = null;
let currentPeopleID = 123; // This stays static until changed manually

// 🎲 Shuffle function (this stays exactly as it was)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 🔄 Load a shuffled list of albums (exactly as you had it before)
function initializeAlbumQueue() {
    albumQueue = [...Array(370).keys()]; // Example: 370 albums, numbered 0-369
    shuffleArray(albumQueue);
    loadNextAlbum();
}

// 🎵 Load the next album (exactly as you had it before)
function loadNextAlbum() {
    if (albumQueue.length === 0) {
        console.log("No more albums to load.");
        return;
    }

    currentAlbum = albumQueue.pop();
    console.log("Now showing album:", currentAlbum);

    // This is where you'd update the UI with the new album (YOUR EXISTING CODE GOES HERE)
}

// 🏆 Submit a vote (Firestore only)
function submitVote(value) {
    if (currentAlbum === null) return;

    const voteData = {
        albumID: currentAlbum,
        vote_value: value,
        peopleID: currentPeopleID,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("votes").add(voteData)
        .then(() => {
            console.log("Vote submitted:", voteData);
            loadNextAlbum();
        })
        .catch(error => console.error("Error submitting vote:", error));
}

// 🚀 Skip an album (Firestore only)
function skipAlbum() {
    if (currentAlbum === null) return;

    const skipData = {
        albumID: currentAlbum,
        vote_value: 0, // Using 0 to mark skips
        peopleID: currentPeopleID,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("votes").add(skipData)
        .then(() => {
            console.log("Album skipped:", currentAlbum);
            loadNextAlbum();
        })
        .catch(error => console.error("Error skipping album:", error));
}

// 🎬 Attach event listeners
document.getElementById("button-enter").addEventListener("click", () => submitVote(50)); // Example value
document.getElementById("button-next").addEventListener("click", skipAlbum);

// 🔥 Load albums on page start (EXACTLY as you had it before)
document.addEventListener("DOMContentLoaded", initializeAlbumQueue);
