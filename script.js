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
let localAlbumCount = 10;  // Number of local albums
let nextAlbumPromise = null; // To store the promise of the next album fetch
let intervalId = null; // To store the interval ID
let holdStartTime = null;
let initialDelay = 500; // 0.5 seconds initial delay
let fastInterval = 50;  // Rapid interval after initial delay
let slowInterval = 200; // Slower interval before initial delay
let currentInterval = slowInterval;
let direction = null;
let useLocalFirstAlbum = true;  // Flag to ensure the first album is local
let initialAlbumIndex = null;

// Updated fetchData function
function fetchData(sheetName) {
  const sheetId = 'your-sheet-id'; // Replace with your actual Google Sheet ID
  const apiKey = 'your-api-key'; // Replace with your actual API key
  const apiUrl = `https://script.google.com/macros/s/AKfycbz2ywAJx-cOMkELZN6mh9OHdwajGsmzMn5kDVVELKAGsUs-1EhjwTQe6GqRmJ5XuR-rFg/exec`;

  return fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.hasOwnProperty(sheetName)) {
        console.error('Unexpected API response format:', data);
        return null;
      }

      // API response always includes data objects, no separate headers
      const sheetData = data[sheetName];

      return sheetData.map(row => ({
        name: row.Name,
        artist: row.Artist,
        url: row.url
      }));
    })
    .catch(error => {
      console.error("Error fetching sheet data:", error);
      return null;
    });
}

function updateDisplay() {
  const album = albums[currentAlbumIndex];
  const isLocal = (useLocalFirstAlbum)? false : (currentAlbumIndex < localAlbumCount)

  albumImage.src = (useLocalFirstAlbum)? `images/album${initialAlbumIndex + 1}.png` : (isLocal ? `images/album${currentAlbumIndex + 1}.png` : album.url);  // Use local image if within range
  albumTooltip.textContent = `${album.name} by ${album.artist}`;
  scaleImage.src = `images/scale.png`;
  personLeft.src = `images/person1.png`;
  personRight.src = `images/person2.png`;
  albumTooltip.style.display = 'none';
  albumImage.style.outline = '';
}

function getRandomAlbum() {
  if(useLocalFirstAlbum){
    initialAlbumIndex = Math.floor(Math.random() * (localAlbumCount));
    currentAlbumIndex = initialAlbumIndex
  } else {
    currentAlbumIndex = Math.floor(Math.random() * (albums.length));
  }
  currentVote = 0;
  updateDisplay();

  // Start fetching the *next* album's data in the background
  if (albums.length > localAlbumCount && !useLocalFirstAlbum) {
    const nextIndex = Math.floor(Math.random() * (albums.length));
    nextAlbumPromise = Promise.resolve(albums[nextIndex]);
    console.log(`prefetching album index ${nextIndex}`)
  }
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
  direction = dir;
  holdStartTime = Date.now();
  currentInterval = slowInterval; // Start with the slower interval

  intervalId = setInterval(() => {
    moveScale(direction);

    // Check if the initial delay has passed and switch to the faster interval
    if (Date.now() - holdStartTime >= initialDelay) {
      clearInterval(intervalId);
      currentInterval = fastInterval;
      intervalId = setInterval(() => moveScale(direction), currentInterval);
    }
  }, currentInterval);
}

function stopMoving() {
  clearInterval(intervalId);
  intervalId = null;
  holdStartTime = null;
  direction = null;
}

// Initial data loading and setup
Promise.all([fetchData('albums'), fetchData('people')])
  .then(([albumData, peopleData]) => {
    if (albumData && peopleData) {
      albums = albumData;
      // Limit albums array to the length of local images + the remaining album data
      if (albums.length > localAlbumCount) {
        albums = albums.slice(0, localAlbumCount).concat(albumData.slice(localAlbumCount));
      }
      console.log(albums)

      if (peopleData.length === 2) {
        people.left = peopleData[0];
        people.right = peopleData[1];
        personLeftName.textContent = people.left.name; // Set the left person's name
        personRightName.textContent = people.right.name; // Set the right person's name

      } else {
        console.error("Error: the sheet must have 2 people")
      }

      getRandomAlbum(); // Load initial album immediately

      // Mouse events
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

      // Touch events
      arrowLeft.addEventListener('touchstart', (event) => {
        event.preventDefault();  // Prevent scrolling
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

      //Keyboard events
      document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          if (!intervalId) {
            startMoving('left');
          }
        } else if (event.key === 'ArrowRight') {
          if (!intervalId) {
            startMoving('right');
          }
        }
      });
      document.addEventListener('keyup', (event) => {
        if (event.key === 'ArrowLeft' && direction === 'left') {
          stopMoving();
        } else if (event.key === 'ArrowRight' && direction === 'right') {
          stopMoving();
        }
      })


      buttonNext.addEventListener('click', async () => {
        useLocalFirstAlbum = false; // Disable local images after the first "Next"
        if (nextAlbumPromise) {
          // If we pre-fetched an album, use that
          currentAlbumIndex = Math.floor(Math.random() * (albums.length));
          updateDisplay();
        } else {
          getRandomAlbum(); // Otherwise, fetch a new one regularly
        }
        buttonEnter.disabled = false;
        nextAlbumPromise = null;
      });
      buttonEnter.addEventListener('click', submitVote);

      albumImage.addEventListener('click', () => {
        albumTooltip.style.display = (albumTooltip.style.display === 'none') ? 'block' : 'none';
      });

    } else {
      console.error("Error loading all data");
    }
  });
