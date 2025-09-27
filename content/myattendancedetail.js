// content.js

// Creates a styled cell with specific text, color, and a tooltip.
const createStatusCell = (text, color, tooltip) => {
  const cell = document.createElement('b');
  cell.textContent = text;
  cell.style.color = color;
  cell.classList.add('custom-tooltip');
  cell.dataset.tooltip = tooltip;
  return cell;
};


// Request the processed OD data from the background script.
browser.runtime.sendMessage({ action: "getODRequest" }, (response) => {
  if (response && response.success) {
    console.log("SUCCESS: Received parsed OD data:", response.data);

    // Determines the status and level of a request.
    const getFinalStatus = (request) => {
      const { status, periods, remark } = request;
      if (status.verify.includes('Rejected')) return { status: 'Rejected', level: 'Coordinator', periods, remark };
      if (status.hod.includes('Rejected')) return { status: 'Rejected', level: 'HOD', periods, remark };
      if (status.director.includes('Rejected')) return { status: 'Rejected', level: 'Director', periods, remark };
      if (status.verify.includes('Pending')) return { status: 'Pending', level: 'Coordinator', periods, remark };
      if (status.hod.includes('Pending')) return { status: 'Pending', level: 'HOD', periods, remark };
      if (status.director.includes('Pending')) return { status: 'Pending', level: 'Director', periods, remark };
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
              abbr = `R:${level}`; // e.g., R:Coordinator
              color = '#000000';
            } else if (status === 'Pending') {
              abbr = `P:${level}`; // e.g., P:Director
              if (level === 'Coordinator') color = '#007bff';
              else if (level === 'HOD') color = '#0056b3';
              else if (level === 'Director') color = '#003875';
            }
            
            // Use the remark for the tooltip.
            const statusCell = createStatusCell(abbr, color, odDataForDate.remark);
            targetCell.appendChild(statusCell);
          }
        });
      }
    });

  } else {
    console.error("ERROR: Failed to get OD data from background script:", response.error);
  }
});