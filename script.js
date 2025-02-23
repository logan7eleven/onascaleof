document.addEventListener('DOMContentLoaded', function () {
  // -------------------------------
  // Check for Required DOM Elements
  // -------------------------------
  const requiredIDs = [
    'main-container',
    'album-container',
    'album-image',
    'album-info-text',
    'album-name',
    'album-artist',
    'person-left',
    'person-right',
    'button-enter',
    'button-next',
    'button-person-left',
    'button-person-right',
    'button-info',
    'scale-container',
    'scale',
    'scale-segments-left',
    'scale-divider',
    'scale-segments-right',
    'person-arrow-container',
    'button-row'
  ];
  const elements = {};
  requiredIDs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) {
      throw new Error(`Required element with id "${id}" is missing from the DOM.`);
    }
    elements[id] = el;
  });

  // Aliases for convenience.
  const mainContainer         = elements['main-container'];
  const albumContainer        = elements['album-container'];
  const albumImage            = elements['album-image'];
  const albumInfoText         = elements['album-info-text'];
  const albumNameElement      = elements['album-name'];
  const albumArtistElement    = elements['album-artist'];
  const personLeft            = elements['person-left'];
  const personRight           = elements['person-right'];
  const buttonEnter           = elements['button-enter'];
  const buttonNext            = elements['button-next'];
  const buttonPersonLeft      = elements['button-person-left'];
  const buttonPersonRight     = elements['button-person-right'];
  const buttonInfo            = elements['button-info'];
  const scaleContainer        = elements['scale-container'];
  const scale                 = elements['scale'];
  const scaleSegmentsLeft     = elements['scale-segments-left'];
  const scaleDivider          = elements['scale-divider'];
  const scaleSegmentsRight    = elements['scale-segments-right'];
  const personArrowContainer  = elements['person-arrow-container'];
  const buttonRow             = elements['button-row'];

  // -------------------------------
  // Global Variables
  // -------------------------------
  let albums = [];
  let shuffledAlbums = [];
  let people = { left: {}, right: {} };
  let currentAlbumIndex = 0;
  let currentVote = 0; // Ranges from -100 to 100, increments of 5
  let voteSubmitted = false;
  let peopleID = 2; // Current active people ID for filtering people data
  let infoMode = false;
  const totalScaleSegments = 40; // 40 segments total (20 left, 20 right)

  // -------------------------------
  // Firebase Setup
  // -------------------------------
  const firebaseConfig = {
    apiKey: "AIzaSyCUt5sTKJRYe-gguuon8U7SlyZtttawTSA",
    authDomain: "onascaleof-2e3b4.firebaseapp.com",
    projectId: "onascaleof-2e3b4",
    storageBucket: "onascaleof-2e3b4.firebaseapp.com",
    messagingSenderId: "96599540311",
    appId: "1:96599540311:web:47c86e4e6fce30e3065912"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // -------------------------------
  // 1. Resize Main Container & Related Elements
  // -------------------------------
  function resizeMainContainer() {
    // Determine base dimension as 90% of viewport height and width (choose the smaller)
    const viewHeight = window.innerHeight * 0.9;
    const viewWidth = window.innerWidth * 0.9;
    const baseSize = Math.min(viewHeight, viewWidth);
    // Resize main container: set height to baseSize and width to maintain a 2:3 ratio.
    mainContainer.style.height = `${baseSize}px`;
    mainContainer.style.width = `${(baseSize * 2) / 3}px`;
    mainContainer.style.fontSize = `${baseSize * 0.015}px`;

    const mainRect = mainContainer.getBoundingClientRect();

    // Update scale container: 90% of main container's width and 7.5% of its height.
    scaleContainer.style.width = `${mainRect.width * 0.9}px`;
    scaleContainer.style.height = `${mainRect.height * 0.075}px`;

    // Update person arrow container and button row: 80% of main container's width.
    personArrowContainer.style.width = `${mainRect.width * 0.80}px`;
    buttonRow.style.width = `${mainRect.width * 0.80}px`;

    // Update person arrow button widths: leaving a gap equal to 5% of main container's width.
    const gapForArrows = mainRect.width * 0.05;
    const totalArrowWidth = mainRect.width * 0.80;
    const personButtonWidth = (totalArrowWidth - gapForArrows) / 2;
    buttonPersonLeft.style.width = `${personButtonWidth}px`;
    buttonPersonRight.style.width = `${personButtonWidth}px`;

    // Update three-button row widths, with gaps equal to 5% of main container width.
    const gapForButtons = mainRect.width * 0.05;
    const totalButtonsWidth = mainRect.width * 0.80;
    const numButtons = 3;
    const buttonWidth = (totalButtonsWidth - (numButtons - 1) * gapForButtons) / numButtons;
    document.querySelectorAll("#button-row .app-button").forEach(btn => {
      btn.style.width = `${buttonWidth}px`;
    });

    // Update person image container sizes.
    setPersonImageContainerSize();

    // Ensure album image fills 90% of album container.
    albumImage.style.width = "90%";
    albumImage.style.height = "90%";
  }

  // -------------------------------
  // 2. Person Image Container Sizing (Maintaining a 4:3 Width:Height Ratio)
  // -------------------------------
  function setPersonImageContainerSize() {
    const albumHeight = albumContainer.offsetHeight;
    // Each person image container's height is 1/3 of the album container's height.
    const containerHeight = albumHeight / 3;
    // For a 4:3 ratio, width equals (4/3)*height.
    const containerWidth = containerHeight * (4 / 3);
    document.querySelectorAll('.person-image-container').forEach(container => {
      container.style.height = `${containerHeight}px`;
      container.style.width = `${containerWidth}px`;
      container.style.backgroundColor = "black";
    });
  }

  // -------------------------------
  // 3. Fetch Albums & People Data from CSVs
  // -------------------------------
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

  // -------------------------------
  // 4. Load People Data into the UI
  // -------------------------------
  function loadPeople(data) {
    const filtered = data.filter(person => person.peopleID === peopleID);
    const left = filtered.find(person => person.side === 'L');
    const right = filtered.find(person => person.side === 'R');
    if (left) {
      people.left = left;
      personLeft.src = left.url;
      const leftInfo = document.getElementById('person-left-info-text');
      leftInfo.textContent = left.name;
    }
    if (right) {
      people.right = right;
      personRight.src = right.url;
      const rightInfo = document.getElementById('person-right-info-text');
      rightInfo.textContent = right.name;
    }
  }

  // -------------------------------
  // 5. Display Album Data & Reset Outlines
  // -------------------------------
  function updateDisplay() {
    let album = shuffledAlbums[currentAlbumIndex];
    albumImage.src = album.url;
    // Reset outlines on container elements.
    albumContainer.style.outline = "";
    personLeft.style.outline = "";
    personRight.style.outline = "";
    // Reset vote variables.
    voteSubmitted = false;
    buttonEnter.disabled = false;
    currentVote = 0;
    updateScale();
    // Adjust text sizes for album info overlay.
    adjustAlbumInfoFontSize();
  }

  // Fisher-Yates Shuffle for randomizing album order.
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function getNextAlbum() {
    currentAlbumIndex++;
    if (currentAlbumIndex >= shuffledAlbums.length) {
      shuffledAlbums = shuffleArray([...albums]);
      currentAlbumIndex = 0;
    }
    albumContainer.style.outline = "";
    personLeft.style.outline = "";
    personRight.style.outline = "";
    updateDisplay();
  }

  // -------------------------------
  // 6. Create and Update Scale Bar
  // -------------------------------
  function createScaleSegments() {
    scaleSegmentsLeft.innerHTML = "";
    scaleSegmentsRight.innerHTML = "";
    const segmentsPerSide = totalScaleSegments / 2; // 20 segments per side.
    for (let i = 0; i < segmentsPerSide; i++) {
      const leftSeg = document.createElement('div');
      leftSeg.classList.add('scale-segment');
      scaleSegmentsLeft.appendChild(leftSeg);

      const rightSeg = document.createElement('div');
      rightSeg.classList.add('scale-segment');
      scaleSegmentsRight.appendChild(rightSeg);
    }
    scaleDivider.style.backgroundColor = "#333";
  }

  function updateScale() {
    const segmentsPerSide = totalScaleSegments / 2;
    const leftActive = Math.max(0, Math.min(segmentsPerSide, Math.floor(-currentVote / 5)));
    const rightActive = Math.max(0, Math.min(segmentsPerSide, Math.floor(currentVote / 5)));
    document.querySelectorAll('.scale-segment').forEach(seg => {
      seg.classList.remove('active-left', 'active-right');
    });
    for (let i = 0; i < leftActive; i++) {
      scaleSegmentsLeft.children[i].classList.add('active-left');
    }
    for (let i = 0; i < rightActive; i++) {
      scaleSegmentsRight.children[i].classList.add('active-right');
    }
  }

  // -------------------------------
  // 7. Update Vote Outlines and Color Transitions
  // -------------------------------
  function updateVoteOutline(clickedSide) {
    let outlineColor = "";
    if (currentVote > 0) {
      outlineColor = "#F7B73D";
    } else if (currentVote < 0) {
      outlineColor = "#BAA0FA";
    }
    albumContainer.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
    if (clickedSide === 'left') {
      personLeft.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
    } else if (clickedSide === 'right') {
      personRight.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
    }
  }

  // -------------------------------
  // 8. Adjust Vote Value on Arrow Button Clicks
  // -------------------------------
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

  // -------------------------------
  // 9. Submit Vote and Persist Color Outlines
  // -------------------------------
  function submitVote() {
    if (!voteSubmitted) {
      let outlineColor = currentVote > 0 ? "#F7B73D" : currentVote < 0 ? "#BAA0FA" : "";
      albumContainer.style.outline = outlineColor ? `0.3em solid ${outlineColor}` : "";
      if (currentVote > 0) {
        personRight.style.outline = `0.3em solid ${outlineColor}`;
      } else if (currentVote < 0) {
        personLeft.style.outline = `0.3em solid ${outlineColor}`;
      }
      voteSubmitted = true;
      buttonEnter.disabled = true;
      const albumID = shuffledAlbums[currentAlbumIndex].albumID;
      db.collection("votes").add({
        albumID: albumID,
        vote_value: currentVote,
        peopleID: peopleID,
      }).then(() => {
        console.log("Vote submitted:", { albumID, vote_value: currentVote, peopleID });
      }).catch(error => {
        console.error("Error submitting vote:", error);
      });
    }
  }

  // -------------------------------
  // 10. Next Button Click Handler
  // -------------------------------
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

  // -------------------------------
  // 11. INFO Mode Toggle and Text Resizing
  // -------------------------------
  buttonInfo.addEventListener('click', () => {
    infoMode = !infoMode;
    albumImage.classList.toggle('image-faded', infoMode);
    personLeft.classList.toggle('image-faded', infoMode);
    personRight.classList.toggle('image-faded', infoMode);
    // Toggle album info overlay visibility.
    if (infoMode) {
      albumInfoText.classList.add('show');
      const album = shuffledAlbums[currentAlbumIndex];
      albumNameElement.textContent = album.name;
      albumArtistElement.textContent = album.artist;
      // Delay text resizing to allow the overlay to render.
      setTimeout(adjustAlbumInfoFontSize, 500);
    } else {
      albumInfoText.classList.remove('show');
      albumNameElement.textContent = '';
      albumArtistElement.textContent = '';
    }
  });

  /*
   * adjustAlbumInfoFontSize:
   * Determines the maximum font size for the album info overlay text
   * by using a bounding box that is as wide as the album image
   * and with a height equal to 40% of the album image's height.
   */
  function adjustAlbumInfoFontSize() {
    const containerWidth = albumImage.offsetWidth;
    const maxTextBoxHeight = albumImage.offsetHeight * 0.4;
    // Reset current font sizes.
    albumNameElement.style.fontSize = '';
    albumArtistElement.style.fontSize = '';
    // Calculate maximum font sizes for album name and artist.
    const nameFontSize = getMaxFontSize(albumNameElement, containerWidth, maxTextBoxHeight);
    const artistFontSize = getMaxFontSize(albumArtistElement, containerWidth, maxTextBoxHeight);
    // Use the smaller of the two to ensure both texts fit.
    const finalFontSize = Math.min(nameFontSize, artistFontSize);
    albumNameElement.style.fontSize = `${finalFontSize}px`;
    albumArtistElement.style.fontSize = `${finalFontSize}px`;
  }

  /*
   * getMaxFontSize:
   * Performs a binary search to determine the maximum font size that allows the
   * element's text to fit within the specified maxWidth and maxHeight.
   */
  function getMaxFontSize(element, maxWidth, maxHeight) {
    let fontSize = 1;
    element.style.fontSize = `${fontSize}px`;
    let low = 1, high = 1000;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      element.style.fontSize = `${mid}px`;
      if (element.scrollWidth > maxWidth || element.scrollHeight > maxHeight) {
        high = mid - 1;
      } else {
        fontSize = mid;
        low = mid + 1;
      }
    }
    return fontSize;
  }

  // -------------------------------
  // Event Listeners for Arrow Buttons & Vote Submission
  // -------------------------------
  buttonPersonLeft.addEventListener('click', () => moveScale('left', 'left'));
  buttonPersonRight.addEventListener('click', () => moveScale('right', 'right'));
  buttonEnter.addEventListener('click', submitVote);

  // -------------------------------
  // Initial Setup and Data Loading
  // -------------------------------
  resizeMainContainer();
  window.addEventListener('resize', resizeMainContainer);
  createScaleSegments();

  const albumsCSV = '/albums.csv';
  const peopleCSV = '/people.csv';

  Promise.all([fetchAlbums(albumsCSV), fetchPeople(peopleCSV)]).then(([albumData, peopleData]) => {
    albums = albumData;
    shuffledAlbums = shuffleArray([...albums]);
    loadPeople(peopleData);
    updateScale();
    currentAlbumIndex = 0;
    updateDisplay();
  });
});
