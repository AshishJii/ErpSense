function handlePageMutations() {
    const targetLabel = Array.from(document.getElementsByClassName('form-label')).find(el => el.textContent.includes("Select Uploaded Proof"));
    if (targetLabel) {
        const targetRow = targetLabel.closest('.row');
        // Guard clause to prevent duplicate injection
        if (targetRow && targetRow.dataset.erpsenseUploaderInjected !== 'true') {
             injectUploader(targetRow);
        }
    }
}

function injectUploader(targetRow) {
    targetRow.dataset.erpsenseUploaderInjected = 'true';
    // HTML structure kept exactly as requested
    const uploaderHTML = `
        <div class="col-md-12 col-12 erpsense-uploader-wrapper" style="margin-bottom: 15px; border: 1px solid #ccc; padding: 10px; border-radius: 5px;">
            <details>
                <summary style="cursor: pointer; font-weight: bold; color: #007bff;font-size: 14px;"
                onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
                    <span>Upload New Document</span>
                </summary>
                <div class="row mt-3">
                    <label class="form-label coll-lg-2 col-md-2 col-sm-4"><b>Document Title:</b></label>
                    <div class="col-md-6 col-sm-6">
                        <input type="text" id="erpsense-doc-title" class="form-control" placeholder="e.g., Fee Receipt, Medical Certificate">
                    </div>
                </div>
                <div class="row mt-2">
                    <label class="form-label coll-lg-2 col-md-2 col-sm-4"><b>Select File:</b></label>
                    <div class="col-md-8 col-sm-8">
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <button type="button" id="erpsense-browse-btn" class="btn btn-sm btn-info" style="display: flex; align-items: center; gap: 5px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                Browse
                            </button>
                            <button type="button" id="erpsense-paste-btn" class="btn btn-sm btn-secondary" style="display: flex; align-items: center; gap: 5px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                                Paste
                            </button>
                             <div id="erpsense-paste-target" contenteditable="true" style="opacity: 0; position: absolute; z-index: -1; height: 1px; width: 1px; overflow: hidden;"></div>
                            <input type="file" id="erpsense-file-input" hidden accept="image/*,application/pdf">
                        </div>
                        <small class="text-muted" id="erpsense-paste-hint">Supports Images and PDF.</small>
                    </div>
                </div>
                <div class="row mt-2" id="erpsense-preview-row" style="display: none;">
                     <label class="form-label coll-lg-2 col-md-2 col-sm-4"></label>
                     <div class="col-md-8 col-sm-8">
                        <div id="erpsense-preview-container" style="border: 1px dashed #ccc; padding: 5px; margin-top: 5px; max-width: 300px; min-height: 50px; display: flex; align-items: center; justify-content: center; background: #f9f9f9;"></div>
                     </div>
                </div>
                <div class="row mt-3">
                    <label class="form-label coll-lg-2 col-md-2 col-sm-4"></label>
                    <div class="col-md-6 col-sm-6">
                        <button type="button" id="erpsense-upload-action-btn" class="btn btn-success" disabled style="font-weight: bold;">
                            Start Upload
                        </button>
                         <span id="erpsense-upload-status" style="margin-left: 10px;"></span>
                    </div>
                </div>
            </details>
        </div>
    `;

    const newRow = document.createElement('div');
    newRow.className = 'row mt-2 erpsense-injected';
    newRow.innerHTML = uploaderHTML;
    targetRow.parentNode.insertBefore(newRow, targetRow);

    attachUploaderListeners();
}

