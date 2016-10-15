import InsightFacade from '../src/controller/InsightFacade'

import fs = require('fs');
import { ANSWER1 } from './testData/InsightFacadeData'

import { expect } from 'chai'

describe.only("InsightFacade spec", () => {
    let baseEncoded: string;
    let DATASET_ID = 'courses';
    let IF = new InsightFacade();

    function loadDataset(): Promise<any> {
        let binaryFile = fs.readFileSync('test/allCourses.zip');
        baseEncoded = new Buffer(binaryFile).toString('base64');
        return IF.addDataset(DATASET_ID, baseEncoded);
    }

    describe("Basic control flow D2", function() {
        // Load the dataset
        it("parses the whole dataset", function (done) {
            this.timeout(5000);
            loadDataset().then((resCode) => {
                done();
            });
        });

        it("query with group by and non empty where", (done) => {
            let query: any = {
                "GET": ["courses_dept", "courseAverage", "courseMax"],
                "WHERE": { "IS": { "courses_dept": "cpsc" } },
                "GROUP": ["courses_dept"],
                "APPLY": [{ "courseAverage": { "AVG": "courses_avg" } }, { "courseMax": { "MAX": "courses_avg" } }],
                "ORDER": { "dir": "DOWN", "keys": ["courseAverage"] },
                "AS": "TABLE"
            }

            IF.performQuery(query).then((res) => {
                expect(res.body).to.be.deep.equal({
                    "render": "TABLE",
                    "result": [
                        {
                            "courses_dept": "cpsc",
                            "courseAverage": 77.60108387096773,
                            "courseMax": 95
                        }
                    ]
                });
                expect(res.code).to.be.equal(200);
                done();
            });
        });

        it("query with group by, example query", (done) => {
            let query: any = {
                "GET": ["courses_id", "courseAverage"],
                "WHERE": { "IS": { "courses_dept": "cpsc" } },
                "GROUP": ["courses_id"],
                "APPLY": [{ "courseAverage": { "AVG": "courses_avg" } }],
                "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"] },
                "AS": "TABLE"
            }

            IF.performQuery(query).then((res) => {
                expect(res.body).to.be.deep.equal(ANSWER1);
                expect(res.code).to.be.equal(200);
                done();
            });
        });

        it("removes the dataset", function(done) {
            IF.removeDataset(DATASET_ID).then((res) => {
                expect(res.code).to.be.equal(204);
                done();
            })
        });
    });

    describe("fails if no dataset", function() {
        it("removes any dataset and response codes are valid", function(done){
            IF.removeDataset(DATASET_ID).then((res) => {
                expect(res.code).to.be.equal(204);
                done();
            }).catch((err) => {
                expect(err.code).to.be.equal(404);
                done();
            })
        });

        it("returns 424 if the dataset is not present", (done) => {
            let query: any = {
                "GET": ["courses_dept", "courseAverage", "courseMax"],
                "WHERE": { "IS": { "courses_dept": "cpsc" } },
                "GROUP": ["courses_dept"],
                "APPLY": [{ "courseAverage": { "AVG": "courses_avg" } }, { "courseMax": { "MAX": "courses_avg" } }],
                "ORDER": { "dir": "DOWN", "keys": ["courseAverage"] },
                "AS": "TABLE"
            }

            IF.performQuery(query).catch((res) => {
                expect(res.body.missing).to.be.deep.equal(['courses_dept']);
                expect(res.code).to.be.equal(424);
                done();
            });
        });
    });
});