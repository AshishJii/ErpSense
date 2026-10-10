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

function createTimetableCard() {
    const dashboard = document.querySelector('.sectionDashboardTop');

    if (!dashboard) {
        return null;
    }

    let card = dashboard.querySelector('[data-erpsense-timetable-card]');

    if (card) {
        return card;
    }

    card = document.createElement('div');
    card.className = 'col-12 col-lg-8 mb-3';
    card.dataset.erpsenseTimetableCard = 'true';

    card.innerHTML = `
        <a
            href="https://erp.psit.ac.in/Student/MyTimeTable"
            class="d-block text-decoration-none text-dark h-100"
            aria-label="Today's Class — open full timetable"
        >
            <div class="btn1 btn-white w-100 h-100 p-3">
                <h5 class="mb-3">Today's Class</h5>
                <div data-erpsense-timetable-content>
                    Loading today's timetable...
                </div>
                <div class="text-primary mt-2">
                    View full timetable →
                </div>
            </div>
        </a>
    `;

    dashboard.appendChild(card);

    return card;
}

function renderTimetableMessage(card, message) {
    const content = card?.querySelector('[data-erpsense-timetable-content]');

    if (content) {
        content.textContent = message;
    }
}

async function addTimeTableLink() {
    if (window.location.pathname !== '/Student/Dashboard') {
        return;
    }

    const card = createTimetableCard();

    if (!card || card.dataset.erpsenseTimetableLoading === 'true') {
        return;
    }

    if (card.dataset.erpsenseTimetableUpdated === 'true') {
        return;
    }

    card.dataset.erpsenseTimetableLoading = 'true';

    try {
        const response = await fetch(
            'https://erp.psit.ac.in/Student/MyTimeTable',
            {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store'
            }
        );

        if (!response.ok) {
            throw new Error(`Timetable request failed: ${response.status}`);
        }

        const html = await response.text();
        const timetableDocument = new DOMParser().parseFromString(
            html,
            'text/html'
        );

        const sourceTable = timetableDocument.querySelector(
            'table.table.table-striped.table-bordered'
        );

        if (!sourceTable) {
            throw new Error('Could not find the timetable in the ERP response.');
        }

        const today = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            timeZone: 'Asia/Kolkata'
        }).format(new Date());

        const todayRow = [...sourceTable.querySelectorAll('tbody tr')]
            .find(row =>
                row.querySelector('td')
                    ?.textContent.trim().toLowerCase() === today.toLowerCase()
            );

        const content = card.querySelector(
            '[data-erpsense-timetable-content]'
        );

        if (!content) {
            throw new Error('Timetable card content is missing.');
        }

        if (!todayRow) {
            renderTimetableMessage(card, `No timetable found for ${today}.`);
            card.dataset.erpsenseTimetableUpdated = 'true';
            return;
        }

        const sourceCells = [...todayRow.querySelectorAll('td')];

        const periods = sourceCells.slice(1).map((cell, index) => {
            const details = cell.querySelector('h5')?.innerText
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean) || [];

            return {
                period: index + 1,
                details
            };
        });

        const hasClasses = periods.some(period => period.details.length > 0);

        content.replaceChildren();

        if (!hasClasses) {
            renderTimetableMessage(card, `No classes scheduled for ${today}.`);
            card.dataset.erpsenseTimetableUpdated = 'true';
            return;
        }

        const list = document.createElement('div');
        list.className = 'd-flex flex-column gap-2';

        periods.forEach(({ period, details }) => {
            if (details.length === 0) {
                return;
            }

            const item = document.createElement('div');
            item.className = 'border rounded p-2';

            const heading = document.createElement('strong');
            heading.textContent = `Period ${period}`;

            const description = document.createElement('div');
            description.textContent = details.join(' · ');

            item.append(heading, description);
            list.appendChild(item);
        });

        content.appendChild(list);
        card.dataset.erpsenseTimetableUpdated = 'true';

        console.log(`ErpSense: Today's timetable loaded for ${today}.`);
    } catch (error) {
        console.error('ErpSense timetable error:', error);
        renderTimetableMessage(
            card,
            "Couldn't load today's timetable. Please refresh the page."
        );
    } finally {
        delete card.dataset.erpsenseTimetableLoading;
    }
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