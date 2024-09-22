// work-log-app.js
const DateTime = luxon.DateTime;
let workLogs = [];
let currentDate = DateTime.now();
const leaveTypesRequiringAttachment = ['sick', 'family_sick', 'parent_sick', 'spouse_sick', 'spouse_absence', 'child_sick'];

// Initialize Flatpickr for date and time inputs
flatpickr.localize(flatpickr.l10ns.he);

flatpickr("#edit-date", {
    dateFormat: "Y-m-d",
    allowInput: true,
    altInput: true,
    altFormat: "d/m/Y",
});

flatpickr("#edit-start-time, #edit-end-time", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
    minuteIncrement: 15,
});

function safelyParseJSON(json) {
    try {
        return JSON.parse(json);
    } catch (e) {
        console.error('Error parsing JSON from localStorage:', e);
        return null;
    }
}

function lazyLoadWorkLogs() {
    try {
        const storedLogs = localStorage.getItem('workLogs');
        if (storedLogs) {
            const parsedLogs = safelyParseJSON(storedLogs);
            if (parsedLogs && Array.isArray(parsedLogs)) {
                workLogs = parsedLogs;
            } else {
                console.error('Invalid data in localStorage');
                workLogs = [];
            }
        }
    } catch (error) {
        console.error('Error loading work logs:', error);
        workLogs = [];
    }
}

function saveWorkLogs() {
    try {
        localStorage.setItem('workLogs', JSON.stringify(workLogs));
    } catch (error) {
        console.error('Error saving work logs:', error);
        alert('אירעה שגיאה בשמירת הנתונים. אנא נסה שנית מאוחר יותר.');
    }
}

function showError(elementId, message) {
    let errorElement = document.getElementById(elementId);
    if (!errorElement) {
        errorElement = document.createElement('p');
        errorElement.id = elementId;
        errorElement.className = 'mt-2 text-sm text-red-600';
        const inputElement = document.getElementById(elementId.replace('-error', ''));
        if (inputElement && inputElement.parentNode) {
            inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
        }
    }
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    const inputElement = document.getElementById(elementId.replace('-error', ''));
    if (inputElement) {
        inputElement.setAttribute('aria-invalid', 'true');
    }
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.add('hidden');
    }
    const inputElement = document.getElementById(elementId.replace('-error', ''));
    if (inputElement) {
        inputElement.setAttribute('aria-invalid', 'false');
    }
}

function validateForm(formId) {
    const form = document.getElementById(formId);
    let isValid = true;

    form.querySelectorAll('input, select').forEach(element => {
        const errorId = `${element.id}-error`;
        if (element.hasAttribute('required') && !element.value.trim()) {
            showError(errorId, 'שדה זה הוא חובה');
            isValid = false;
        } else if (element.hasAttribute('minlength') && element.value.trim().length < parseInt(element.getAttribute('minlength'))) {
            showError(errorId, `אורך מינימלי הוא ${element.getAttribute('minlength')} תווים`);
            isValid = false;
        } else if (element.hasAttribute('maxlength') && element.value.trim().length > parseInt(element.getAttribute('maxlength'))) {
            showError(errorId, `אורך מקסימלי הוא ${element.getAttribute('maxlength')} תווים`);
            isValid = false;
        } else {
            hideError(errorId);
        }
    });

    const startTime = form.querySelector('[name="start-time"]');
    const endTime = form.querySelector('[name="end-time"]');
    if (startTime && endTime && startTime.value && endTime.value && startTime.value >= endTime.value) {
        showError(`${formId === 'work-log-form' ? '' : formId === 'edit-form' ? 'edit-' : 'day-'}end-time-error`, 'שעת הסיום חייבת להיות אחרי שעת ההתחלה');
        isValid = false;
    }

    // Validate attachment for leave types that require it
    const typeSelect = form.querySelector('[name="type"]');
    const attachmentInput = form.querySelector('[name="attachment"]');
    if (leaveTypesRequiringAttachment.includes(typeSelect.value) && (!attachmentInput || !attachmentInput.files.length)) {
        showError(`${formId === 'edit-form' ? 'edit-' : ''}attachment-error`, 'חובה לצרף מסמך לסוג דיווח זה');
        isValid = false;
    }

    return isValid;
}

