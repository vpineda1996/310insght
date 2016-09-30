import DatasetController from "../src/controller/DatasetController";
import {Datatable} from "../src/common/Common";
import {Datasets} from "../src/common/Common";
import {Column} from "../src/common/Common";
import {Row} from "../src/common/Common";
import Log from "../src/Util";

import JSZip = require('jszip');
import {expect} from 'chai';
import fs = require('fs');



describe("JSON Parser", function() {
    let DS = DatasetController.getInstance();
    it("Should be able to receive a Dataset", function (done) {
        Log.test('Creating dataset');
        let content: any = {
            result: [{
                Avg: 10,
                Professor: "John",
                Title: "",
                Pass: 1,
                Fail: 2,
                Audit: 1
            }, { result: [] }]
        };
        let zip = new JSZip();
        zip.file('courses/CPSC310', JSON.stringify(content));
        const opts = {
            compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
        };
        return zip.generateAsync(opts).then(function (data) {
            Log.test('Dataset created');
            return DS.process('courses', data);
        }).then(function (result) {
            Log.test('JSON processed; result: ' + result);
            expect(result).below(500);
            done();
        }).catch((result) => {
            Log.test('JSON processed; ERROR: result: ' + result);
            done();
        });
    });

    it("saved the dataset", function(done) {
        DS.getDataset('courses').then((datatable) => {
            expect(datatable.columns.length).to.equal(8);
            return datatable.columns[0].getData();
        }).then((col0data) => {
            expect(col0data[0]).to.be.equal('cpsc');
            done();
        });
    });
});
