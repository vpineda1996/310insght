import { MCOMPARATORS, SCOMPARATORS, LOGICCOMPARATORS, NEGATORS, APPLYTOKENS } from '../common/Constants'
import { Datatable } from '../common/Common'

import DatasetController from '../controller/DatasetController'
import { isValidDatasetId } from '../queryHelpers/querable'

import { isArray } from './Array'
import { isHash } from './Object'
import { isStringOrStringArray, isTypeString, isString, hasString, isNumber } from './String'
import { MissingDatasets } from '../util/Errors'
import { hasIdInApply} from '../queryHelpers/querable'

export interface QueryRequest {
    GET: string[];
    WHERE: {};
    ORDER?: QueryOrder|string;
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

export function areValidWhereIds(query: QueryRequest): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        return areIdsValid(query.WHERE).then((isValid: any[]) => {
            if (isValid[0]) {
                resolve(true);
            } else {
                throw new MissingDatasets(isValid[1]);
            }
        }).catch((err: Error) => {
            console.error(err);
            reject(err);
        });
    });
}

// Extracts unique ids from strins in form of ${id}_${column}
// ids = ['courses_ids', 'courses_title', 'others_id']
// ==> uniqueIds = ['courses', 'others']
export function getUniqueDatasetIds(ids : string[]) : string[] {
    let uniqueIds : string[] = [];

    ids.forEach((val) => {
        let id_column = val.split('_');
        uniqueIds.push(id_column[0]);
    });

    let counter : {[s: string]: any} = {};

    return uniqueIds.filter((id) => {
        if (counter[id] === true)
            return false;
        counter[id] = true;
        return true;
    });
}

function areIdsValid(query: {[s:string]:any}): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
        let promises: Promise<any[]>[] = [];

        for (let key in query) {
            if (isHash(query[key])) {
                promises.push(areIdsValid(query[key]));
            } else {
                if (!isWhereOperator(key)) {
                    promises.push(isValidIdAndType(key, query[key]));
                } else {
                    promises.push(new Promise<any[]>((resolve, reject) => resolve([false, query[key]])));
                }
            }
        }
        return combineValidIds(promises).then(resolve);
    });
}

function isValidIdAndType(id: string, value: string|number): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
        isValidDatasetId(id, typeof value).then((isValid) => {
            if (isValid) {
                resolve([true, []]);
            } else {
                resolve([false, [id]]);
            }
        });
    });
}

function combineValidIds(promises: Promise<any[]>[]): Promise<any[]> {
    return Promise.all(promises).then((areValid: any[]) => {
        let missing: string[] = [];
        areValid.forEach((isValid: any[], index: number) => {
            if (!isValid[0]) {
                missing = [].concat(missing, isValid[1]);
            }
        });

        if (missing.length > 0) {
            return [false, missing];
        } else {
            return [true, []];
        }
    });
}

function isWhereOperator(key: string): boolean {
    return MCOMPARATORS.includes(key) ||
        SCOMPARATORS.includes(key) ||
        LOGICCOMPARATORS.includes(key) ||
        NEGATORS.includes(key);
}