function updateReport() {
    const view = document.getElementById('view-selector').value;
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = '';

    console.log('Current view:', view);
    console.log('Current date:', currentDate.toISO());
    console.log('Number of work logs:', workLogs.length);

    switch (view) {
        case 'month':
            displayMonthCalendar();
            break;
        case 'day':
            displayDayView(currentDate);
            break;
    }
}

function displayMonthCalendar() {
    const reportContent = document.getElementById('report-content');
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const totalDays = endOfMonth.day;

    let html = `
        <div class="flex flex-col md:flex-row justify-between items-center mb-4 p-4 bg-white shadow-lg rounded-lg border border-gray-200">
            <button onclick="changeMonth(-1)" class="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg transition duration-200" aria-label="חודש קודם">&lt; חודש קודם</button>
            <h3 class="text-lg font-semibold text-gray-800 text-center mb-2 md:mb-0">${currentDate.toFormat('MMMM yyyy')}</h3>
            <button onclick="changeMonth(1)" class="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg transition duration-200" aria-label="חודש הבא">חודש הבא &gt;</button>
        </div>
        <div class="text-right mb-4 p-4 bg-gray-100 rounded-lg">
            <p class="font-bold text-gray-600">סה"כ שעות בחודש: <span id="total-hours" class="text-gray-800"></span></p>
        </div>
        <div class="grid grid-cols-7 gap-2 text-center" role="grid" aria-label="לוח שנה חודשי">
            ${['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
              .map(day => `<div class="flex justify-center items-center font-bold text-gray-600 text-sm md:text-lg p-2 day-header" role="columnheader">${day}</div>`).join('')}
    `;

    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < startOfMonth.weekday % 7; i++) {
        html += '<div class="bg-gray-200 p-2 h-24" role="gridcell"></div>';
    }

    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
        const date = startOfMonth.set({ day });
        const dayLogs = workLogs.filter(log => DateTime.fromISO(log.date).hasSame(date, 'day'));
        const totalHours = calculateTotalHours(dayLogs);

        html += `
            <div class="bg-white p-2 h-24 border rounded-lg cursor-pointer flex flex-col justify-between items-center hover:bg-indigo-50 transition duration-200" 
                 role="gridcell" tabindex="0" 
                 onclick="displayDayView('${date.toISO()}')" 
                 aria-label="${date.toFormat('d בMMMM')}" 
                 data-date="${date.toISODate()}">
                <div class="font-bold text-gray-800">${day}</div>
                <div class="text-gray-600">${totalHours.toFixed(1)}</div>
            </div>
        `;
    }

    html += '</div>';
    reportContent.innerHTML = html;

    // Update total hours for the month
    const totalMonthHours = calculateTotalHours(workLogs.filter(log => 
        DateTime.fromISO(log.date).hasSame(currentDate, 'month')
    ));
    document.getElementById('total-hours').textContent = totalMonthHours.toFixed(1);
}



