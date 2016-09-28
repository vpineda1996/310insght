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

        if (DatasetController._instance) {
            throw new Error("Error: Instantiation failed: Use DatasetController.getInstance() instead of new.");
        }

        DatasetController._instance = this;
        if (!fs.existsSync(PARENT_DIR)) {
            fs.mkdirSync(PARENT_DIR);
        }
        if (!fs.existsSync(DATASETFILE)) {
            fs.writeFileSync(DATASETFILE, '{}');
        }
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
     * @returns {Promise<boolean>} returns true if successful; false if the dataset was invalid (for whatever reason)
     */
    public process(id: string, data: any): Promise<number> {
        Log.trace('DatasetController::process( ' + id + '... )');
        return new Promise((fulfill, reject) => {
            try {
                let myZip = new JSZip();
                let resCode = 204;
                this.getDataset(id).then(oDataTable => {
                    if (!oDataTable) {
                        oDataTable = new Datatable(id, PARENT_DIR + "/" + id, []);
                        resCode = 201;
                    }
                    myZip.loadAsync(data, { base64: true }).then((zip: JSZip) => {
                        Log.trace('DatasetController::process(..) - unzipped');
                        JSONParser.parse(zip.files, oDataTable).then((processedMetadata: Datatable) => {
                            this.save(id, processedMetadata);
                            fulfill(resCode);
                        });
                    }).catch(function (err) {
                        Log.trace('DatasetController::process(..) - unzip ERROR: ' + err.message);
                        reject(err);
                    });
                });
            } catch (err) {
                Log.trace('DatasetController::process(..) - ERROR: ' + err);
                reject(err);
            }
        });
    }

    /**
     * Writes the processed dataset to disk as 'id.json'. The function should overwrite
     * any existing dataset with the same name.
     *
     * @param id
     * @param processedDataset
     */
    private save(id: string, processedDataset: Datatable) {
        // add it to the memory model
        this.readCachedDatasetsInDisk().then((datasets) => {
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
            fs.writeFile(DATASETFILE, JSON.stringify(this.getDatasetsForExport()), (err) => {
                if (err) {
                    Log.trace('DatasetController::writeCacheIntoDisk(..) ' + err);
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }

    private getDatasetsForExport() {
        var acc: any = {};
        for (var i in this.datasets) {
            if (this.datasets[i]) {
                var cleanCol: any[] = [];
                this.datasets[i].columns.forEach((column) => {
                    cleanCol.push({
                        name: column.name,
                        src: column.src,
                        datatype: column.datatype
                    });
                });
                acc[i] = {
                    id: this.datasets[i].id,
                    src: this.datasets[i].src,
                    columns: cleanCol
                };
            }
        }
        return acc;
    }
    /**
     * Reads datasets from disk
     */
    private readCachedDatasetsInDisk(): Promise<Datasets> {
        if (this.datasets) {
            return new Promise<Datasets>((resolve) => resolve(this.datasets));
        }
        return new Promise<Datasets>((resolve, reject) => {
            fs.readFile(DATASETFILE, 'utf8', (err, data) => {
                if (err) {
                    Log.trace('DatasetController::readCachedDatasetsInDisk(cannot parse json file)');
                    return reject();
                }
                try {
                    this.datasets = JSON.parse(data);
                } catch (err) {
                    Log.trace('DatasetController::readCachedDatasetsInDisk(cannot parse json file)');
                    throw err;
                }
                resolve(this.datasets);
            });
        });
    }
}
