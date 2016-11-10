import { idsExistInGet } from '../queryHelpers/queryGet'

import { MissingDatasets } from '../util/Errors'

import DatasetController from '../controller/DatasetController';
import { Datatype } from '../common/Common';

import { QueryRequest, QueryData, QueryOrder } from '../util/Query'
import { isArray } from '../util/Array'
import { isString, isNumber } from '../util/String'
import { getFirst, getFirstKey } from '../util/Object'

export function isValidOrder(query: QueryRequest) : Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        if (!query.ORDER) {
            return resolve(true);
        }

        let order = standardizeOrder(query.ORDER);

        if (!isString(order.dir)) {
            return reject(new Error('"dir" is missing in ORDER'));
        }

        if (order.dir !== "UP" && order.dir !== "DOWN") {
            return reject(new Error('"dir" in ORDER must be either "UP" or "DOWN"'));
        }

        if (!isArray(order.keys)) {
            return reject(new Error('"keys" is not array in ORDER'));
        }

        if (!idsExistInGet(query, order.keys)) {
            return reject(new Error(order.keys + ' includes unknown name'));
        }
        return resolve(true);
    });
}

// order QueryData[] in O(rlog(r) + c)
export function orders(queryData: QueryData[], query: QueryRequest) : QueryData[] | Promise<QueryData[]> {
    if (!query.ORDER) {
        return queryData;
    }

    let order = standardizeOrder(query.ORDER);

    let columnNames : string[] = queryData.map((qd) => Object.keys(qd)[0]);
    let columnNumbers: number[] = order.keys.map((k) => columnNames.indexOf(k));

    let before: number = (order.dir === 'UP' ? 1 : -1)
    let after: number = (order.dir === 'UP' ? -1 : 1)

    let targetNames = columnNames.map((colName) => {
        // get target column name
        if (colName.split('_').length == 2) return colName;
        return getFirst(getFirst(query.APPLY.find((apply: any) => {
            return getFirstKey(apply) === colName;
        })));
    });
    let promises: Promise<any>[] = targetNames.map((colName) => {
        // get datatable
        return DatasetController.getInstance().getDataset(colName.split('_')[0]).then((datatable) => {
            // get column
            if (!datatable) throw new Error('wait... seriously?');
            return datatable.getColumn(colName);
        }).then((column) => {
            return {[colName]: column.datatype};
        });
    });

    return new Promise<QueryData[]>((resolve, reject) => {
        return Promise.all(promises).then((columns: {}[]) => {
            let datatypes: Datatype[] = targetNames.map(colName => {
                return columns.find((col) => getFirstKey(col) === colName);
            }).map((col) => getFirst(col));

            let indices: number[] = getFirst(queryData[0]).map((a: any, i: number) => i).
                sort((x1: number, x2: number) => sort(x1,x2, columnNumbers, datatypes));

            let sortedData : any[] = queryData.map((qd, index) => {
                return { [columnNames[index]] : indices.map((val) => qd[columnNames[index]][val]) };
            });

            return resolve(sortedData);
        });
    });


    function sort(x1: number, x2: number, sortBy: number[], datatypes: {}[]): number {
        if (sortBy.length === 0 || datatypes.length === 0) {
            // can't compare any more
            return 0;
        }

        let a: any = queryData[sortBy[0]][columnNames[sortBy[0]]][x1];
        let b: any = queryData[sortBy[0]][columnNames[sortBy[0]]][x2];

        if (getFirst(datatypes[0]) === Datatype.NUMBER) {
            return tryNumber();
        }
        return tryString();

        function tryNumber() {
            let d = a - b;
            if (d > 0) {
                return before;
            } else if (d < 0) {
                return after;
            } else {
                return sort(x1, x2, sortBy.slice(1, sortBy.length), datatypes.slice(1, datatypes.length));
            }
        }

        function tryString() {
            if (a > b) {
                return before;
            } else if (a < b) {
                return after;
            } else {
                return sort(x1, x2, sortBy.slice(1, sortBy.length), datatypes.slice(1, datatypes.length));
            }
        }
    }
}

export function standardizeOrder(order: any /*QueryOrder|string */): QueryOrder {
    if (isString(order)) {
        return { dir: "UP", keys: [order] };
    } else {
        return order;
    }
}
