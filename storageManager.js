// storageManager.js
import { Utils } from './utils.js';

export const StorageManager = {
    getItem: (key) => Utils.safelyParseJSON(localStorage.getItem(key)),
    setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    removeItem: (key) => localStorage.removeItem(key)
};