function autofillFromTable() {
  const table = document.getElementById('data-table-buttons');
  if (!table) return;
  const lastRow = table.querySelector('tbody tr:last-child');
  if (!lastRow) return;
  const cells = lastRow.querySelectorAll('td');
  if (cells.length < 3) return;

  const typeText = cells[1].textContent.trim();
  const detailsText = cells[2].textContent.trim();

  // Fill the "type" field
  const typeSelect = document.querySelector('select[name="oaatype"]');
  if (typeSelect && typeSelect.dataset.autoFilled !== 'true' && typeText) {
    const typeMapping = {
      "placement drive": "Placement Drive",
      "other": "Other (Please Specify )"
    };
    const targetOptionText = typeMapping[typeText.toLowerCase()];
    if (targetOptionText) { // Find option with matching text
      const optionToSelect = Array.from(typeSelect.options).find(
        opt => opt.textContent.trim() === targetOptionText
      );
      if (optionToSelect) {
        typeSelect.value = optionToSelect.value;
        typeSelect.dataset.autoFilled = 'true';
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  // Fill the "Specify Details" textarea
  const detailsInput = document.querySelector('textarea[name="Reason"]');
  if (detailsInput && detailsInput.dataset.autoFilled !== 'true' && detailsText) {
    detailsInput.value = detailsText;
    detailsInput.dataset.autoFilled = 'true';
    detailsInput.dispatchEvent(new Event('input', { bubbles: true }));
    detailsInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function autofillFromURL() {
  if (window.location.hash && window.location.hash.startsWith('#highlight=')) {
    const dateStringYYYYMMDD = window.location.hash.split('=')[1];
    if (!dateStringYYYYMMDD) return;

    const dateRangeInput = document.getElementById('date-range0');
    if (!dateRangeInput) return;
    
    // Dont do if date already set
    if (dateRangeInput.dataset.dateSet === 'true') return;

    const rangeValue = `${dateStringYYYYMMDD} to ${dateStringYYYYMMDD}`;
    dateRangeInput.value = rangeValue;
    dateRangeInput.dataset.dateSet = 'true';
    dateRangeInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function addClearButtonToDetailsField() {
    const detailsTextarea = document.querySelector('textarea[name="Reason"]');
    if (!detailsTextarea) return;
    if (detailsTextarea.dataset.clearButtonAdded === 'true') return;

    // Create wrapper div
    const wrapperDiv = document.createElement('div');
    wrapperDiv.style.position = 'relative';
    wrapperDiv.style.width = '100%'; 
    // Get the parent
    const parentCol = detailsTextarea.closest('.col-md-4.col-12');
    if (!parentCol) return;
    
    // Move the textarea inside the new wrapper
    parentCol.insertBefore(wrapperDiv, detailsTextarea);
    wrapperDiv.appendChild(detailsTextarea);
    // Style the textarea to make space for the button
    detailsTextarea.style.width = '100%';
    detailsTextarea.style.paddingRight = '40px'; 
    // Create the clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = '×';
    clearButton.type = 'button';
    clearButton.dataset.clearButtonAdded = 'true';
    // Style the button to be inside the textarea
    clearButton.style.position = 'absolute';
    clearButton.style.top = '50%';
    clearButton.style.right = '10px'; 
    clearButton.style.transform = 'translateY(-50%)';
    clearButton.style.zIndex = '10';
    clearButton.style.height = '26px';
    clearButton.style.width = '26px';
    clearButton.style.lineHeight = '26px';
    clearButton.style.fontSize = '18px';
    clearButton.style.border = 'none';
    clearButton.style.background = '#ddd';
    clearButton.style.color = '#777';
    clearButton.style.fontWeight = 'bold';
    clearButton.style.borderRadius = '50%';
    clearButton.style.padding = '0';
    clearButton.style.textAlign = 'center';
    clearButton.style.cursor = 'pointer';
    clearButton.style.display = 'inline-flex';
    clearButton.style.alignItems = 'center';
    clearButton.style.justifyContent = 'center';
    // Add the button to the wrapper
    wrapperDiv.appendChild(clearButton);
    detailsTextarea.dataset.clearButtonAdded = 'true';
    // Add event listener
    clearButton.addEventListener('click', () => {
        detailsTextarea.value = '';
        detailsTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        detailsTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        detailsTextarea.focus();
    });
}

function setDefaultSortToDescending() {
    const idHeader = document.querySelector('#data-table-buttons th[data-dt-column="0"]');

    if (!idHeader) return; 
    if (idHeader.dataset.sortSet === 'true') return;

    const currentSort = idHeader.getAttribute('aria-sort');
    if (currentSort === 'ascending') {
        idHeader.click();
        idHeader.dataset.sortSet = 'true';
    } else {
        idHeader.dataset.sortSet = 'true';
    }
}

function handlePageMutations() {
  autofillFromTable();
  autofillFromURL();
  addClearButtonToDetailsField();
  setDefaultSortToDescending();
}

//-------initialize--------
async function initialize() {
  // check if extension is enabled
  const result = await browser.storage.sync.get({ isExtensionEnabled: true });
  if (!result.isExtensionEnabled) {
    console.log("ErpSense is disabled.");
    return;
  }
  // Retry until the <body> is available
  if (!document.body) {
    requestAnimationFrame(initialize);
    return;
  }
  // Run once immediately
  handlePageMutations();
  // Observer to watch for dynamically added content
  const observer = new MutationObserver(handlePageMutations);
  observer.observe(document.body, { childList: true, subtree: true });
}

initialize();

// TESTING FOR PROOF UPLOAD

// browser.runtime.sendMessage({ action: "uploadProof" }).then((response) => {
//     if (response && response.success) {
//       console.log("SUCCESS: Received parsed OD data:", response.data);
//     }
// }).catch((error) => {
//     console.error("ERROR: Failed to receive parsed OD data:", error);
// });