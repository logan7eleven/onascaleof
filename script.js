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
    // let currentAlbumIndex = 0; // No longer needed, we'll use albumId
    let currentVote = 0;
    let shownAlbumIds = []; // Array to track shown album IDs

    // Function to fetch and parse CSV data
    function fetchCSV(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                return csv.split('\n').map((line, index) => { // Add index for ID
                    const [name, artist, url] = line.split(',');
                    return {
                        id: index, // Assign a unique ID based on row number
                        name: (name || '').trim(),
                        artist: (artist || '').trim(),
                        url: (url || '').trim()
                    };
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

    function updateDisplay(album) { // Now takes the album object directly
        albumImage.src = album.url;
        albumImage.dataset.albumId = album.id; // Store album ID in the image's dataset
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
        const availableAlbums = albums.filter(album => !shownAlbumIds.includes(album.id));

        if (availableAlbums.length === 0) {
            alert("You've seen all the albums!");
            shownAlbumIds = []; // Reset for a new round
            // Refilter after reset, same logic as before:
             const newlyAvailableAlbums = albums.filter(album => !shownAlbumIds.includes(album.id));
            if (newlyAvailableAlbums.length > 0){
                const randomAlbum = newlyAvailableAlbums[Math.floor(Math.random() * newlyAvailableAlbums.length)];
                updateDisplay(randomAlbum);
                shownAlbumIds.push(randomAlbum.id);
                return;
            } else {
                return;
            }
        }

        const randomAlbum = availableAlbums[Math.floor(Math.random() * availableAlbums.length)];
        updateDisplay(randomAlbum);
        shownAlbumIds.push(randomAlbum.id); // Store the ID
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
        // Get album ID from the image's dataset
        const albumId = parseInt(albumImage.dataset.albumId, 10); // Parse as integer

        // No need to check if it's already shown; we're already tracking that.

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
            const albumId = parseInt(albumImage.dataset.albumId, 10);
            const album = albums.find(a => a.id === albumId); // Find album by ID
            albumTooltip.textContent = `${album.name} by ${album.artist}`;
            albumTooltip.style.display = (albumTooltip.style.display === 'none') ? 'block' : 'none';
          });
            getRandomAlbum(); // Initial album display
        })
        .catch(error => console.error('Error loading data:', error));
});
