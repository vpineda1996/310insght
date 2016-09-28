import fs = require('fs');
import Log from "../Util";

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
    public columns: Column[];

    constructor(src: string, columns: Column[]) {
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

    public removeColumn(name: string | number): Promise<boolean> {
        // TODO
        return new Promise((resolve) => resolve());
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

    constructor(name: string, src: string, datatype?: Datatype) {
        this.name = name;
        this.src = src;
        this.datatype = datatype || Datatype.STRING;
    }

    private data: string[] | number[];

    public getData(): Promise<string[] | number[]> {
        return new Promise<string[] | number[]>((resolve, reject) => {
            if (this.data) {
                return this.data.slice();
            }
            fs.readFile(this.src, 'utf-8', (err, data) => {
                Log.trace('Column::getData( ' + data + '... )');
                if (!data || err) {
                    return reject(err);
                }
                this.data = JSON.parse(data);
                resolve(this.data.slice());
            });
        });
    }

    public updateCell(idx: number, value: string | number): Promise<Column> {
        return this.getData().then((data) => {
            data[idx] = value;
            this.data = data;
            return this.saveData();
        });
    }

    public insertCell(value: string | number): Promise<Column> {
        return this.getData().then((data: any) => {
            data.push(value);
            this.data = data;
            return this.saveData();
        });
    }

    public removeCell(idx: number): Promise<Column> {
        return this.getData().then((data: any) => {
            data.splice(idx, 1);
            this.data = data;
            return this.saveData();
        });
    }

    private saveData(): Promise<Column> {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.src, JSON.stringify(this.data), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }
};

export enum Datatype {
    STRING,
    NUMBER
};