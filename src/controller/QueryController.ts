/**
 * Created by rtholmes on 2016-06-19.
 */

import { Datasets, Datatable, Datatype, Column } from "../common/Common";
import DatasetController from "../controller/DatasetController";
import Log from "../Util";

export interface QueryRequest {
    GET: string[];
    WHERE: {
        GT?: {
            [s: string]: number
        },
        LT?: {
            [s: string]: number
        },
        EQ?: {
            [s: string]: number
        },
        IS?: string | string[]
    };
    ORDER?: string;
    AS: string;
}

export interface QueryResponse {
    render?: string;
    missing?: string[];
    result?: {}[];
}

interface QueryData {
    [columnName: string] : string[] | number[];
}

class MissingDatasets extends Error {
    missing : string[];

    constructor(missing: string[]) {
        super(missing.join(', '));
        this.name = this.constructor.name;
        this.message = missing.join(', ');
        this.missing = missing;
    }
}

const MCOMPARATOR = ['LT', 'GT', 'EQ'];
const SCOMPARATOR = ['IS'];
const LOGICCOMPARISON = ['AND', 'OR'];
const NEGATORS = ['NOT'];

export default class QueryController {

    public isValid(query: QueryRequest): boolean {
        if (typeof query !== 'undefined' && query !== null && Object.keys(query).length > 0) {
            return (typeof query.WHERE === 'undefined') || this.isValidQuery(query);
        }
        return false;
    }

    private getFirst(query: {[s: string]: any}): any {
        return query[this.getFirstKey(query)];
    }
    private getFirstKey(query: {[s: string]: any}): string {
        return Object.keys(query)[0];
    }

    private AND(a: boolean, b: boolean) : boolean { return a && b; }
    private OR(a: boolean, b: boolean) : boolean { return a || b; }
    private GT(a: number, b: number) : boolean { return a > b; }
    private LT(a: number, b: number) : boolean { return a < b; }
    private EQ(a: number, b: number) : boolean { return a == b; }
    private IS(a: string, b: string) : boolean { return new RegExp('^' + b.split('*').join('.*') + '$').test(a); }

    public evaluates(key: string, query: {[s: string]: any}|any, datatable: Datatable, indices: boolean[]): Promise<boolean[]> {
        Log.trace('QueryController::evaluates( ' + key + ': ' + JSON.stringify(query) + ' )');

        return new Promise<boolean[]>((resolve, reject) => {

            if ((MCOMPARATOR.indexOf(key) !== -1) || (SCOMPARATOR.indexOf(key) !== -1)) {

                let operator : Function =
                    (key === 'GT') ? this.GT :
                    (key === 'LT') ? this.LT :
                    (key === 'EQ') ? this.EQ :
                    (key === 'IS') ? this.IS :
                    undefined;

                // destruct query in form of { 'courses_id':'310' }
                let columnName: string = this.getFirstKey(query);
                let value: number|string = this.getFirst(query);

                // Retrieve data that match conditions
                return datatable.getColumn(columnName).getData().then((column: any[]) => {
                    return column.map((row: string|number) => operator(row, value));
                }).then((data) => {
                    resolve(data);
                }).catch((err: any) => {
                    console.error(err);
                    reject(err);
                });

            } else if (LOGICCOMPARISON.indexOf(key) !== -1) {

                let operator : Function =
                    (key === 'AND') ? this.AND :
                    (key === 'OR') ? this.OR :
                    undefined;

                let promises = query.map((next: {[s: string]: any}): Promise<boolean[]> => {
                    Log.trace("QueryController::LOGICCOMPARISON( " + JSON.stringify(next));
                    return this.evaluates(this.getFirstKey(next), this.getFirst(next), datatable, indices);
                });

                // list_of_indices hold the results of its descendant conditions in form of
                // [
                //   [true, false, true, false],
                //   [false, true, false, false]
                // ]
                return Promise.all(promises).then((list_of_indices: any[]) => {
                    let _index = -1;
                    let displayQuery = "";

                    let baseIndices = indices;
                    if (baseIndices === null) {
                        baseIndices = new Array(list_of_indices[0].length);
                        if (key === 'AND') {
                            for (let i = 0; i < baseIndices.length; ++i) {
                                baseIndices[i] = true;
                            }
                        }
                        else if (key === 'OR') {
                            for (let i = 0; i < baseIndices.length; ++i) {
                                baseIndices[i] = false;
                            }
                        }
                    }

                    return resolve(list_of_indices.reduce((indices: boolean[], next: boolean[]) => {
                        let counter = 0;
                        ++_index;
                        displayQuery += JSON.stringify(query[_index]);
                        for (let i in indices) {
                            // everything other than this line is just for logging
                            indices[i] = operator(indices[i], next[i]);
                            if (indices[i]) ++counter;
                        }
                        Log.trace('QueryController::evaluates( ' + key + ': ' + displayQuery + ' ) ===> ' + counter);
                        return indices;
                    }, baseIndices));
                }).catch((err: any) => {
                    console.error(err);
                    reject(err);
                });

            } else if (NEGATORS.indexOf(key) !== -1) {

                return this.evaluates(this.getFirstKey(query), this.getFirst(query), datatable, indices).then((indices: boolean[]) => {
                    let counter = 0;
                    for (let i in indices) {
                        indices[i] = !indices[i];
                        if (indices[i]) ++counter;
                    }
                    Log.trace('QueryController::evaluates( ' + key + ': ' + JSON.stringify(query) + ' ) ===> ' + counter);
                    return resolve(indices);
                }).catch((err: any) => {
                    console.error(err);
                    reject(err);
                });

            } else {
                reject('wtf?');
            }
        });
    }