function attachUploaderListeners() {
    const els = {
        browseBtn: document.getElementById('erpsense-browse-btn'),
        pasteBtn: document.getElementById('erpsense-paste-btn'),
        pasteTarget: document.getElementById('erpsense-paste-target'),
        pasteHint: document.getElementById('erpsense-paste-hint'),
        fileInput: document.getElementById('erpsense-file-input'),
        uploadBtn: document.getElementById('erpsense-upload-action-btn'),
        uploadStatus: document.getElementById('erpsense-upload-status'),
        previewRow: document.getElementById('erpsense-preview-row'),
        previewContainer: document.getElementById('erpsense-preview-container'),
        docTitleInput: document.getElementById('erpsense-doc-title')
    };

    let selectedFile = null;
    let oaAttendanceValue = "";

    // Helper to update status messages
    const updateStatus = (msg, color = 'inherit') => {
        if (els.uploadStatus) {
            els.uploadStatus.textContent = msg;
            els.uploadStatus.style.color = color;
        }
    };

    // Fetch Category Value from background script
    browser.runtime.sendMessage({ action: "uploadProof" }).then((response) => {
        if (response?.success) {
             oaAttendanceValue = response.data.oaAttendanceValue;
             console.log("Received OA Attendance Value:", oaAttendanceValue);
        } else {
             console.error("ERROR: Failed to receive valid OA Attendance Value");
        }
    }).catch(error => console.error("ERROR: Failed to receive parsed OD data:", error));

    // Event Listeners
    els.browseBtn.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', (e) => {
        if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
    });

    els.pasteBtn.addEventListener('click', async () => {
        els.pasteHint.innerHTML = '<span style="color: #dc3545; font-weight: bold;">Please press Ctrl+V (or Cmd+V) now to paste.</span>';
        els.pasteTarget.focus();
    });

    // Above listerner revised to use Clipboard API below
    /*
    els.pasteBtn.addEventListener('click', async () => {
        els.pasteHint.textContent = "Attempting to read clipboard...";
        try {
            window.focus(); // Required for Firefox sometimes
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                const imageType = item.types.find(type => type.startsWith('image/'));
                if (imageType) {
                    const blob = await item.getType(imageType);
                    handleFileSelection(new File([blob], "pasted-image.png", { type: imageType }));
                    els.pasteHint.textContent = "Supports Images and PDF.";
                    return;
                }
            }
            throw new Error("No image found via API");
        } catch (err) {
            console.warn("Clipboard API failed, switching to fallback:", err);
            els.pasteHint.innerHTML = '<span style="color: #dc3545; font-weight: bold;">Please press Ctrl+V (or Cmd+V) now to paste.</span>';
            els.pasteTarget.focus();
        }
    });
    */

    els.pasteTarget.addEventListener('paste', (e) => {
        e.preventDefault();
        els.pasteHint.textContent = "Supports Images and PDF.";
        const files = e.clipboardData?.files;
        const items = e.clipboardData?.items;

        if (files?.length > 0) {
            handleFileSelection(files[0]);
        } else if (items) {
            // pick first eligble item
             for (let i = 0; i < items.length; i++) {
                 if (items[i].kind === 'file') {
                     handleFileSelection(items[i].getAsFile());
                     return;
                 }
             }
             alert("No file detected in paste.");
        }
    });

    function handleFileSelection(file) {
        // Validation check for allowed file types
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            alert("Unsupported file type. Please select an Image or PDF.");
            els.fileInput.value = null; 
            return;
        }
        selectedFile = file;
        els.uploadBtn.disabled = false;
        els.previewRow.style.display = 'flex';
        els.previewContainer.innerHTML = '<span style="color: #999;">Loading...</span>';
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                els.previewContainer.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 4px;">`;
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            // Create a Blob URL for the PDF file
            const fileURL = URL.createObjectURL(file);
            els.previewContainer.innerHTML = `
                <iframe src="${fileURL}#toolbar=0&navpanes=0&scrollbar=0" type="application/pdf" width="100%" height="200px" style="border: none; border-radius: 4px;">
                    <p>Your browser does not support PDF previews. <a href="${fileURL}" target="_blank">Download the PDF</a>.</p>
                </iframe>`;
        }
    }

    els.uploadBtn.addEventListener('click', async () => {
        // Validation
        if (!els.docTitleInput.value.trim()) {
            alert("Please enter a Document Title.");
            els.docTitleInput.focus();
            return;
        }
        if (!selectedFile) { alert("No file selected."); return; }
        if (!oaAttendanceValue) {
            alert("Error: Could not retrieve OA Attendance Value. Cannot upload.");
            return;
        }

        // Start Upload
        els.uploadBtn.disabled = true;
        els.uploadBtn.textContent = "Uploading...";
        updateStatus("");

        const formData = new FormData();
        formData.append("Title", els.docTitleInput.value);
        formData.append("Category", oaAttendanceValue);
        formData.append("file", selectedFile);

        try {
            const response = await fetch("https://erp.psit.ac.in/Student/MediaManagerProcess", {
                method: "POST",
                body: formData
            });

            if (response.ok || response.status === 302) {
                 updateStatus("Upload successful!(Refresh the page to see changes)", "green");
                 els.uploadBtn.textContent = "Uploaded";
                 setTimeout(() => window.location.reload(), 1000);
            } else {
                throw new Error(`Server responded with ${response.status}`);
            }
        } catch (error) {
            console.error("Upload failed:", error);
            updateStatus("Upload failed.", "red");
            els.uploadBtn.disabled = false;
            els.uploadBtn.textContent = "Start Upload";
        }
    });
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
  handlePageMutations();
  // Observer to watch for dynamically added content
  const observer = new MutationObserver(handlePageMutations);
  observer.observe(document.body, { childList: true, subtree: true });
}

initialize();