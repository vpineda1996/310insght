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
    
    before(function(){
        try{
            fs.unlinkSync('./data/myData/dept.json');
            fs.unlinkSync('./data/myData/id.json');
            fs.unlinkSync('./data/myData/avg.json');
            fs.unlinkSync('./data/myData/instructor.json');
            fs.unlinkSync('./data/myData/title.json');
            fs.unlinkSync('./data/myData/pass.json');
            fs.unlinkSync('./data/myData/fail.json');
            fs.unlinkSync('./data/myData/audit.json');
        } catch (e) {Log.trace("Cannot delete files")}
    });

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
            },{ }]
        };
        let zip = new JSZip();
        zip.file('courses/CPSC310', JSON.stringify(content));
        const opts = {
            compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
        };
        return zip.generateAsync(opts).then(function (data) {
            Log.test('Dataset created');
            return DS.process('myData', data);
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
        DS.getDataset('myData').then((datatable) => {
            expect(datatable.columns.length).to.equal(8);
            return datatable.columns[0].getData();
        }).then((col0data) => {
            expect(col0data[0]).to.be.equal('cpsc');
            expect(col0data.length).to.be.equal(1);
            done();
        });
    });
});
