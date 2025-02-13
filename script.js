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
    let shownAlbums = [];

    function fetchCSV(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(csv => {
                const parsedAlbums = csv.split('\n').map(line => {
                    const [name, artist, url] = line.split(',');
                    return { name: (name || '').trim(), artist: (artist || '').trim(), url: (url || '').trim() };
                }).filter(album => album.name && album.artist && album.url);
                console.log("Parsed Albums from CSV:", parsedAlbums);
                return parsedAlbums;
            })
            .catch(error => {
                console.error("Error fetching or parsing CSV:", error);
                alert("Error loading album data. Check console.");
                throw error;
            });
    }

   function fetchNames(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            // Split by line, then trim each part
            const lines = text.split('\n').map(line => line.trim());
            // Ensure we have at least two lines
            if (lines.length < 2) {
                throw new Error("people.txt must contain at least two lines.");
            }
            const names = { left: lines[0], right: lines[1] };
            console.log("Fetched Names:", names);
            return names;
        })
        .catch(error => {
            console.error("Error fetching names:", error);
            alert("Error loading name data. Check console.");
            throw error; // Re-throw to stop further execution
        });
}

    function updateDisplay() {
        if (albums.length > 0 && currentAlbumIndex >= 0 && currentAlbumIndex < albums.length) {
            const album = albums[currentAlbumIndex];
            albumImage.src = album.url;
            albumTooltip.textContent = `${album.name} by ${album.artist}`;
            scaleImage.src = `images/scale.png`;
            personLeft.src = `images/person1.png`;
            personRight.src = `images/person2.png`;
            personLeftName.textContent = people.left;
            personRightName.textContent = people.right;
            albumTooltip.style.display = 'none';
            albumImage.style.outline = '';
            buttonEnter.disabled = false;
        } else {
            console.error("Cannot update display: Invalid album index or empty albums array.");
        }
    }


    function getRandomAlbum() {
        console.log("getRandomAlbum called. shownAlbums:", shownAlbums, "albums length:", albums.length);

        const availableAlbums = albums.filter(album => !shownAlbums.includes(album.url));
        console.log("Available Albums:", availableAlbums);

        if (availableAlbums.length === 0) {
            alert("You've seen all the albums!");
            shownAlbums = [];
            const newlyAvailableAlbums = albums.filter(album => !shownAlbums.includes(album.url));
            console.log("Newly Available Albums (after reset):", newlyAvailableAlbums);

            if (newlyAvailableAlbums.length > 0) {
                const randomIndex = Math.floor(Math.random() * newlyAvailableAlbums.length);
                currentAlbumIndex = albums.indexOf(newlyAvailableAlbums[randomIndex]);
                console.log("New random index:", randomIndex, "currentAlbumIndex:", currentAlbumIndex);

                if (currentAlbumIndex === -1) {
                    console.error("ERROR: indexOf returned -1 after reset.");
                    return;
                }

                currentVote = 0;
                updateDisplay();
                shownAlbums.push(albums[currentAlbumIndex].url);
                return;
            } else {
                console.log("No albums available even after reset.");
                return;
            }
        }

        const randomIndex = Math.floor(Math.random() * availableAlbums.length);
        console.log("Random index from availableAlbums:", randomIndex);

        if (albums.length === 0) {
            console.error("ERROR: albums array is empty!");
            return;
        }
        if (randomIndex < 0 || randomIndex >= availableAlbums.length) {
            console.error("ERROR: randomIndex is out of bounds.");
            return;
        }

        currentAlbumIndex = albums.indexOf(availableAlbums[randomIndex]);
        console.log("currentAlbumIndex in original albums:", currentAlbumIndex);

        if (currentAlbumIndex === -1) {
            console.error("ERROR: indexOf returned -1.");
            return;
        }

        currentVote = 0;
        updateDisplay();
        shownAlbums.push(albums[currentAlbumIndex].url);
    }

    function moveScale(direction) {
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

    function submitVote() {
        let pickName = "";
        let outlineColor = '';
        if (currentVote > 0) {
            pickName = `pick_${currentVote}R.png`;
            outlineColor = '#F7B73D';
        } else if (currentVote < 0) {
            pickName = `pick_${Math.abs(currentVote)}L.png`;
            outlineColor = '#BAA0FA';
        } else {
            pickName = `scale.png`;
            outlineColor = '';
        }
        scaleImage.src = `images/${pickName}`;
        albumImage.style.outline = `0.3rem solid ${outlineColor}`;
        buttonEnter.disabled = true;
    }

    Promise.all([fetchCSV('albums.csv.txt'), fetchNames('people.txt')])
    .then(([albumData, names]) => {
        albums = albumData;
        people = names;

        if (albums.length > 0) {
            getRandomAlbum();
        } else {
            console.error("No albums loaded.");
            alert("Failed to load albums. Check console.");
        }
    })
    .catch(error => {
        console.error("Error in Promise.all:", error);
    });
});
