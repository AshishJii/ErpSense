// ErpSense — Navbar Tweaks Toggle Widget
// Inserts a "Tweaks" toggle box before the inbox item in the ERP navbar.

async function initialize() {
  // Duplication guard
  if (document.getElementById('erpsense-nav-toggle')) return;

  // Read current state
  const result = await browser.storage.sync.get({ isExtensionEnabled: true });
  const isEnabled = result.isExtensionEnabled;

  // Build widget element
  const navItem = document.createElement('div');
  navItem.className = 'navbar-item';
  navItem.id = 'erpsense-nav-toggle';

  const logoUrl = browser.runtime.getURL('icons/icon128.png');

  navItem.innerHTML = `
    <label class="erpsense-switch-box">
      <img src="${logoUrl}" class="erpsense-logo" alt="ErpSense" />
      <span class="erpsense-track">
        <input type="checkbox" id="erpsense-toggle" ${isEnabled ? 'checked' : ''} />
        <span class="erpsense-slider"></span>
      </span>
      <span class="erpsense-label">Enable Tweaks</span>
    </label>
  `;

  // Insert before the inbox dropdown item
  const inboxItem = document.querySelector('.navbar-nav .navbar-item.dropdown');
  if (!inboxItem) return; // navbar not ready yet — MutationObserver will retry

  inboxItem.insertAdjacentElement('beforebegin', navItem);

  // Handle toggle change
  document.getElementById('erpsense-toggle').addEventListener('change', async (e) => {
    await browser.storage.sync.set({ isExtensionEnabled: e.target.checked });
    browser.runtime.sendMessage({ action: 'reloadTab' });
  });
}

// Watch for the navbar to appear (it may render after document_end)
const observer = new MutationObserver(() => {
  if (document.querySelector('.navbar-nav .navbar-item.dropdown')) {
    observer.disconnect();
    initialize();
  }
});

if (document.querySelector('.navbar-nav .navbar-item.dropdown')) {
  // Already in DOM
  initialize();
} else {
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
