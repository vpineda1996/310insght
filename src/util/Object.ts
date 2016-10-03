export function isHash(val: any) : boolean {
    return val !== null && typeof val === 'object';
}

export function getFirstKey(obj: {[s: string]: any}): string {
    return Object.keys(obj)[0];
}

export function getFirst(obj: {[s: string]: any}): any {
    return obj[this.getFirstKey(obj)];
}
