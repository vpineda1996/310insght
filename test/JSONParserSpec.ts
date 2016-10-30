import DatasetController from "../src/controller/DatasetController";
import {Datatable} from "../src/common/Common";
import {Datasets} from "../src/common/Common";
import {Column} from "../src/common/Common";
import {Row} from "../src/common/Common";
import Log from "../src/Util";
import JSONParser from "../src/parsers/JSONParser"

import JSZip = require('jszip');
import {expect} from 'chai';
import fs = require('fs');



describe("JSON Parser", function() {
    let DS = DatasetController.getInstance();

    before(function(){
        try{
            fs.unlinkSync('./data/myData/myData_dept.json');
            fs.unlinkSync('./data/myData/myData_id.json');
            fs.unlinkSync('./data/myData/myData_avg.json');
            fs.unlinkSync('./data/myData/myData_instructor.json');
            fs.unlinkSync('./data/myData/myData_title.json');
            fs.unlinkSync('./data/myData/myData_pass.json');
            fs.unlinkSync('./data/myData/myData_fail.json');
            fs.unlinkSync('./data/myData/myData_audit.json');
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
        });
    });

    it("Should be able to receive a Dataset with course and subject", function (done) {
        Log.test('Creating dataset');
        let content: any = {
            result: [{
                Avg: 10,
                Professor: "John",
                Title: "",
                Pass: 1,
                Fail: 2,
                Audit: 1,
                Course: '310',
                Subject: 'cpsc',
                Year: 2056
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
        });
    });

    it("saved the dataset", function() {
        return DS.getDataset('myData').then((datatable) => {
            expect(datatable.columns.length).to.equal(10);
            return datatable.columns[0].getData();
        }).then((col0data) => {
            expect(col0data[0]).to.be.equal('cpsc');
            expect(col0data.length).to.be.equal(1);
        });
    });

    // FALIURE TESTS

    it("promise should return catch if invalid zipfile", () =>{
        let invalidObj :any = {};
        let fn = () => {
            JSONParser.parse(invalidObj, invalidObj).catch(() => {
            });
        }
        expect(fn).to.throw;

    });

    it("promise should return catch if invalid course", function (done) {
         let invalidObj :any = {};
         let mockData : any= {
            async: () => {
                return new Promise((r,j) => r(null))
            }
         };
        JSONParser.parseCourse(mockData, invalidObj, invalidObj).catch(() => {
            done();
        });
    });
});