function displayDayView(dateString) {
    const date = DateTime.fromISO(dateString);
    currentDate = date;
    document.getElementById('view-selector').value = 'day';

    const reportContent = document.getElementById('report-content');
    const dayLogs = workLogs.filter(log => {
        const logDate = DateTime.fromISO(log.date);
        return logDate && logDate.hasSame(date, 'day');
    });

    // Sort the logs, handling potential undefined 'start-time'
    dayLogs.sort((a, b) => {
        if (!a['start-time'] && !b['start-time']) return 0;
        if (!a['start-time']) return 1;
        if (!b['start-time']) return -1;
        return a['start-time'].localeCompare(b['start-time']);
    });

    let html = `
        <div class="flex justify-between items-center mb-4">
            <button onclick="changeDay(-1)" class="text-blue-600 hover:text-blue-800" aria-label="יום קודם">&lt; יום קודם</button>
            <h3 class="text-lg font-semibold">${date.toFormat('dd/MM/yyyy')}</h3>
            <button onclick="changeDay(1)" class="text-blue-600 hover:text-blue-800" aria-label="יום הבא">יום הבא &gt;</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
                <h4 class="text-lg font-semibold">דיווחי היום</h4>
                <div class="relative h-[600px] border border-gray-300 rounded">
                    ${generateTimelineHtml(dayLogs)}
                </div>
            </div>
            <div>
                <h4 class="text-lg font-semibold mb-4">הוסף דיווח חדש</h4>
                <form id="day-work-log-form" novalidate>
                    <input type="hidden" id="day-date" name="date" value="${date.toFormat('yyyy-MM-dd')}">
                    <div class="space-y-4">
                        <div>
                            <label for="day-type" class="block mb-2 text-sm font-medium text-gray-900">סוג דיווח:</label>
                            <select id="day-type" name="type" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                                <option value="">בחר סוג דיווח</option>
                                <option value="work">עבודה רגילה</option>
                                <option value="sick">מחלה</option>
                                <option value="family_sick">מחלה משפחתית</option>
                                <option value="parent_sick">מחלת הורה</option>
                                <option value="spouse_sick">מחלת בן/בת זוג</option>
                                <option value="spouse_absence">היעדרות בגין בת זוג</option>
                                <option value="child_sick">מחלת ילד</option>
                                <option value="vacation">חופשה</option>
                                <option value="reserve">מילואים</option>
                                <option value="bereavement">אבל</option>
                                <option value="study">ימי השתלמות</option>
                            </select>
                            <p id="day-type-error" class="mt-2 text-sm text-red-600 hidden"></p>
                        </div>
                        <div id="day-location-container">
                            <label for="day-location" class="block mb-2 text-sm font-medium text-gray-900">מיקום עבודה:</label>
                            <input type="text" id="day-location" name="location" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required minlength="2" maxlength="50">
                            <p id="day-location-error" class="mt-2 text-sm text-red-600 hidden"></p>
                        </div>
                        <div id="day-client-container">
                            <label for="day-client" class="block mb-2 text-sm font-medium text-gray-900">לקוח לחיוב:</label>
                            <input type="text" id="day-client" name="client" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required minlength="2" maxlength="50">
                            <p id="day-client-error" class="mt-2 text-sm text-red-600 hidden"></p>
                        </div>
                        <div>
                            <label for="day-start-time" class="block mb-2 text-sm font-medium text-gray-900">שעת התחלה:</label>
                            <input type="text" id="day-start-time" name="start-time" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                            <p id="day-start-time-error" class="mt-2 text-sm text-red-600 hidden"></p>
                        </div>
                        <div>
                            <label for="day-end-time" class="block mb-2 text-sm font-medium text-gray-900">שעת סיום:</label>
                            <input type="text" id="day-end-time" name="end-time" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" required>
                            <p id="day-end-time-error" class="mt-2 text-sm text-red-600 hidden"></p>
                        </div>
                        <div id="attachment-container" class="hidden">
                            <label for="attachment" class="block mb-2 text-sm font-medium text-gray-900">צרף מסמך:</label>
                            <input type="file" id="attachment" name="attachment" class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none">
                            <p id="attachment-error" class="mt-2 text-sm text-red-600 hidden"></p>
                        </div>
                        <button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">הוסף דיווח</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    reportContent.innerHTML = html;

    initializeFlatpickr();

    // Add event listener for the new form
    document.getElementById('day-work-log-form').addEventListener('submit', handleDayFormSubmit);

    // Add event listener for the type select to show/hide attachment input and update fields
    const typeSelect = document.getElementById('day-type');
    const attachmentContainer = document.getElementById('attachment-container');
    const locationContainer = document.getElementById('day-location-container');
    const clientContainer = document.getElementById('day-client-container');

    typeSelect.addEventListener('change', () => {
        const selectedType = typeSelect.value;
        
        // Show/hide attachment input
        if (leaveTypesRequiringAttachment.includes(selectedType)) {
            attachmentContainer.classList.remove('hidden');
        } else {
            attachmentContainer.classList.add('hidden');
        }

        // Update labels and visibility of location and client fields
        if (selectedType === 'work') {
            locationContainer.querySelector('label').textContent = 'מיקום עבודה:';
            clientContainer.querySelector('label').textContent = 'לקוח לחיוב:';
            locationContainer.style.display = 'block';
            clientContainer.style.display = 'block';
        } else if (selectedType) {
            locationContainer.querySelector('label').textContent = 'סיבת היעדרות:';
            clientContainer.querySelector('label').textContent = 'פרטים נוספים:';
            locationContainer.style.display = 'block';
            clientContainer.style.display = 'block';
        } else {
            // If no type is selected, hide both fields
            locationContainer.style.display = 'none';
            clientContainer.style.display = 'none';
        }
    });

    // Trigger the change event to set the initial state
    typeSelect.dispatchEvent(new Event('change'));
}
function initializeFlatpickr() {
    flatpickr("#day-start-time, #day-end-time", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 15,
    });
}
function generateTimelineHtml(logs) {
    const timeSlots = new Array(24).fill().map((_, i) => {
        const time = i.toString().padStart(2, '0') + ':00';
        return `<div class="absolute w-full border-t border-gray-200 text-xs text-gray-500 text-right pr-1" style="top: ${i * (100 / 24)}%">${time}</div>`;
    });

    const processedLogs = handleOverlappingReports(logs);
    const maxOverlap = Math.max(...processedLogs.map(log => log.overlap));

    const logElements = processedLogs.map(log => {
        const startTime = DateTime.fromFormat(log['start-time'], 'HH:mm');
        const endTime = DateTime.fromFormat(log['end-time'], 'HH:mm');
        const top = (startTime.hour + startTime.minute / 60) * (100 / 24);
        let height = (endTime.diff(startTime, 'minutes').minutes / 60) * (100 / 24);
        const color = getColorForLogType(log.type);
        const width = (100 / (maxOverlap + 1)) * 0.9; // Reduce width further for mobile
        const left = (log.overlap * width); // Start logs from the left

        // Set a minimum height for visibility
        const minHeight = 5; // 5% of the timeline height
        if (height < minHeight) {
            height = minHeight;
        }

        let content = `
            <strong>${getHebrewType(log.type)}</strong><br>
            ${log['start-time']} - ${log['end-time']}<br>
            ${log.client} (${log.location})
        `;

        // For very short durations, show a compact version
        if (height <= 8) {
            content = `<strong>${getHebrewType(log.type)}</strong> ${log['start-time']} - ${log['end-time']}`;
        }

        return `
        <div class="absolute p-1 text-xs text-white rounded-sm overflow-hidden hover:overflow-visible hover:z-10" 
             style="top: ${top}%; height: ${height}%; min-height: ${minHeight}%; background-color: ${color}; width: ${width}%; left: ${left}%; z-index: 1; border: 1px dashed white;">
            <div class="h-full w-full overflow-y-auto">
                ${content}
                <div class="mt-1">
                    <button onclick="editLog('${log.id}')" class="text-white underline mr-2" aria-label="ערוך דיווח">ערוך</button>
                    <button onclick="deleteLog('${log.id}')" class="text-white underline" aria-label="מחק דיווח">מחק</button>
                </div>
            </div>
        </div>
    `;
    
    });

    return `
        <div class="relative h-full overflow-x-auto"> <!-- Added overflow-x-auto for horizontal scrolling on mobile -->
            <div class="absolute inset-0 pr-12"> <!-- Add right padding for time markers -->
                ${logElements.join('')}
            </div>
            ${timeSlots.join('')}
        </div>
    `;
}

function handleOverlappingReports(logs) {
    logs.sort((a, b) => a['start-time'].localeCompare(b['start-time']));
    const overlaps = new Array(logs.length).fill(0);

    for (let i = 0; i < logs.length; i++) {
        for (let j = 0; j < i; j++) {
            if (logs[i]['start-time'] < logs[j]['end-time']) {
                overlaps[i] = Math.max(overlaps[i], overlaps[j] + 1);
            }
        }
    }

    return logs.map((log, index) => ({ ...log, overlap: overlaps[index] }));
}

function getColorForLogType(type) {
    const colors = {
        'work': '#4299e1',
        'sick': '#f56565',
        'vacation': '#48bb78',
        'reserve': '#ed8936',
        'bereavement': '#9f7aea',
        'study': '#ecc94b'
    };
    return colors[type] || '#a0aec0';
}

function getHebrewType(type) {
    const types = {
        'work': 'עבודה רגילה',
        'sick': 'מחלה',
        'family_sick': 'מחלה משפחתית',
        'parent_sick': 'מחלת הורה',
        'spouse_sick': 'מחלת בן/בת זוג',
        'spouse_absence': 'היעדרות בגין בת זוג',
        'child_sick': 'מחלת ילד',
        'vacation': 'חופשה',
        'reserve': 'מילואים',
        'bereavement': 'אבל',
        'study': 'ימי השתלמות'
    };
    return types[type] || type;
}

function handleDayFormSubmit(e) {
    e.preventDefault();
    if (!validateForm('day-work-log-form')) return;

    const formData = new FormData(e.target);
    const newLog = Object.fromEntries(formData.entries());
    newLog.id = Date.now().toString();

    // Handle file attachment
    const attachmentInput = document.getElementById('attachment');
    if (attachmentInput && attachmentInput.files.length > 0) {
        newLog.attachmentName = attachmentInput.files[0].name;
        // In a real application, you would upload the file to a server here
        // and store the file reference or URL instead of the file name
    }

    workLogs.push(newLog);
    saveWorkLogs();
    displayDayView(currentDate.toISO());

    // Show success message
    showSuccessMessage('הדיווח נשמר בהצלחה');
}


function editLog(id) {
    const log = workLogs.find(log => log.id === id);
    if (log) {
        document.getElementById('edit-id').value = log.id;
        
        // Auto-populate the date field
        const dateInput = document.getElementById('edit-date');
        if (dateInput) {
            dateInput.value = log.date;
            dateInput._flatpickr.setDate(log.date);
        }

        document.getElementById('edit-type').value = log.type;
        document.getElementById('edit-location').value = log.location;
        document.getElementById('edit-client').value = log.client;
        document.getElementById('edit-start-time').value = log['start-time'];
        document.getElementById('edit-end-time').value = log['end-time'];

        // Show/hide attachment input based on log type
        const attachmentContainer = document.getElementById('edit-attachment-container');
        if (leaveTypesRequiringAttachment.includes(log.type)) {
            attachmentContainer.classList.remove('hidden');
        } else {
            attachmentContainer.classList.add('hidden');
        }
        
        // Show the modal
        openModal('edit-modal');

        // Add event listener for the type select to show/hide attachment input
        const typeSelect = document.getElementById('edit-type');
        typeSelect.addEventListener('change', () => {
            if (leaveTypesRequiringAttachment.includes(typeSelect.value)) {
                attachmentContainer.classList.remove('hidden');
            } else {
                attachmentContainer.classList.add('hidden');
            }
        });
    }
}

function deleteLog(id) {
    const confirmDelete = confirm('האם אתה בטוח שברצונך למחוק רשומה זו?');
    if (confirmDelete) {
        workLogs = workLogs.filter(log => log.id !== id);
        saveWorkLogs();
        updateReport();
        showSuccessMessage('הדיווח נמחק בהצלחה');
    }
}

function showSuccessMessage(message) {
    const successMessage = document.createElement('div');
    successMessage.textContent = message;
    successMessage.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4';
    successMessage.setAttribute('role', 'alert');
    document.getElementById('report-container').insertAdjacentElement('afterbegin', successMessage);
    setTimeout(() => successMessage.remove(), 3000);
}

function changeMonth(delta) {
    currentDate = currentDate.plus({ months: delta });
    displayMonthCalendar();
}

function changeDay(delta) {
    currentDate = currentDate.plus({ days: delta });
    displayDayView(currentDate.toISO());
}

function calculateTotalHours(logs) {
    return logs.reduce((total, log) => {
        if (log.type === 'work') {
            const startTime = DateTime.fromFormat(log['start-time'], 'HH:mm');
            const endTime = DateTime.fromFormat(log['end-time'], 'HH:mm');
            const duration = endTime.diff(startTime, 'hours');
            return total + duration.hours;
        }
        return total;
    }, 0);
}

function exportToCSV() {
    const headers = ['תאריך', 'סוג דיווח', 'מיקום עבודה', 'לקוח לחיוב', 'שעת התחלה', 'שעת סיום'];
    const rows = workLogs.map(log => [
        log.date,
        getHebrewType(log.type),
        log.location,
        log.client,
        log['start-time'],
        log['end-time']
    ]);

    // Prepare CSV content
    let csvContent = [headers, ...rows].map(row => 
        row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\r\n');

    // Add BOM and convert to UTF-16LE
    const bom = '\uFEFF';
    const utf16le = new TextEncoder().encode(bom + csvContent);

    // Create Blob and download
    const blob = new Blob([utf16le], { type: 'text/csv;charset=UTF-16LE;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "work_logs.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

function handleEditFormSubmit(e) {
    e.preventDefault();
    if (!validateForm('edit-form')) return;

    const formData = new FormData(e.target);
    const updatedLog = Object.fromEntries(formData.entries());
    const id = document.getElementById('edit-id').value;
    
    // Handle file attachment
    const attachmentInput = document.getElementById('edit-attachment');
    if (attachmentInput && attachmentInput.files.length > 0) {
        updatedLog.attachmentName = attachmentInput.files[0].name;
        // In a real application, you would upload the file to a server here
        // and store the file reference or URL instead of the file name
    }

    const index = workLogs.findIndex(log => log.id === id);
    if (index !== -1) {
        workLogs[index] = { ...workLogs[index], ...updatedLog };
        saveWorkLogs();
        updateReport();
        closeModal('edit-modal');
        showSuccessMessage('הדיווח עודכן בהצלחה');
    }
}

function handleCalendarKeyboardNavigation(e) {
    if (document.getElementById('view-selector').value === 'month') {
        const focusedDay = document.activeElement;
        if (focusedDay.getAttribute('role') === 'gridcell') {
            const currentDate = DateTime.fromISO(focusedDay.getAttribute('data-date'));
            let newDate;

            switch (e.key) {
                case 'ArrowRight':
                    newDate = currentDate.minus({ days: 1 });
                    break;
                case 'ArrowLeft':
                    newDate = currentDate.plus({ days: 1 });
                    break;
                case 'ArrowUp':
                    newDate = currentDate.minus({ weeks: 1 });
                    break;
                case 'ArrowDown':
                    newDate = currentDate.plus({ weeks: 1 });
                    break;
                default:
                    return;
            }

            e.preventDefault();
            const newFocusedDay = document.querySelector(`[data-date="${newDate.toISODate()}"]`);
            if (newFocusedDay) {
                newFocusedDay.focus();
            }
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    lazyLoadWorkLogs();
    updateReport();

    document.getElementById('view-selector').addEventListener('change', updateReport);
    document.getElementById('edit-form').addEventListener('submit', handleEditFormSubmit);
    document.getElementById('export-csv').addEventListener('click', exportToCSV);

    // Keyboard navigation for calendar
    document.addEventListener('keydown', handleCalendarKeyboardNavigation);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close modal when clicking on close button
    const closeButtons = document.querySelectorAll('.modal .close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
});
// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
        document.body.classList.add('modal-open');
        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.add('opacity-50');
            modal.classList.add('active');
        }, 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
        document.body.classList.remove('modal-open');
        modal.classList.remove('active');
        overlay.classList.remove('opacity-50');
        setTimeout(() => {
            modal.classList.add('hidden');
            overlay.classList.add('hidden');
        }, 0);
    }
}
// Event listener for closing the modal when clicking outside
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// Initialize the report
updateReport();