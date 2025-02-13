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
    let intervalId = null; // To store the interval ID
    let holdStartTime = null;
    let initialDelay = 500; // 0.5 seconds initial delay
    let fastInterval = 50;  // Rapid interval after initial delay
    let slowInterval = 200; // Slower interval before initial delay
    let currentInterval = slowInterval;
    let direction = null;

    // Function to fetch and parse CSV data
    function fetchCSV(url) {
        return fetch(url)
            .then(response => response.text())
            .then(csv => {
                return csv.split('\n').map(line => {
                    const [name, artist, url] = line.split(',');
                    return { name: name.trim(), artist: artist.trim(), url: url.trim() };
                });
            });
    }

    // Function to fetch and parse names from a text file
    function fetchNames(url) {
        return fetch(url)
            .then(response => response.text())
            .then(text => {
                const lines = text.split('\n');
                return { left: lines[0].trim(), right: lines[1].trim() };
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
    }

    function getRandomAlbum() {
        currentAlbumIndex = Math.floor(Math.random() * albums.length);
        currentVote = 0;
        updateDisplay();
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

    function startMoving(dir) {
      //Added set timeout to allow single press to function
      setTimeout(() => {
            direction = dir;
            holdStartTime = Date.now();
            currentInterval = slowInterval;

            intervalId = setInterval(() => {
                moveScale(direction);
                if (Date.now() - holdStartTime >= initialDelay) {
                    clearInterval(intervalId);
                    currentInterval = fastInterval;
                    intervalId = setInterval(() => moveScale(direction), currentInterval);
                }
            }, currentInterval);
        }, 50); // Delay of 50 milliseconds
    }

    function stopMoving() {
        clearInterval(intervalId);
        intervalId = null;
        holdStartTime = null;
        direction = null;
    }

    personLeft.src = `images/person1.png`;
    personRight.src = `images/person2.png`;

    // Load data from CSV and text file
    Promise.all([fetchCSV('albums.csv'), fetchNames('people.txt')])
        .then(([albumData, names]) => {
            albums = albumData;
            people = names;

          buttonNext.addEventListener('click', async () => {
              getRandomAlbum()
              updateDisplay()
          });
          buttonEnter.addEventListener('click', submitVote);

           albumImage.addEventListener('click', () => {
            const album = albums[currentAlbumIndex]; // Get current album info
            albumTooltip.textContent = `${album.name} by ${album.artist}`; // Set tooltip text
            albumTooltip.style.display = (albumTooltip.style.display === 'none') ? 'block' : 'none';
          });

            //Long press functions for arrows
          arrowLeft.addEventListener('mousedown', () => {
              startMoving('left');
          });

          arrowRight.addEventListener('mousedown', () => {
              startMoving('right');
          });

          arrowLeft.addEventListener('mouseup', stopMoving);
          arrowRight.addEventListener('mouseup', stopMoving);
          arrowLeft.addEventListener('mouseleave', stopMoving);
          arrowRight.addEventListener('mouseleave', stopMoving);

           // Touch Events (for long-press)
          arrowLeft.addEventListener('touchstart', (event) => {
              event.preventDefault();
              startMoving('left');
          });

          arrowRight.addEventListener('touchstart', (event) => {
              event.preventDefault();
              startMoving('right');
          });

          arrowLeft.addEventListener('touchend', stopMoving);
          arrowRight.addEventListener('touchend', stopMoving);
          arrowLeft.addEventListener('touchcancel', stopMoving);
          arrowRight.addEventListener('touchcancel', stopMoving);

            updateDisplay()

            getRandomAlbum(); // Initial album display
        })
        .catch(error => console.error('Error loading data:', error));
});