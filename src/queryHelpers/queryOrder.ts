import { areValidIds } from '../queryHelpers/querable'

import { MissingDatasets } from '../util/Errors'

import { QueryRequest, QueryData, QueryOrder } from '../util/Query'
import { isArray } from '../util/Array'
import { isString, isNumber } from '../util/String'
import { getFirst } from '../util/Object'

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

        return areValidIds(query, order.keys).then(() => {
            return resolve(true);
        }).catch((err) => {
            reject(err);
        });
    });
}

// order QueryData[] in O(rlog(r) + c)
export function orders(queryData: QueryData[], order: QueryOrder) : QueryData[] {
    if (!order) {
        return queryData;
    }

    let columnNames : string[] = queryData.map((qd) => Object.keys(qd)[0]);
    let columnNumbers: number[] = order.keys.map((k) => columnNames.indexOf(k));

    let before: number = (order.dir === 'UP' ? 1 : -1)
    let after: number = (order.dir === 'UP' ? -1 : 1)

    let indices: number[] = getFirst(queryData[0]).map((a: any, i: number) => i).
        sort((x1: number, x2: number) => sort(x1,x2, columnNumbers));

    let sortedData : any[] = queryData.map((qd, index) => {
        return { [columnNames[index]] : indices.map((val) => qd[columnNames[index]][val]) };
    });

    return sortedData;

    function sort(x1: number, x2: number, sortBy: number[]): number {
        if (sortBy.length === 0) {
            // can't compare any more
            return 0;
        }

        let a: any = queryData[sortBy[0]][columnNames[sortBy[0]]][x1];
        let b: any = queryData[sortBy[0]][columnNames[sortBy[0]]][x2];

        return tryNumber();

        function tryNumber() {
            if (isNumber(a) && isNumber(b)) {
                let d = parseFloat(a) - parseFloat(b);
                if (d > 0) {
                    return before;
                } else if (d < 0) {
                    return after;
                } else {
                    return sort(a, b, sortBy.slice(1, sortBy.length));
                }
            } else {
                return tryString();
            }
        }

        function tryString() {
            if (a > b) {
                return before;
            } else if (a < b) {
                return after;
            } else {
                return sort(a, b, sortBy.slice(1, sortBy.length));
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
