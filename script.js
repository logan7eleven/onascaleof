const albumImage = document.getElementById('album-image');
const scaleImage = document.getElementById('scale-image');
const personLeft = document.getElementById('person-left');
const personRight = document.getElementById('person-right');
const arrowLeft = document.getElementById('arrow-left');
const arrowRight = document.getElementById('arrow-right');
const buttonEnter = document.getElementById('button-enter');
const buttonNext = document.getElementById('button-next');
const albumTooltip = document.getElementById('album-tooltip');

let albums = [];
let people = {};
let currentAlbumIndex = 0;
let currentVote = 0;

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
  albumImage.src = album.url;
  albumTooltip.textContent = `${album.name} by ${album.artist}`;
  scaleImage.src = `images/scale.png`;
  personLeft.src = people.left.url;
  personRight.src = people.right.url;
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

// Initial data loading and setup
Promise.all([fetchData('albums'), fetchData('people')])
.then(([albumData, peopleData]) => {
    if (albumData && peopleData) {
      albums = albumData;

      if (peopleData.length === 2) {
        people.left = peopleData[0];
        people.right = peopleData[1];
      } else {
        console.error("Error: the sheet must have 2 people")
      }

      getRandomAlbum();

      arrowLeft.addEventListener('click', () => {
        moveScale('left');
      });
      arrowRight.addEventListener('click', () => {
        moveScale('right');
      });

      buttonNext.addEventListener('click', () => {
        getRandomAlbum();
        buttonEnter.disabled = false;
      });
      buttonEnter.addEventListener('click', submitVote);

      document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          moveScale('left');
        } else if (event.key === 'ArrowRight') {
          moveScale('right');
        }
      });

      albumImage.addEventListener('click', () => {
        albumTooltip.style.display = (albumTooltip.style.display === 'none')? 'block': 'none';
      });

    } else {
      console.error("Error loading all data");
    }
  });