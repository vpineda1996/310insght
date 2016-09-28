/**
 * Created by rtholmes on 2016-09-03.
 */

import Log from "../Util";
import JSZip = require('jszip');
import fs = require('fs');

/**
 * In memory representation of all datasets.
 * Value for every key is the src of the datatable
 */
export interface Datasets {
    [id: string]: Datatable;
}

/**
 * The key is the name of the column and the value
 * is a column
 */
export class Datatable {
    src: string;
    columns: Column[];

    /** 
     * Returns a promise that will be called whenever the row is inserted
     */
    public insertRow(row: Row): Promise<number> {
        return null;
    }

    /** 
     * Returns a promise that will be called whenever the row is edited
     */
    public editRow(idx: number, row: Row): Promise<boolean> {
        //TODO
        return null;
    }

    public getRow(idx: number): Promise<Row> {
        //TODO
        return null;
    }

    /**
     * Get a column by index in table or by name
     */
    public getColumn(name: string, idx?: number) {
        if (idx) {
            return this.columns[idx];
        }
        return this.columns.find((col) => {
            return col.name === name;
        });
    }
}

export interface Row {
    [column: string]: string;
}

const DATASETFILE = './data/datasets.json';

/**
 * Column defn where the index of the data 
 * array corresponds to row index in the table
 */
export class Column {
    private data: string[];

    name: string;
    src: string;

    public getData(): Promise<Column> {
        // TODO: read column
        return null;
    }

    public updateCell(number: number, value: string): Promise<Column> {
        // TODO: write to cache and disk
        return null;
    }

    public insertCell(value: string): Promise<Column> {
        // TODO: insert cell value and save async
        return null;
    }

    public removeCell(number: number): Promise<Column> {
        // TODO: remove and save
        return null;
    }
}

export default class DatasetController {

    private datasets: Datasets = null;

    constructor() {
        Log.trace('DatasetController::init()');
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
        // TODO: this should check if the dataset is on disk in ./data if it is not already in memory.
        return new Promise((resolve, reject) => {
            this.readCachedDatasetsInDisk().then((datasets: Datasets) => {
                resolve(datasets[id]);
            });
        });
    }

    public getDatasets(): Promise<Datasets> {
        return new Promise<Datasets>((resolve, reject) => {
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
    public process(id: string, data: any): Promise<boolean> {
        Log.trace('DatasetController::process( ' + id + '... )');

        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let myZip = new JSZip();
                myZip.loadAsync(data, { base64: true }).then(function (zip: JSZip) {
                    Log.trace('DatasetController::process(..) - unzipped');

                    let processedDataset = {};
                    // TODO: iterate through files in zip (zip.files)
                    // The contents of the file will depend on the id provided. e.g.,
                    // some zips will contain .html files, some will contain .json files.
                    // You can depend on 'id' to differentiate how the zip should be handled,
                    // although you should still be tolerant to errors.

                    that.save(id, processedDataset);

                    fulfill(true);
                }).catch(function (err) {
                    Log.trace('DatasetController::process(..) - unzip ERROR: ' + err.message);
                    reject(err);
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
    private save(id: string, processedDataset: any) {
        // add it to the memory model
        this.readCachedDatasetsInDisk().then((datasets) => {
            this.datasets[id] = processedDataset;
        }).catch((err) => {
            Log.error('DatasetController::save(..) read from disk' + err );
        });

        this.writeCacheIntoDisk().catch((err) => {
            Log.error('DatasetController::save(..) write to disk' + err );
        });
    }

    /**
     * Saves datasets to disk
     */
    private writeCacheIntoDisk(): Promise<Datasets> {
        return new Promise((resolve, reject) => {
            fs.writeFile(DATASETFILE, JSON.stringify(this.datasets), (err) => {
                if (err) {
                    Log.trace('DatasetController::writeCacheIntoDisk(..) ' + err );
                    reject();
                } else {
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
            fs.readFile(DATASETFILE, 'utf8', (err, data) => {
                if (err) {
                    reject();
                }
                this.datasets = JSON.parse(data);
                resolve(this.datasets);
            });
        });
    }
}
