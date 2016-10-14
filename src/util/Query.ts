import { MCOMPARATORS, SCOMPARATORS, LOGICCOMPARATORS, NEGATORS, APPLYTOKENS } from '../common/Constants'

import DatasetController from '../controller/DatasetController'
import { Datatable } from '../common/Common'

import { isArray } from './Array'
import { isHash } from './Object'
import { isStringOrStringArray, isTypeString, isString, hasString, isNumber } from './String'
import { MissingDatasets } from '../util/Errors'
import { hasIdInApply} from '../queryHelpers/querable'

export interface QueryRequest {
    GET: string[];
    WHERE: {};
    ORDER?: QueryOrder;
    GROUP?: string[];
    APPLY?: ApplyElement[];
    AS: string;
}

export interface ApplyElement {
    [colName: string]: {
        [applyToken: string]: string
    }
}

export interface QueryResponse {
    render?: string;
    missing?: string[];
    result?: {}[];
}

export interface QueryOrder {
    dir: string,
    keys: string[]
}

// has form of
// [
//   { 'courses_id': ['310', '300'] },
//   { 'courses_dept': ['cpsc', 'chem'] }
// ]
export interface QueryData {
    [columnName: string]: string[] | number[];
}

export function isLogicComparison(key: string, val: any): boolean {
    let k: string;

    return (LOGICCOMPARATORS.indexOf(key) !== -1) &&
        isArray(val) &&
        val.every((v: any) => isHash(v) && isFilter((k = Object.keys(v)[0]), v[k]));
}

export function isMComparison(key: string, val: any): boolean {
    let keys: string[];

    return (MCOMPARATORS.indexOf(key) !== -1) &&
        isHash(val) &&
        (keys = Object.keys(val)).length === 1 &&
        isString(keys[0]) &&
        (isString(val[keys[0]]) || isNumber(val[keys[0]]));
}

export function isSComparison(key: string, val: any): boolean {
    let keys: string[];

    return (SCOMPARATORS.indexOf(key) !== -1) &&
        isHash(val) &&
        (keys = Object.keys(val)).length === 1 &&
        isString(keys[0]) &&
        hasString(val[keys[0]]);
}

export function isNegation(key: string, val: any): boolean {
    return NEGATORS.indexOf(key) !== -1 &&
        isHash(val) &&
        areFilters(Object.keys(val)[0], val);
}

export function isAsTable(key: string, val: any): boolean {
    return key === 'AS' &&
        isString(val) &&
        val === 'TABLE';
}

export function areFilters(key: string, val: { [s: string]: any }): boolean {
    return Object.keys(val).every((k: string) => isFilter(k, val[k]));
}

export function isFilter(key: string, val: any): boolean {
    return isLogicComparison(key, val) ||
        isMComparison(key, val) ||
        isSComparison(key, val) ||
        isNegation(key, val);
}

export function queryIdsValidator(query: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        if (isArray(query)) {
            // when AND or OR
            let promises: Promise<boolean>[] = [];
            for (let i in query) {
                promises.push(queryIdsValidator(query[i]));
            }
            Promise.all(promises).then((results: any) => {
                let failed: string[] = [].concat.apply([], results.filter((res: any) => !!res));

                if (failed && failed.length > 0) {
                    return resolve(failed);
                } else {
                    return resolve(null);
                }
            });
        } else {
            // when object
            let key: string = Object.keys(query)[0];

            if (MCOMPARATORS.includes(key) || SCOMPARATORS.includes(key) || LOGICCOMPARATORS.includes(key) || NEGATORS.includes(key)) {
                return queryIdsValidator(query[key]).then((result: any) => {
                    return resolve(result);
                });
            } else {
                // when pair of key/value
                if(key){
                    let id_column: string[] = key.split('_');
                    DatasetController.getInstance().getDataset(id_column[0]).then((datatable: Datatable) => {
                        if (!datatable) {
                            return resolve(key);
                        }
                        if (!datatable.getColumn(key)) {
                            return resolve(key);
                        }
                        return resolve(null);
                    }).catch((err: any) => {
                        if (hasIdInApply(query, key)) {
                            return resolve(key);
                        }
                        resolve(err);
                    });
                } else {
                    resolve(key);
                }
            }
        }
    });
}
