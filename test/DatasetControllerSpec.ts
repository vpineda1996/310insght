/**
 * Created by rtholmes on 2016-09-03.
 */

import DatasetController from "../src/controller/DatasetController";
import {Datatable} from "../src/common/Common";
import {Datasets} from "../src/common/Common";
import {Column} from "../src/common/Common";
import {Row} from "../src/common/Common";
import Log from "../src/Util";

import JSZip = require('jszip');
import {expect} from 'chai';
import fs = require('fs');

const DATASETFILE = './data/datasets.json';

const TEST_DATATABLE_OBJ : any = { "afasfas": { id: 'afasfas',
  src: './data/afasfas',
  columns: 
   [ { name: 'courses_dept',
       src: './data/afasfas/courses_dept.json',
       datatype: 0,
       data: [] },
     { name: 'courses_id',
       src: './data/afasfas/courses_id.json',
       datatype: 0,
       data: [] },
     { name: 'courses_avg',
       src: './data/afasfas/courses_avg.json',
       datatype: 0,
       data: [] },
     { name: 'courses_instructor',
       src: './data/afasfas/courses_instructor.json',
       datatype: 0,
       data: [] },
     { name: 'courses_title',
       src: './data/afasfas/courses_title.json',
       datatype: 0,
       data: [] },
     { name: 'courses_pass',
       src: './data/afasfas/courses_pass.json',
       datatype: 0,
       data: [] },
     { name: 'courses_fail',
       src: './data/afasfas/courses_fail.json',
       datatype: 0,
       data: [] },
     { name: 'courses_audit',
       src: './data/afasfas/courses_audit.json',
       datatype: 0,
       data: [] } ] } };

const TEST_DATASET_EMPTY: any = { "EMPTY": { "id": "EMPTY", "src": "./data/EMPTY", "columns":[]}};

describe("DatasetController", function () {

    beforeEach(function () {
    });

    afterEach(function () {
    });

    it("Should be able to receive a Dataset", function (done) {
        Log.test('Creating dataset');
        // this.timeout(1500000);
        let content = {key: 'value'};
        let zip = new JSZip();
        zip.file('courses/content.obj', JSON.stringify(content));
        const opts = {
            compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
        };
        return zip.generateAsync(opts).then(function (data) {
            let controller = DatasetController.getInstance();
            return controller.process('setA', data);
        }).then(function (result) {
            Log.test('Dataset created');
            Log.test('Dataset processed; result: ' + result);
            expect(!!result).to.equal(true);
            done();
        }).catch((result) => {
            Log.test('Dataset processed; result: ' + result);
            done();
        });
    });

    describe("Open the saved dataset", function() {
        beforeEach(function(done) {
            DatasetController.getInstance().clearCache();
            fs.writeFile(DATASETFILE, JSON.stringify(TEST_DATATABLE_OBJ), done);
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
                console.log(JSON.parse(JSON.stringify(res)))
                console.log(JSON.parse(JSON.stringify(TEST_DATATABLE_OBJ.afasfas)))
                expect(JSON.parse(JSON.stringify(res))).to.be.deep.equal(TEST_DATATABLE_OBJ.afasfas);
                expect(res instanceof Datatable).to.be.true;
                done();
            });
        });
    });

    describe("creates and removes on a saved dataset", function() {
        let DS = DatasetController.getInstance();
        before(function(done) {
            DS.clearCache();
            fs.writeFile(DATASETFILE, JSON.stringify(TEST_DATASET_EMPTY), done);
        });

        it("creates columns", function(done) {
            createDataset().then(() => {
                DS.getDataset("EMPTY").then((dataset) => {
                    expect(dataset.columns.length).to.be.equal(2);
                    done();
                });
            });
            function createDataset() {
                return DS.getDataset("EMPTY").then(obj => {
                    return obj.createColumn('test').then(() => obj);
                }).then((obj) => {
                    return obj.createColumn('test2');
                });
            }
        });

        it("removes col", function() {
            DS.removeDataset("EMPTY").then(() => {
                return DS.getDataset("EMPTY");
            }).then((nonExistentDataset) => {
                expect(nonExistentDataset).to.not.exist;
            });
        });

        it("throws if the dataset is not there", function(done){
            DS.removeDataset("afasfas").catch((err) => {
                expect(err).to.exist;
                done();
            });
        });

        it("fails", function(done) {
            DS.process(null,null).catch((e) => {
                expect(!!e).to.be.true;
                done();
            });
            
        });

        it("crate folder and file if not present", function(done) {
            DS.clearCache();
            fs.unlinkSync('./data/datasets.json');
            DS.getDataset(null).then((e) => {
                expect(!!e).to.be.false;
                done();
            });
            
        });



    });

});
