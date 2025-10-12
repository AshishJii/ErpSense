const selectorsToRemove = [
'.student_notices_alert',
'.sectionDashboardTop div.col-sm-6:has(a[href="https://erp.psit.ac.in/CR/Student_job_inbox"])',
'.sectionDashboardTop div.col-sm-6:has(a[href="#"])',
'.sectionDashboardTop div.col-sm-6:has(a[href="https://erp.psit.ac.in/Student/MediaManagerList"])',
'.student_details',
'.sectionDashboardProfile .new-message-box:has(a[href="javascript:void(0);"])',
'.sectionDashboardProfile .new-message-box:has(a[href="https://erp.psit.ac.in/Student/Feedback"])',
'.sectionDashboardProfile .card-dashboard-one > .card-header:has(a[href="NotesList"])',
'.sectionDashboardProfile .card-dashboard-one > .table-responsive:has(table.table-hover)',
'.sectionDashboardProfile .card-dashboard-one .card-body .row:has(a[href="StudentAssignInterviewList"])',
'.sectionDashboardProfile .col-xl-3.col-lg-3.col-sm-6.d-flex:has(a[href="LabAssignmentList"])',
'.sectionDashboardProfile .col-xl-3.col-lg-3.col-sm-6.d-flex:has(a[href="AchievementRequest"])',
'.sectionDashboardProfile .col-xl-3.col-lg-3.col-sm-6.d-flex:has(a[href="StudentLectureReview"])',
'.sectionDashboardProfile hr',
'section.mt-4 div.col-md-4.mb-4:has(a[href="GrievanceStudList"])',
'section.mt-4 div.col-md-4.mb-4:has(a[href="https://erp.psit.ac.in/assets/InfyNotes/C.pdf"])',
'footer',
'section.mt-4 li:has(a[href*="Student_training_inbox"])',
'section.mt-4 li:has(a[href*="/CR/form/1"])',
'section.mt-4 li:has(a[href*="drive.google.com/file/d/1JxKKCEQb229t4FSAi-LJib8Yz3usdPsa"])',
'.sectionDashboardProfile + br'
];

function removeUnwantedElements() {
  selectorsToRemove.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      console.log(`Removing element:`, element);
      element.remove();
    });
  });
}

function minifySidebarOnLoad() {
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.classList.add('app-sidebar-minified');
    console.log("Sidebar minified on page load.");
  }
}

function addTimeTableLink() {
    const dashboardTop = document.querySelector('.sectionDashboardTop');
    // Exit if the container doesn't exist OR if the link is already there
    if (!dashboardTop || dashboardTop.querySelector('a[href="https://erp.psit.ac.in/Student/MyTimeTable"]')) {
        return;
    }

    const timeTableDiv = document.createElement('div');
    timeTableDiv.className = 'col-sm-6 col-md-6 col-lg-4 col-xl-4 col-xxl-3 mb-3';
    timeTableDiv.innerHTML = `
        <a href="https://erp.psit.ac.in/Student/MyTimeTable" class="d-flex align-items-start text-decoration-none text-dark h-100">
            <button type="button" class="btn1 btn-white w-100 align-items-stretch d-flex h-100">
                <div class="icon icon-left icon-quarternary d-flex align-items-center justify-content-center">
                    <i class="fa-solid fa-calendar-days text-primary"></i>
                </div>
                <div class="text text-end d-flex flex-column justify-content-center">
                    <h4>My TimeTable</h4>
                    <span class="text-dark" style="color: rgb(38, 50, 56);">View Class Schedule</span>
                </div>
            </button>
        </a>
    `;
    
    dashboardTop.appendChild(timeTableDiv);
    console.log("TimeTable link successfully added to dashboard.");
}

function handlePageMutations() {
    removeUnwantedElements();
    addTimeTableLink();
    minifySidebarOnLoad();
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