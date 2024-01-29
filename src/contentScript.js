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

const arbitraryClassNames = {
  'avatar': '.rounded-sm',
  'dialogs': 'div.flex.flex-1.text-base.mx-auto',
};

let shareButton;
let showingCheckboxes = false;
let saveButton;
let blocksToShare = [];
let userAvatar;
let userName;
let gptAvatar;

injectStyles();
addShareButton();
addSaveButton();

function addSaveButton() {
  saveButton = document.createElement('button');
  saveButton.textContent = 'Save PNG';
  saveButton.className = 'save-button';

  saveButton.addEventListener('click', () => {
    blocksToShare = [];
    // get all the checked checkboxes
    const checkedCheckboxes = document.querySelectorAll(
      '.custom-checkbox input[type="checkbox"]:checked'
    );
    if (checkedCheckboxes.length === 0) {
      // alert when no checkboxes are checked
      alert('No dialogs selected, please select some dialogs by clicking on the checkboxes✅ on the left👈. Enlarge the browser↔️ if you can\'t see the checkboxes.');
      return
    }
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

function getAvatars() {
  userAvatar = document.querySelector(`img${arbitraryClassNames['avatar']}`);
  if (userAvatar) userName = userAvatar.alt;
  gptAvatar = document.querySelector(`div${arbitraryClassNames['avatar']}`).firstChild;
}

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
  return node.querySelector('[data-message-author-role]')?.dataset['messageAuthorRole'] === 'user';
}

function saveToImage() {
  if (blocksToShare.length === 0) {
    alert('No dialogs selected, please select some dialogs by clicking on the checkboxes on the right side of the dialogs.');
    return;
  }
  const board = document.createElement('div');
  board.className = 'share-board';
  board.style.width = '45rem';
  let convoTitle = Array.from(document.querySelectorAll('a')).find(node => node.href === window.location.href)?.textContent;
  if (convoTitle) {
    const convoTitleElement = document.createElement('h1');
    convoTitleElement.textContent = convoTitle;
    convoTitleElement.className = 'convo-title';
    board.appendChild(convoTitleElement);
  }

  blocksToShare.forEach((block) => {
    const card = document.createElement('div');
    card.className = 'share-card';
    // create a title with avatar
    getAvatars();
    const titleText = document.createElement('h2');
    titleText.textContent = isQuestion(block) ? 'Me' : 'GPT';
    const title = document.createElement('div');
    const titleAvatar = isQuestion(block) ? userAvatar.cloneNode(true) : gptAvatar.cloneNode(true);
    titleAvatar.style.position = 'relative';
    titleAvatar.style.height = '1.5rem';
    titleAvatar.style.width = '1.5rem';
    const titleAvatarWrapper = document.createElement('div');
    titleAvatarWrapper.style.maxWidth = '1.5rem';
    titleAvatarWrapper.style.marginRight = '0.625rem';
    titleAvatarWrapper.appendChild(titleAvatar);
    title.style.marginBottom = '1.25rem';
    title.style.height = '1.5rem';
    title.style.display = 'flex';
    title.style.alignItems = 'center';
    title.appendChild(titleAvatarWrapper);
    title.appendChild(titleText);

    card.appendChild(title);

    if (isQuestion(block)) {
      const questionWrapper = document.createElement('div');
      const questionContent = block.querySelector('[data-message-author-role]')?.childNodes;
      questionContent.forEach((child) => {
        questionWrapper.appendChild(child.cloneNode(true));
      });
      card.appendChild(questionWrapper);
    } else {
      const answerWrapper = document.createElement('div');
      const answerContent = block.querySelector('div.flex.flex-grow')?.childNodes;
      // clone each child element of the block to card
      answerContent.forEach((child) => {
        const clonedNode = child.cloneNode(true);
        if (clonedNode.tagName === 'PRE') {
          // hide a button element inside it
          clonedNode.querySelector('button').style.visibility = 'hidden';
          clonedNode.querySelector('code').style.setProperty('white-space', 'pre-wrap', 'important');
        }
        clonedNode.style.marginBottom = '1.25rem';
        answerWrapper.appendChild(clonedNode);
      });
      card.appendChild(answerWrapper);
    }
    board.appendChild(card);
  });

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.alignItems = 'center';
  footer.style.marginLeft = '1rem';
  const logo = document.createElement('div');
  logo.style.marginRight = '0.3125rem';
  logo.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 100 100">
          <g fill="#74728a">
              <path xmlns="http://www.w3.org/2000/svg" d="M48,3.05c-24.824,0-44.951,20.126-44.951,44.951S23.176,92.95,48,92.95c24.826,0,44.951-20.124,44.951-44.949  S72.826,3.05,48,3.05z M63.924,80.312v-29.15c3.885-1.21,6.705-4.835,6.705-9.117c0-5.273-4.273-9.548-9.547-9.548  s-9.547,4.274-9.547,9.548c0,4.282,2.82,7.907,6.705,9.117v31.374c-3.246,0.963-6.684,1.48-10.24,1.48  c-19.891,0-36.014-16.125-36.014-36.015c0-14.174,8.188-26.434,20.092-32.311v29.15c-3.885,1.209-6.707,4.833-6.707,9.117  c0,5.271,4.275,9.547,9.549,9.547c5.271,0,9.547-4.275,9.547-9.547c0-4.284-2.822-7.908-6.707-9.117V13.465  c3.246-0.961,6.684-1.479,10.24-1.479c19.891,0,36.014,16.124,36.014,36.016C84.014,62.175,75.826,74.434,63.924,80.312z"></path>
          </g>
      </svg>
  `;
  const footerText = document.createElement('p');
  footerText.style.fontSize = '0.8rem';
  footerText.style.color = '#74728a';
  footer.style.opacity = '0.8';
  footerText.textContent = 'via ShareGPTConvo - Chrome Extension';
  footer.appendChild(logo);
  footer.appendChild(footerText);

  board.appendChild(footer);

  document.body.appendChild(board);

  const boardBounds = board.getBoundingClientRect();

  htmlToImage
    .toPng(board, {
      width: boardBounds.width,
      height: boardBounds.height,
      fontEmbedCSS: '',
      style: {
        left: 0,
        top: 0,
      },
    })
    .then((dataUrl) => {
      document.body.removeChild(board);
      // Create a link element to download the image
      const link = document.createElement('a');
      link.href = dataUrl;
      let date = new Date();
      let dateString = `${date.getFullYear()}${date.getMonth()}${date.getDate()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
      link.download = `share-gpt_${dateString}.png`;
      link.style.display = 'none';

      // Add the link to the DOM and trigger the download
      document.body.appendChild(link);
      link.click();

      // Clean up the link element
      document.body.removeChild(link);
    });
}

function toggleCollapseDialogs() {
  let dialogs = document.querySelectorAll(arbitraryClassNames['dialogs']);
  dialogs.forEach((element) => {
    // animated collapse
    if (showingCheckboxes) {
      element.style.maxHeight = '62.5rem';
      element.style.overflow = 'hidden';
      element.style.transition = 'max-height 0.5s ease-in-out';
      setTimeout(() => {
        element.style.maxHeight = '6.25rem';
      }, 100);
    } else {
      element.style.maxHeight = '62.5rem';
      setTimeout(() => {
        element.style.maxHeight = null;
        element.style.overflow = 'auto';
      }, 100);
    }
  });
}

function addCheckboxes() {
  let dialogs = document.querySelectorAll(arbitraryClassNames['dialogs']);
  dialogs.forEach((element) => {
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
    let elementToAppendTo = element.firstChild;
    elementToAppendTo.appendChild(checkboxContainer);
  });
}

function injectStyles() {
  const css = `
    .custom-checkbox {
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
      padding-left: 2.1875rem;
      cursor: pointer;
      font-size: 1rem;
      user-select: none;
    }

    /* Create the custom checkbox indicator */
    .custom-checkbox label::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 1.875rem;
      height: 1.875rem;
      background-color: #eee;
      border: 0.125rem solid #555;
      border-radius: 0.25rem;
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
      top: 0.375rem;
      left: 0.75rem;
      width: 0.5rem;
      height: 0.875rem;
      border: solid white;
      border-width: 0 0.125rem 0.125rem 0;
      transform: rotate(45deg);
      opacity: 0;
      transition: opacity 0.2s;
    }

    /* Show the checkmark when the custom checkbox is checked */
    .custom-checkbox input[type='checkbox']:checked + label::after {
      opacity: 1;
    }

    .dark {
      .share-button {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
      }
      .save-button {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
      }
      .share-board {
        background-color: #131723;
      }
      .share-card {
        box-shadow: 0.3125rem 0.625rem 1.875rem -0.625rem rgba(0, 0, 20, 0.4);
        background-color: #222734;
      }
    }

    /* style the share button */
    .share-button {
      background-color: rgba(0, 0, 0, 0.3);
      color: #222;
      border: none;
      border-radius: 0.3125rem;
      position: fixed;
      top: 4.375rem;
      right: 1.25rem;
      width: 7.5rem;
      height: 2.5rem;
      cursor: pointer;
      z-index: 10000;
      font-weight: normal;
    }

    :root {
      --texture-url: url('https://res.cloudinary.com/dpbummzhu/image/upload/v1679739844/img/texture_zwgmki.png');
    }

    .share-board {
      padding-left: 3.125rem;
      padding-right: 3.125rem;
      padding-top: 3.75rem;
      padding-bottom: 3.75rem;
      background-color: rgba(252, 250, 242, 100);
      background-image: var(--texture-url);
    }

    .share-card {
      box-shadow: 0.3125rem 0.625rem 1rem -0.625rem rgba(0, 0, 0, 0.3);
      padding: 2.5rem;
      border-radius: 0.3125rem;
      margin-bottom: 1.875rem;
      background-color: rgba(255,255,251,100);
      background-image: var(--texture-url);

    }

    .save-button {
      background-color: rgba(0, 0, 0, 0.3);
      color: #222;
      border: none;
      border-radius: 0.3125rem;
      position: fixed;
      top: 7.5rem;
      cursor: pointer;
      display: none;
      right: 1.25rem;
      width: 7.5rem;
      height: 2.5rem;
      z-index: 10000;
      font-weight: normal;
    }

    .convo-title {
      margin-bottom: 2rem;
      margin-left: 0.3125rem;
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}
// todo: not use arbitrary class names to locate contents
