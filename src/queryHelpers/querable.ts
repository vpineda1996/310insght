import DatasetController from '../controller/DatasetController'
import { getApplyNames } from '../queryHelpers/queryApply'

import { Datatype, Column } from '../common/Common';

import { areFilters, isAsTable, QueryRequest, getUniqueDatasetIds } from '../util/Query'
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

// check ids against datasets & (query.GROUP + query.APPLY)
export function areValidIds(query: QueryRequest, queryIds: string[]): Promise<boolean> {
    let applyNamesInApply = getApplyNames(query);
    let applyNamesInGet = queryIds.filter(id => id.split('_').length !== 2);
    if (!applyNamesInGet.every(id => applyNamesInApply.includes(id))) {
        throw new Error('GET ids without underscore must appear in APPLY');
    }

    let datasetNamesInGet = queryIds.filter(id => id.split('_').length === 2);
    let datasetNamesInGroup = query.GROUP;
    if (!!datasetNamesInGroup && !datasetNamesInGet.every(id => datasetNamesInGroup.includes(id))) {
        throw new Error('GET ids with underscore must appear in GROUP');
    }

    if (getUniqueDatasetIds(datasetNamesInGet).length > 1) {
        throw new Error('We are dumb. We cannot process multiple datasets at once');
    }

    return areValidDatasetIds(datasetNamesInGet);
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

export function isValidDatasetId(queryId: string, valueType?: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        DatasetController.getInstance().getDataset(queryId.split('_')[0]).then(datatable => {
            if (!datatable) {
                return resolve(false);
            }
            return datatable.getColumn(queryId);
        }).then((col: Column) => {
            if (col) {
                if (!!valueType) {
                  if (valueType === 'string') resolve(col.datatype === Datatype.STRING);
                  else if (valueType === 'number') resolve(col.datatype === Datatype.NUMBER);
                  else resolve(false);
                }
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
