/**
 * Created by rtholmes on 2016-06-19.
 */

import { hasRequestedIds } from '../queryHelpers/querable'
import { isValidOrder, orders } from '../queryHelpers/queryOrder'
import { getQueryData } from '../queryHelpers/queryWhere'

import { isStringOrStringArray } from '../util/String'
import { areFilters, isAsTable, queryIdsValidator, QueryRequest, QueryResponse, QueryData } from '../util/Query'
import { isNumber } from '../util/String'
import { MissingDatasets } from '../util/Errors'
import GroupQuery from '../queryHelpers/GroupQuery';

const QUERY_REQUIREMENTS: { [s: string]: Function } = {
    'GET': isStringOrStringArray,
    'WHERE': areFilters,
    'AS': isAsTable
};

export default class QueryController {

    public isValid(query: QueryRequest): boolean {
        if (typeof query !== 'undefined' && query !== null && Object.keys(query).length > 0) {
            let keys = Object.keys(query);
            let q: any = query;

            return Object.keys(QUERY_REQUIREMENTS).every((req_key: string) => {
                return (keys.indexOf(req_key) !== -1) && QUERY_REQUIREMENTS[req_key](req_key, q[req_key]);
            });
        }
        return false;
    }

    public query(query: QueryRequest) : Promise<QueryResponse> {
        return new Promise<QueryResponse>((resolve, reject) => {

            return hasRequestedIds(query).then((results : boolean[]) => {
                let missing : string[] = [];

                results.forEach((res: boolean, index: number) => {
                    if (!res) {
                        missing.push(query.GET[index]);
                    }
                });
                if (missing.length === 0) return true;
                else throw new MissingDatasets(missing);
            }).then(() => {
                return queryIdsValidator(query.WHERE);
            }).then((res: any) =>  {
                if (!res) {
                    return;
                } else {
                    throw new MissingDatasets(res);
                }
            }).then(() => {
                return isValidOrder(query);
            }).then(() => {
                return getQueryData(query);
            }).then((queryData) => {
                return [].concat.apply([], queryData);
            }).then((queryData : QueryData[]) => {
                return GroupQuery.groupBy(query, queryData);
            }).then((queryData : QueryData[]) => {
                if (query.ORDER) {
                    return orders(queryData, query.ORDER);
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

    // convert from QueryData[] to
    // [
    //   { 'courses_id: '310', 'courses_dept':'cpsc' },
    //   { 'courses_id: '300', 'courses_dept':'chem' },
    // ]
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
}
