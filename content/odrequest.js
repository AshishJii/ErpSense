function handlePageMutations() {
  if (window.location.hash && window.location.hash.startsWith('#highlight=')) {
    const idToHighlight = window.location.hash.split('=')[1];
    if (!idToHighlight) return;

    const tableBody = document.querySelector('#t1 tbody');
    if (!tableBody) return;
    const rows = tableBody.querySelectorAll('tr');

    for (const row of rows) {
      // Skip if this row has already been processed to prevent re-highlighting
      if (row.dataset.highlighted === 'true') continue;

      const idCell = row.querySelector('td:first-child a');
      if (idCell && idCell.textContent.trim() === idToHighlight) {

        row.dataset.highlighted = 'true';
        row.style.backgroundColor = '#fff9c4';
        row.style.transition = 'background-color 0.5s ease';

        row.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // Stop searching once the correct row is found and handled
        break;
      }
    }
  }
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