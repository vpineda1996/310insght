/**
 * Created by rtholmes on 2016-06-19.
 */

import { Datasets, Datatable, Datatype, Column } from "../common/Common";
import DatasetController from "../controller/DatasetController";
import Log from "../Util";

export interface QueryRequest {
    GET: string | string[];
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
    render: string;
    result: {}[];
}

const MCOMPARATOR = ['LT', 'GT', 'EQ'];
const SCOMPARATOR = ['IS'];
const LOGICCOMPARISON = ['AND', 'OR'];
const NEGATORS = ['NOT'];

export default class QueryController {
    private datasets: Datasets = null;

    constructor(datasets: Datasets) {
        this.datasets = datasets;
    }

    public isValid(query: QueryRequest): boolean {
        if (typeof query !== 'undefined' && query !== null && Object.keys(query).length > 0) {
            return (typeof query.WHERE === 'undefined') || this.isValidQuery(query);
        }
        return false;
    }

    private getFirst(query:{[s:string]:any}):any {
        return query[this.getFirstKey(query)];
    }
    private getFirstKey(query:{[s:string]:any}):string {
        return Object.keys(query)[0];
    }

    private AND(a:boolean, b:boolean) : boolean { return a && b; }
    private OR(a:boolean, b:boolean) : boolean { return a || b; }
    private GT(a:number, b:number) : boolean { return a > b; }
    private LT(a:number, b:number) : boolean { return a < b; }
    private EQ(a:number|string, b:number|string) : boolean { return a === b; }

    public evaluates(key:string, query:{[s:string]:any}|any, datatable:Datatable, indices:boolean[]): Promise<boolean[]> {

        return new Promise<boolean[]>((resolve, reject) => {

            if (MCOMPARATOR.includes(key) || SCOMPARATOR.includes(key)) {

                let operator : Function =
                    (key === 'GT') ? this.GT :
                    (key === 'LT') ? this.LT :
                    (key === 'EQ') ? this.EQ :
                    (key === 'IS') ? this.EQ :
                    undefined;

                let columnName:string|number = this.getFirstKey(query);
                let value:string|number = this.getFirst(query);

                return datatable.getColumn(columnName).getData().then((column:any[]) => {
                    return resolve(column.map((row:string|number) => operator(row, value)));
                });

            } else if (LOGICCOMPARISON.includes(key)) {

                let operator : Function =
                    (key === 'AND') ? this.AND :
                    (key === 'OR') ? this.OR :
                    undefined;

                let promises = query.map((next:{[s:string]:any}):Promise<boolean[]> => {
                    return this.evaluates(this.getFirstKey(next), this.getFirst(next), datatable, indices);
                });

                return Promise.all(promises).then((list_of_indices: any[]) => {
                    return resolve(list_of_indices.reduce((indices:boolean[], next:boolean[]) => {
                        for (let i in indices) {
                            indices[i] = operator(indices[i], next[i]);
                        }
                        return indices;
                    }, indices));
                }).catch((err:any) => {
                    reject(err);
                });

            } else if (NEGATORS.includes(key)) {

                return this.evaluates(this.getFirstKey(query), this.getFirst(query), datatable, indices).then((indices:boolean[]) => {
                    for (let i in indices) {
                        indices[i] = !indices[i];
                    }
                    return resolve(indices);
                }).catch((err:any) => {
                    reject(err);
                });

            } else {
                reject('wtf?');
            }
        });
    }

    private extractValidRowNumbers(indices: boolean[]) : number[] {
        let rowNumbers : number[] = [];
        indices.forEach((row:boolean, index:number) => {
            if (row) { rowNumbers.push(index); }
        });
        return rowNumbers;
    }

    private getValues(columns:string[], rowNumbers:number[], datatable: Datatable) : Promise<{}[]> {
        return new Promise<{}[]>((resolve, reject) => {
            let values : {[s:string]:string|number}[] = [];
            let promises = rowNumbers.map((rn:number) => {
                return datatable.getRow(rn).then((row:{[s:string]:string|number}) => {
                    let selectRow : {[s:string]:string|number} = {};
                    Object.keys(row).forEach((col:string) => {
                        if (columns.includes(col)) {
                            selectRow[col] = row[col];
                        }
                    })
                    values.push(selectRow);
                });
            });
            return Promise.all(promises).then(() => resolve(values))
        });
    }

    private orders(rows: number[], datatable: Datatable, columnName: string) : Promise<number[]> {
        return new Promise((resolve, reject) => {
            let col = datatable.getColumn(columnName);
            if (!col) {
                // FIXME do we want to throw error instead?
                return resolve(rows);
            }
            if (col.datatype === Datatype.STRING) {

            } else if (col.datatype === Datatype.NUMBER) {

            }
            return resolve(rows.sort());
        });
    }

