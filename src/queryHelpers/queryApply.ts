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

