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

describe("DatasetController", function () {

    beforeEach(function () {
    });

    afterEach(function () {
    });

    it("Should be able to receive a Dataset", function () {
        Log.test('Creating dataset');
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
            expect(result).to.equal(true);
        });

    });

    describe("Open the saved dataset", function() {
        var test = {
            columns: "abc"
        };
        beforeEach(function() {
            fs.writeFileSync(DATASETFILE, JSON.stringify(test));
        });

        it("opens the main datasets", function(done){
            let controller = DatasetController.getInstance();
            controller.getDatasets().then((res) => {
                expect(res).to.be.deep.equal(test);
                done();
            });
        });

        it("opens the main datasets and selects a specific one", function(done){
            let controller = DatasetController.getInstance();
            controller.getDataset("columns").then((res) => {
                expect(res).to.be.deep.equal(test.columns);
                done();
            });
        });

    });

});
