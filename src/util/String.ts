export function isStringOrStringArray(key: string, val: any) : boolean {
    return isString(val) || val.constructor === Array && val.every(isString);
}

export function isTypeString(val: any) : boolean {
    return typeof val === 'string';
}

export function isString(val: string) : boolean {
    const regex = /^[a-zA-Z0-9,_-]+$/;
    return isTypeString(val) && regex.test(val);
}

export function hasString(val: any) : boolean {
    const regex = /[a-zA-Z0-9,_-]+/;
    return isTypeString(val) && regex.test(val);
}

export function isNumber(val: any) : boolean {
    return !isNaN(parseFloat(val)) && isFinite(val);
}
