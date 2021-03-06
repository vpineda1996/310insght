var http = require('http');
var parse5 = require('parse5');

import { Datatable, Datatype, ColumnType, Column, Row } from '../common/Common';

import { GEO_ENDPOINT, MAX_GEO_TRIES, GEO_REQ_TIMEOUT } from '../common/Constants';

import Log from '../Util';

const COLUMNS: ColumnType[] = [{
    name: 'fullname',
    type: Datatype.STRING
}, {
    name: 'shortname',
    type: Datatype.STRING
}, {
    name: 'number',
    type: Datatype.STRING
}, {
    name: 'name',
    type: Datatype.STRING
}, {
    name: 'address',
    type: Datatype.STRING
}, {
    name: 'lat',
    type: Datatype.NUMBER
}, {
    name: 'lon',
    type: Datatype.NUMBER
}, {
    name: 'seats',
    type: Datatype.NUMBER
}, {
    name: 'type',
    type: Datatype.STRING
}, {
    name: 'furniture',
    type: Datatype.STRING
}, {
    name: 'href',
    type: Datatype.STRING
}];

export default class HTMLParser {

    public static parse(zipFiles: { [id: string]: JSZipObject }, datatable: Datatable): Promise<Datatable> {
        Log.trace('HTMLParser::parse( ... )');
        if(!Object.keys(zipFiles).length) throw new Error("invalid dataset!")

        return datatable.createColumns(COLUMNS).then((col) => {
            return datatable.loadColumns(COLUMNS.map(col => datatable.id + '_' + col.name));
        }).then(() => {
            if (!zipFiles['index.htm']) {
                throw new Error('you better send index file');
            }
            return this.parseAvailableBuildingNames(zipFiles['index.htm']);
        }).then((buildingNames: string[]) => {
            let promises: Promise<any>[] = [];
            for (let i in zipFiles) {
                let filePath = zipFiles[i]['name'].split('/');
                if (zipFiles[i] && !zipFiles[i].dir && buildingNames.includes(filePath[filePath.length-1])) {
                    promises.push(this.parseBuilding(zipFiles[i], i, datatable));
                }
            }
            return Promise.all(promises);
        }).then(() => {
            return datatable;
        }).catch((e) => {
            Log.trace('HTMLParser::parse( error pushing data to columns ) ' + e);
            throw e;
        });
    }

