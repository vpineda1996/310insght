/*
 * This should be in the same folder as your controllers
 */
import QueryController from '../controller/QueryController';
import DatasetController from './DatasetController'

import { isValidWhere } from '../queryHelpers/queryWhere';
import { QueryRequest, QueryResponse } from '../util/Query';

import Log from "../Util";

export interface InsightResponse {
    code: number;
    body: {}; // this is what you would return to a requestee in the REST body
}

export interface IInsightFacade {

    /**
     * Add a dataset to UBCInsight.
     *
     * @param id  The id of the dataset being added. This is the same as the PUT id.
     * @param content  The base64 content of the dataset. This is the same as the PUT body.
     *
     * The promise should return an InsightResponse for both fulfill and reject.
     * fulfill should be for 2XX codes and reject for everything else.
     */
    addDataset(id: string, content: string): Promise<InsightResponse>;

    /**
     * Remove a dataset from UBCInsight.
     *
     * @param id  The id of the dataset to remove. This is the same as the DELETE id.
     *
     * The promise should return an InsightResponse for both fulfill and reject.
     * fulfill should be for 2XX codes and reject for everything else.
     */
    removeDataset(id: string): Promise<InsightResponse>;

    /**
     * Perform a query on UBCInsight.
     *
     * @param query  The query to be performed. This is the same as the body of the POST message.
     * @return Promise <InsightResponse>
     * The promise should return an InsightResponse for both fulfill and reject.
     * fulfill should be for 2XX codes and reject for everything else.
     */
    performQuery(query: QueryRequest): Promise<InsightResponse>;
};

export default class InsightFacade implements IInsightFacade {
    constructor() { };

    public addDataset(id: string, content: string): Promise<InsightResponse> {
        let res: InsightResponse = {
            code: 400,
            body: { error: "unknown error happened" }
        };
        return new Promise((resolve, reject) => {
            DatasetController.getInstance().process(id, content).then(function (result) {
                Log.trace('RouteHandler::postDataset(..) - processed');
                res.code = result;
                res.body = { success: true };
                resolve(res);
            }).catch(function (error: Error) {
                Log.trace('RouteHandler::postDataset(..) - ERROR: ' + error.message);
                res.body = error;
                reject(res);
            });
        });
    }

    public removeDataset(id: string): Promise<InsightResponse> {
        let res: InsightResponse = {
            code: 400,
            body: { error: "unknown error happened" }
        };
        return DatasetController.getInstance().getDatasets().then((oDatasets) => {
            if (oDatasets[id]) {
                Log.trace('RouteHandler::deleteDataset(..) - found dataset, deleting: ');
                return DatasetController.getInstance().removeDataset(id).then(() => {
                    Log.trace('RouteHandler::deleteDataset(..) - deletion successful ');
                    return 204;
                });
            } else return 404;
        }).then((code: number) => {
            if (code === 404) {
                res.code = code;
                res.body = { error: "dataset could not be found" };
                throw res;
            }
            res.code = code;
            res.body = { success: true };
            return res;
        }).catch(function (error: Error) {
            Log.trace('RouteHandler::deleteDataset(..) - ERROR: ' + error.message);
            res.body = { error: error.message };
            throw res;
        });
    }

    public performQuery(query: QueryRequest): Promise<InsightResponse> {
        let res: InsightResponse = {
            code: 400,
            body: { error: "unknown error happened" }
        };
        let controller = new QueryController();
        let isValid = isValidWhere(query);
        return new Promise((resolve, reject) => {
            if (isValid === true) {
                controller.query(query).then((qr: QueryResponse) => {
                    res.body = qr;
                    if (qr.missing) {
                        res.code = 424;
                        return reject(res);
                    } else {
                        res.code = 200;
                    }
                    resolve(res);
                }).catch((err) => {
                    Log.error('RouteHandler::postQuery(..) - ERROR: ' + err);
                    res.code = 400;
                    res.body = { error: err };
                    reject(res);
                });
            } else {
                res.code = 400;
                res.body = { error: 'invalid query' };
                reject(res);
            }
        });
    }
}

