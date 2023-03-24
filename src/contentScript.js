'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

const html2canvas = require('html2canvas');
const htmlToImage = require('html-to-image');
const domtoimage = require('dom-to-image');


// Create a new button element
const shareButton = document.createElement('button');

// Add content or attributes to the button
shareButton.textContent = 'Share';
shareButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // Semi-transparent blue
shareButton.style.color = 'white';
shareButton.style.border = 'none';
shareButton.style.borderRadius = '5px'; // Rounded corners
shareButton.style.position = 'fixed';
shareButton.style.top = '20px';
shareButton.style.right = '20px';
shareButton.style.width = '120px'; // Adjust width for a rectangle
shareButton.style.height = '40px';
shareButton.style.cursor = 'pointer';
shareButton.style.zIndex = 10000; // A high value to ensure it appears on top of other elements
shareButton.style.fontWeight = 'normal'; // Optional: make the button text bold

// Add the button to the webpage
document.body.appendChild(shareButton);

injectStyles();

let showingCheckboxes = false;
let saveButton;

function toggleCheckboxes() {
  const checkboxes = document.querySelectorAll('.custom-checkbox');

  checkboxes.forEach(checkbox => {
    checkbox.style.display = showingCheckboxes ? 'block' : 'none';
  });

  if (saveButton) {
    saveButton.style.display = showingCheckboxes ? 'block' : 'none';
  }
}


// Add click event listener to the button
shareButton.addEventListener('click', () => {
  // "Share": show checkboxes, text changes to "Cancel"
  // "Cancel": hide checkboxes, text changes to "Share"
  // if there were any checkboxes checked, show another button that says "Save"
  showingCheckboxes = !showingCheckboxes;
  shareButton.textContent = showingCheckboxes ? 'Cancel' : 'Share';
  addCheckboxes();
  toggleCheckboxes();
  // alert("Share button clicked")
});

// Create the Save button
addSaveButton();

let blocksToShare = [];

function saveToImage() {
  const board = document.createElement('div');
  board.style.paddingLeft = '50px';
  board.style.paddingRight = '50px';
  board.style.paddingTop = '100px';
  board.style.paddingBottom = '100px';
  board.style.backgroundColor = '#131723';
  board.style.backgroundImage = 'url(https://nipponcolors.com/images/texture.png)';
  blocksToShare.forEach(block => {
    const card = document.createElement('div');
    card.className = 'share-card';
    card.style.boxShadow = '5px 10px 30px -10px rgba(0, 0, 20, 0.4)';
    card.style.padding = '30px';
    card.style.borderRadius = '5px';
    card.style.marginBottom = '50px';
    card.style.backgroundColor = '#222734';
    card.style.backgroundImage = 'url(https://nipponcolors.com/images/texture.png)';
    const title = document.createElement('h2');
    title.textContent = 'iamGeoWat:';
    title.marginBottom = '20px';
    card.appendChild(title);

    // clone each child element of the block to card
    block.childNodes.forEach(child => {
      let clonedNode = child.cloneNode(true);
      console.log(clonedNode.tagName)
      if (clonedNode.tagName === 'PRE') {
        // hide a button element inside it
        clonedNode.querySelector('button').style.visibility = 'hidden';
      }
      clonedNode.style.marginBottom = '20px';
      card.appendChild(clonedNode);
    });
    board.appendChild(card);
  });

  document.body.appendChild(board);
  const boardBounds = board.getBoundingClientRect();

  htmlToImage.toPng(board, {
    width: boardBounds.width,
    height: boardBounds.height,
    style: {
      transform: 'scale(1)',
      left: 0,
      top: 0,
    }
  }).then(canvas => {
    // Convert the canvas to a data URL
    // const dataUrl = canvas.toDataURL('image/png');

    const img = document.createElement('img');
    img.src = canvas;
    document.body.appendChild(img);
    // open image in new tab
    console.log(canvas);



    // // Create a link element to download the image
    // const link = document.createElement('a');
    // link.href = dataUrl;
    // link.download = 'div-image.png';
    // link.style.display = 'none';
    //
    // // Add the link to the DOM and trigger the download
    // document.body.appendChild(link);
    // link.click();
    //
    // // Clean up the link element
    // document.body.removeChild(link);
  });
}

