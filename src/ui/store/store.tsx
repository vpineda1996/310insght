import { fetch } from './dispatcher'

interface Data {
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

    public static fetch(id: string, query: {}): Data|Promise<Data> {
        return this.getInstance().fetch(id, query);
    }

    private fetch(id: string, query: {}): Data|Promise<Data> {
        let dataContainer = this._data[id];
        if (!dataContainer) return this.load(id, query);

        let key = JSON.stringify(query);
        let data: Data = dataContainer[key];

        if (!data || data.expires_at > new Date().getTime()) return this.load(id, query);

        return data
    }

    private load(id: string, query: {}): Data|Promise<Data> {
        let key = JSON.stringify(query);
        let dataContainer = this._data[id];
        if (!dataContainer) dataContainer = {};

        let data = dataContainer[key];
        if (!data) data = {
          id: id,
          query_key: key,
          value: [],
          expires_at: new Date().getTime() + 5 * 60000 // 5 mins
        };

        return new Promise<Data>((resolve, reject) => {
            return fetch(id, query).then(res => {
                console.info(res.result);
                return null;
            }).fail((xhr, status, error) => {
                console.error(error);
                return null;
            });
        });
    }
}
