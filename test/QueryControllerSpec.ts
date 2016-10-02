/**
 * Created by rtholmes on 2016-10-31.
 */

import { Datasets, Datatable } from "../src/common/Common";
import DatasetController from "../src/controller/DatasetController";
import QueryController, { QueryRequest, QueryResponse } from "../src/controller/QueryController";
import Log from "../src/Util";
import JSZip = require('jszip');

import {expect} from 'chai';
describe("QueryController", function () {
    let GET: string[];
    let WHERE: {};
    let ORDER: string;
    let AS: string;

    const ID = 'other'
    const COLUMN_NAMES = ['dept', 'id', 'avg', 'instructor', 'title', 'pass', 'fail', 'audit']

    function SRC_NAME(n:number) { return ID + '_' + COLUMN_NAMES[n] }

    const VALID_MCOMPARISON : {} = { GT: { [SRC_NAME(2)]: 30 } }
    const VALID_MCOMPARISON_LT : {} = { LT: { [SRC_NAME(2)]: 80 } }
    const VALID_MCOMPARISON_EQ : {} = { EQ: { [SRC_NAME(5)]: 5 } }
    const VALID_SCOMPARISON : {} = { IS: { [SRC_NAME(4)]: 'intro*' } }
    const VALID_NEGATION : {} = { NOT: VALID_MCOMPARISON }
    const VALID_LOGICCOMPARISON : {} = { AND: [VALID_MCOMPARISON, VALID_SCOMPARISON] }
    const VALID_LOGICCOMPARISON_OR : {} = { OR: [VALID_SCOMPARISON, VALID_MCOMPARISON_EQ] }

    function ARITH_OPERATION(fn:any)                    { return flatten(JSONS.map((json: any) => basicFilter(json) ? json.result.filter(fn) : [] )) }
    function ARITH_VALID_MCOMPARISON(jsons:{}[])        { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[2])] > 30 ) }
    function ARITH_VALID_MCOMPARISON_LT(jsons:{}[])     { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[2])] < 80 ) }
    function ARITH_VALID_MCOMPARISON_EQ(jsons:{}[])     { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[5])] === 5 ) }
    function ARITH_VALID_SCOMPARISON(jsons:{}[])        { return ARITH_OPERATION((res:{[s:string]:any}) => /^intro.*$/.test(res[capitalize(COLUMN_NAMES[4])]) ) }
    function ARITH_VALID_NEGATION(jsons:{}[])           { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[2])] <= 30 ) }
    function ARITH_VALID_LOGICCOMPARISON(jsons:{}[])    { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[2])] > 30 && /^intro.*$/.test(res[capitalize(COLUMN_NAMES[4])]) ) }
    function ARITH_VALID_LOGICCOMPARISON_OR(jsons:{}[]) { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[5])] === 5 || /^intro.*$/.test(res[capitalize(COLUMN_NAMES[4])]) ) }

    function capitalize(str:string) { return str.charAt(0).toUpperCase() + str.slice(1) }
    function basicFilter(json:{[s:string]:any}) { return json['result'] && json['result'][0] }
    function flatten(arr:any[]) { return [].concat.apply([], arr) }

    function ARITH_EQUAL(arr1:{}[], arr2:{}[]) { return ARITH_ARRAY_EQUAL(arr1.map((json:{[s:string]:any}) => json['id']),arr2.map((json:{[s:string]:any})=>json['id'])).map(id=>arr1.find((json:{[s:string]:any})=> json['id'] === id)) }

    function ARITH_ARRAY_EQUAL(arr1:{}[], arr2:{}[]) { return arr1.filter(arr => arr2.includes(arr)) }

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

    const JSONS : {[s:string]:any[]}[] = [{
        result: []
    }, {
        result: [
            createDataset(['cpsc', '110', 70, 'John', '', 5, 3, 4]),
            createDataset(['cpsc', '110', 30, 'Nick', 'introduction to awesome RACKET', 90, 60, 20])
        ]
    }, {
        result: [
            createDataset(['cpsc', '320', 30, 'Smith', 'intro', 50, 100, 30]),
        ]
    }, {
        result: [
            createDataset(['zool', '300', 50, 'Michael', 'hi', 30, 4, 10]),
            createDataset(['zool', '300', 60, 'Gregor', 'what is this', 70, 30, 60])
        ]
    }]
    const ZIP_OPTS= {
        compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
    };

    function query() : QueryRequest {
        if (typeof QUERY !== 'undefined') return QUERY;
        QUERY = {GET: GET, WHERE: WHERE, ORDER: ORDER, AS: AS};
        return QUERY;
    }
    function isValid() : boolean {
        let controller = new QueryController();
        return controller.isValid(query());
    }

    beforeEach(function (done) {
        GET = [SRC_NAME(0), SRC_NAME(1), SRC_NAME(2), SRC_NAME(5)];
        WHERE = VALID_MCOMPARISON;
        ORDER = SRC_NAME(0);
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
            return new Promise<QueryResponse>((resolve, reject) => {
                prepopulate().then((result : boolean) => {
                    if (!result) { return reject('data upload failed'); }

                    let controller = new QueryController();
                    controller.query(query()).then((response : any) => {
                        return resolve(response);
                    });
                }).catch((err:Error) => {
                    console.error(err);
                    return reject(err);
                });
            });
        }
        it('returns 424 for unknown id', function(done) {
            GET = ['courses_id']
            perform_query().then(res => {
                expect(res.missing).to.be.deep.equal(GET);
                done();
            });
        });

        it('works on LT', function (done) {
            WHERE = VALID_MCOMPARISON_LT;
            perform_query().then((res:QueryResponse) => {
                expect(res.result).to.be.deep.equal(QUERY_RESPONSE(ARITH_VALID_MCOMPARISON_LT(JSONS)));
                done();
            }).catch(console.error)
        });
        it('works on EQ', function (done) {
            WHERE = VALID_MCOMPARISON_EQ;
            perform_query().then((res:QueryResponse) => {
                expect(res.result).to.be.deep.equal(QUERY_RESPONSE(ARITH_VALID_MCOMPARISON_EQ(JSONS)));
                done();
            }).catch(console.error)
        });
        it('works on GT', function (done) {
            WHERE = VALID_MCOMPARISON;
            perform_query().then((res:QueryResponse) => {
                expect(res.result).to.be.deep.equal(QUERY_RESPONSE(ARITH_VALID_MCOMPARISON(JSONS)));
                done();
            }).catch(console.error)
        });
        it('works on AND { PCOMPARATORS }', function (done) {
            WHERE = VALID_LOGICCOMPARISON;
            perform_query().then((res:QueryResponse) => {
                expect(res.result).to.be.deep.equal(QUERY_RESPONSE(ARITH_VALID_LOGICCOMPARISON(JSONS)));
                done();
            }).catch(console.error)
        });
        it('works on OR { PCOMPARATORS }', function (done) {
            WHERE = VALID_LOGICCOMPARISON_OR;
            perform_query().then((res:QueryResponse) => {
                expect(res.result).to.be.deep.equal(QUERY_RESPONSE(ARITH_VALID_LOGICCOMPARISON_OR(JSONS)));
                done();
            }).catch(console.error)
        });
        it('works on SCOMPARATOR', function (done) {
            WHERE = VALID_SCOMPARISON;
            perform_query().then((res:QueryResponse) => {
                expect(res.result).to.be.deep.equal(QUERY_RESPONSE(ARITH_VALID_SCOMPARISON(JSONS)));
                done();
            }).catch(console.error)
        });
        it('works on NEGATOR', function (done) {
            WHERE = { NOT: VALID_MCOMPARISON };
            perform_query().then((res:QueryResponse) => {
                expect(res.result).to.be.deep.equal(QUERY_RESPONSE(ARITH_VALID_NEGATION(JSONS)));
                done();
            }).catch(console.error)
        });

    });

    xit('Should be able to query, although the answer will be empty', function () {
        // NOTE: this is not actually a valid query for D1, nor is the result correct.
        let query: QueryRequest = {GET: ['food'], WHERE: {IS: 'apple'}, ORDER: 'food', AS: 'table'};
        let controller = new QueryController();
        let ret = controller.query(query);
        Log.test('In: ' + JSON.stringify(query) + ', out: ' + JSON.stringify(ret));
        expect(ret).not.to.be.equal(null);
        // should check that the value is meaningful
    });
});