    public static parseAvailableBuildingNames(zip: JSZipObject): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            zip.async('string').then((res) => {
                try {
                    let document = parse5.parse(res);
                    let html = document.childNodes.find((node: any) => node.nodeName === 'html');
                    let body = html.childNodes.find((node: any) => node.nodeName === 'body');
                    let section = body.
                        childNodes[31].
                        childNodes[10].
                        childNodes[1].
                        childNodes[3];
                    let tbody = section.
                        childNodes[1].
                        childNodes[5].
                        childNodes[1].
                        childNodes[3];

                    let buildingNames = tbody.childNodes.filter((node: any) => node.nodeName === 'tr').
                        map((node: any) => node.childNodes[3].childNodes[0].value.trim());

                    resolve(buildingNames);

                } catch (e) {
                    reject();
                };
                reject();
            }).catch(reject);

        });
    }

    public static parseBuilding(zip: JSZipObject, filePath: string, datatable: Datatable): Promise<number> {
        return new Promise((resolve, reject) => {
            let rooms: any[];
            let idxColStart = Infinity;

            zip.async('string').then((res) => {
                let document = parse5.parse(res);
                let html = document.childNodes.find((node: any) => node.nodeName === 'html');
                let body = html.childNodes.find((node: any) => node.nodeName === 'body');
                let dtable = body.childNodes[31];

                if (!dtable) throw new Error('missing bunch of stuff on page');

                let placeholder =
                    !filePath.includes('UCLL') ?
                    dtable.
                    childNodes[10].
                    childNodes[1].
                    childNodes[3].
                    childNodes[1] :

                    dtable.
                    childNodes[12].
                    childNodes[1].
                    childNodes[3].
                    childNodes[1];

                let title = placeholder.
                    childNodes[3].
                    childNodes[1].
                    childNodes[1].
                    childNodes.
                    filter((node: any) => node.attrs).
                    find((node: any) =>
                        node.attrs.some((attr: any) =>
                            attr.name === 'id' && attr.value === 'building-info'));

                let data = placeholder.
                    childNodes[5].
                    childNodes[1].
                    childNodes[3];

                if (!(title && data)) throw new Error('missing building or room on page');

                let table = data.childNodes.find((node: any) => node.nodeName === 'table');

                if (!table) throw new Error('missing room on page');

                let building = this.getBuildingInfo(title);

                let thead = table.childNodes.find((node: any) => node.nodeName === 'thead');
                let tbody = table.childNodes.find((node: any) => node.nodeName === 'tbody');

                let headers = this.getHeaders(thead);
                let values = this.getTableValues(tbody, headers);

                let names = filePath.split('/');
                let shortname = names[names.length - 1];

                rooms = values.map((room: any) => [
                    building['fullname'],
                    shortname,
                    room['number'],
                    shortname + '_' + room['number'],
                    building['address'],
                    0,
                    0,
                    room['seats'],
                    room['type'],
                    room['furniture'],
                    room['href']
                ]);

                idxColStart = datatable.columns[0].getCurrentDataLength();

                rooms.forEach((room: any[]) => {
                    room.forEach((val: any, index: number) => datatable.columns[index].insertCellFast(val));
                });

                return getLatLon(building['address']);
            }).then((latlon: number[]) => {
                if (latlon && latlon.length !== 0) {
                    rooms.forEach((row: any[]) => {
                        datatable.columns[5].updateCellFast(idxColStart, latlon[0]);
                        datatable.columns[6].updateCellFast(idxColStart++, latlon[1]);
                    });
                }
                return resolve(true);
            }).catch(e => {
                // TODO idk what to do here
                // should we store partial data too?
                resolve();
            });
        });
    }

    // returns table headers like ['Room', 'Capacity', 'Type']
    private static getHeaders(thead: any): string[] {
        if (!thead || thead.nodeName !== 'thead') return [];

        return thead.childNodes.
            find((node: any) => node.nodeName === 'tr').childNodes.
            filter((node: any) => node.nodeName === 'th').
            map((node: any) => node.childNodes[0].value.trim());
    }

    private static getTableValues(tbody: any, headers: string[]): {}[] {
        if (!tbody || tbody.nodeName !== 'tbody') return [];

        return tbody.childNodes.
            filter((node: any) => node.nodeName === 'tr').
            map((node: any) => this.getRowValues(node, headers));
    }

    private static getRowValues(tr: any, headers: string[]): { [col: string]: string | number } {
        if (!tr || tr.nodeName !== 'tr') return {};

        let nodes: any = tr.childNodes.
            filter((node: any) => node.nodeName === 'td');

        return {
            'number': getRoomNumber(nodes[0]),
            'href': getRoomLink(nodes[0]),
            'seats': parseInt(getRoomSeats(nodes[1]).trim()),
            'furniture': getRoomFurniture(nodes[2]).trim(),
            'type': getRoomType(nodes[3]).trim()
        }
    }

    private static getBuildingInfo(node: any): { [col: string]: string | number } {
        return {
            'fullname': getBuildingFullName(node.childNodes[1]),
            'address': getBuildingAddress(node.childNodes[3])
        };
    }
}

function getRoomLink(tdnode: any): string {
    return tdnode.childNodes.
        find((node: any) => node.nodeName === 'a').attrs.
        find((attr: any) => attr.name === 'href').value || ""
}
function getRoomNumber(tdnode: any): string {
    return tdnode.childNodes.
        find((node: any) => node.nodeName === 'a').
        childNodes[0].value || "";
}

function getRoomSeats(tdnode: any): string {
    return tdnode.childNodes[0].value || "0";
}

function getRoomFurniture(tdnode: any): string {
    return tdnode.childNodes[0].value || "";
}

function getRoomType(tdnode: any): string {
    return tdnode.childNodes[0].value || "";
}

function getBuildingFullName(h2node: any): string {
    return h2node.childNodes[0].childNodes[0].value || "";
}

function getBuildingAddress(divnode: any): string {
    return divnode.childNodes[0].childNodes[0].value || "";
}

function getLatLon(address: any): Promise<any> {
    return new Promise<number[]>((resolve, reject) => {

        let tryCount = 0;
        let reqHttp : Function;

        let fnHandler = (res: any) => {
            if (res.statusCode !== 200) {
                if(tryCount ++ < MAX_GEO_TRIES){
                    return reqHttp();
                }
                return resolve([]);
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk: any) => rawData += chunk);

            res.on('end', () => {
                let latlon: any = JSON.parse(rawData);
                console.info(latlon);
                resolve([latlon.lat, latlon.lon]);
            });
        };

        let fnTimeoutHandler = () => {
            Log.info("Timeout for: " + address);
             (tryCount ++ < MAX_GEO_TRIES) ? reqHttp() : resolve([]);
        }

        reqHttp = () => {
            Log.info("Starting req for: " + address);
            let request = http.get(GEO_ENDPOINT + encodeURIComponent(address), fnHandler ).on('error', (e: Error) => {
                (tryCount ++ < MAX_GEO_TRIES) ? reqHttp() : resolve([]);
            });
            request.setTimeout(GEO_REQ_TIMEOUT, fnTimeoutHandler);
        }

        reqHttp();
    });
}
