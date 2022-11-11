
import { watch } from 'vue';

export function storageBacked(name, rValue) {
    const stored = localStorage.getItem(name);
    const stringValue = stored === null ? JSON.stringify(rValue) : stored;
    Object.assign(rValue, JSON.parse(stringValue));
    watch(rValue, (newValue) => {
        localStorage.setItem(name, JSON.stringify(newValue));
    });
    return rValue;
}
