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

const PERIOD_TIMES = [
  '9:15 - 10:05',
  '10:05 - 10:55',
  '11:10 - 12:00',
  '12:00 - 12:50',
  '1:40 - 2:25',
  '2:25 - 3:10',
  '3:25 - 4:10',
  '4:10 - 4:55',
  ''
];

function readHeaderTimings(table) {
  const timeRe = /(\d{1,2}[.:]\d{2})\s*-\s*(\d{1,2}[.:]\d{2})/;
  const headerRow = [...table.querySelectorAll('tr')].find(r => timeRe.test(r.textContent));
  if (!headerRow) {
    return [];
  }
  const fmt = t => {
    const [h, m] = t.split(/[.:]/);
    return `${parseInt(h, 10)}:${m}`;
  };
  return [...headerRow.children].slice(1).map(cell => {
    const m = cell.textContent.match(timeRe);
    return m ? `${fmt(m[1])} - ${fmt(m[2])}` : '';
  });
}

function removeUnwantedElements() {
  selectorsToRemove.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      console.log('Removing element:', element);
      element.remove();
    });
  });
}

function minifySidebarOnLoad() {
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.classList.add('app-sidebar-minified');
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

  
  const nativeLink = dashboard.querySelector('a[href*="MyTimeTable"]');
  const nativeCol = nativeLink?.closest('[class*="col-"]') || null;

  
  const attendanceLink = dashboard.querySelector('a[href*="Attendance"]');
  const attendanceCol = attendanceLink?.closest('[class*="col-"]') || null;

  card = document.createElement('div');
  if (nativeCol) {
    
    card.className = nativeCol.className;
  } else if (attendanceCol) {
    
    card.className = 'col-12 col-lg mb-3';
    card.style.minWidth = '0';
  } else {
    card.className = 'col-12 mb-3';
  }
  card.dataset.erpsenseTimetableCard = 'true';
  card.style.alignSelf = 'flex-start';   // keep natural height, don't stretch with the attendance tile

  card.innerHTML = `
    <div class="btn1 btn-white w-100 h-100 p-3" style="display:block;text-align:left">
      <a
        href="https://erp.psit.ac.in/Student/MyTimeTable"
        class="text-primary text-decoration-none"
        style="display:block;white-space:nowrap;font-size:18px;font-weight:600;margin-bottom:12px"
      >View Timetable →</a>
      <div data-erpsense-timetable-content style="width:100%;min-width:0">
        Loading today's timetable...
      </div>
    </div>
  `;

  if (nativeCol) {
    nativeCol.replaceWith(card);       
    attendanceCol.after(card);         
  } else {
    dashboard.appendChild(card);        
  }

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
    const response = await fetch('https://erp.psit.ac.in/Student/MyTimeTable', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Timetable request failed: ${response.status}`);
    }

    const html = await response.text();
    const timetableDocument = new DOMParser().parseFromString(html, 'text/html');

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

    const todayRow = [...sourceTable.querySelectorAll('tbody tr')].find(row =>
      row.querySelector('td')?.textContent.trim().toLowerCase() === today.toLowerCase()
    );

    const content = card.querySelector('[data-erpsense-timetable-content]');

    if (!content) {
      throw new Error('Timetable card content is missing.');
    }

    if (!todayRow) {
      renderTimetableMessage(card, `No timetable found for ${today}.`);
      card.dataset.erpsenseTimetableUpdated = 'true';
      return;
    }

    
    const sourceCells = [...todayRow.querySelectorAll('td')].slice(1);
    console.log('ErpSense: period cells found:', sourceCells.length);

    const periods = sourceCells.map((cell, index) => {
      const text = cell.textContent.replace(/\s+/g, ' ').trim();
      
      const parts = [...text.matchAll(/\[\s*([^\]]*?)\s*\]/g)].map(m => m[1]);
      return { period: index + 1, parts, raw: text };
    });

    
    while (periods.length && !periods[periods.length - 1].raw) {
      periods.pop();
    }

    const timings = readHeaderTimings(sourceTable);

    const hasClasses = periods.some(p => p.raw.length > 0);

    content.replaceChildren();

    if (!hasClasses) {
      renderTimetableMessage(card, `No classes scheduled for ${today}.`);
      card.dataset.erpsenseTimetableUpdated = 'true';
      return;
    }

    // Horizontal row of rectangles
    const row = document.createElement('div');
    row.style.cssText = `
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(120px, 1fr);
      gap: 6px;
      overflow-x: auto;
    `;

    periods.forEach(({ period, parts, raw }) => {
      const box = document.createElement('div');
      box.style.cssText = `
        padding: 8px;
        border: 1px solid #cfe0ff;
        border-radius: 6px;
        background: #eef5f9;
        text-align: center;
        font-size: 12px;
        line-height: 1.4;
      `;

      const timeEl = document.createElement('div');
      timeEl.style.cssText = 'color:#888;font-size:11px;font-weight:500';
      timeEl.textContent = timings[period - 1] || PERIOD_TIMES[period - 1] || '';
      box.appendChild(timeEl);

      if (parts.length >= 3) {
        const [teacher, code, room] = parts;

        const codeEl = document.createElement('div');
        codeEl.style.cssText = 'font-weight:600;font-size:14px';
        codeEl.textContent = code;

        const teacherEl = document.createElement('div');
        teacherEl.textContent = teacher;

        const roomEl = document.createElement('div');
        roomEl.style.color = '#666';
        roomEl.textContent = room;

        box.append(codeEl, teacherEl, roomEl);
      } else {
        
        const other = document.createElement('div');
        other.textContent = raw || '—';
        box.appendChild(other);
      }

      row.appendChild(box);
    });

    content.appendChild(row);
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
    queueBalance();   
  }
}

function injectCompactStyles() {
  if (document.querySelector('[data-erpsense-style]') || !document.head) {
    return;
  }
  const style = document.createElement('style');
  style.dataset.erpsenseStyle = 'true';
  style.textContent = `
    .sectionDashboardProfile .new-message-box {
      min-height: 0 !important;
      height: auto !important;
      margin-top: 4px !important;
      margin-bottom: 4px !important;
    }
    .sectionDashboardProfile .new-message-box > * {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }
  `;
  document.head.appendChild(style);
}


function compactLeftColumn() {
  const box = document.querySelector('.sectionDashboardProfile .new-message-box');
  if (!box) {
    return null;
  }
  let el = box.parentElement;
  let last = null;
  for (
    let i = 0;
    i < 3 && el &&
    !el.classList.contains('row') &&
    !el.classList.contains('sectionDashboardProfile');
    i++
  ) {
    el.style.height = 'auto';
    el.style.minHeight = '0';
    el.style.alignSelf = 'flex-start';
    last = el;
    el = el.parentElement;
  }
  if (!last) {
    return null;
  }
  return {
    leftCol: last,
    rightCol: last.nextElementSibling || last.previousElementSibling,
    row: last.parentElement
  };
}


let balanceQueued = false;
function queueBalance() {
  if (balanceQueued) {
    return;
  }
  balanceQueued = true;
  requestAnimationFrame(() => {
    balanceQueued = false;
    balanceLeftColumn();
  });
}

function balanceLeftColumn() {
  const attCol = document.querySelector('[data-erpsense-attendance="done"]');
  const parts = compactLeftColumn();
  if (!attCol || !parts || !parts.rightCol) {
    return;
  }

  const { leftCol, rightCol } = parts;
  const tile = attCol.firstElementChild;
  if (!tile) {
    return;
  }

  
  tile.style.minHeight = '';
  rightCol.style.marginTop = '';

  
  if (window.innerWidth < 992) {
    return;
  }

  const gap =
    rightCol.getBoundingClientRect().bottom -
    leftCol.getBoundingClientRect().bottom;

  if (gap < 8) {
    return;
  }

  
  const tlCard = document.querySelector('[data-erpsense-timetable-card]');
  const tileHeight = tile.getBoundingClientRect().height;
  const cardHeight = tlCard ? tlCard.getBoundingClientRect().height : tileHeight;
  tile.style.minHeight = `${Math.round(Math.max(tileHeight, cardHeight + gap))}px`;

  
  const d =
    rightCol.getBoundingClientRect().bottom -
    leftCol.getBoundingClientRect().bottom;
  if (d > 0) {
    rightCol.style.marginTop = `-${Math.round(d)}px`;
  }
}


const ATTENDANCE_TARGET = 75; 
function attendanceColor(pct) {
  if (pct >= ATTENDANCE_TARGET) {
    return '#16a34a';          
  }
  if (pct >= ATTENDANCE_TARGET - 10) {
    return '#f59e0b';          
  }
  return '#dc2626';           
}

function restyleAttendanceTile() {
  const dashboard = document.querySelector('.sectionDashboardTop');
  if (!dashboard) {
    return;
  }

  const link = dashboard.querySelector('a[href*="Attendance"]');
  const col = link?.closest('[class*="col-"]');

  if (!col || col.dataset.erpsenseAttendance === 'done') {
    return;
  }

  
  const text = col.textContent.replace(/\s+/g, ' ');
  const grab = re => text.match(re)?.[1];

  const total = grab(/TL\s*-\s*(\d+)/i);
  const present = grab(/\bP\s*-\s*(\d+)/i);
  const pf = grab(/\bPF\s*-\s*(\d+)/i);
  const absent = grab(/\bAb\s*-\s*(\d+)/i);
  const withPf = grab(/With\s*PF\s*:\s*([\d.]+)/i);
  const withoutPf = grab(/Without\s*PF\s*:\s*([\d.]+)/i);

  
  if (total == null || present == null || absent == null) {
    return;
  }

  const tile = col.firstElementChild || col;
  const tileIsLink = tile.tagName === 'A';

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'width:100%;text-align:left;flex:1 1 auto;display:flex;flex-direction:column';

  
  const heading = document.createElement(tileIsLink ? 'div' : 'a');
  if (!tileIsLink) {
    heading.href = link.href;
  }
  heading.textContent = 'My Attendance';
  heading.style.cssText =
    'display:block;font-size:16px;font-weight:600;margin-bottom:10px;color:#222;text-decoration:none';
  wrap.appendChild(heading);

  
  const stats = document.createElement('div');
  stats.style.cssText =
    'display:grid;grid-template-columns:repeat(auto-fit,minmax(60px,1fr));grid-auto-rows:1fr;gap:6px;margin-bottom:10px;flex:1 1 auto';

  [
    ['Total', total, '#2563eb'],
    ['Present', present, '#16a34a'],
    ['PF', pf, '#7c3aed'],
    ['Absent', absent, '#dc2626']
  ].forEach(([label, value, color]) => {
    if (value == null) {
      return;
    }
    const cell = document.createElement('div');
    cell.style.cssText =
      'display:flex;flex-direction:column;justify-content:center;align-items:center;padding:6px 4px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;text-align:center';

    const num = document.createElement('div');
    num.style.cssText = `font-size:20px;font-weight:600;line-height:1.2;color:${color}`;
    num.textContent = value;

    const lab = document.createElement('div');
    lab.style.cssText = 'font-size:11px;color:#777';
    lab.textContent = label;

    cell.append(num, lab);
    stats.appendChild(cell);
  });
  wrap.appendChild(stats);

  
  const addPercent = (label, value) => {
    if (value == null) {
      return;
    }
    const pct = Math.max(0, Math.min(100, parseFloat(value)));
    const color = attendanceColor(pct);

    const rowEl = document.createElement('div');
    rowEl.style.cssText = 'margin-top:6px';

    const top = document.createElement('div');
    top.style.cssText = 'display:flex;justify-content:space-between;font-size:13px';

    const l = document.createElement('span');
    l.textContent = label;
    const v = document.createElement('strong');
    v.textContent = `${value}%`;
    v.style.color = color;
    top.append(l, v);

    const track = document.createElement('div');
    track.style.cssText =
      'height:5px;border-radius:3px;background:#e9ecef;margin-top:3px;overflow:hidden';
    const fill = document.createElement('div');
    fill.style.cssText = `height:100%;width:${pct}%;background:${color}`;
    track.appendChild(fill);

    rowEl.append(top, track);
    wrap.appendChild(rowEl);
  };

  addPercent('With PF', withPf);
  addPercent('Without PF', withoutPf);


  const t = parseInt(total, 10);
  const pr = parseInt(present, 10);
  if (t > 0 && ATTENDANCE_TARGET < 100) {
    let msg;
    if (pr * 100 >= ATTENDANCE_TARGET * t) {
      const skip = Math.floor((pr * 100) / ATTENDANCE_TARGET - t);
      msg =
        skip > 0
          ? `You can skip ${skip} more lecture${skip === 1 ? '' : 's'} and stay at ${ATTENDANCE_TARGET}%`
          : `You're right at ${ATTENDANCE_TARGET}%, don't skip!`;
    } else {
      const need = Math.ceil(
        (ATTENDANCE_TARGET * t - 100 * pr) / (100 - ATTENDANCE_TARGET)
      );
      msg = `Attend the next ${need} lecture${need === 1 ? '' : 's'} to reach ${ATTENDANCE_TARGET}%`;
    }

    const insight = document.createElement('div');
    insight.style.cssText = 'margin-top:10px;font-size:12px;color:#666';
    insight.textContent = `${msg} (without PF)`;
    wrap.appendChild(insight);
  }

  tile.replaceChildren(wrap);
  tile.style.display = 'flex';
  tile.style.flexDirection = 'column';
  tile.style.textAlign = 'left';

  col.dataset.erpsenseAttendance = 'done';
}

function handlePageMutations() {
  removeUnwantedElements();
  injectCompactStyles();
  compactLeftColumn();
  restyleAttendanceTile();
  addTimeTableLink();
  minifySidebarOnLoad();
  queueBalance();
}

//------- initialize --------
async function initialize() {
 
  const result = await browser.storage.sync.get({ isExtensionEnabled: true });
  if (!result.isExtensionEnabled) {
    console.log('ErpSense is disabled.');
    return;
  }

  
  if (!document.body) {
    requestAnimationFrame(initialize);
    return;
  }

  window.addEventListener('resize', queueBalance);
  window.addEventListener('load', queueBalance);

 
  handlePageMutations();

  
  const observer = new MutationObserver(handlePageMutations);
  observer.observe(document.body, { childList: true, subtree: true });
}

initialize();