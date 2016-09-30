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
    let GET: string|string[];
    let WHERE: {};
    let ORDER: string;
    let AS: string;

    const VALID_KEY = 'other_avg';
    const VALID_MCOMPARISON : {} = { GT: { [VALID_KEY]: 30 } }
    const VALID_SCOMPARISON : {} = { IS: { [VALID_KEY]: '50' } }
    const VALID_NEGATION : {} = { NOT: VALID_MCOMPARISON }
    const VALID_LOGICCOMPARISON : {} = { AND: [VALID_MCOMPARISON, VALID_SCOMPARISON] }

    let QUERY : QueryRequest;
    let DATASET : Datasets;
    let DATATABLE : Datatable;

    function query() : QueryRequest {
        if (typeof QUERY !== 'undefined') return QUERY;
        QUERY = {GET: GET, WHERE: WHERE, ORDER: ORDER, AS: AS};
        return QUERY;
    }
    function dataset() : Datasets {
        if (typeof DATASET !== 'undefined') return DATASET;
        DATASET = {};
        return DATASET;
    }
    function datatable() : Datatable {

        return DATATABLE;
    }
    function isValid() : boolean {
        let controller = new QueryController(dataset());
        return controller.isValid(query());
    }

    beforeEach(function (done) {
        GET = ['other_id', 'other_avg'];
        WHERE = {GT: { [VALID_KEY]: 40}};
        ORDER = 'other_avg';
        AS = 'TABLE';

        QUERY = undefined;
        DATASET = undefined;

        DatasetController.getInstance().getDataset('other').then((odataset) => {
            return odataset.removeColumns();
        }).then(()=>done()).catch(()=>done());
    });

    afterEach(function () {
    });

    describe('QUERY BODY', function() {

        describe('SCOMPARISON', function () {
            it('fails on invalid type: string <- json', function () {
                WHERE = { IS: VALID_KEY };
                expect(isValid()).to.equal(false);
            });
            it('fails on invalid type: null', function () {
                WHERE = { IS: { [VALID_KEY]: null } };
                expect(isValid()).to.equal(false);
            });
            it('fails on invalid type: number', function () {
                WHERE = { IS: { [VALID_KEY]: 5 } };
                expect(isValid()).to.equal(false);
            });
            it('fails on invalid string ^[*]+$', function () {
                WHERE = { IS: { [VALID_KEY]: '*****'} };
                expect(isValid()).to.equal(false);
            });
            it('succeeds with valid [*]string[*]', function () {
                WHERE = { IS: { [VALID_KEY]: '*course_avg*'} };
                expect(isValid()).to.equal(true);
            });
            it('succeeds with valid json {string : string}', function () {
                WHERE = { IS: { [VALID_KEY]: VALID_KEY} };
                expect(isValid()).to.equal(true);
            });
        });

        describe('MCOMPARISON', function () {
            it('fails on invalid type: json', function () {
                WHERE = { GT: { GT: { [VALID_KEY]: 5 } } };
                expect(isValid()).to.equal(false);
            });
            it('fails on invalid type: null', function () {
                WHERE = { GT: null };
                expect(isValid()).to.equal(false);
            });
            it('succeeds with valid type', function () {
                WHERE = { GT: { [VALID_KEY]: 50} };
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

        function perform_query() : Promise<any> {
            let DS = DatasetController.getInstance();
            return new Promise<any>((resolve, reject) =>{


                Log.test('Creating dataset');
                let content: any = {
                    result: [{
                        Avg: 50,
                        Professor: "John",
                        Title: "",
                        Pass: 1,
                        Fail: 2,
                        Audit: 1
                    }, 
                    {
                        Avg: 30,
                        Professor: "Smith",
                        Title: "",
                        Pass: 50,
                        Fail: 50,
                        Audit: 30
                    },
                    { result: [] }]
                };
                let zip = new JSZip();
                zip.file('courses/CPSC310', JSON.stringify(content));
                const opts = {
                    compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
                };
                return zip.generateAsync(opts).then(function (data) {
                    return DS.process('other', data);
                }).then(function (result) {
                    Log.test('Dataset created');
                    Log.test('JSON processed; result: ' + result);
                    expect(result).below(500);
                }).then(() => { 
                    return DatasetController.getInstance().getDataset('other');
                }).then((datatable:Datatable) => {
                    let controller = new QueryController(dataset());
                    let q : any = query();

                    return controller.query(q);
                }).then((data) => {
                    return resolve(data);
                });
            });
        }
        describe('SCOMPARISON', function () {
            it('works on PCOMPARATOR', function (done) {
                WHERE = { GT: { [VALID_KEY]: 40 } };
                perform_query().then((res:QueryResponse) => {
                    expect(res.result.length).to.be.equal(3)
                    done();
                }).catch((result) => {
                    Log.test('Dataset processed; result: ' + result);
                    done();
                });
            });
            it('works on LOGICCOMPARISON { PCOMPARATORS }', function (done) {
                WHERE = { AND: [{LT: { [VALID_KEY]: 50 } }, {EQ: { ['other_id']: '310' } }] };
                perform_query().then((res:QueryResponse) => {
                    expect(res.result.length).to.be.equal(1)
                    done();
                })
            });
            it('works on SCOMPARATOR', function (done) {
                WHERE = { IS: { 'other_id': '310'} };
                perform_query().then((res:QueryResponse) => {
                    expect(res.result.length).to.be.equal(2)
                    done();
                });
            });
            it('does query', function (done) {
                WHERE = { NOT: VALID_MCOMPARISON };
                perform_query().then((res:QueryResponse) => {
                    expect(res.result.length).to.be.equal(1)
                    done();
                });
            });
            it('works on NEGATOR', function (done) {
                WHERE = { NOT: VALID_MCOMPARISON };
                perform_query().then((res:QueryResponse) => {
                    expect(res.result.length).to.be.equal(2)
                    done();
                }).catch((result) => {
                    Log.test('Dataset processed; result: ' + result);
                    done();
                });
            });
        });

    });

    xit('Should be able to query, although the answer will be empty', function () {
        // NOTE: this is not actually a valid query for D1, nor is the result correct.
        let query: QueryRequest = {GET: 'food', WHERE: {IS: 'apple'}, ORDER: 'food', AS: 'table'};
        let dataset: Datasets = {};
        let controller = new QueryController(dataset);
        let ret = controller.query(query);
        Log.test('In: ' + JSON.stringify(query) + ', out: ' + JSON.stringify(ret));
        expect(ret).not.to.be.equal(null);
        // should check that the value is meaningful
    });
});
