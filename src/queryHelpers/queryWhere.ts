import { MULTI_FILTERS, MCOMPARATORS, SCOMPARATORS, LOGICCOMPARATORS, NEGATORS } from '../common/Constants'

import DatasetController from "../controller/DatasetController";
import { Datatable } from "../common/Common";

import { QueryRequest, getUniqueDatasetIds } from '../util/Query'
import { getFirstKey, getFirst } from '../util/Object'
import { getAllColumnTargetIds } from './queryApply'
import Log from '../Util'


export function getQueryData(query: QueryRequest): Promise<any[]> {
    Log.trace('QueryController::query( ' + JSON.stringify(query) + ' )');

    let where : any = query.WHERE;

    let ids = getUniqueDatasetIds(getAllColumnTargetIds(query));

    let promises = ids.map((id: string, index: number) => {
        return new Promise<{}[]>((resolve, reject) => {
            let _datatable : Datatable;

            return DatasetController.getInstance().getDataset(id).then((datatable: Datatable) => {
                _datatable = datatable;
                return evaluates(getFirstKey(where), getFirst(where), _datatable, null);
            }).then((indices: boolean[]) => {
                let rowNumbers = extractValidRowNumbers(indices);
                return getValues(getAllColumnTargetIds(query), rowNumbers, _datatable);
            }).then((res: {}[]) => {
                return resolve(res);
            }).catch((err: Error) => {
                reject(err);
            });
        });
    });

    return Promise.all(promises);
}

function AND(a: boolean, b: boolean) : boolean { return a && b; }
function OR(a: boolean, b: boolean) : boolean { return a || b; }
function GT(a: any, b: any) : boolean { return parseFloat(a) > parseFloat(b); }
function LT(a: any, b: any) : boolean { return parseFloat(a) < parseFloat(b); }
function EQ(a: number, b: number) : boolean { return a == b; }
function IS(a: string, b: string) : boolean { return new RegExp('^' + b.split('*').join('.*') + '$').test(a); }

function evaluates(key: string, query: {[s: string]: any}|any, datatable: Datatable, indices: boolean[]): Promise<boolean[]> {
    Log.trace('QueryController::evaluates( ' + key + ': ' + JSON.stringify(query) + ' )');

    return new Promise<boolean[]>((resolve, reject) => {

        if ((MCOMPARATORS.indexOf(key) !== -1) || (SCOMPARATORS.indexOf(key) !== -1)) {

            let operator : Function =
                (key === 'GT') ? GT :
                (key === 'LT') ? LT :
                (key === 'EQ') ? EQ :
                (key === 'IS') ? IS :
                undefined;

            // destruct query in form of { 'courses_id':'310' }
            let columnName: string = getFirstKey(query);
            let value: number|string = getFirst(query);

            // Retrieve data that match conditions
            return datatable.getColumn(columnName).getData().then((column: any[]) => {
                return column.map((row: string|number) => operator(row, value));
            }).then((data) => {
                resolve(data);
            }).catch((err: any) => {
                reject(err);
            });

        } else if (LOGICCOMPARATORS.indexOf(key) !== -1) {

            let operator : Function =
                (key === 'AND') ? AND :
                (key === 'OR') ? OR :
                undefined;

            let promises = query.map((next: {[s: string]: any}): Promise<boolean[]> => {
                Log.trace("QueryController::LOGICCOMPARISON( " + JSON.stringify(next));
                return evaluates(getFirstKey(next), getFirst(next), datatable, indices);
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
                reject(err);
            });

        } else if (NEGATORS.indexOf(key) !== -1) {

            return evaluates(getFirstKey(query), getFirst(query), datatable, indices).then((indices: boolean[]) => {
                let counter = 0;
                for (let i in indices) {
                    indices[i] = !indices[i];
                    if (indices[i]) ++counter;
                }
                Log.trace('QueryController::evaluates( ' + key + ': ' + JSON.stringify(query) + ' ) ===> ' + counter);
                return resolve(indices);
            }).catch((err: any) => {
                reject(err);
            });

        } else if (Object.keys(MULTI_FILTERS).indexOf(key) !== -1) {
             let filter = MULTI_FILTERS[key];

             let columnNames: string[] = Object.keys(query);
             let filterValue = query[filter.count];
             let filterIndex = columnNames.indexOf(filterValue);
             columnNames.splice(filterIndex,1);

             let allData = columnNames.filter(c => c !== filter.token).map(columnName => {
                 return datatable.getColumn(columnName).getData().then(data => {
                     return { [columnName]: data };
                 });
             });

             Promise.all(allData).then((allData: any[]) => {
                 let data = allData.reduce((out: any, data: any) => {
                     out[getFirstKey(data)] = getFirst(data);
                     return out;
                 }, {});

                 resolve(getFirst(data).map((i: boolean, index: number) => {
                     // check if-clause for MCOMPARATORS if you want to add more multi-filters
                     let dx = data[columnNames[0]][index] - query[columnNames[0]];
                     let dy = data[columnNames[1]][index] - query[columnNames[1]];
                     let r = query[filter.token];
                     return (dx * dx + dy * dy) <= (r * r);
                 }));
             });

        } else if (typeof key === 'undefined' && indices === null) {
            resolve(null);
        } else {
            reject('wtf?');
        }
    });
}

// returns matching index(row numbers)
// indices = [true, false, false, false, true]
// ==> rowNumbers = [0, 4]
function extractValidRowNumbers(indices: boolean[]) : number[] {
    if (!indices) {
        return null;
    }
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
// ] in O(r * c)
function getValues(queryColums: string[], rowNumbers: number[], datatable: Datatable) : Promise<any> {
    let promises : Promise<any>[] = [];
    queryColums.forEach((colName) => {
        promises.push(new Promise<any>((resolve, reject) => {
            datatable.getColumn(colName).getData().then((data: string[]|number[]) => {
                let filteredData = rowNumbers ? rowNumbers.map((rn) => data[rn]) : data;
                return resolve({ [colName] : filteredData });
            });
        }));
    });
    return Promise.all(promises);
}

