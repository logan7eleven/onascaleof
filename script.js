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
let localAlbums = []; // Array for local album data
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
let useGoogleSheetAlbums = false; // Flag to control if the sheet albums should be used
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
    let albumSource = "";
    if (useGoogleSheetAlbums) {
        albumSource = albums[currentAlbumIndex].url;
        albumTooltip.textContent = `${albums[currentAlbumIndex].name} by ${albums[currentAlbumIndex].artist}`;
    } else {
        albumSource = `images/album${currentAlbumIndex + 1}.png`;
        albumTooltip.textContent = `${localAlbums[currentAlbumIndex].name} by ${localAlbums[currentAlbumIndex].artist}`;
    }

    albumImage.src = albumSource;
    scaleImage.src = `images/scale.png`;
    personLeft.src = `images/person1.png`;
    personRight.src = `images/person2.png`;
    albumTooltip.style.display = 'none';
    albumImage.style.outline = '';
}

function getRandomAlbum() {
    if (useGoogleSheetAlbums) {
        currentAlbumIndex = Math.floor(Math.random() * (albums.length));
    } else {
        currentAlbumIndex = Math.floor(Math.random() * (localAlbumCount));
    }
    currentVote = 0;
    updateDisplay();

    // Start fetching the *next* album's data in the background
    if (albums.length > localAlbumCount && useGoogleSheetAlbums) {
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

//Create initial local albums
for (let i = 0; i < localAlbumCount; i++) {
    localAlbums.push({
        name: `Album ${i + 1}`, // Placeholder name
        artist: `Artist ${i + 1}`, // Placeholder artist
        url: `images/album${i + 1}.png` // Local URL
    });
}

// Initial data loading and setup
Promise.all([fetchData('albums'), fetchData('people')])
  .then(([albumData, peopleData]) => {
    if (albumData && peopleData) {
      albums = albumData; // Now albums has all of the google sheet data
      if (albums.length > localAlbumCount) {
        albums = albums.slice(localAlbumCount); //remove the first 10
      }

      // Add Google Sheet albums to the localAlbums
      localAlbums.forEach((album, index) => {
        album.name = albumData[index].Name;
        album.artist = albumData[index].Artist
      })

      if (peopleData.length === 2) {
        people.left = peopleData[0];
        people.right = peopleData[1];
        personLeftName.textContent = people.left.name; // Set the left person's name
        personRightName.textContent = people.right.name; // Set the right person's name
      } else {
        console.error("Error: the sheet must have 2 people")
      }

      // Ensure people images are always local
      personLeft.src = `images/person1.png`;
      personRight.src = `images/person2.png`;

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
          useGoogleSheetAlbums = true
          albums = localAlbums.concat(albums) //concat the remaining
          getRandomAlbum()
      });
      buttonEnter.addEventListener('click', submitVote);

      albumImage.addEventListener('click', () => {
        albumTooltip.style.display = (albumTooltip.style.display === 'none') ? 'block' : 'none';
      });

    } else {
      console.error("Error loading all data");
    }
  });
