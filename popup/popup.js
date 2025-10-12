document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('extension-toggle');
  const updateMessage = document.getElementById('update-message');

  // Load the saved state and update the switch
  browser.storage.sync.get({ isExtensionEnabled: true })  // Default is true (enabled)
    .then(result => {
      toggleSwitch.checked = result.isExtensionEnabled;
    })
    .catch(error => {
      console.error(`Error getting stored setting: ${error}`);
    });

  // Listen for changes on the switch
  toggleSwitch.addEventListener('change', (event) => {
    const isEnabled = event.target.checked;
    browser.storage.sync.set({ isExtensionEnabled: isEnabled });
    updateMessage.classList.add('show');
  });
});