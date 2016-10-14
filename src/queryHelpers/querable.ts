import { QueryRequest, QueryResponse } from '../util/Query'
import { getApplyNames } from '../queryHelpers/queryApply'

import DatasetController from '../controller/DatasetController'

export function hasRequestedIds(query : QueryRequest|any) : Promise<any[]> {
    let promises : Promise<any>[] = [];

    query.GET.forEach((id: string, index: number) => {
        let oPromise = new Promise<boolean>((resolve, reject) => {
            if (hasIdInApply(query, id)) {
                return resolve(true);
            }
            DatasetController.getInstance().getDataset(id.split('_')[0]).then(datatable => {
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

export function hasIdInApply(query: QueryRequest, id: string) : boolean {
    return getApplyNames(query).includes(id);
}



