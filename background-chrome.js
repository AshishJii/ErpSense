chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getODRequest") {
    processPageRequest(message.action, sender, sendResponse, 'https://erp.psit.ac.in/Student/ODRequest');
    return true;
  }
  else if (message.action === "uploadProof") {
    processPageRequest(message.action, sender, sendResponse, 'https://erp.psit.ac.in/Student/MediaManager');
    return true;
  }
  else if (message.action === "getSARRequest") {
    processPageRequest(sender, sendResponse, 'https://erp.psit.ac.in/Student/StudentAttRequest');
    return true;
  }
});

function processPageRequest(message, sender, sendResponse, url) {
  const pageUrl = sender.tab.url;
  chrome.cookies.get({
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
      return parseInOffscreen(message, htmlText);
    })
    .then(result => {
      sendResponse(result);
    })
    .catch(error => {
      console.error('Fetch or Offscreen error:', error);
      sendResponse({ success: false, error: error.toString() });
    });
  });
}

async function parseInOffscreen(action, htmlText) {
  const OFFSCREEN_DOCUMENT_PATH = '/offscreen/offscreen.html';
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
    action: action,
    htmlText: htmlText
  });
  
  console.log("ErpSense: Parsed data in offscreen document.");
  return result;
}