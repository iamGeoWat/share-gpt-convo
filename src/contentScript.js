'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

const htmlToImage = require('html-to-image');

let shareButton;
let showingCheckboxes = false;
let saveButton;
let blocksToShare = [];

injectStyles();
addShareButton();
addSaveButton();

function addShareButton() {
  shareButton = document.createElement('button');
  shareButton.textContent = 'Share';
  shareButton.className = 'share-button';
  shareButton.addEventListener('click', () => {
    // "Share": show checkboxes, text changes to "Cancel"
    // "Cancel": hide checkboxes, text changes to "Share"
    // if there were any checkboxes checked, show another button that says "Save"
    showingCheckboxes = !showingCheckboxes;
    shareButton.textContent = showingCheckboxes ? 'Cancel' : 'Share';
    toggleCheckboxes();
    toggleCollapseDialogs();
    toggleSaveButton();
  });
  document.body.appendChild(shareButton);
}

function removeCheckboxes() {
  const checkboxes = document.querySelectorAll('.custom-checkbox');
  checkboxes.forEach((checkbox) => {
    checkbox.remove();
  });
}

function toggleSaveButton() {
  if (saveButton) {
    saveButton.style.display = showingCheckboxes ? 'block' : 'none';
  }
}

function toggleCheckboxes() {
  if (showingCheckboxes) {
    addCheckboxes();
  } else {
    removeCheckboxes();
  }
}

function isQuestion(node) {
  return node.firstChild.nodeType === Node.TEXT_NODE;
}

function saveToImage() {
  const board = document.createElement('div');
  board.className = 'share-board';

  blocksToShare.forEach((block) => {
    const card = document.createElement('div');
    card.className = 'share-card';
    const title = document.createElement('h2');
    title.textContent = isQuestion(block) ? 'iamGeoWat:' : 'OpenAI:';
    title.style.marginBottom = '20px';
    card.appendChild(title);

    if (isQuestion(block)) {
      const text = document.createElement('p');
      text.textContent = block.firstChild.textContent;
      card.appendChild(text);
    } else {
      // clone each child element of the block to card
      block.childNodes.forEach((child) => {
        let clonedNode = child.cloneNode(true);
        if (clonedNode.tagName === 'PRE') {
          // hide a button element inside it
          clonedNode.querySelector('button').style.visibility = 'hidden';
        }
        clonedNode.style.marginBottom = '20px';
        card.appendChild(clonedNode);
      });
    }
    board.appendChild(card);
  });

  document.body.appendChild(board);

  const boardBounds = board.getBoundingClientRect();

  htmlToImage
    .toPng(board, {
      width: boardBounds.width,
      height: boardBounds.height,
      style: {
        transform: 'scale(1)',
        left: 0,
        top: 0,
      },
    })
    .then((dataUrl) => {
      document.body.removeChild(board);
      // Create a link element to download the image
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'div-image.png';
      link.style.display = 'none';

      // Add the link to the DOM and trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up the link element
      document.body.removeChild(link);
    });
}

function addSaveButton() {
  saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.className = 'save-button';

  saveButton.addEventListener('click', () => {
    blocksToShare = [];
    // get all the checked checkboxes
    const checkedCheckboxes = document.querySelectorAll(
      '.custom-checkbox input[type="checkbox"]:checked'
    );
    checkedCheckboxes.forEach((checkbox) => {
      // get attribute value of shareid of the checkbox
      const shareId = checkbox.id;
      // get the element with the same shareid
      const element = document.querySelector(`[shareId="${shareId}"]`);
      blocksToShare.push(element);
    });
    saveToImage();
  });

  document.body.appendChild(saveButton);
}

function toggleCollapseDialogs() {
  let dialogs = document.querySelectorAll(
    'div.flex.flex-col.items-start.gap-4.whitespace-pre-wrap'
  );
  dialogs.forEach((element) => {
    // animated collapse
    if (showingCheckboxes) {
      element.style.maxHeight = '1000px';
      element.style.overflow = 'hidden';
      element.style.transition = 'max-height 0.5s ease-in-out';
      setTimeout(() => {
        element.style.maxHeight = '100px';
      }, 100);
    } else {
      element.style.maxHeight = '1000px';
      setTimeout(() => {
        element.style.maxHeight = null;
        element.style.overflow = 'auto';
      }, 100);
    }
  });
}

function addCheckboxes() {
  let dialogs = document.querySelectorAll(
    'div.flex.flex-col.items-start.gap-4.whitespace-pre-wrap'
  );
  dialogs.forEach((element) => {
    if (!isQuestion(element)) {
      element = element.firstChild;
    }
    // Create a new container for the custom checkbox
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'custom-checkbox';

    // Create a new checkbox input element
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const randomId = Math.random().toString(36).substring(2, 9);
    checkbox.id = randomId;
    element.setAttribute('shareId', `${randomId}`);

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
    .custom-checkbox {
      position: absolute;
      right: -8em;
      z-index: 10000;
    }

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

    /* style the share button */
    .share-button {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 5px;
      position: fixed;
      top: 20px;
      right: 20px;
      width: 120px;
      height: 40px;
      cursor: pointer;
      z-index: 10000;
      font-weight: normal;
    }

    :root {
      --texture-url: url('https://res.cloudinary.com/dpbummzhu/image/upload/v1679739844/img/texture_zwgmki.png');
    }

    .share-board {
      padding-left: 50px;
      padding-right: 50px;
      padding-top: 100px;
      padding-bottom: 100px;
      background-color: #131723;
      background-image: var(--texture-url);
    }

    .share-card {
      box-shadow: 5px 10px 30px -10px rgba(0, 0, 20, 0.4);
      padding: 30px;
      border-radius: 5px;
      margin-bottom: 50px;
      background-color: #222734;
      background-image: var(--texture-url);
    }

    .save-button {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 5px;
      position: fixed;
      top: 70px;
      cursor: pointer;
      display: none;
      right: 20px;
      width: 120px;
      height: 40px;
      z-index: 10000;
      font-weight: normal;
    }

  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// todo: add header logo
// todo: change extension logo
// todo: write readme, git repo description
// todo: use actual user name in the output image

// todo: enhance styles, better mobile reading
// todo: add light mode
// todo: share as a link to a page with original content
// todo: share as a video in the form of chatting
