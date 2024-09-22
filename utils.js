// utils.js
import { DateTime, Duration } from 'luxon';

export const Utils = {
    safelyParseJSON: (json) => {
        try {
            return JSON.parse(json);
        } catch (e) {
            console.error('Error parsing JSON:', e);
            return null;
        }
    },
    formatDate: (date) => DateTime.fromISO(date).toFormat('dd/MM/yyyy'),
    calculateDuration: (start, end) => {
        const startTime = DateTime.fromFormat(start, 'HH:mm');
        const endTime = DateTime.fromFormat(end, 'HH:mm');
        return endTime.diff(startTime).as('hours');
    }
};