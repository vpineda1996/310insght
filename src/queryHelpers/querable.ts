import DatasetController from '../controller/DatasetController'
import { getApplyNames } from '../queryHelpers/queryApply'

import { QueryRequest } from '../util/Query'
import { MissingDatasets } from '../util/Errors'

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
