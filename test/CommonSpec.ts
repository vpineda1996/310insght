/**
 * Created by Victor Pineda
 */
import {Datatable} from "../src/common/Common";
import {Column} from "../src/common/Common";
import {Row} from "../src/common/Common";
import Log from "../src/Util";

import {expect} from 'chai';
import fs = require('fs');

const DATASETFILE = './data/datasets.json';

describe("CommonSpec", function () {

    beforeEach(function () {
    });

    afterEach(function () {
    });

    describe("Datatable", function() {
        var datatable: Datatable;

        before(function() {
            if (!fs.existsSync('./data/')) {
                fs.mkdirSync('./data/');
            }
            if (!fs.existsSync('./data/wat.json')) {
                fs.writeFileSync('./data/wat.json', '{}');
            }
            if (!fs.existsSync('./data/wat/')) {
                fs.mkdirSync('./data/wat/');
            }
            if (!fs.existsSync('./data/wat/hello.json')) {
                fs.writeFileSync('./data/wat/hello.json', '[]');
            }
        });

        after(function() {
            fs.unlinkSync('./data/wat.json');
            fs.unlinkSync('./data/wat/hello.json');
        });
        beforeEach(function () {
            datatable = new Datatable('wat', './data/wat.json', [
                new Column("hello", "./data/wat/hello.json")
            ]);
        });

        it("creates a datable", function() {
            expect(datatable).to.exist;
        });

        it("inserts rows", function(done){
            datatable.insertRow({
                hello: 1
            }).then(() => {
                return datatable.getColumn(0).getData();
            }).then((data) => {
                expect(data[0]).to.be.equal(1);
                done();
            });
        });

        it("updates rows", function(done){
            datatable.editRow(0, {
                hello: 2
            }).then(() => done());
        });

        it("deletes rows", function(done){
            datatable.removeRow(0).then(() => done());
        });

        it("gets column", function(){
            let col = datatable.getColumn(0);
            expect(col).to.exist;
        });
    });

});
