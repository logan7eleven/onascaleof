// --- script.js --- (Person info text at 15% height)

document.addEventListener('DOMContentLoaded', function () {
    // Elements from the HTML (No changes)
    const mainContainer = document.getElementById('main-container');
    const albumContainer = document.getElementById('album-container');
    const albumImage = document.getElementById('album-image');
    const personLeft = document.getElementById('person-left');
    const personRight = document.getElementById('person-right');
    const buttonEnter = document.getElementById('button-enter');
    const buttonNext = document.getElementById('button-next');
    const buttonPersonLeft = document.getElementById('button-person-left');
    const buttonPersonRight = document.getElementById('button-person-right');
    const buttonInfo = document.getElementById('button-info');
    const albumInfoText = document.getElementById('album-info-text');
    const personLeftInfoText = document.getElementById('person-left-info-text');
    const personRightInfoText = document.getElementById('person-right-info-text');
    const scaleSegmentsLeft = document.getElementById('scale-segments-left');
    const scaleSegmentsRight = document.getElementById('scale-segments-right');
    const scale = document.getElementById('scale');
    const voteMarker = document.getElementById('vote-marker');

    // Variables (No changes)
    let albums = [];
    let shuffledAlbums = [];
    let people = { left: {}, right: {} };
    let currentAlbumIndex = 0;
    let currentVote = 0;
    let voteSubmitted = false;
    let peopleID = 1;
    let infoMode = false;
    const numSegments = 20;

    // Firebase initialization (No changes)
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

    function resizeMainContainer() {
        mainContainer.style.width = '';
        mainContainer.style.height = '';

        let maxHeight = window.innerHeight * 0.9;
        let maxWidth = window.innerWidth * 0.9;

        let containerWidth, containerHeight;
        let heightBasedWidth = (maxHeight * 2) / 3;
        if (heightBasedWidth <= maxWidth) {
            containerWidth = heightBasedWidth;
            containerHeight = maxHeight;
        } else {
            containerWidth = maxWidth;
            containerHeight = (maxWidth * 3) / 2;
        }

        containerWidth = Math.min(containerWidth, 1000);
        containerHeight = (containerWidth / 2) * 3;

        mainContainer.style.width = `${Math.floor(containerWidth)}px`;
        mainContainer.style.height = `${Math.floor(containerHeight)}px`;
        mainContainer.style.fontSize = `${Math.floor(containerWidth * 0.015)}px`;

        setPersonImageContainerSize();
    }

    function setPersonImageContainerSize() {
        let albumHeight = albumContainer.offsetHeight;
        const personContainerHeight = albumHeight / 3;
        const personContainerWidth = personContainerHeight * 0.75;

        document.querySelectorAll('.person-image-container').forEach(container => {
            container.style.height = `${personContainerHeight}px`;
            container.style.width = `${personContainerWidth}px`;
        });
    }

    function fetchAlbums(url) {
        return fetch(url)
          .then(response => response.text())
          .then(csv => {
            const lines = csv.split('\n').filter(line => line.trim().length > 0);
            return lines.map((line, index) => {
              const [name, artist, url] = line.split(',');
              return {
                name: name.trim(),
                artist: artist.trim(),
                url: url.trim(),
                albumID: index + 1
              };
            });
          });
      }

      function fetchPeople(url) {
        return fetch(url)
          .then(response => response.text())
          .then(csv => {
            const lines = csv.split('\n').filter(line => line.trim().length > 0);
            return lines.map(line => {
              const parts = line.split(',');
              if (parts.length !== 4) {
                console.warn("Skipping malformed line in people.csv:", line);
                return null;
              }
              const [name, url, id, side] = parts.map(part => part.trim());
              const peopleID = parseInt(id);
              if (isNaN(peopleID)) {
                console.warn("Invalid peopleID in line:", line);
                return null;
              }
              return {
                name: name,
                url: url,
                peopleID: peopleID,
                side: side
              };
            }).filter(person => person !== null);
          });
      }

      function loadPeople(data) {
        const filteredPeople = data.filter(person => person.peopleID === peopleID);
        const leftPerson = filteredPeople.find(person => person.side === 'L');
        const rightPerson = filteredPeople.find(person => person.side === 'R');

        if (leftPerson) {
          people.left = leftPerson;
          personLeft.src = leftPerson.url;
          personLeftInfoText.textContent = leftPerson.name;
        }
        if (rightPerson) {
          people.right = rightPerson;
          personRight.src = rightPerson.url;
          personRightInfoText.textContent = rightPerson.name;
        }
      }

        function updateDisplay() {
        let album = shuffledAlbums[currentAlbumIndex];
        albumImage.src = album.url;
        albumImage.style.outline = "";
        voteSubmitted = false;
        buttonEnter.disabled = false;
        currentVote = 0;
        updateScale();
        personLeft.style.outline = "";
        personRight.style.outline = "";

        voteMarker.style.display = 'none';
        voteMarker.style.left = '50%';
      }

      function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      function createScaleSegments() {
        scaleSegmentsLeft.innerHTML = '';
        scaleSegmentsRight.innerHTML = '';

        for (let i = 0; i < numSegments; i++) {
          const leftSegment = document.createElement('div');
          leftSegment.classList.add('scale-segment');
          leftSegment.style.width = `${100 / numSegments}%`;
          scaleSegmentsLeft.appendChild(leftSegment);

          const rightSegment = document.createElement('div');
          rightSegment.classList.add('scale-segment');
          rightSegment.style.width = `${100 / numSegments}%`;
          scaleSegmentsRight.appendChild(rightSegment);
        }
      }

      function updateScale() {
        const leftActiveSegments = Math.max(0, Math.min(numSegments, Math.floor(-currentVote / 5)));
        const rightActiveSegments = Math.max(0, Math.min(numSegments, Math.floor(currentVote / 5)));

        document.querySelectorAll('.scale-segment').forEach(segment => {
          segment.classList.remove('active-left', 'active-right');
        });

        const leftSegments = scaleSegmentsLeft.querySelectorAll('.scale-segment');
        for (let i = 0; i < leftActiveSegments; i++) {
          if (leftSegments[i]) {
            leftSegments[i].classList.add('active-left');
          }
        }

        const rightSegments = scaleSegmentsRight.querySelectorAll('.scale-segment');
        for (let i = 0; i < rightActiveSegments; i++) {
          if (rightSegments[i]) {
            rightSegments[i].classList.add('active-right');
          }
        }

        scale.style.setProperty('--middle-line-opacity', currentVote === 0 ? '1' : '0');
      }

      function submitVote() {
        if (!voteSubmitted) {
          let outlineColor = currentVote > 0 ? "#F7B73D" : currentVote < 0 ? "#BAA0FA" : "";
          albumImage.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";

          if (currentVote > 0) {
            personRight.style.outline = `0.3em solid ${outlineColor}`;
            personLeft.style.outline = "";
          } else if (currentVote < 0) {
            personLeft.style.outline = `0.3em solid ${outlineColor}`;
            personRight.style.outline = "";
          }

          voteMarker.style.display = 'block';
          if (currentVote > 0) {
            voteMarker.style.left = `${50 + (currentVote / 2)}%`;
          } else if (currentVote < 0) {
            voteMarker.style.left = `${50 + (currentVote / 2)}%`;
          } else {
            voteMarker.style.left = '50%';
          }

          buttonEnter.disabled = true;
          voteSubmitted = true;
          const albumID = shuffledAlbums[currentAlbumIndex].albumID;
          db.collection("votes").add({
            albumID: albumID,
            vote_value: currentVote,
            peopleID: peopleID,
          })
            .then(() => {
              console.log("Vote submitted:", { albumID, vote_value: currentVote, peopleID });
            })
            .catch(error => {
              console.error("Error submitting vote:", error);
            });
        }
      }

      function moveScale(direction, clickedSide) {
        if (!voteSubmitted) {
          if (direction === "right") {
            currentVote = Math.min(100, currentVote + 5);
          } else if (direction === "left") {
            currentVote = Math.max(-100, currentVote - 5);
          }
          updateScale();
          updateVoteOutline(clickedSide);
        }
      }

      function updateVoteOutline(clickedSide) {
        let outlineColor = currentVote > 0 ? "#F7B73D" : currentVote < 0 ? "#BAA0FA" : "";
        albumImage.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";

        if (clickedSide === 'left') {
          personLeft.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
          personRight.style.outline = "";
        } else if (clickedSide === 'right') {
          personRight.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
          personLeft.style.outline = "";
        }
      }

      function getNextAlbum() {
        currentAlbumIndex++;
        if (currentAlbumIndex >= shuffledAlbums.length) {
          shuffledAlbums = shuffleArray([...albums]);
          currentAlbumIndex = 0;
        }
        updateDisplay();
      }

    // Event Listeners (buttonInfo CHANGES)
    buttonPersonLeft.addEventListener('click', () => moveScale('left', 'left'));
    buttonPersonRight.addEventListener('click', () => moveScale('right', 'right'));
    buttonEnter.addEventListener('click', submitVote);
    buttonNext.addEventListener('click', async () => {
        if (!voteSubmitted) {
            try {
                const albumID = shuffledAlbums[currentAlbumIndex].albumID;
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
        getNextAlbum();
    });

    buttonInfo.addEventListener('click', () => {
        infoMode = !infoMode;

        albumContainer.classList.toggle('image-faded', infoMode);
        personLeft.parentElement.classList.toggle('image-faded', infoMode);
        personRight.parentElement.classList.toggle('image-faded', infoMode);

        if (infoMode) {
            albumInfoText.style.display = 'flex';
            personLeftInfoText.style.display = 'flex';
            personRightInfoText.style.display = 'flex';

            const album = shuffledAlbums[currentAlbumIndex];
            albumInfoText.textContent = `${album.name}\nby ${album.artist}`;
            albumInfoText.style.fontSize = `${Math.floor(albumContainer.offsetHeight * 0.1)}px`;

            // CHANGED TO 15%
            personLeftInfoText.style.fontSize = `${Math.floor(personLeft.parentElement.offsetHeight * 0.15)}px`;
            personRightInfoText.style.fontSize = `${Math.floor(personRight.parentElement.offsetHeight * 0.15)}px`;

        } else {
            albumInfoText.style.display = 'none';
            personLeftInfoText.style.display = 'none';
            personRightInfoText.style.display = 'none';
        }
    });

    // Window resize event handlers
    window.addEventListener('resize', resizeMainContainer);
    window.addEventListener('load', resizeMainContainer);
    window.addEventListener('orientationchange', resizeMainContainer);

    // Initialize container sizes and scale
    resizeMainContainer();
    createScaleSegments();

    // Load initial data
    Promise.all([
        fetchAlbums('/albums.csv'),
        fetchPeople('/people.csv')
    ]).then(([albumsData, peopleData]) => {
        albums = albumsData;
        shuffledAlbums = shuffleArray([...albums]);
        loadPeople(peopleData);
        updateScale();
        updateDisplay();
        scale.style.setProperty('--middle-line-opacity', '1');
    }).catch(error => {
        console.error('Error loading data:', error);
    });
});
