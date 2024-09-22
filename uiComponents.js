// uiComponents.js
import { DateTime } from 'luxon';

export const UIComponents = {
    showError(elementId, message) {
        let errorElement = document.getElementById(elementId);
        if (!errorElement) {
            errorElement = document.createElement('p');
            errorElement.id = elementId;
            errorElement.className = 'mt-2 text-sm text-red-600';
            const form = document.getElementById('day-work-log-form');
            if (form) {
                form.prepend(errorElement);
            } else {
                console.error('Form not found: day-work-log-form');
                return;
            }
        }
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    },

    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.add('hidden');
        }
        const inputElement = document.getElementById(elementId.replace('-error', ''));
        if (inputElement) {
            inputElement.setAttribute('aria-invalid', 'false');
        }
    },

    showSuccessMessage(message) {
        const successMessage = document.createElement('div');
        successMessage.textContent = message;
        successMessage.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4';
        successMessage.setAttribute('role', 'alert');
        const reportContainer = document.getElementById('report-container');
        if (reportContainer) {
            reportContainer.insertAdjacentElement('afterbegin', successMessage);
            setTimeout(() => successMessage.remove(), 3000);
        } else {
            console.error('Report container not found');
        }
    },

    createLogElement(log, maxOverlap) {
        const startTime = DateTime.fromFormat(log['start-time'], 'HH:mm');
        const endTime = DateTime.fromFormat(log['end-time'], 'HH:mm');
        const top = (startTime.hour + startTime.minute / 60) * (100 / 24);
        let height = (endTime.diff(startTime, 'minutes').minutes / 60) * (100 / 24);
        const color = this.getColorForLogType(log.type);
        const width = (100 / (maxOverlap + 1)) * 0.9;
        const left = (log.overlap * width);
        const minHeight = 5;

        height = Math.max(height, minHeight);

        let content = `
            <strong>${this.getHebrewType(log.type)}</strong><br>
            ${log['start-time']} - ${log['end-time']}<br>
            ${log.client} (${log.location})
        `;

        if (height <= 8) {
            content = `<strong>${this.getHebrewType(log.type)}</strong> ${log['start-time']} - ${log['end-time']}`;
        }

        return `
        <div class="absolute p-1 text-xs text-white rounded-sm overflow-hidden hover:overflow-visible hover:z-10" 
             style="top: ${top}%; height: ${height}%; min-height: ${minHeight}%; background-color: ${color}; width: ${width}%; left: ${left}%; z-index: 1; border: 1px dashed white;">
            <div class="h-full w-full overflow-y-auto">
                ${content}
                <div class="mt-1">
                    <button onclick="WorkLogApp.editLog('${log.id}')" class="text-white underline mr-2" aria-label="ערוך דיווח">ערוך</button>
                    <button onclick="WorkLogApp.deleteLog('${log.id}')" class="text-white underline" aria-label="מחק דיווח">מחק</button>
                </div>
            </div>
        </div>
    `;
    },

    getColorForLogType(type) {
        const colors = {
            'work': '#4299e1',
            'sick': '#f56565',
            'vacation': '#48bb78',
            'reserve': '#ed8936',
            'bereavement': '#9f7aea',
            'study': '#ecc94b'
        };
        return colors[type] || '#a0aec0';
    },

    getHebrewType(type) {
        const types = {
            'work': 'עבודה רגילה',
            'sick': 'מחלה',
            'vacation': 'חופשה',
            'reserve': 'מילואים',
            'bereavement': 'אבל',
            'study': 'ימי השתלמות'
        };
        return types[type] || type;
    }
};