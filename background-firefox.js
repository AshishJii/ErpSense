browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getODRequest") {
    processPageRequest(sender, sendResponse, 'https://erp.psit.ac.in/Student/ODRequest', parseODRequestPage);
    return true;
  }

  else if (message.action === "uploadProof") {
    processPageRequest(sender, sendResponse, 'https://erp.psit.ac.in/Student/MediaManager', parseMediaManagerPage);
    return true;
  }
});

function processPageRequest(sender, sendResponse, url, parserFunction) {
  const pageUrl = sender.tab.url;

  browser.cookies.get({
    url: pageUrl,
    name: 'ci_session'
  }).then(cookie => {
    if (!cookie) {
      return sendResponse({ success: false, error: "Authentication cookie not found." });
    }
    const cookieHeader = `${cookie.name}=${cookie.value}`;

    fetch(url, {
      method: 'GET',
      headers: { 'Cookie': cookieHeader }
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.text();
    })
    .then(htmlText => {
      const result = parserFunction(htmlText);
      sendResponse(result);
    })
    .catch(error => {
      console.error('Fetch or Parse error:', error);
      sendResponse({ success: false, error: error.toString() });
    });
  });
}

function parseODRequestPage(htmlText) {
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
      id: cells[0].querySelector('a')?.textContent.trim() || '',
      // for each row, there is nested table for periods. Thats why cells are counted from the end
      details: cells[numCells - 7].textContent.trim(),
      submittedAt: cells[numCells - 5].textContent.trim(),
      // Extract faculty ID using regex
      facultyID: (() => {
        const raw = cells[numCells - 4].textContent || '';
        const match = raw.match(/[a-z]{2}[0-9]{5}/i);
        return match ? match[0] : null;
      })(),
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
  
  return { success: true, data: allRequestsData };
}

function parseMediaManagerPage(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const allOptions = Array.from(doc.querySelectorAll('option'));
  const oaOption = allOptions.find(opt => 
    opt.textContent.trim().toLowerCase().includes('oa attendance')
  );
  
  if (!oaOption) {
    throw new Error("Could not find 'OA attendance' option on MediaManager page.");
  }

  const oaAttendanceValue = oaOption.value;
  const dataForFrontend = { oaAttendanceValue: oaAttendanceValue };
  
  return { success: true, data: dataForFrontend };
}