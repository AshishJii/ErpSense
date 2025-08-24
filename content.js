// Find all tables with the class "table-hover"
const tables = document.querySelectorAll('table.table-hover');

// Process each table found on the page
tables.forEach(table => {
  // Find the body of the table
  const tbody = table.querySelector('tbody');
  // If a table has no body, skip it
  if (!tbody) return;

  // --- NEW: Count the number of rows in the table body ---
  // We look for all 'tr' (table row) elements within the tbody
  const rowCount = tbody.querySelectorAll('tr').length;

  // Collapse the table by default
  tbody.classList.add('hidden');

  // Create a text-based toggle element
  const toggle = document.createElement('div');
  // --- NEW: Update the text to include the row count ---
  // The text now shows the row count in a subtle, grayed-out span
  toggle.innerHTML = `▶ Show Table <span class="row-count">(${rowCount} rows)</span>`;
  toggle.classList.add('table-toggle');

  // Insert the toggle link right before the table
  table.parentNode.insertBefore(toggle, table);

  // Add a click event listener to the toggle link
  toggle.addEventListener('click', () => {
    // Toggle the 'hidden' class to show/hide the table body
    tbody.classList.toggle('hidden');

    // Update the text and icon based on the table's state
    if (tbody.classList.contains('hidden')) {
      // The text when the table is collapsed
      toggle.innerHTML = `▶ Show Table <span class="row-count">(${rowCount} rows)</span>`;
    } else {
      // The text when the table is expanded
      toggle.innerHTML = `▼ Hide Table <span class="row-count">(${rowCount} rows)</span>`;
    }
  });
});
