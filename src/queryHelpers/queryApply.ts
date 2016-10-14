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

