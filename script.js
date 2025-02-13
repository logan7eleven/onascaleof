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
    let shownAlbums = []; // Array to track shown albums THIS SESSION

    // Function to fetch and parse CSV data
    function fetchCSV(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                return csv.split('\n').map(line => {
                    const [name, artist, url] = line.split(',');
                    return { name: (name || '').trim(), artist: (artist || '').trim(), url: (url || '').trim() };
                }).filter(album => album.name && album.artist && album.url);
            });
    }

    // Function to fetch and parse names from a text file
    function fetchNames(url) {
        return fetch(url)
            .then(response => response.text())
            .then(text => {
                const lines = text.split('\n');
                return { left: (lines[0] || '').trim(), right: (lines[1] || '').trim() };
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
        albumTooltip.style.display = 'none';
        albumImage.style.outline = '';
        buttonEnter.disabled = false;
    }

  function getRandomAlbum() {
    // Filter out albums that have already been shown
    const availableAlbums = albums.filter(album => !shownAlbums.includes(album.url));

    if (availableAlbums.length === 0) {
        // All albums have been shown.  Reset or show a message.
        alert("You've seen all the albums!"); // Or handle differently
        shownAlbums = []; // Reset for a new "round"

        // **FIXED RECURSIVE CALL:** We need to re-filter after resetting shownAlbums
        const newlyAvailableAlbums = albums.filter(album => !shownAlbums.includes(album.url));
        if (newlyAvailableAlbums.length > 0) { // Check again after reset
            const randomIndex = Math.floor(Math.random() * newlyAvailableAlbums.length);
            currentAlbumIndex = albums.indexOf(newlyAvailableAlbums[randomIndex]);
            currentVote = 0;
            updateDisplay();
            shownAlbums.push(albums[currentAlbumIndex].url);
            return; //  Important: Return after processing the new album
        } else {
             return; // No albums available even after reset (shouldn't happen with valid data)
        }
    }

    // Get a random index from the *available* albums
    const randomIndex = Math.floor(Math.random() * availableAlbums.length);
    currentAlbumIndex = albums.indexOf(availableAlbums[randomIndex]); // Get index in *original* albums array

    currentVote = 0;
    updateDisplay();

    // Add the newly shown album to the shownAlbums array
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

    personLeft.src = `images/person1.png`;
    personRight.src = `images/person2.png`;

    // Load data from CSV and text file
    Promise.all([fetchCSV('albums.csv.txt'), fetchNames('people.txt')])
        .then(([albumData, names]) => {
            albums = albumData;
            people = names;

            // Event Listeners
            arrowLeft.addEventListener('click', () => moveScale('left'));
            arrowRight.addEventListener('click', () => moveScale('right'));

             // Key press Functions
            document.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowLeft') {
                    moveScale('left');
                } else if (event.key === 'ArrowRight') {
                    moveScale('right');
                }
            });


          buttonNext.addEventListener('click', () => {
              getRandomAlbum();
          });
          buttonEnter.addEventListener('click', submitVote);

           albumImage.addEventListener('click', () => {
            const album = albums[currentAlbumIndex];
            albumTooltip.textContent = `${album.name} by ${album.artist}`;
            albumTooltip.style.display = (albumTooltip.style.display === 'none') ? 'block' : 'none';
          });
            getRandomAlbum(); // Initial album display
        })
        .catch(error => console.error('Error loading data:', error));
});
