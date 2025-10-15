function handlePageMutations() {
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