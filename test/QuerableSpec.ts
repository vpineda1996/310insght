import DatasetController from '../src/controller/DatasetController';
import { QueryRequest } from '../src/util/Query';
import { areValidIds } from '../src/queryHelpers/querable';

import { expect } from 'chai';
import JSZip = require('jszip');

describe('Querable', function () {
    let GET: string[];
    let WHERE: {};
    let AS: string;
    let APPLY: any[];
    let GROUP: any[];
    let queryIds: string[];
    const ZIP_OPTS= {
        compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
    };
    const JSONS : {[s:string]:any}[] = [{
        result: []
    }, {
        result: [ {
            Dept: 'cpsc',
            Id: '110',
            Avg: 70.3,
            Instructor: 'John',
            Title: '',
            Pass: 5,
            Fail: 4,
            Audit: 3
        }, {
            Dept: 'cpsc',
            Id: '110',
            Avg: 30.2,
            Instructor: 'Nick',
            Title: 'introduction',
            Pass: 90,
            Fail: 60,
            Audit: 20
        }]
    }]

    function query(): QueryRequest {
        let query: QueryRequest = {
            GET: GET,
            WHERE: WHERE,
            AS: AS
        }
        if (APPLY)
          query.APPLY = APPLY;
        if (GROUP)
          query.GROUP = GROUP;

      return query;
    }

    beforeEach(function() {
        GET = [''];
        WHERE = {};
        AS = 'TABLE';
        APPLY = undefined;
        GROUP = undefined;
    });

    describe('::areValidIds', function () {
        function perform(): Promise<boolean> {
            return new Promise<boolean>((resolve, reject) => {
                return DatasetController.getInstance().getDataset('other').then((datatable:any) => {
                    return areValidIds(query(), queryIds);
                }).then((res) => resolve()).catch(err => reject());
            });
        }

        it('returns true without data', function (done) {
            queryIds = [];
            perform().then(done);
        });

        it('returns true with ids in APPLY', function (done) {
            queryIds = ['coursesId'];
            APPLY = [ {'coursesId': {'MAX': 'courses_avg'} } ]

            perform().then(done);
        });

        describe('with data', function () {

            function prepopulate() : Promise<boolean> {
                let zip = new JSZip();

                for (let i in JSONS) {
                    if (JSONS[i]['result'][0]) {
                        zip.file(JSONS[i]['result'][0]['Dept'] +JSONS[i]['result'][0]['Id'], JSON.stringify(JSONS[i]));
                    }
                }
                return zip.generateAsync(ZIP_OPTS).then((data) => {
                    return DatasetController.getInstance().process('other', data);
                }).then((result) => {
                    return result < 400;
                }).catch((err:Error) => {
                    return false;
                });
            }

            beforeEach(function (done) {
                prepopulate().then(() => done());
            });

            it('returns true with known id', function (done) {
                queryIds = ['other_dept'];
                perform().then(done);
            });
            it('returns true with known ids', function (done) {
                queryIds = ['other_title', 'other_instructor'];
                perform().then(done);
            });
            it('returns true with known id and id in APPLY', function (done) {
                queryIds = ['other_title', 'maxAvg'];
                GROUP = ['other_title'];
                APPLY = [ {'maxAvg': {'MAX': 'other_avg'} } ]
                perform().then(done);
            });

            it('returns false with unknown dataset', function (done) {
                queryIds = ['standard_aa'];
                perform().catch(done);
            });
            it('returns false with known and unknown ids', function (done) {
                queryIds = ['other_title', 'other_assad'];
                perform().catch(done);
            });
            it('returns false with unknown id', function (done) {
                queryIds = ['other_assad'];
                perform().catch(done);
            });
            it('returns false with known id and id not in APPLY', function (done) {
                queryIds = ['other_title', 'minAvg'];
                APPLY = [ {'maxAvg': {'MAX': 'other_avg'} } ]
                perform().catch(done);
            });

        });
    });
});
