import { QueryRequest } from '../util/Query'

import { hasRequestedIds } from '../queryHelpers/querable'

import { MissingDatasets } from '../util/Errors'

import { isString } from '../util/String'
import { isArray } from '../util/Array'

export function isValidOrder(query: QueryRequest) : Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        if (!query.ORDER) {
            return resolve(true);
        }

        if (!isString(query.ORDER.dir)) {
            return reject(new Error('"dir" is missing in ORDER'));
        }

        if (!isArray(query.ORDER.keys)) {
            return reject(Error('"keys" is not array in ORDER'));
        }

        return hasRequestedIds(query).then((results: boolean[]) => {
            let missing : string[] = [];

            results.forEach((res: boolean, index: number) => {
                if (!res) {
                    missing.push(query.GET[index]);
                }
            });
            if (missing.length === 0) return resolve(true);
            else throw new MissingDatasets(missing);
        }).catch((err) => {
            reject(err);
        });
    });
}
