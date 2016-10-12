export function isArray(val: any) : boolean {
    return !!val && val.constructor === Array; // Array.isArray(val) --- way easier and cleaner... ish
}
