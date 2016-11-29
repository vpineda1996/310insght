import { fetch } from './dispatcher'

const BASE_QUERY = {
    "AS": "TABLE",
    "WHERE": {}
}

export interface Data {
    id: string;
    query_key: string;
    value: any[];
    expires_at: number
}

interface Accessor {
    [key: string]: Data
}

interface Storage {
    [id: string]: Accessor
}

export class Store {
    private static _instance: Store;
    private _data: Storage = {

    }

    public static getInstance(): Store {
        if (!this._instance) {
            this._instance = new Store();
        }
        return this._instance;
    }

    public static fetch(id: string, query: {}): Promise<any[]> {
        let _query = $.extend({}, BASE_QUERY, query);
        console.info('Store::Fetch', JSON.stringify(_query));

        return this.getInstance().fetch(id, _query);
    }

    private fetch(id: string, query: {}): Promise<any[]> {
        let dataContainer = this._data[id];
        if (!dataContainer) return this.load(id, query);

        let key = JSON.stringify(query);
        let data: Data = dataContainer[key];

        if (!data || data.value === [] || data.expires_at < new Date().getTime()) return this.load(id, query);

        return new Promise<any[]>((resolve, reject) => resolve(data.value));
    }

    private load(id: string, query: {}): Promise<any[]> {
        let key = JSON.stringify(query);
        let dataContainer = this._data[id];
        if (!dataContainer) dataContainer = {};

        let data = dataContainer[key];
        if (!data) {
            data = {
                id: id,
                query_key: key,
                value: [],
                expires_at: null
            };
        }
        data.expires_at = new Date().getTime() + 5 * 60000 // 5 mins

        return new Promise<any[]>((resolve, reject) => {
            return fetch(id, query).then(res => {
                data.value = res.result;
                dataContainer[key] = data;
                this._data[id] = dataContainer;
                return resolve(res.result);
            }).fail((xhr, status, error) => {
                dataContainer[key] = data;
                this._data[id] = dataContainer;
                return reject(error);
            });
        });
    }
}
