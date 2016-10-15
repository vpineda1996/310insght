import { QueryRequest } from '../util/Query';

export function idsExistInGet(query: QueryRequest, names: string[]): boolean {
    return names.every(n => query.GET.includes(n));
}
