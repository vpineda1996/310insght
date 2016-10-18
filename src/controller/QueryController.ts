import { areValidIds, isFormatValid } from '../queryHelpers/querable'
import { isValidOrder, orders, standardizeOrder } from '../queryHelpers/queryOrder'
import { getQueryData } from '../queryHelpers/queryWhere'
import { renderTable } from '../queryHelpers/queryAs'

import { areValidWhereIds, QueryRequest, QueryResponse, QueryData } from '../util/Query'
import { MissingDatasets } from '../util/Errors'
import { groupBy } from '../queryHelpers/GroupQuery';

export default class QueryController {

    public query(query: QueryRequest) : Promise<QueryResponse> {
        return new Promise<QueryResponse>((resolve, reject) => {

            if (!isFormatValid(query)) {
                throw new Error('invalid format of WHERE');
            }

            return areValidIds(query, query.GET).then(() => {
                return areValidWhereIds(query);
            }).then(() => {
                return isValidOrder(query);
            }).then(() => {
                return getQueryData(query);
            }).then((queryData) => {
                return [].concat.apply([], queryData);
            }).then((queryData : QueryData[]) => {
                return groupBy(query, queryData);
            }).then((queryData : QueryData[]) => {
                return orders(queryData, standardizeOrder(query.ORDER));
            }).then((queryData : QueryData[]) => {
                return renderTable(queryData, query.AS);
            }).then((queryData : any[]) => {
                return resolve({
                    render: query.AS,
                    result: queryData
                });
            }).catch((err) => {
                if (err instanceof MissingDatasets) {
                    resolve({ missing : err.missing });
                } else {
                    reject(err);
                }
            });
        });
    }
}
