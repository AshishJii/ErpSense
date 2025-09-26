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

    const toggle = document.createElement('div');
    toggle.innerHTML = `▶ Show Table <span class="row-count">(${rowCount} rows)</span>`;
    toggle.classList.add('table-toggle');

    table.parentNode.insertBefore(toggle, table);

    toggle.addEventListener('click', () => {
      tbody.classList.toggle('hidden');
      toggle.innerHTML = tbody.classList.contains('hidden')
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
