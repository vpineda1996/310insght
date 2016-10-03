import { MCOMPARATORS, SCOMPARATORS, LOGICCOMPARATORS, NEGATORS } from '../common/Constants'

import { isArray } from './Array'
import { isHash } from './Object'
import { isStringOrStringArray, isTypeString, isString, hasString, isNumber } from './String'

export function isLogicComparison(key: string, val: any) : boolean {
    let k : string;

    return (LOGICCOMPARATORS.indexOf(key) !== -1) &&
        isArray(val) &&
        val.every((v: any) => isHash(v) && isFilter((k = Object.keys(v)[0]), v[k]));
}

export function isMComparison(key: string, val: any) : boolean {
    let keys : string[];

    return (MCOMPARATORS.indexOf(key) !== -1) &&
        isHash(val) &&
        (keys = Object.keys(val)).length === 1 &&
        isString(keys[0]) &&
        (isString(val[keys[0]]) || isNumber(val[keys[0]]));
}

export function isSComparison(key: string, val: any) : boolean {
    let keys : string[];

    return (SCOMPARATORS.indexOf(key) !== -1) &&
        isHash(val) &&
        (keys = Object.keys(val)).length === 1 &&
        isString(keys[0]) &&
        hasString(val[keys[0]]);
}

export function isNegation(key: string, val: any) : boolean {
    return NEGATORS.indexOf(key) !== -1 &&
        isHash(val) &&
        areFilters(Object.keys(val)[0], val);
}

export function isAsTable(key: string, val: any) : boolean {
    return key === 'AS' &&
        isString(val) &&
        val === 'TABLE';
}

export function areFilters(key: string, val: {[s: string]: any}) : boolean {
    return Object.keys(val).every((k: string) => isFilter(k, val[k]));
}

export function isFilter(key: string, val: any) : boolean {
    return isLogicComparison(key, val) ||
        isMComparison(key, val) ||
        isSComparison(key, val) ||
        isNegation(key, val);
}

