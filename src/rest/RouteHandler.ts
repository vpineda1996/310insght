/**
 * Created by rtholmes on 2016-06-14.
 */
import restify = require('restify');
import fs = require('fs');

import DatasetController from '../controller/DatasetController';
import QueryController from '../controller/QueryController';
import InsightFacade from '../controller/InsightFacade';

import { isFormatValid } from '../queryHelpers/querable';

import { QueryRequest, QueryResponse } from '../util/Query';

import Log from '../Util';

export default class RouteHandler {

    private static datasetController = DatasetController.getInstance();

    public static getHomepage(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::getHomepage(..)');
        fs.readFile('./src/rest/views/index.html', 'utf8', function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    public static  putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::postDataset(..) - params: ' + JSON.stringify(req.params));
        try {
            var id: string = req.params.id;

            // stream bytes from request into buffer and convert to base64
            // adapted from: https://github.com/restify/node-restify/issues/880#issuecomment-133485821
            let buffer: any = [];
            req.on('data', function onRequestData(chunk: any) {
                Log.trace('RouteHandler::postDataset(..) on data; chunk length: ' + chunk.length);
                buffer.push(chunk);
            });

            req.once('end', function () {
                let concated = Buffer.concat(buffer);
                req.body = concated.toString('base64');
                Log.trace('RouteHandler::postDataset(..) on end; total length: ' + req.body.length);

                return new InsightFacade().addDataset(id, req.body).then(response => {
                    res.json(response.code, response.body);
                    return next();
                }).catch(err => {
                    res.json(err.code, err.body);
                    return next();
                });
            });
        } catch (err) {
            Log.error('RouteHandler::postDataset(..) - ERROR: ' + err.message);
            res.send(400, {error: err.message});
        }
        return next();
    }

    public static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {

        let query: QueryRequest = req.params;
        return new InsightFacade().performQuery(query).then(response => {
            res.json(response.code, response.body);
            return next();
        }).catch(err => {
            res.json(err.code, err.body);
            return next();
        });
    }

    public static deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        return new InsightFacade().removeDataset(req.params.id).then(response => {
            res.json(response.code, response.body);
            return next();
        }).catch(err => {
            res.json(err.code, err.body);
            return next();
        });
    }
}
