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
        beforeEach(function () {
            datatable = new Datatable('./data/wat.json', [
                new Column("hello", "./data/wat/hello.json")
            ]);
        });

        it("creates a datable", function() {
            expect(datatable).to.exist;
        });

        it("inserts rows", function(done){
            datatable.insertRow({
                hello: 1
            }).then(() => done());
        });

        it("updates rows", function(done){
            datatable.editRow(0, {
                hello: 2
            }).then(() => done());
        });

        // it("gets rows", function(done){
        //     datatable.getRow(0).then(() => done());
        // });

        it("deletes rows", function(done){
            datatable.removeRow(0).then(() => done());
        });

        it("gets column", function(){
            let col = datatable.getColumn(0);
            expect(col).to.exist;
        });
    });

});
