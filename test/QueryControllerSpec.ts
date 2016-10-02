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
    const VALID_MCOMPARISON_EQ : {} = { EQ: { [SRC_NAME(5)]: 5 } }
    const VALID_SCOMPARISON : {} = { IS: { [SRC_NAME(4)]: 'intro' } }
    const VALID_NEGATION : {} = { NOT: VALID_MCOMPARISON }
    const VALID_LOGICCOMPARISON : {} = { AND: [VALID_MCOMPARISON, VALID_SCOMPARISON] }

    function ARITH_OPERATION(fn:any)                 { return flatten(JSONS.map(json => basicFilter(json) ? json.result.filter(fn) : [] )) }
    function ARITH_VALID_MCOMPARISON(jsons:{}[])     { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[2])] > 30 ) }
    function ARITH_VALID_MCOMPARISON_EQ(jsons:{}[])  { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[5])] === 5 ) }
    function ARITH_VALID_SCOMPARISON(jsons:{}[])     { return ARITH_OPERATION((res:{[s:string]:any}) => /intro/.test(res[capitalize(COLUMN_NAMES[4])]) ) }
    function ARITH_VALID_NEGATION(jsons:{}[])        { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[2])] <= 30 ) }
    function ARITH_VALID_LOGICCOMPARISON(jsons:{}[]) { return ARITH_OPERATION((res:{[s:string]:any}) => res[capitalize(COLUMN_NAMES[2])] > 30 && /intro/.test(res[capitalize(COLUMN_NAMES[4])]) ) }

    function capitalize(str:string) { return str.charAt(0).toUpperCase() + str.slice(1) }
    function basicFilter(json:{[s:string]:any}) { return json['result'] && json['result'][0] }
    function flatten(arr:any[]) { return [].concat.apply([], arr) }

    function ARITH_EQUAL(arr1:{}[], arr2:{}[]) { return ARITH_ARRAY_EQUAL(arr1.map((json:{[s:string]:any}) => json['id']),arr2.map((json:{[s:string]:any})=>json['id'])).map(id=>arr1.find((json:{[s:string]:any})=> json['id'] === id)) }

    function ARITH_ARRAY_EQUAL(arr1:{}[], arr2:{}[]) { return arr1.filter(arr => arr2.includes(arr)) }

    let QUERY : QueryRequest;
    let JSON_DATA : {[s:string]:any}[];

    const JSONS = [{
        result: []
    }, {
        result: [{
            [capitalize(COLUMN_NAMES[0])]: 'cpsc',
            [capitalize(COLUMN_NAMES[1])]: '310',
            [capitalize(COLUMN_NAMES[2])]: 70,
            [capitalize(COLUMN_NAMES[3])]: 'John',
            [capitalize(COLUMN_NAMES[4])]: '',
            [capitalize(COLUMN_NAMES[5])]: 5,
            [capitalize(COLUMN_NAMES[6])]: 3,
            [capitalize(COLUMN_NAMES[7])]: 4
        }]
    }, {
        result: [{
            [capitalize(COLUMN_NAMES[0])]: 'cpsc',
            [capitalize(COLUMN_NAMES[1])]: '320',
            [capitalize(COLUMN_NAMES[2])]: 30,
            [capitalize(COLUMN_NAMES[3])]: 'Smith',
            [capitalize(COLUMN_NAMES[4])]: 'intro',
            [capitalize(COLUMN_NAMES[5])]: 50,
            [capitalize(COLUMN_NAMES[6])]: 100,
            [capitalize(COLUMN_NAMES[7])]: 30
        }]
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
        JSON_DATA = [JSONS[1], JSONS[2]];

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

            for (let i in JSON_DATA) {
                if (JSON_DATA[i]['result'][0]) {
                    zip.file(JSON_DATA[i]['result'][0]['Dept'] + JSON_DATA[i]['result'][0]['Id'], JSON.stringify(JSON_DATA[i]));
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

        it('works on MCOMPARATOR', function (done) {
            WHERE = VALID_MCOMPARISON;
            perform_query().then((res:QueryResponse) => {
                let result = res.result.length === ARITH_VALID_MCOMPARISON(JSON_DATA).length;
                expect(result).to.be.equal(true);
                if (result) done();
            })
        });
        it('works on LOGICCOMPARISON { PCOMPARATORS }', function (done) {
            WHERE = { AND: [ VALID_MCOMPARISON, VALID_MCOMPARISON_EQ] };
            perform_query().then((res:QueryResponse) => {
                let result = res.result.length === ARITH_EQUAL(ARITH_VALID_MCOMPARISON(JSON_DATA), ARITH_VALID_MCOMPARISON_EQ(JSON_DATA)).length;
                expect(result).to.be.equal(true);
                if (result) done();
            })
        });
        it('works on SCOMPARATOR', function (done) {
            WHERE = VALID_SCOMPARISON;
            perform_query().then((res:QueryResponse) => {
                let result = res.result.length === ARITH_VALID_SCOMPARISON(JSON_DATA).length;
                expect(result).to.be.equal(true);
                if (result) done();
            })
        });
        it('does query', function (done) {
            WHERE = { NOT: VALID_MCOMPARISON };
            perform_query().then((res:QueryResponse) => {
                expect(res.result.length).to.be.equal(ARITH_VALID_SCOMPARISON(JSON_DATA).length)
                done();
            })
        });
        it('works on NEGATOR', function (done) {
            WHERE = { NOT: VALID_MCOMPARISON };
            perform_query().then((res:QueryResponse) => {
                let result = res.result.length === ARITH_VALID_NEGATION(JSON_DATA).length;
                expect(result).to.be.equal(true);
                if (result) done();
            })
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
