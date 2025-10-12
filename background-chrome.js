const OFFSCREEN_DOCUMENT_PATH = '/offscreen/offscreen.html';

async function parseInOffscreen(htmlText) {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  if (existingContexts.length > 0) {
    await chrome.offscreen.closeDocument();
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ['DOM_PARSER'],
    justification: 'To parse HTML string using DOMParser.'
  });

  const result = await chrome.runtime.sendMessage({
    action: 'parseODRequest',
    htmlText: htmlText
  });
  
  return result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "getODRequest") {
    const pageUrl = sender.tab.url;
    const odRequestUrl = 'https://erp.psit.ac.in/Student/ODRequest';

    chrome.cookies.get({
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
        return parseInOffscreen(htmlText);
      })
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Fetch or Offscreen error:', error);
        sendResponse({ success: false, error: error.toString() });
      });
    });

    return true;
  }
});