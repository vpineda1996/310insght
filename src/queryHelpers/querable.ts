import DatasetController from '../controller/DatasetController'
import { getApplyNames } from '../queryHelpers/queryApply'

import { areFilters, isAsTable, QueryRequest } from '../util/Query'
import { isStringOrStringArray } from '../util/String'
import { MissingDatasets } from '../util/Errors'

const QUERY_REQUIREMENTS: { [s: string]: Function } = {
    'GET': isStringOrStringArray,
    'WHERE': areFilters,
    'AS': isAsTable
};

export function isFormatValid(query: QueryRequest): boolean {
    if (typeof query !== 'undefined' && query !== null && Object.keys(query).length > 0) {
        let keys = Object.keys(query);
        let q: any = query;

        return Object.keys(QUERY_REQUIREMENTS).every((req_key: string) => {
            return (keys.indexOf(req_key) !== -1) && QUERY_REQUIREMENTS[req_key](req_key, q[req_key]);
        });
    }
    return false;
}
// check ids against datasets & query.APPLY
export function areValidIds(query: QueryRequest, queryIds: string[]): Promise<boolean> {
    let applyIds: string[] = getApplyNames(query);

    let datasetIds: string[] = queryIds.filter((id: string) => !applyIds.includes(id));

    return areValidDatasetIds(datasetIds);
}

export function areValidDatasetIds(queryIds: string[]) : Promise<boolean> {
    let promises = queryIds.map((id: string) => isValidDatasetId(id));

    return new Promise<boolean>((resolve, reject) => {
        Promise.all(promises).then((res: any[]) => {
            let missing: string[] = collectMissingIds(queryIds, res);

            if (!missing || missing.length == 0) {
                resolve(true);
            } else {
                throw new MissingDatasets(missing);
            }
        }).catch((err: Error) => {
            reject(err);
        });
    });
}

export function hasIdInApply(query: QueryRequest, id: string) : boolean {
    return getApplyNames(query).includes(id);
}
export function isValidDatasetId(queryId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        DatasetController.getInstance().getDataset(queryId.split('_')[0]).then(datatable => {
            if (!datatable) {
                return resolve(false);
            }
            return datatable.getColumn(queryId);
        }).then((col) => {
            if (col) {
                return resolve(true);
            } else {
                return resolve(false);
            }
        });
    });
}

function collectMissingIds(ids: string[], exists: any[]): string[] {
    let missing : string[] = [];

    exists.forEach((exist: boolean, index: number) => {
        if (!exist) {
            missing.push(ids[index]);
        }
    });
    return missing;
}
