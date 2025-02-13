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
    let longPressDelay = 500; // Delay before long press activates (ms)
    let maxInterval = 50;  //Min Time between movement
    let minInterval = 500; //Max Time Between Movement
    let direction = null;
    let nextVote = null;

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
            currentVote = Math.min(100, currentVote + 1);
        } else if (direction === "left") {
            currentVote = Math.max(-100, currentVote - 1);
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
        direction = dir;
        holdStartTime = Date.now();
        nextVote = currentVote

        intervalId = setInterval(() => {
            const timeHeld = Date.now() - holdStartTime;
            let interval = minInterval - (minInterval - maxInterval) * Math.min(1, timeHeld/ 1000); //Increase Time
            clearInterval(intervalId)

            if (timeHeld >= longPressDelay) {
                if (direction === "right") {
                    nextVote = Math.min(100, nextVote + 1);
                } else if (direction === "left") {
                    nextVote = Math.max(-100, nextVote - 1);
                }
            }
        }, 50);
    }

    function stopMoving() {
      clearInterval(intervalId);
      intervalId = null;
      direction = null;
      currentVote = nextVote
      updateDisplay()
    }

    personLeft.src = `images/person1.png`;
    personRight.src = `images/person2.png`;

    // Load data from CSV and text file
    Promise.all([fetchCSV('albums.csv'), fetchNames('people.txt')])
        .then(([albumData, names]) => {
            albums = albumData;
            people = names;


        arrowLeft.addEventListener('click', (event) => {
                event.preventDefault()
                moveScale('left')
             })
        arrowRight.addEventListener('click', (event) => {
                event.preventDefault()
                moveScale('right')
        });

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

            updateDisplay()

            getRandomAlbum(); // Initial album display
        })
        .catch(error => console.error('Error loading data:', error));
});