// Creates a styled cell with specific text, color, a tooltip, and an ID for linking.
const createStatusCell = (text, color, tooltip, odId) => {
  const cell = document.createElement('b');
  cell.textContent = text;
  cell.style.color = color;
  cell.classList.add('custom-tooltip');
  cell.dataset.tooltip = tooltip;
  cell.addEventListener('click', () => {
    window.location.href = `https://erp.psit.ac.in/Student/ODRequest#highlight=${odId}`;
  });
  return cell;
};

// Create OAA button
function createOAAButton(date) {
  const button = document.createElement('button');
  button.textContent = 'Apply OAA';
  button.className = 'btn btn-success btn-sm attendance-btn';
  button.style.marginLeft = '8px';
  
  button.addEventListener('click', (event) => {
    event.stopPropagation(); 
    window.location.href = `https://erp.psit.ac.in/Student/PLAIRequest#highlight=${date}`;
  });
  
  return button;
}

async function handlePageMutations() {
// Request the processed OD data from the background script.
  return browser.runtime.sendMessage({ action: "getODRequest" }).then((response) => {
    if (response && response.success) {
      console.log("SUCCESS: Received parsed OD data:", response.data);

      // Determines the status and level of a request.
      const getFinalStatus = (request) => {
        const { id, status, periods, remark } = request;
        if (status.verify.includes('Rejected')) return { id, status: 'Rejected', level: 'Coordinator', periods, remark };
        if (status.hod.includes('Rejected')) return { id, status: 'Rejected', level: 'HOD', periods, remark };
        if (status.director.includes('Rejected')) return { id, status: 'Rejected', level: 'Director', periods, remark };
        if (status.verify.includes('Pending')) return { id, status: 'Pending', level: 'Coordinator', periods, remark };
        if (status.hod.includes('Pending')) return { id, status: 'Pending', level: 'HOD', periods, remark };
        if (status.director.includes('Pending')) return { id, status: 'Pending', level: 'Director', periods, remark };
        return null;
      };

      const pendingOrRejectedRequests = response.data
        .map(getFinalStatus)
        .filter(request => request !== null);

      // Groups all periods by their date for easy lookup.
      const groupedByDate = pendingOrRejectedRequests.reduce((acc, request) => {
        request.periods.forEach(period => {
          const { date, lecture } = period;
          if (!acc[date]) {
            acc[date] = {
              id: request.id,
              status: request.status,
              level: request.level,
              remark: request.remark,
              periods: []
            };
          }
          acc[date].periods.push(lecture);
        });
        return acc;
      }, {});
      
      // Finds the attendance table and updates it.
      const attendanceTable = document.querySelector('#data-table-buttons tbody');
      if (!attendanceTable) return;

      const tableRows = attendanceTable.querySelectorAll('tr');

      tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;
        const dateOnPage = cells[1].textContent.trim();

        if (groupedByDate[dateOnPage]) {
          const odDataForDate = groupedByDate[dateOnPage];
          
          odDataForDate.periods.forEach(periodNumber => {
            const periodIndex = parseInt(periodNumber) + 1;
            
            if (cells[periodIndex] && cells[periodIndex].textContent.includes('ABS')) {
              const targetCell = cells[periodIndex];
              targetCell.innerHTML = '';

              let abbr = '';
              let color = '#000';
              const { status, level } = odDataForDate;

              // Use the full level name for the abbreviation.
              if (status === 'Rejected') {
                abbr = `R:${level}`;
                color = '#000000';
              } else if (status === 'Pending') {
                abbr = `P:${level}`;
                if (level === 'Coordinator') color = '#007bff';
                else if (level === 'HOD') color = '#0056b3';
                else if (level === 'Director') color = '#003875';
              }
              
              const statusCell = createStatusCell(abbr, color, odDataForDate.remark, odDataForDate.id);
              targetCell.appendChild(statusCell);
            }
          });
        }
      });

    } else {
      console.error("ERROR: Failed to get OD data from background script:", response.error);
    }
  });
}

function addApplyButtons() {
  const table = document.getElementById('data-table-buttons');
  if (!table) {
    console.error("Table with ID 'data-table-buttons' not found.");
    return;
  }
  const rows = table.querySelectorAll('tbody tr');

  // Helper function to format dates
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get today and two days before
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dayBefore = new Date();
  dayBefore.setDate(today.getDate() - 2);
  const targetDates = new Set([formatDate(today), formatDate(yesterday), formatDate(dayBefore)]);
  
  console.log("Searching for dates:", Array.from(targetDates));

  // Loop through each row of the table ONCE
  for (const row of rows) {
    const dateCell = row.cells[1];
    if (!dateCell) continue;
    const rowDateString = dateCell.textContent.trim();

    if (targetDates.has(rowDateString) && !dateCell.querySelector('.attendance-btn')) {
      // Check if some cell has "ABS"
      const rowHasABS = Array.from(row.cells).some(cell => cell.textContent.trim() === 'ABS');
      if (rowHasABS) {
        console.log(`Found matching row for ${rowDateString} with ABS, adding button.`);
        const button = createOAAButton(rowDateString);       
        dateCell.appendChild(button);
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
  await handlePageMutations();
  addApplyButtons();
}

initialize();