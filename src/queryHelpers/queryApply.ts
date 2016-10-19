import { QueryRequest } from '../util/Query'
import { getFirst, getFirstKey } from '../util/Object'

export function getApplyNames(query: QueryRequest) : string[] {
    if (!query.APPLY) {
        return [];
    }
    return query.APPLY.map((a: {[s:string]:any}) => getFirstKey(a));
}

export function getApplyTargets(query: QueryRequest) : string[] {
    if (!query.APPLY) {
        return [];
    }
    return query.APPLY.map((a: {[s:string]:any}) => getFirst(getFirst(a)));
}

export function getAllColumnTargetIds(query: QueryRequest) : Array<string> {
    let applyVals = getApplyNames(query);
    let applyTargs = getApplyTargets(query);
    let oAccum : Map<string, boolean> = new Map<string, boolean>();
    return Array.from(query.GET.map((colName) => {
        var sRet = colName;
        var indexOfApplyVals = applyVals.indexOf(colName);
        return (indexOfApplyVals !== -1) ? applyTargs[indexOfApplyVals] : sRet;
    }).reduce((prev, cur) => {
        prev.set(cur, true);
        return prev;
    }, oAccum).keys());
}

export const AGGREGATE_FUNCTIONS: any = {
    MAX: (arr: Array<string | number>) => Math.max.apply(undefined, arr),
    MIN: (arr: Array<string | number>) => Math.min.apply(undefined, arr),
    AVG: AVG,
    COUNT: COUNT
}

function AVG(arr: Array<number>): string {
    if(arr.length === 0 ) return "0";
    let avg = arr.reduce((iAccum, curVal) => {
        iAccum += curVal;
        return iAccum;
    }, 0.0) / arr.length;
    return avg.toFixed(2);
}

function COUNT(arr: Array<string | number>) {
    let oRet: { [id: string]: boolean } = {};
    return Object.keys(arr.reduce((oAccum, siCurVal) => {
        oAccum[siCurVal.toString()] = true;
        return oAccum;
    }, oRet)).length;
}

