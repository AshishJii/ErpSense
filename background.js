browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "getODRequest") {
    const pageUrl = sender.tab.url;
    const odRequestUrl = 'https://erp.psit.ac.in/Student/ODRequest';

    browser.cookies.get({
      url: pageUrl,
      name: 'PHPSESSID'
    }).then(cookie => {
      if (!cookie) {
        return sendResponse({ success: false, error: "Authentication cookie not found." });
      }
      const cookieHeader = `${cookie.name}=${cookie.value}`;

      fetch(odRequestUrl, {
        method: 'GET',
        headers: { 'Cookie': cookieHeader }
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
      })
      .then(htmlText => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const tableBody = doc.querySelector('#t1 tbody');
        if (!tableBody) throw new Error("Could not find data table #t1 tbody.");

        const rows = tableBody.querySelectorAll('tr');
        const allRequestsData = [];

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 8) return;

          const numCells = cells.length;
          const modal = cells[0].querySelector('.modal');
          
          const request = {
            // Reverted to .textContent.trim() for robustness
            id: cells[0].querySelector('a')?.textContent.trim() || '',
            details: cells[numCells - 7].textContent.trim(),
            submittedAt: cells[numCells - 5].textContent.trim(),
            status: {
              verify: cells[numCells - 3].textContent.trim(),
              hod: cells[numCells - 2].textContent.trim(),
              director: cells[numCells - 1].textContent.trim(),
            },
            remark: modal?.querySelector('.modal-body p')?.textContent.trim() || '',
            periods: []
          };

          if (modal) {
            const periodRows = modal.querySelectorAll('table tbody tr');
            periodRows.forEach((periodRow, index) => {
              if (index === 0) return;
              const periodCells = periodRow.querySelectorAll('td');
              if (periodCells.length === 3) {
                request.periods.push({
                  date: periodCells[0].textContent.trim(),
                  lecture: periodCells[1].textContent.trim(),
                  status: periodCells[2].textContent.trim()
                });
              }
            });
          }
          allRequestsData.push(request);
        });
        
        sendResponse({ success: true, data: allRequestsData });
      })
      .catch(error => {
        console.error('Fetch or Parse error:', error);
        sendResponse({ success: false, error: error.toString() });
      });
    });

    return true;
  }
});