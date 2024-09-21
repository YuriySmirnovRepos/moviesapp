export default class Utils {

    static debounce = (fn, delay) => {
        let timeout = null;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        }
    }
}