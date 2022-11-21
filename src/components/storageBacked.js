
import { watch } from 'vue';

export function storageBacked(name, rValue) {
    const stored = localStorage.getItem(name);
    const stringValue = stored === null ? JSON.stringify(rValue) : stored;
    const parsed = JSON.parse(stringValue);
    for (const [key, value] of Object.entries(parsed)) {
        rValue[key] = value;
    }
    watch(rValue, (newValue) => {
        localStorage.setItem(name, JSON.stringify(newValue));
    });
    return rValue;
}

export function storageBackedRef(name, rValue) {
    const stored = localStorage.getItem(name);
    const stringValue = stored === null ? JSON.stringify(rValue) : stored;
    const parsed = JSON.parse(stringValue);
    rValue.value = parsed;
    watch(rValue, (newValue) => {
        localStorage.setItem(name, JSON.stringify(newValue));
    });
    return rValue;
}
