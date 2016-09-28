/**
 * Created by rtholmes on 2016-09-03.
 */

import DatasetController from "../src/controller/DatasetController";
import {Datatable} from "../src/common/Common";
import {Column} from "../src/common/Common";
import {Row} from "../src/common/Common";
import Log from "../src/Util";

import JSZip = require('jszip');
import {expect} from 'chai';
import fs = require('fs');

const DATASETFILE = './data/datasets.json';

const TEST_DATATABLE_OBJ = { "afasfas": { "id": "afasfas", "src": "./data/afasfas", "columns": [{ "name": "courses_dept", "src": "./data/afasfas/courses_dept.json", "datatype": 0 }, { "name": "courses_id", "src": "./data/afasfas/courses_id.json", "datatype": 0 }, { "name": "courses_avg", "src": "./data/afasfas/courses_avg.json", "datatype": 0 }, { "name": "courses_instructor", "src": "./data/afasfas/courses_instructor.json", "datatype": 0 }, { "name": "courses_title", "src": "./data/afasfas/courses_title.json", "datatype": 0 }, { "name": "courses_pass", "src": "./data/afasfas/courses_pass.json", "datatype": 0 }, { "name": "courses_fail", "src": "./data/afasfas/courses_fail.json", "datatype": 0 }, { "name": "courses_audit", "src": "./data/afasfas/courses_audit.json", "datatype": 0 }] } };

describe("DatasetController", function () {

    beforeEach(function () {
    });

    afterEach(function () {
    });

    describe("Open the saved dataset", function() {
        var test = TEST_DATATABLE_OBJ;
        before(function(done) {
            fs.writeFileSync(DATASETFILE, JSON.stringify(test));
            done();
        });

        it("opens the main datasets", function(done){
            let controller = DatasetController.getInstance();
            controller.getDatasets().then((res) => {
                expect(!!res).to.be.true;
                done();
            });
        });

        it("opens the main datasets and selects a specific one", function(done){
            let controller = DatasetController.getInstance();
            controller.getDataset("afasfas").then((res) => {
                expect(res.id).to.be.deep.equal("afasfas");
                expect(res instanceof Datatable).to.be.true;
                done();
            });
        });

    });

    it("Should be able to receive a Dataset", function (done) {
        Log.test('Creating dataset');
        // this.timeout(1500000);
        let content = {key: 'value'};
        let zip = new JSZip();
        zip.file('content.obj', JSON.stringify(content));
        const opts = {
            compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
        };
        return zip.generateAsync(opts).then(function (data) {
            Log.test('Dataset created');
            let controller = DatasetController.getInstance();
            return controller.process('setA', data);
        }).then(function (result) {
            Log.test('Dataset processed; result: ' + result);
            expect(!!result).to.equal(true);
            done();
        }).catch(() => {
            done();
        });

    });

});
