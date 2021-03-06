/**
 * Created by rtholmes on 2016-10-31.
 */

import { Datasets, Datatable } from "../src/common/Common";
import DatasetController from "../src/controller/DatasetController";
import QueryController from "../src/controller/QueryController";
import { QueryRequest, QueryResponse, QueryOrder } from '../src/util/Query';

import { isFormatValid } from '../src/queryHelpers/querable';
import { isValidOrder } from '../src/queryHelpers/queryOrder';
import { renderTable } from '../src/queryHelpers/queryAs';

import Log from "../src/Util";
import { isNumber } from '../src/util/String';
import { getFirst } from '../src/util/Object';
import JSZip = require('jszip');

import {expect} from 'chai';
describe("QueryController", function () {
    let GET: string[];
    let WHERE: {};
    let ORDER: QueryOrder;
    let ORDER_KEYS: string[];
    let ORDER_DIR: string;
    let AS: string;

    const ID = 'other'
    const COLUMN_NAMES = ['dept', 'id', 'avg', 'instructor', 'title', 'pass', 'fail', 'audit']

    function SRC_NAME(n:number) { return ID + '_' + COLUMN_NAMES[n] }

    const VALID_MCOMPARISON : {} = { GT: { [SRC_NAME(2)]: 70} }
    const VALID_MCOMPARISON_LT : {} = { LT: { [SRC_NAME(2)]: 80 } }
    const VALID_MCOMPARISON_EQ : {} = { EQ: { [SRC_NAME(5)]: 5 } }
    const VALID_SCOMPARISON : {} = { IS: { [SRC_NAME(4)]: 'intro*' } }
    const VALID_SCOMPARISON_DEPT : {} = { IS: { [SRC_NAME(0)]: 'zool' } }
    const VALID_NEGATION : {} = { NOT: VALID_MCOMPARISON }
    const VALID_LOGICCOMPARISON : {} = { AND: [VALID_MCOMPARISON, VALID_SCOMPARISON] }
    const VALID_LOGICCOMPARISON_OR : {} = { OR: [VALID_SCOMPARISON, VALID_MCOMPARISON_EQ] }
    const VALID_LOGICCOMPARISON_OR_AND_AND : {} = { OR: [ { AND: [VALID_MCOMPARISON, VALID_SCOMPARISON] }, { AND: [VALID_SCOMPARISON_DEPT] } ] }
    const VALID_LOGICCOMPARISON_OR_AND_OR : {} = { OR: [ { AND: [VALID_MCOMPARISON] }, { OR: [VALID_SCOMPARISON_DEPT, VALID_NEGATION] } ] }
    const VALID_LOGICCOMPARISON_OR_OR_AND : {} = { OR: [ { OR: [VALID_MCOMPARISON, VALID_NEGATION] }, { AND: [VALID_SCOMPARISON_DEPT] } ] }
    const VALID_LOGICCOMPARISON_OR_OR_OR : {} = { OR: [ { OR: [VALID_MCOMPARISON] }, { OR: [VALID_SCOMPARISON_DEPT] } ] }
    const VALID_LOGICCOMPARISON_AND_AND_AND : {} = { AND: [ { AND: [VALID_MCOMPARISON] }, { AND: [VALID_SCOMPARISON_DEPT] } ] }
    const VALID_LOGICCOMPARISON_AND_AND_OR : {} = { AND: [ { AND: [VALID_MCOMPARISON] }, { OR: [VALID_SCOMPARISON_DEPT, VALID_LOGICCOMPARISON] } ] }
    const VALID_LOGICCOMPARISON_AND_OR_AND : {} = { AND: [ { OR: [VALID_MCOMPARISON, VALID_MCOMPARISON_LT] }, { AND: [VALID_SCOMPARISON_DEPT] } ] }
    const VALID_LOGICCOMPARISON_AND_OR_OR : {} = { AND: [ { OR: [VALID_MCOMPARISON, VALID_LOGICCOMPARISON_OR] }, { OR: [VALID_SCOMPARISON_DEPT] } ] }

    function MCOMPARISON_GT(res:any) { return res[capitalize(COLUMN_NAMES[2])] > 70; }
    function MCOMPARISON_LT(res:any) { return res[capitalize(COLUMN_NAMES[2])] < 80; }
    function MCOMPARISON_EQ(res:any) { return res[capitalize(COLUMN_NAMES[5])] === 5; }
    function SCOMPARISON_IS(res:any) { return /intro.*/.test(res[capitalize(COLUMN_NAMES[4])]); }
    function SCOMPARISON_IS_DEPT(res:any) { return /^zool$/.test(res[capitalize(COLUMN_NAMES[0])]); }

    function ARITH_OPERATION(fn:any)                    { return flatten(JSONS.map((json: any) => basicFilter(json) ? json.result.filter(fn) : [] )) }
    function ARITH_VALID_MCOMPARISON(jsons:{}[])        { return ARITH_OPERATION((res:{[s:string]:any}) => MCOMPARISON_GT(res) ) }
    function ARITH_VALID_MCOMPARISON_LT(jsons:{}[])     { return ARITH_OPERATION((res:{[s:string]:any}) => MCOMPARISON_LT(res) ) }
    function ARITH_VALID_MCOMPARISON_EQ(jsons:{}[])     { return ARITH_OPERATION((res:{[s:string]:any}) => MCOMPARISON_EQ(res) ) }
    function ARITH_VALID_SCOMPARISON(jsons:{}[])        { return ARITH_OPERATION((res:{[s:string]:any}) => SCOMPARISON_IS(res) ) }
    function ARITH_VALID_NEGATION(jsons:{}[])           { return ARITH_OPERATION((res:{[s:string]:any}) => !MCOMPARISON_GT(res) ) }
    function ARITH_VALID_LOGICCOMPARISON(jsons:{}[])    { return ARITH_OPERATION((res:{[s:string]:any}) => MCOMPARISON_GT(res) && SCOMPARISON_IS(res) ) }
    function ARITH_VALID_LOGICCOMPARISON_OR(jsons:{}[])           { return ARITH_OPERATION((res:{[s:string]:any}) => MCOMPARISON_EQ(res) || SCOMPARISON_IS(res) ) }

    function ARITH_VALID_LOGICCOMPARISON_OR_AND_AND(jsons:{}[])   { return ARITH_OPERATION((res:{[s:string]:any}) => (MCOMPARISON_GT(res) && SCOMPARISON_IS(res)) || (SCOMPARISON_IS_DEPT(res)) ) }
    function ARITH_VALID_LOGICCOMPARISON_OR_AND_OR(jsons:{}[])    { return ARITH_OPERATION((res:{[s:string]:any}) => (MCOMPARISON_GT(res)) || (SCOMPARISON_IS_DEPT(res) || !MCOMPARISON_GT(res)) ) }
    function ARITH_VALID_LOGICCOMPARISON_OR_OR_AND(jsons:{}[])    { return ARITH_OPERATION((res:{[s:string]:any}) => (MCOMPARISON_GT(res) || !MCOMPARISON_GT(res)) || (SCOMPARISON_IS_DEPT(res)) ) }
    function ARITH_VALID_LOGICCOMPARISON_OR_OR_OR(jsons:{}[])     { return ARITH_OPERATION((res:{[s:string]:any}) => (MCOMPARISON_GT(res)) || (SCOMPARISON_IS_DEPT(res)) ) }
    function ARITH_VALID_LOGICCOMPARISON_AND_AND_AND(jsons:{}[])  { return ARITH_OPERATION((res:{[s:string]:any}) => (MCOMPARISON_GT(res)) && (SCOMPARISON_IS_DEPT(res)) ) }
    function ARITH_VALID_LOGICCOMPARISON_AND_AND_OR(jsons:{}[])   { return ARITH_OPERATION((res:{[s:string]:any}) => (MCOMPARISON_GT(res)) && (SCOMPARISON_IS_DEPT(res) || MCOMPARISON_GT(res) && SCOMPARISON_IS(res)) ) }
    function ARITH_VALID_LOGICCOMPARISON_AND_OR_AND(jsons:{}[])   { return ARITH_OPERATION((res:{[s:string]:any}) => (MCOMPARISON_GT(res) || MCOMPARISON_LT(res)) && (SCOMPARISON_IS_DEPT(res)) ) }
    function ARITH_VALID_LOGICCOMPARISON_AND_OR_OR(jsons:{}[])    { return ARITH_OPERATION((res:{[s:string]:any}) => (MCOMPARISON_GT(res) || MCOMPARISON_EQ(res) || SCOMPARISON_IS(res)) && (SCOMPARISON_IS_DEPT(res)) ) }

    function capitalize(str:string) { return str.charAt(0).toUpperCase() + str.slice(1) }
    function basicFilter(json:{[s:string]:any}) { return json['result'] && json['result'][0] }
    function flatten(arr:any[]) { return [].concat.apply([], arr) }

    function ARITH_EQUAL(arr1:{}[], arr2:{}[]) { return ARITH_ARRAY_EQUAL(arr1.map((json:{[s:string]:any}) => json['id']),arr2.map((json:{[s:string]:any})=>json['id'])).map(id=>arr1.find((json:{[s:string]:any})=> json['id'] === id)) }

    function ARITH_ARRAY_EQUAL(arr1:{}[], arr2:{}[]) { return arr1.filter(arr => arr2.includes(arr)) }

    // HACK ORDER_KEYS need to be iterated over
    function ARITH_ORDER(jsons:any) {
        let flat: any[];
        return (flat = flatten(jsons)).
            map((v: any,i: any) => i).
            sort((a: any, b: any) => sort(jsons,a,b,ORDER_KEYS.map(k => capitalize(k.split('_')[1])),ORDER_DIR)).
            map((i:any) => flat[i]);
    }

    function sort(jsons: {[s:string]:any}[], a_index: any, b_index: any, col: string[], dir: string) {
        if (col.length == 0) return 0;

        let a = jsons[a_index][col[0]];
        let b = jsons[b_index][col[0]];
        let before = dir === "UP" ? 1 : -1;
        let after = dir === "UP" ? -1 : 1;

        return tryNumber();

        function tryNumber():number {
            if (isNumber(a) && isNumber(b)) {
                let d = parseFloat(a) - parseFloat(b);
                if (d > 0) {
                    return before;
                } else if (d < 0) {
                    return after;
                } else {
                    return sort(jsons, a_index, b_index,col.slice(1,col.length), dir);
                }
            } else {
                return tryString();
            }
        }

        function tryString():number {
            if (a > b) {
                return before;
            } else if (a < b) {
                return after;
            } else {
                return sort(jsons, a_index, b_index,col.slice(1,col.length), dir);
            }
        }
    }

    function QUERY_RESPONSE(jsons:{}[]) { return jsons.map((json:any) => GET.reduce((newJson:any, col:string) => { newJson[col] = json[capitalize(col.split('_')[1])]; return newJson }, {})) }

    let QUERY : QueryRequest;

    function createDataset(arr:any[]) { return {
        [capitalize(COLUMN_NAMES[0])]: arr[0],
        [capitalize(COLUMN_NAMES[1])]: arr[1],
        [capitalize(COLUMN_NAMES[2])]: arr[2],
        [capitalize(COLUMN_NAMES[3])]: arr[3],
        [capitalize(COLUMN_NAMES[4])]: arr[4],
        [capitalize(COLUMN_NAMES[5])]: arr[5],
        [capitalize(COLUMN_NAMES[6])]: arr[6],
        [capitalize(COLUMN_NAMES[7])]: arr[7]
    }}

    const JSONS : {[s:string]:any}[] = [{
        result: []
    }, {
        result: [
            createDataset(['cpsc', '110', 70.3, 'John', '', 5, 3, 4]),
            createDataset(['cpsc', '110', 30.2, 'Nick', 'introduction to awesome RACKET', 90, 60, 20])
        ]
    }, {
        result: [
            createDataset(['arts', '001a', 20.6, 'Smith', 'intro', 90, 500, 10]),
        ]
    }, {
        result: [
            createDataset(['arts', '001c', 30.15, 'Smith', 'intro', 80, 500, 10]),
        ]
    }, {
        result: [
            createDataset(['arts', '099c', 50.2, 'Smith', 'intro', 50, 500, 10]),
        ]
    }, {
        result: [
            createDataset(['arts', '099', 50.6, 'Smith', 'intro', 60, 500, 10]),
        ]
    }, {
        result: [
            createDataset(['arts', '001', 10, 'Smith', 'intro', 100, 500, 10]),
        ]
    }, {
        result: [
            createDataset(['arts', '351b', 10, 'Smith', 'intro', 30, 500, 10]),
        ]
    }, {
        result: [
            createDataset(['arts', '201', 70.4, 'Smith', 'intro', 40, 500, 10]),
        ]
    }, {
        result: [
            createDataset(['arts', '011a', 40.2, 'Smith', 'intro', 70, 500, 10]),
        ]
    }, {
        result: [
            createDataset(['cpsc', '320', 30.99, 'Smith', 'intro', 50, 100, 30]),
        ]
    }, {
        result: [
            createDataset(['zool', '300', 50.12, 'Michael', 'hi', 30, 4, 10]),
            createDataset(['zool', '300', 60.4, 'Gregor', 'what is this', 70, 30, 60])
        ]
    }]
    const ZIP_OPTS= {
        compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
    };

    function query() : QueryRequest {
        if (QUERY === null) return QUERY;
        QUERY = { GET: GET, WHERE: WHERE, AS: AS };
        if (ORDER_KEYS) QUERY.ORDER = { dir: ORDER_DIR, keys: ORDER_KEYS };
        return QUERY;
    }
    function isValid() : boolean {
        return isFormatValid(query());
    }

    beforeEach(function (done) {
        GET = [SRC_NAME(0), SRC_NAME(1), SRC_NAME(2), SRC_NAME(5)];
        WHERE = VALID_MCOMPARISON;
        ORDER_DIR = "UP"
        ORDER_KEYS = [SRC_NAME(0)];
        AS = 'TABLE';

        QUERY = undefined;

        DatasetController.getInstance().getDataset(ID).then((odataset) => {
            return odataset.removeColumns();
        }).then(()=>done()).catch(()=>done());
    });

    afterEach(function () {
    });

    describe('QUERY BODY', function() {

        describe('SCOMPARISON', function () {
            it('fails on invalid type: string <- json', function () {
                WHERE = { IS: SRC_NAME(1) };
                expect(isValid()).to.equal(false);
            });
            it('fails on invalid type: null', function () {
                WHERE = { IS: { [SRC_NAME(1)]: null } };
                expect(isValid()).to.equal(false);
            });
            it('fails on invalid type: number', function () {
                WHERE = { IS: { [SRC_NAME(0)]: 5 } };
                expect(isValid()).to.equal(false);
            });
            it('fails on invalid string ^[*]+$', function () {
                WHERE = { IS: { [SRC_NAME(0)]: '*****'} };
                expect(isValid()).to.equal(false);
            });
            it('succeeds with valid [*]string[*]', function () {
                WHERE = { IS: { [SRC_NAME(0)]: '*course_avg*'} };
                expect(isValid()).to.equal(true);
            });
            it('succeeds with valid json {string : string}', function () {
                WHERE = { IS: { [SRC_NAME(1)]: SRC_NAME(2)} };
                expect(isValid()).to.equal(true);
            });
        });

        describe('MCOMPARISON', function () {
            it('fails on invalid type: json', function () {
                WHERE = { GT: { GT: { [SRC_NAME(0)]: 5 } } };
                expect(isValid()).to.equal(false);
            });
            it('fails on invalid type: null', function () {
                WHERE = { GT: null };
                expect(isValid()).to.equal(false);
            });
            it('succeeds with valid type', function () {
                WHERE = { GT: { [SRC_NAME(1)]: 50} };
                expect(isValid()).to.equal(true);
            });
        });

        describe('LOGICCOMPARISON', function () {
            it('fails on invalid type: json', function () {
                WHERE = { AND: VALID_MCOMPARISON };
                expect(isValid()).to.equal(false);
            });
            it('fails on invalid type: null', function () {
                WHERE = { OR: null };
                expect(isValid()).to.equal(false);
            });
            it('succeeds with valid type', function () {
                WHERE = VALID_LOGICCOMPARISON;
                expect(isValid()).to.equal(true);
            });
            it('succeeds with valid within clause', function () {
                WHERE = {
                    WITHIN: {
                        [ID + '_lat']: 469.123242,
                        [ID + '_lon']: -123.23563,
                        radius: 100.01
                    }
                }
                expect(isValid()).to.equal(true);
            });
        });

        describe('NEGATION', function () {
            it('fails on invalid type: json', function () {
                WHERE = { NOT: VALID_MCOMPARISON };
                expect(isValid()).to.equal(true);
            });
            it('fails on invalid type: null', function () {
                WHERE = { NOT: null };
                expect(isValid()).to.equal(false);
            });
            it('succeeds with valid type', function () {
                WHERE = VALID_LOGICCOMPARISON;
                expect(isValid()).to.equal(true);
            });
        });

        it('invalidates null query', function () {
            QUERY = null;

            expect(isValid()).to.equal(false);
        });

    });
    describe('::query()', function() {
        beforeEach(function () {
        })

        function prepopulate() : Promise<boolean> {
            let zip = new JSZip();

            for (let i in JSONS) {
                if (JSONS[i]['result'][0]) {
                    zip.file(JSONS[i]['result'][0]['Dept'] +JSONS[i]['result'][0]['Id'], JSON.stringify(JSONS[i]));
                }
            }
            return zip.generateAsync(ZIP_OPTS).then((data) => {
                return DatasetController.getInstance().process(ID, data);
            }).then((result) => {
                return result < 400;
            }).catch((err:Error) => {
                console.error(err);
                return false;
            });
        }

        function perform_query() : Promise<QueryResponse> {
            return new QueryController().query(query())
        }

        function ARITH_IDENTITY(val:any) { return val; }

        function perform_query_checks(additionalOperation?: Function) : Promise<any> {

            if (!additionalOperation) additionalOperation = ARITH_IDENTITY;

            return new Promise<any>((resolve, reject) => {
                prepopulate().then((result : boolean) => {
                    if (!result) { return reject('data upload failed'); }

                }).then(() => {
                    justdoitFailCount = 0;
                    justdoitSuccessCount = 0;

                    WHERE = VALID_MCOMPARISON_LT;
                    return justdoit('works on LT', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_MCOMPARISON_LT(JSONS))));
                    });

                }).then(() => {

                    WHERE = VALID_MCOMPARISON_EQ;
                    return justdoit('works on EQ', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_MCOMPARISON_EQ(JSONS))));
                    });

                }).then(() => {

                    WHERE = VALID_MCOMPARISON;
                    return justdoit('works on GT', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_MCOMPARISON(JSONS))));
                    });

                }).then(() => {

                    WHERE = VALID_LOGICCOMPARISON;
                    return justdoit('works on AND { MCOMPARATORS }', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_LOGICCOMPARISON(JSONS))));
                    });

                }).then(() => {

                    WHERE = VALID_LOGICCOMPARISON_OR;
                    return justdoit('works on OR { MCOMPARATORS }', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_LOGICCOMPARISON_OR(JSONS))));
                    })

                }).then(() => {

                    WHERE = VALID_SCOMPARISON;
                    return justdoit('works on IS', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_SCOMPARISON(JSONS))));
                    });

                }).then(() => {

                    WHERE = { NOT: VALID_MCOMPARISON };
                    return justdoit('works on NOT { MCOMPARATORS }', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_NEGATION(JSONS))));
                    });

                }).then(() => {

                    WHERE = VALID_LOGICCOMPARISON_OR_OR_AND;
                    return justdoit('works on OR [ OR { MCOMPARATORS }, AND { SCOMPARATORS } ]', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_LOGICCOMPARISON_OR_OR_AND(JSONS))));
                    });

                }).then(() => {

                    WHERE = VALID_LOGICCOMPARISON_OR_AND_OR;
                    return justdoit('works on OR [ AND { MCOMPARATORS }, OR { SCOMPARATORS } ]', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_LOGICCOMPARISON_OR_AND_OR(JSONS))));
                    });

                }).then(() => {

                    WHERE = VALID_LOGICCOMPARISON_OR_OR_OR;
                    return justdoit('works on OR [ OR { MCOMPARATORS }, OR { SCOMPARATORS } ]', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_LOGICCOMPARISON_OR_OR_OR(JSONS))));
                    });

                }).then(() => {

                    WHERE = VALID_LOGICCOMPARISON_OR_OR_AND;
                    return justdoit('works on OR [ OR { MCOMPARATORS }, AND { SCOMPARATORS } ]', perform_query, (res:QueryResponse) => {
                        expect(res.result).to.be.deep.equal(QUERY_RESPONSE(additionalOperation(ARITH_VALID_LOGICCOMPARISON_OR_OR_AND(JSONS))));
                    });

                }).then(() => {

                    GET = ['courses_id', 'courses_avg']
                    return justdoit('works on 424', perform_query, (res:QueryResponse) => {
                        expect(res.missing).to.be.deep.equal(GET);
                    });

                }).then(() => {

                    if (justdoitFailCount === 0) {
                        console.log('\x1b[33m[mocha-super-awesome\x1b[33m]\x1b[37m: \x1b[32mnothing failed... boring...\x1b[0m');
                        resolve();
                    } else {
                        console.log('\x1b[33m[mocha-super-awesome\x1b[33m]\x1b[37m: \x1b[32m' + justdoitSuccessCount+ ' passed!\x1b[0m');
                        console.log('\x1b[33m[mocha-super-awesome\x1b[33m]\x1b[37m: \x1b[31m' + justdoitFailCount + ' failed! dumbass \x1b[0m');
                        reject();
                    }
                });
            });
        }

        let justdoitFailCount = 0, justdoitSuccessCount = 0;
        function justdoit(fnname: string, fn: Function, fnerr: Function) : Promise<any> {
            return new Promise<any>((resolve, reject) => {
                return fn().then(fnerr).then((res: any) => {
                    ++justdoitSuccessCount;
                    console.log('\x1b[33m[mmocha-super-awesome\x1b[33m]\x1b[37m: \x1b[32m' + fnname + '\x1b[0m');
                    resolve();
                }).catch((err: Error) => {
                    ++justdoitFailCount;
                    console.error(err);
                    console.log('\x1b[33m[mmocha-super-awesome\x1b[33m]\x1b[37m: \x1b[31m' + fnname + '\x1b[0m');
                    resolve();
                });
            })
        }

        describe('regular queries', function () {
            it('just works', function (done) {
                ORDER_KEYS = null;
                perform_query_checks().then(res => {
                    done();
                }).catch(console.error);
            });
        })

        describe('ORDER', function () {
            describe('keys: [sring]', function () {
                it('has to work', function (done) {
                    ORDER_KEYS = [SRC_NAME(0), SRC_NAME(1)];
                    perform_query_checks(ARITH_ORDER).then(res => {
                        done();
                    });
                });
                it('just works, you know, just works', function (done) {
                    ORDER_KEYS = [SRC_NAME(0)];
                    perform_query_checks(ARITH_ORDER).then(res => {
                        done();
                    });
                });
            });

            describe('keys: [number]', function () {
                it('just works, ofcourse, what else?', function (done) {
                    ORDER_KEYS = [SRC_NAME(2)];
                    perform_query_checks(ARITH_ORDER).then(res => {
                        done();
                    });
                });
            });

            describe('dir: UP', function () {
                it('just works, ofcourse, what else?', function (done) {
                    ORDER_DIR = 'UP';
                    ORDER_KEYS = [SRC_NAME(2)];
                    perform_query_checks(ARITH_ORDER).then(res => {
                        done();
                    });
                });
            });

            describe('dir: DOWN', function () {
                it('just works, ofcourse, what else?', function (done) {
                    ORDER_DIR = 'DOWN';
                    ORDER_KEYS = [SRC_NAME(2)];
                    perform_query_checks(ARITH_ORDER).then(res => {
                        done();
                    });
                });
            });
        });
    });

    describe("useless coverage tests", function() {
        let q : any = {"ORDER": { "dooom": "DOWN", "keys": ["courseAverage"] } };
        return new Promise(r => {
            isValidOrder(q).catch((e) => {
                expect(e.message).to.exist;
                r();
            });
        }).then(() => {
            q = {"ORDER": { "dir": "DOWNISH", "keys": ["courseAverage"] } };
            return new Promise(r => {
                isValidOrder(q).catch((e) => {
                    expect(e.message).to.exist;
                    r();
                });
            });
        }).then(() => {
            q = {"ORDER": { "dir": "DOWN", "keys": {} } };
            return new Promise(r => {
                isValidOrder(q).catch((e) => {
                    expect(e.message).to.exist;
                    r();
                });
            });
        }).then(() => {
            try {
                renderTable(null, "MOMO");
            } catch(e) {
                expect(e.message).to.exist;
            }
        });
    });
});
