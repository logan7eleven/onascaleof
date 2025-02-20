html {
    font-size: 100%;
}

body {
    font-family: sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0;
    text-align: center;
    min-height: 100vh;
    box-sizing: border-box;
    background-color: #826E67;
    position: relative;
    overflow: hidden;
    font-size: 100%;
}

body::before,
body::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
}

body::after {
    background-size: 100vw 100vh;
    opacity: 1;
    pointer-events: none;
    background-image:
        radial-gradient(circle, #A1887F 40%, transparent 40%),
        radial-gradient(circle, #A1887F 40%, transparent 40%);
    background-position: 0 0, 50vw 50vh;
}

#main-container {
    width: 60vh;
    height: 90vh;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    box-sizing: border-box;
    background-color: #555;
    padding-top: 1.5%;
    padding-bottom: 1.5%;
    /* Removed justify-content */
}

/* Vertical Spacing */
.vertical-spacer {
    height: 1.5%;
    width: 100%;
}

#site-title {
    font-size: 5em;
    color: black;
    width: 100%;
    text-align: center;
    margin-top: 1.5%;  /* Initial spacing from top */
    margin-bottom: 0;
}

#album-container {
    width: 80%;  /* This is the key width */
    height: 0;
    padding-bottom: 80%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 1);
    box-sizing: border-box;
    margin-bottom: 0;
}

#album-image {
    max-width: 95%;
    max-height: 95%;
    width: 95%;
    height: 95%;
    object-fit: contain;
    object-position: center;
    border-radius: 0.5rem;
    box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: filter 0.3s ease;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

#scale-container {
    width: 90%;
    position: relative;
    margin-top: 0;
    margin-bottom: 0;
}

#scale {
    display: flex;
    align-items: center;
    height: 1em;
    background-color: #eee;
    border-radius: 0.3em;
    overflow: hidden;
}

#scale-segments-left,
#scale-segments-right {
    display: flex;
    width: 50%;
    height: 100%;
}

#scale-segments-left {
    flex-direction: row-reverse;
    justify-content: flex-end;
}

.scale-segment {
    width: 5%;
    height: 100%;
    background-color: transparent;
    box-sizing: border-box;
}

.scale-segment.active-left {
    background-color: #BAA0FA;
}

.scale-segment.active-right {
    background-color: #F7B73D;
}

/* Divider */
#scale-divider {
    width: 0.05em;
    height: 100%;
    background-color: #ccc;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
}
#person-arrow-container {
    width: 80%; /* Match album container */
    display: flex;
    justify-content: space-between;
    box-sizing: border-box;
    margin-bottom: 0;
}

.person-arrow-button {
    position: relative;
    display: flex;
    align-items: center;
    border: none;
    cursor: pointer;
    border-radius: 0.5rem;
    width: calc((100% - 5%) / 2); /* Correct: (Total Width - Spacing) / Number of Buttons */
    box-sizing: border-box;
    padding: 1em; /* Add padding back to the BUTTON */
}
.person-arrow-button:first-of-type {
    flex-direction: row;
    background-color: #BAA0FA;
    justify-content: space-between; /* Arrow on the right */
}

.person-arrow-button:last-of-type {
    flex-direction: row-reverse;
    background-color: #F7B73D;
    justify-content: space-between; /* Arrow on the left */
}

.person-image-container {
    position: relative;
    width: 75%; /* 75% of the *button's* width (for the 3:4 aspect ratio with the height) */
    /* Height and width set dynamically in JavaScript */
    box-sizing: border-box;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 1); /* Black background */
    border-radius: 0.5rem; /* Match image rounding */
}

.person-arrow-button img {
    position: absolute;
    top: 5%;
    left: 5%;
    width: 90%;
    height: 90%;
    object-fit: cover;
    object-position: 50% 33.333%;
    border-radius: 0.5rem;
    box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
}

.person-arrow-button .arrow {
    font-size: 4em;
    color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    width: 25%;
}

#button-row {
    display: flex;
    justify-content: space-between;
    width: 80%; /* Match album and person containers */
    margin: 0 auto; /* Center horizontally */
}

.app-button {
    border: none;
    cursor: pointer;
    border-radius: 0.5rem;
    height: 2.5em;
    font-size: 2em;
    background-color: #ddd;
    color: #333;
    padding: 0.5em 1em;
    transition: background-color: 0.3s ease;
     width: calc((100% - (2 * 5%)) / 3); /*  Correct Spacing*/
    margin: 0;
    text-align: center;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* ... (rest of your CSS) ... */

.overlay-text {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
}

#album-image.image-faded {
    filter: grayscale(80%) blur(3px);
    opacity: 0.7;
}

.person-arrow-button img.image-faded {
    filter: grayscale(80%) blur(3px);
    opacity: 0.7;
}

.person-image-container .overlay-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    justify-content: center;
    align-items: center;
    color: black;
    z-index: 10;
    font-weight: bold;
    font-family: monospace;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 0.5rem;
    box-sizing: border-box;
    padding: 0.5em;
    overflow: hidden;
}

#album-info-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    color: black;
    text-align: center;
    z-index: 10;
    word-wrap: break-word;
    white-space: pre-wrap;
    font-weight: bold;
    font-family: monospace;
    box-sizing: border-box;
    padding: 0.5em;
    background-color: rgba(255, 255, 255, 0.7);
}

#album-name {
    height: 40%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

}

#album-by {
    height: 10%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5em;
    overflow: hidden;
}

#album-artist {
    height: 40%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