    // returns matching index(row numbers)
    private extractValidRowNumbers(indices: boolean[]) : number[] {
        let rowNumbers : number[] = [];
        indices.forEach((row: boolean, index: number) => {
            if (row) { rowNumbers.push(index); }
        });
        return rowNumbers;
    }

    // returns values for given columns & given row numbers in a form of
    // [
    //   {courses_id: [2, 1, 3],
    //   {courses_avg: [60, 70, 80]
    // ]
    // O(rc)
    private getValues(columns: string[], rowNumbers: number[], datatable: Datatable) : Promise<any> {
        let promises : Promise<any>[] = [];

        columns.forEach((colName) => {
            promises.push(new Promise<{}>((resolve, reject) => {
                datatable.getColumn(colName).getData().then((data: string[]|number[]) => {
                    let filteredData = rowNumbers.map((rn) => data[rn]);
                    return resolve({ [colName] : filteredData });
                });
            }));
        });

        return Promise.all(promises);
    }

    // order QueryData in O(r^2 + c)
    private orders(queryData: QueryData[], columnName: string) : QueryData[] {

        let columnNames : string[] = queryData.map((qd) => Object.keys(qd)[0]);
        let qdCol = queryData[columnNames.indexOf(columnName)];
        let data : any[] = qdCol[Object.keys(qdCol)[0]];

        let indexedData : any[] = [];
        for (let i in data) {
            indexedData.push([data[i], i]);
        }

        indexedData.sort();

        let sortedData : any[] = queryData.map((qd, index) => {
            return { [columnNames[index]] : indexedData.map((id) => qd[columnNames[index]][id[1]]) };
        });

        return sortedData;
    }

    private renderTable(queryData: QueryData[]) : {}[] {

        let i : any;
        let response : {}[] = [];
        let columnNames : string[] = queryData.map((qd) => Object.keys(qd)[0]);

        for (i in queryData[0][columnNames[0]]) {
            response.push(
                columnNames.reduce((responseRow : {[s: string]: any}, cn : string, index : number) => {
                    responseRow[cn] = queryData[index][cn][i];
                    return responseRow;
                }, {})
            );
        }
        return response;
    }

    public query(query: QueryRequest) : Promise<QueryResponse> {
        return new Promise<QueryResponse>((resolve, reject) => {

            this.hasRequestedIds(query).then((results : boolean[]) => {
                let missing : string[] = [];

                results.forEach((res: boolean, index: number) => {
                    if (!res) {
                        missing.push(query.GET[index]);
                    }
                });
                if (missing.length === 0) return true;
                else throw new MissingDatasets(missing);
            }).then(() => {
                return this.getQueryData(query);
            }).then((queryData) => {
                return [].concat.apply([], queryData);
            }).then((queryData : QueryData[]) => {
                if (query.ORDER) {
                    return this.orders(queryData, query.ORDER);
                } else {
                    return queryData;
                }
            }).then((queryData : QueryData[]) => {
                if (query.AS === 'TABLE') {
                    return this.renderTable(queryData);
                } else {
                    throw new Error('Invalid AS -- Unknown render type');
                }
            }).then((queryData : any[]) => {
                return resolve({
                    render: query.AS,
                    result: queryData
                });
            }).catch((err) => {
                console.error(err);
                if (err instanceof MissingDatasets) {
                    resolve({ missing : err.missing });
                } else {
                    reject(err);
                }
            });
        });
    }

