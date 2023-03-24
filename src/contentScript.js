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
    checkbox.style.display = showingCheckboxes ? 'none' : 'block';
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
  alert("Share button clicked")
});

// Create the Save button
addSaveButton();

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
    alert('Save button clicked!');
  });

  document.body.appendChild(saveButton);
}

function addCheckboxes() {
  let answers = document.querySelectorAll('div.markdown.prose.w-full.break-words');
  answers.forEach(element => {
    // Create a new container for the custom checkbox
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'custom-checkbox';
    checkboxContainer.style.position = 'fixed';
    checkboxContainer.style.right = '10px';
    checkboxContainer.style.zIndex = 10000;

    // Create a new checkbox input element
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `checkbox-${Math.random().toString(36).substr(2, 9)}`; // Generate a random ID for the checkbox

    // Position the checkbox container vertically in the center of the element
    const elementRect = element.getBoundingClientRect();
    checkboxContainer.style.top = `${elementRect.top + (elementRect.height / 2) - (checkbox.offsetHeight / 2)}px`;

    // Create a label for the custom checkbox
    const label = document.createElement('label');
    label.setAttribute('for', checkbox.id);

    // Add the checkbox and label to the container
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);

    // Add the container to the body (since it's using 'fixed' positioning)
    checkboxContainer.style.display = showingCheckboxes ? 'block' : 'none';
    document.body.appendChild(checkboxContainer);
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