function addSaveButton() {
  saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // Semi-transparent blue
  saveButton.style.color = 'white';
  saveButton.style.border = 'none';
  saveButton.style.borderRadius = '5px';
  saveButton.style.position = 'fixed';
  saveButton.style.top = '70px';
  saveButton.style.cursor = 'pointer';
  saveButton.style.display = 'none';
  saveButton.style.right = '20px';
  saveButton.style.width = '120px'; // Adjust width for a rectangle
  saveButton.style.height = '40px';
  saveButton.style.cursor = 'pointer';
  saveButton.style.zIndex = 10000; // A high value to ensure it appears on top of other elements
  saveButton.style.fontWeight = 'normal'; // Optional: make the button text bold

  saveButton.addEventListener('click', () => {
    console.log('Save button clicked!');
    blocksToShare = [];
    // get all the checked checkboxes
    const checkedCheckboxes = document.querySelectorAll('.custom-checkbox input[type="checkbox"]:checked');
    checkedCheckboxes.forEach(checkbox => {
      // get attribute value of shareid of the checkbox
      const shareId = checkbox.id;
      // get the element with the same shareid
      const element = document.querySelector(`[shareId="${shareId}"]`);
      blocksToShare.push(element);
      console.log('blocksToShare', blocksToShare);

    });
    saveToImage();
  });

  document.body.appendChild(saveButton);
}

function addCheckboxes() {
  let answers = document.querySelectorAll('div.markdown.prose.w-full.break-words');
  answers.forEach(element => {
    // Create a new container for the custom checkbox
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'custom-checkbox';
    checkboxContainer.style.position = 'absolute';
    checkboxContainer.style.right = '-8em';
    checkboxContainer.style.zIndex = 10000;

    // Create a new checkbox input element
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const randomId = Math.random().toString(36).substring(2, 9);
    checkbox.id = randomId;
    element.setAttribute('shareId', `${randomId}`);

    // Position the checkbox container vertically in the center of the element
    // const elementRect = element.getBoundingClientRect();
    // checkboxContainer.style.top = `${elementRect.top + (elementRect.height / 2) - (checkbox.offsetHeight / 2)}px`;

    // Create a label for the custom checkbox
    const label = document.createElement('label');
    label.setAttribute('for', checkbox.id);

    // Add the checkbox and label to the container
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);

    // Add the container to the body (since it's using 'fixed' positioning)
    checkboxContainer.style.display = showingCheckboxes ? 'block' : 'none';
    element.parentElement.appendChild(checkboxContainer);
  });
}

function injectStyles() {
  const css = `
    /* Hide the default checkbox */
    .custom-checkbox input[type='checkbox'] {
      display: none;
    }

    /* Create a custom checkbox */
    .custom-checkbox label {
      position: relative;
      padding-left: 35px;
      cursor: pointer;
      font-size: 16px;
      user-select: none;
    }

    /* Create the custom checkbox indicator */
    .custom-checkbox label::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      background-color: #eee;
      border: 2px solid #555;
      border-radius: 4px;
      transition: background-color 0.2s, border-color 0.2s;
    }

    /* Style the custom checkbox when checked */
    .custom-checkbox input[type='checkbox']:checked + label::before {
      background-color: #66bb6a;
      border-color: #66bb6a;
    }

    /* Create the checkmark for the custom checkbox */
    .custom-checkbox label::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 7px;
      width: 8px;
      height: 14px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      opacity: 0;
      transition: opacity 0.2s;
    }

    /* Show the checkmark when the custom checkbox is checked */
    .custom-checkbox input[type='checkbox']:checked + label::after {
      opacity: 1;
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// todo: match checkbox with answers
// todo: when save button is clicked, save the checked answers to image
// todo: crop the dialogs when starting selection