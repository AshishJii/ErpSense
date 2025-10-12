function enhanceTables() {
  const tables = document.querySelectorAll('table.table-hover');
  if (!tables.length) return;

  tables.forEach(table => {
    if (table.dataset.enhanced === "true") return;
    table.dataset.enhanced = "true";

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rowCount = tbody.querySelectorAll('tr').length;
    tbody.classList.add('hidden');

    const container = document.createElement('div');
    container.classList.add('table-enhancer-container');

    // toggle button
    const toggle = document.createElement('div');
    toggle.innerHTML = `▶ Show Table <span class="row-count">(${rowCount} rows)</span>`;
    toggle.classList.add('table-toggle');

    // search bar
    const searchContainer = document.createElement('div');
    searchContainer.classList.add('table-search-container', 'hidden'); // Hide initially
    searchContainer.style.marginBottom = '5px';
    
    const searchLabel = document.createElement('span');
    searchLabel.textContent = 'Search: ';
    searchLabel.style.marginRight = '5px';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Type to filter...';

    searchContainer.appendChild(searchLabel);
    searchContainer.appendChild(searchInput);
    
    // live filtering
    searchInput.addEventListener('input', () => {
      const filterText = searchInput.value.toLowerCase();
      const rows = tbody.querySelectorAll('tr');
      
      rows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(filterText) ? '' : 'none';
      });
    });
    
    table.parentNode.insertBefore(container, table);
    container.appendChild(toggle);
    container.appendChild(searchContainer);
    container.appendChild(table);

    toggle.addEventListener('click', () => {
      const isHidden = tbody.classList.toggle('hidden');
      searchContainer.classList.toggle('hidden', isHidden);
      
      toggle.innerHTML = isHidden
      ? `▶ Show Table <span class="row-count">(${rowCount} rows)</span>`
      : `▼ Hide Table <span class="row-count">(${rowCount} rows)</span>`;
    });
  });
}

function startObserver() {
  if (!document.body) {
    console.log("Body not ready, retrying...");
    requestAnimationFrame(startObserver); // retry until <body> exists
    return;
  }

  // Run once immediately
  enhanceTables();

  // Watch for dynamically added tables
  const observer = new MutationObserver(enhanceTables);
  observer.observe(document.body, { childList: true, subtree: true });

  console.log("MutationObserver attached.");
}

// Kick it off
startObserver();