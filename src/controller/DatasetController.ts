/**
 * Created by rtholmes on 2016-09-03.
 */

import Log from "../Util";
import JSZip = require('jszip');
import fs = require('fs');

import {Datasets} from "../common/Common";
import {Datatable} from "../common/Common";
import {Column} from "../common/Common";
import JSONParser from "../parsers/JSONParser";
import HTMLParser from "../parsers/HTMLParser";

import Constants = require('../common/Constants');
const PARENT_DIR = Constants.PARENT_DIR;
const DATASETFILE = Constants.DATASETFILE;

export default class DatasetController {
    private static _instance: DatasetController = new DatasetController();
    private datasets: Datasets = null;

    public static getInstance(): DatasetController {
        return DatasetController._instance;
    }

    constructor() {
        Log.trace('DatasetController::init()');
        DatasetController._instance = this;
    };

    /**
     * Returns the referenced dataset. If the dataset is not in memory, it should be
     * loaded from disk and put in memory. If it is not in disk, then it should return
     * null.
     *
     * @param id
     * @returns {{}}
     */
    public getDataset(id: string): Promise<Datatable> {
        return new Promise((resolve, reject) => {
            Log.trace('DatasetController::getDataset( ' + id + '... )');
            this.readCachedDatasetsInDisk().then((datasets: Datasets) => {
                resolve(datasets[id]);
            });
        });
    }

    public getDatasets(): Promise<Datasets> {
        return new Promise<Datasets>((resolve, reject) => {
            Log.trace('DatasetController::getDatasets( )');
            this.readCachedDatasetsInDisk().then((datasets: Datasets) => {
                resolve(datasets);
            });
        });
    }

    /**
     * Process the dataset; save it to disk when complete.
     *
     * @param id
     * @param data base64 representation of a zip file
     * @returns {Promise<number>} returns the response code of the request
     */
    public process(id: string, data: any): Promise<number> {
        Log.trace('DatasetController::process( ' + id + '... )');
        return new Promise((fulfill, reject) => {
            let myZip = new JSZip();
            let resCode = 201;
            this.getDataset(id).then( (oDataTable : Datatable) => {
                if (!oDataTable) {
                    oDataTable = new Datatable(id, PARENT_DIR + "/" + id, []);
                    resCode = 204;
                    return oDataTable;
                } else {
                    return oDataTable.removeColumns(true).then(() => oDataTable);
                }
            }).then((oDataTable: Datatable) => {
                return myZip.loadAsync(data, { base64: true }).then((zip: JSZip) => {
                    Log.trace('DatasetController::process(..) - unzipped');
                    // hardcoding this lol
                    if (id === 'rooms') {
                        return HTMLParser.parse(zip.files, oDataTable);
                    } else {
                        return JSONParser.parse(zip.files, oDataTable);
                    }
                }).then((processedMetadata: Datatable) => {
                    return this.save(id, processedMetadata);
                }).then(() => {
                    fulfill(resCode);
                }).catch(function (err) {
                    Log.trace('DatasetController::process(..) - unzip ERROR: ' + err.message);
                    reject(err);
                });
            });
        });
    }

    public clearCache() {
        this.datasets = null;
    }

    public removeDataset(id: string): Promise<any> {
        return this.readCachedDatasetsInDisk().then(() => {
            Log.trace('DatasetController::removeDataset(..)');
            let tmp = this.datasets[id];
            if (!tmp) {
                throw new Error("Dataset does not exist!")
            }
            delete this.datasets[id];
            return tmp.removeColumns()
        }).then(() => {
            return this.writeCacheIntoDisk();
        });
    }

    /**
     * Writes the processed dataset to disk as 'id.json'. The function should overwrite
     * any existing dataset with the same name.
     *
     * @param id
     * @param processedDataset
     */
    public save(id: string, processedDataset: Datatable): Promise<any> {
        // add it to the memory model
        if (typeof processedDataset !== 'object') {
            throw new Error("Processed dataset cannot be saved");
        }
        return this.readCachedDatasetsInDisk().then((datasets) => {
            this.datasets[id] = processedDataset;
        }).then(() => {
            return this.writeCacheIntoDisk();
        }).then(() => {
            return processedDataset.saveData();
        }).catch((err) => {
            Log.error('DatasetController::save(..) read from disk' + err);
        });
    };

    /**
     * Saves datasets to disk
     */
    private writeCacheIntoDisk(): Promise<Datasets> {
        return new Promise((resolve, reject) => {
            fs.writeFile(DATASETFILE, JSON.stringify(this.datasets), (err) => {
                if (err) reject();
                else {
                    Log.trace('DatasetController::writeCacheIntoDisk: Writing cache');
                    resolve();
                }
            });
        });
    }
    /**
     * Reads datasets from disk
     */
    private readCachedDatasetsInDisk(): Promise<Datasets> {
        if (this.datasets) {
            return new Promise<Datasets>((resolve) => resolve(this.datasets));
        }
        return new Promise<Datasets>((resolve, reject) => {

            if (!fs.existsSync(PARENT_DIR)) {
                fs.mkdirSync(PARENT_DIR);
            }
            if (!fs.existsSync(DATASETFILE)) {
                fs.writeFileSync(DATASETFILE, '{}');
            }

            fs.readFile(DATASETFILE, 'utf8', (err, data) => {
                if (err) return reject();
                try {
                    Log.trace('DatasetController::readCachedDatasetsInDisk: Read file, creating col');
                    let parsedJSON: { [id: string]: Datatable } = JSON.parse(data);
                    this.datasets = {};
                    for (var i in parsedJSON) {
                        if (parsedJSON[i]) {
                            let cols = (parsedJSON[i].columns || []).map((col: any) => {
                                return new Column(col.name, col.src, col.datatype, col.data);
                            });
                            this.datasets[i] = new Datatable(parsedJSON[i].id, parsedJSON[i].src, cols);
                        }
                    }
                } catch (err){ throw err; }
                resolve(this.datasets);
            });
        });
    }
}