    // Extracts unique ids from strins in form of ${id}_${column}
    // ids = ['courses_ids', 'courses_title', 'others_id']
    // ==> uniqueIds = ['courses', 'others']
    private getUniqueDatasetIds(ids : string[]) : string[] {

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

    private hasRequestedIds(query : QueryRequest|any) : Promise<any[]> {
        let promises : Promise<any>[] = [];

        let ids = this.getUniqueDatasetIds(query.GET);

        ids.forEach((id, index) => {
            let oPromise = new Promise<boolean>((resolve, reject) => {
                DatasetController.getInstance().getDataset(id).then(datatable => {
                    if (datatable) {
                        return resolve(true);
                    } else {
                        return resolve(false);
                    }
                });
            });
            promises.push(oPromise);
        });

        return Promise.all(promises);
    }

    private getQueryData(query: QueryRequest): Promise<any[]> {
        Log.trace('QueryController::query( ' + JSON.stringify(query) + ' )');

        let where : any = query.WHERE;

        let ids = this.getUniqueDatasetIds(query.GET);

        let promises = ids.map((id: string, index: number) => {
            return new Promise<{}[]>((resolve, reject) => {
                let _datatable : Datatable;

                return DatasetController.getInstance().getDataset(id).then((datatable: Datatable) => {
                    _datatable = datatable;
                    return datatable.getColumn(query.GET[index]).getData();
                }).then((columnData: string[]|number[]) => {
                    return this.evaluates(this.getFirstKey(where), this.getFirst(where), _datatable, null);
                }).then((indices: boolean[]) => {
                    let rowNumbers = this.extractValidRowNumbers(indices);
                    return this.getValues(query.GET, rowNumbers, _datatable);
                }).then((res: {}[]) => {
                    return resolve(res);
                }).catch((err: Error) => {
                    console.error(err);
                    reject(err);
                });
            });
        });

        return Promise.all(promises);
    }

    private isLogicComparison(key: string, val: any) : boolean {
        let k : string;
        let values : {[s: string]: any};

        return LOGICCOMPARISON.indexOf(key) !== -1 &&
            this.isArray(val) &&
            val.every((v: any) => this.isHash(v) && this.isFilter((k = Object.keys((values = v))[0]), values[k]));
    }

    private isMComparison(key: string, val: any) : boolean {
        let keys : string[];

        return (MCOMPARATOR.indexOf(key) !== -1) &&
            this.isHash(val) &&
            (keys = Object.keys(val)).length === 1 &&
            this.isString(keys[0]) &&
            (this.isString(val[keys[0]]) || this.isNumber(val[keys[0]]));
    }

    private isSComparison(key: string, val: any) : boolean {
        let keys : string[];

        return SCOMPARATOR.indexOf(key) !== -1 &&
            this.isHash(val) &&
            (keys = Object.keys(val)).length === 1 &&
            this.isString(keys[0]) &&
            this.hasString(val[keys[0]]);
    }

    private isNegation(key: string, val: any) : boolean {

        return NEGATORS.indexOf(key) !== -1 &&
            this.isHash(val) &&
            this.areFilters(Object.keys(val)[0], val);
    }
    private isStringOrStringArray(key: string, val: any) : boolean {
        return this.isString(val) || val.constructor === Array && val.every((v: any) => this.isString(v));
    }
    private isTypeString(val: any) : boolean {
        return typeof val === 'string';
    }
    private isString(val: string) : boolean {
        const regex = /^[a-zA-Z0-9_]+$/;
        return this.isTypeString(val) && regex.test(val);
    }
    private hasString(val: any) : boolean {
        const regex = /[a-zA-Z0-9_]+/;
        return this.isTypeString(val) && regex.test(val);
    }
    private isNumber(val: any) : boolean {
        return !isNaN(parseFloat(val)) && isFinite(val);
    }
    private isHash(val: any) : boolean {
        return val !== null && typeof val === 'object';
    }
    private isArray(val: any) : boolean {
        return !!val && val.constructor === Array;
    }
    private isAsTable(key: string, val: any) : boolean {
        return key === 'AS' &&
            this.isString(val) &&
            val === 'TABLE';
    }


    private areFilters(key: string, val: {[s: string]: any}) : boolean {
        return Object.keys(val).every((k: string) => this.isFilter(k, val[k]));
    }

    private isFilter(key: string, val: any) : boolean {
        return this.isLogicComparison(key, val) ||
            this.isMComparison(key, val) ||
            this.isSComparison(key, val) ||
            this.isNegation(key, val);
    }

    private isValidQuery(query: QueryRequest): boolean {
        const TOP_LEVEL_REQUIREMENTS: { [s: string]: Function } = {
            'GET': this.isStringOrStringArray,
            'WHERE': this.areFilters,
            'AS': this.isAsTable
        };
        const TOP_LEVEL_OPTIONALS: { [s: string]: Function } = {
            'ORDER': this.isString
        };

        let keys = Object.keys(query);
        Log.trace(JSON.stringify(keys));
        let q: any = query;

        return Object.keys(TOP_LEVEL_REQUIREMENTS).every((req_key: string) => {
            return (keys.indexOf(req_key) !== -1) && TOP_LEVEL_REQUIREMENTS[req_key].bind(this)(req_key, q[req_key]);
        }) && Object.keys(TOP_LEVEL_OPTIONALS).every((opt_key: string) => {
            return keys.indexOf(opt_key) === -1 || TOP_LEVEL_OPTIONALS[opt_key].bind(this)(opt_key, q[opt_key]);
        });
    }
}
