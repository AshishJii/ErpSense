function highlightRowFromHash() {
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

function startObserver() {
  if (!document.body) {
    requestAnimationFrame(startObserver); // Retry until the <body> is available
    return;
  }

  // Run the highlighter once immediately for initial page content
  highlightRowFromHash();

  // Create an observer to watch for dynamically added content
  const observer = new MutationObserver(highlightRowFromHash);
  observer.observe(document.body, { childList: true, subtree: true });

  console.log("MutationObserver attached for row highlighting.");
}

startObserver();