    public query(query: QueryRequest): Promise<QueryResponse> {
        return new Promise<QueryResponse>((resolve, reject) => {
            this.getQuery(query).then((results) => {
                // TODO rendering as TABLE
                let json : QueryResponse = results.reduce((json:QueryResponse, res:{[s:string]:{}[]}) => {
                    json.result = json.result.concat(res[Object.keys(res)[0]]);
                    return json;
                }, { render: query.AS, result: [] });
                return resolve(json);
            });
        });
    }

    public getQuery(query: QueryRequest): Promise<any[]> {
        Log.trace('QueryController::query( ' + JSON.stringify(query) + ' )');

        let q:any = query.WHERE;
        let g:any = query.GET;
        let ids:string[] = [];
        let columns:string[] = [];
        if (this.isArray(query.GET)) {
            q.forEach((val:string) => {
                let id_column = val.split('_');
                ids.push(id_column[0]);
                columns.push(id_column[1]);
            })
        } else {
            let id_column = g.split('_');
            ids.push(id_column[0]);
            columns.push(id_column[1]);
        }
        let promises = ids.map((id:string, index:number) => {
            return new Promise<{[s:string/*id*/]:{}[]}>((resolve, reject) => {
                let _datatable : Datatable;

                return DatasetController.getInstance().getDataset(id).then((datatable:Datatable) => {
                    _datatable = datatable;
                    return datatable.getColumn(columns[index]).getData();
                }).then((columnData:string[]|number[]) => {

                    let indices:boolean[] = new Array(columnData.length);
                    for (let i=0; i < indices.length; ++i) indices[i] = true;

                    return this.evaluates(Object.keys(q)[0], q[Object.keys(q)[0]], _datatable, indices);
                }).then((indices:boolean[]) => {
                    let rowNumbers = this.extractValidRowNumbers(indices);
                    if (query.ORDER) {
                        return this.orders(rowNumbers, _datatable, query.ORDER);
                    } else {
                        return rowNumbers;
                    }
                }).then((rowNumbers:number[]) => {
                    return this.getValues(columns, rowNumbers, _datatable);
                }).then((res:{}[]) => {
                    return resolve({ [id]: res });
                });
            });
        });

        return Promise.all(promises);
    }

    private isLogicComparison(key:string, val:any) : boolean {
        let k : string;
        let values : {[s:string]:any}

        return LOGICCOMPARISON.includes(key) &&
            this.isArray(val) &&
            val.every((v: any) => this.isHash(v) && this.isFilter((k = Object.keys((values = v))[0]), values[k]))
    }

    private isMComparison(key:string, val:any) : boolean {
        let keys : string[];

        return MCOMPARATOR.includes(key) &&
            this.isHash(val) &&
            (keys = Object.keys(val)).length === 1 &&
            this.isString(keys[0]) &&
            this.isValidColumnKey(keys[0]) &&
            (this.isString(val[keys[0]]) || this.isNumber(val[keys[0]]));
    }

    private isSComparison(key:string, val:any) : boolean {
        let keys : string[];

        return SCOMPARATOR.includes(key) &&
            this.isHash(val) &&
            (keys = Object.keys(val)).length === 1 &&
            this.isString(keys[0]) &&
            this.isValidColumnKey(keys[0]) &&
            this.hasString(val[keys[0]]);
    }

    private isNegation(key:string, val:any) : boolean {

        return NEGATORS.includes(key) &&
            this.isHash(val) &&
            this.areFilters(Object.keys(val)[0], val)
    }
    private isStringOrStringArray(key:string, val: any) : boolean {
        return this.isString(val) || val.constructor === Array && val.every((v:any) => this.isString(v));
    }
    private isTypeString(val: any) : boolean {
        return typeof val === 'string';
    }
    private isString(val:string) : boolean {
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
    private isAsTable(key:string, val:any) : boolean {
        return key === 'AS' &&
            this.isString(val) &&
            val === 'TABLE';
    }
    private isValidColumnKey(name: string) {
        const VALID_KEYS = [
            'courses_dept',
            'courses_id',
            'courses_avg',
            'courses_instructor',
            'courses_title',
            'courses_pass',
            'courses_fail',
            'courses_audit'
        ];
        return VALID_KEYS.includes(name);
    }


    private areFilters(key:string, val:{[s:string]:any}) : boolean {
        return Object.keys(val).every((k:string) => this.isFilter(k, val[k]));
    }

    private isFilter(key:string, val:any) : boolean {
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
        }
        const TOP_LEVEL_OPTIONALS: { [s: string]: Function } = {
            'ORDER': this.isString
        }

        let keys = Object.keys(query);
        let q: any = query;

        return Object.keys(TOP_LEVEL_REQUIREMENTS).every((req_key: string) => {
            return keys.includes(req_key) && TOP_LEVEL_REQUIREMENTS[req_key].bind(this)(req_key, q[req_key]);
        }) && Object.keys(TOP_LEVEL_OPTIONALS).every((opt_key: string) => {
            return !keys.includes(opt_key) || TOP_LEVEL_OPTIONALS[opt_key].bind(this)(opt_key, q[opt_key]);
        })
    }
}
