/**
 * Created by rtholmes on 2016-06-14.
 */
import restify = require('restify');
import fs = require('fs');

import DatasetController from '../controller/DatasetController';
import QueryController from '../controller/QueryController';
import ScheduleController from '../controller/ScheduleController';
import { CourseQuery, RoomQuery, Timetable } from '../scheduler/Scheduler';

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

                let controller = RouteHandler.datasetController;
                controller.process(id, req.body).then(function (result) {
                    Log.trace('RouteHandler::postDataset(..) - processed');
                    res.json(result, {success: true});
                }).catch(function (error: Error) {
                    Log.trace('RouteHandler::postDataset(..) - ERROR: ' + error.message);
                    res.json(400, {error: error.message});
                });
            });

        } catch (err) {
            Log.error('RouteHandler::postDataset(..) - ERROR: ' + err.message);
            res.send(400, {error: err.message});
        }
        return next();
    }

    public static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::postQuery(..) - params: ' + JSON.stringify(req.params));
        let query: QueryRequest = req.params;
        let controller = new QueryController();
        controller.query(query).then((qr: QueryResponse) => {
            if (qr.missing) {
                res.json(424, qr);
            } else {
                res.json(200, qr);
            }
            return next();
        }).catch((err) => {
            Log.error('RouteHandler::postQuery(..) - ERROR: ' + err);
            res.json(400, {error: err.message});
        });
    }

    public static deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            Log.trace('RouteHandler::deleteDataset(..) - params: ' + JSON.stringify(req.params));
            var id: string = req.params.id;
            var DC = DatasetController.getInstance();
            DC.getDatasets().then((oDatasets) => {
                if (oDatasets[id]) {
                    Log.trace('RouteHandler::deleteDataset(..) - found dataset, deleting: ');
                    return DC.removeDataset(id).then(() => {
                        Log.trace('RouteHandler::deleteDataset(..) - deletion successful ');
                        return 204;
                    });
                } else {
                    return 404;
                }
            }).then((code: number) => {
                if (code === 404) {
                    res.json(code, {error: "dataset could not be found"});
                } else {
                    res.json(code, {success: true});
                }
            }).catch(function (error: Error) {
                Log.trace('RouteHandler::deleteDataset(..) - ERROR: ' + error.message);
                res.json(400, {error: error.message});
            });
        } catch (error) {
            Log.error('RouteHandler::deleteDataset(..) - ERROR: ' + error.message);
            res.send(400, {error: error.message});
        }
        return next();
    }

    public static schedule(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::schedule(..) - params: ' + JSON.stringify(req.params));

        let courseQuery: CourseQuery = req.params.COURSES;
        let roomQuery: RoomQuery = req.params.ROOMS;

        if (!courseQuery || !roomQuery) {
            Log.trace('RouteHandler::Schedule(..) - empty data');
            res.send(400, { error: 'plz send some constraints' });
            return next();
        }

        ScheduleController.getInstance().computeTimetable(courseQuery, roomQuery).then((timetable: any) => {
            if (!!timetable) {
                Log.trace('RouteHandler::Schedule(..) - processed');
                res.json(200, timetable);
            } else {
                Log.error('RouteHandler::Schedule(..) - could not processed');
                res.json(418, 'enjoy your tea');
            }
        });
        return next();
    }
}
