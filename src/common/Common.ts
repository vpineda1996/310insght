import fs = require('fs');
import Log from "../Util";

import Constants = require('../common/Constants');
const PARENT_DIR = Constants.PARENT_DIR;

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
    public src: string;
    public id: string;
    public columns: Column[];

    constructor(id: string, src: string, columns: Column[]) {
        this.id = id;
        this.src = src;
        this.columns = columns;
    }

    /** 
     * Returns a promise that will be called whenever the row is inserted
     */
    public insertRow(row: Row): Promise<any[]> {
        let aPromises: Promise<Column>[] = [];
        this.columns.forEach(function (column) {
            let prom = column.insertCell(row[column.name] || "");
            aPromises.push(prom);
        });
        return Promise.all(aPromises);
    }

    /** 
     * Returns a promise that will be called whenever the row is edited
     */
    public editRow(idx: number, row: Row): Promise<any[]> {
        let aPromises: Promise<Column>[] = [];
        this.columns.forEach(function (column) {
            let prom = column.updateCell(idx, row[column.name] || "");
            aPromises.push(prom);
        });
        return Promise.all(aPromises);
    }

    public getRow(idx: number): Promise<Row> {
        let aPromises: Promise<any>[] = [];
        this.columns.forEach(function (column) {
            let prom = column.getData().then((data) => {
                return {
                    column: column.name,
                    data: data[idx]
                };
            });
            aPromises.push(prom);
        });
        return Promise.all(aPromises).then(rowDef => {
            let row: Row = {};
            rowDef.forEach((colDefn: any) => {
                row[colDefn.column] = colDefn.data;
            });
            return row;
        });
    }

    public removeRow(idx: number): Promise<any[]> {
        let aPromises: Promise<Column>[] = [];
        this.columns.forEach(function (column) {
            let prom = column.removeCell(idx);
            aPromises.push(prom);
        });
        return Promise.all(aPromises);
    }

    /**
     * Get a column by index in table or by name
     */
    public getColumn(name: string | number) {
        if (typeof name === 'number') {
            return this.columns[name];
        }
        return this.columns.find((col) => {
            return col.name === name;
        });
    }

    public createColumn(name: string, src?: string, datatype?: Datatype): Promise<Column> {
        // If a column with the same name already exists, then dont bother creating a new one;
        if (this.getColumn(name)) {
            return new Promise(resolve => {
                resolve(this.getColumn(name));
            });
        }

        Log.trace('Datatable::createColumn(..) - creating files for ' + name + ' in ' + src);

        // Create folders and necesary files for column
        if (!src) {
            src = PARENT_DIR + '/' + this.id + '/' + name + '.json';
            if (!fs.existsSync(PARENT_DIR)) {
                fs.mkdirSync(PARENT_DIR);
            }
            if (!fs.existsSync(PARENT_DIR + '/' + this.id)) {
                fs.mkdirSync(PARENT_DIR + '/' + this.id);
            }
            if (!fs.existsSync(src)) {
                Log.trace('Datatable::createColumn(..) - creating array for ' + name);
                fs.writeFileSync(src, '[]');
            }
            // TODO: resize new array of column to the current size of datatable
        }
        // Push new cols to array
        return new Promise(resolve => {
            let newCol = new Column(name, src, datatype);
            this.columns.push(newCol);
            resolve(newCol);
        });
    }

    public saveData(): Promise<any> {
        let aPromise: Promise<any>[] = [];
        this.columns.forEach((col) => {
            aPromise.push(col.saveData());
        });
        return Promise.all(aPromise);
    }

    public removeColumn(idx: number, splice?: boolean, ignoreErr? :boolean): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let localSrc = this.columns[idx].name
            Log.trace('Datatable::removeColumn(..) - Deleting column ' + localSrc);

            fs.unlink(this.columns[idx].src, (err) => {
                if (err && !ignoreErr) {
                    Log.trace("Column " + this.columns[idx].src + " could not be deleted!");
                    reject(err);
                } else {
                    Log.trace("Column " + localSrc + " was deleted!");
                    this.columns.splice(idx, 1);
                    resolve(true);
                }
            });

        });
    }

    public removeColumns(ignoreErr? : boolean): Promise<any> {
        let aPromise: Promise<boolean>[] = [];
        this.columns.forEach((col, idx) => {
            aPromise.push(this.removeColumn(idx, undefined, ignoreErr));
        });
        return Promise.all(aPromise).then(() =>  this.columns = []);
    }

}

export interface Row {
    [column: string]: string | number;
}

/**
 * Column defn where the index of the data 
 * array corresponds to row index in the table
 */
export class Column {
    public name: string;
    public src: string;
    public datatype: Datatype;

    private data: Array<string | number>;

    constructor(name: string, src: string, datatype?: Datatype, data? : Array<string | number>) {
        this.name = name;
        this.src = src;
        this.datatype = datatype || Datatype.STRING;
        Log.trace("Data length : "   + (data && data.length));
        this.data = data || [];
    }
    

    public getData(): Promise<Array<string | number>> {
        return new Promise<Array<string | number>>((resolve, reject) => {
            resolve(this.data);
        });
    }

    public updateCell(idx: number, value: string | number): Promise<Column> {
        return this.getData().then((data) => {
            data[idx] = value;
            this.data = data;
            return this;
        });
    }

    public insertCellFast(value: string | number) {
        this.data.push(value);
    }

    public insertCell(value: string | number): Promise<Column> {
        return this.getData().then((data: any) => {
            data.push(value);
            this.data = data;
            return this;
        });
    }

    public removeCell(idx: number): Promise<Column> {
        return this.getData().then((data: any) => {
            data.splice(idx, 1);
            this.data = data;
            return this;
        });
    }

    public saveData(): Promise<Column> {
        return new Promise((resolve, reject) => {
            resolve(this);
        });
    }
};

export enum Datatype {
    STRING,
    NUMBER
};
