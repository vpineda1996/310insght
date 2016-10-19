import InsightFacade from '../src/controller/InsightFacade'

import fs = require('fs');
import { ANSWER1, ANSWER2, ANS4, ANS5, ANS6, ANS7 } from './testData/InsightFacadeData'

import { expect } from 'chai'

describe.only("InsightFacade spec", function() {
    let baseEncoded: string;
    let DATASET_ID = 'courses';
    let IF = new InsightFacade();

    function loadDataset(): Promise<any> {
        let binaryFile = fs.readFileSync('test/allCourses.zip');
        baseEncoded = new Buffer(binaryFile).toString('base64');
        return IF.addDataset(DATASET_ID, baseEncoded);
    }

    describe("Basic control flow D2", function () {
        // Load the dataset
        it("parses the whole dataset", function () {
            this.timeout(5000);
            return loadDataset();
        });

        it("query with group by and non empty where", function(){
            let query: any = {
                "GET": ["courses_dept", "courseAverage", "courseMax", "courseCount"],
                "WHERE": { "IS": { "courses_dept": "cpsc" } },
                "GROUP": ["courses_dept"],
                "APPLY": [
                    { "courseAverage": { "AVG": "courses_avg" } },
                    { "courseMax": { "MAX": "courses_avg" } }, 
                    { "courseCount": { "COUNT": "courses_id" } }
                ],
                "ORDER": { "dir": "DOWN", "keys": ["courseAverage"] },
                "AS": "TABLE"
            }

            return IF.performQuery(query).then((res) => {
                expect(res.body).to.be.deep.equal({
                    "render": "TABLE",
                    "result": [
                        {
                        "courses_dept": "cpsc",
                        "courseAverage": "77.60",
                        "courseMax": 95,
                        "courseCount": 53
                        }
                    ]
                });
                expect(res.code).to.be.equal(200);
            });
        });

        it("query with group by, example query", function() {
            let query: any = {
                "GET": ["courses_id", "courseAverage"],
                "WHERE": { "IS": { "courses_dept": "cpsc" } },
                "GROUP": ["courses_id"],
                "APPLY": [{ "courseAverage": { "AVG": "courses_avg" } }],
                "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"] },
                "AS": "TABLE"
            }

            return IF.performQuery(query).then((res) => {
                console.log(JSON.stringify(res.body));
                expect(res.body).to.be.deep.equal(ANSWER1);
                expect(res.code).to.be.equal(200);
            });
        });

        it("supports empty where", function() {
            let query: any = {
                "GET": [ "courses_dept", "courseAverage"],
                "WHERE": { },
                "GROUP": [ "courses_dept" ],
                "APPLY": [{ "courseAverage": { "AVG": "courses_avg" } }],
                "ORDER": { "dir": "DOWN", "keys": ["courseAverage", "courses_dept"] },
                "AS": "TABLE"
            }

            return IF.performQuery(query).then((res) => {
                console.log(JSON.stringify(res.body));
                expect(res.body).to.be.deep.equal(ANSWER2);
                expect(res.code).to.be.equal(200);
            });
        });

        it("supports fancy conditions 1", function() {
            let query: any = {
                "GET": ["courses_fail", "numSections", "average"],
                "WHERE": {"AND": [
                        {"LT" : {"courses_id" : 499}},
                        {"GT" : {"courses_id" : 200}},
                        {"OR" : [
                            {"IS" : {"courses_dept" : "math"}},
                            {"IS" : {"courses_dept" : "cpsc"}}
                        ]}
                    ]},
                "GROUP": [ "courses_fail" ],
                "APPLY": [ {"numSections": {"COUNT": "courses_uuid"}}, {"average": {"AVG": "courses_avg"}} ],
                "ORDER": { "dir": "DOWN", "keys": [ "numSections" ,"average"]},
                "AS":"TABLE"
            }

            return IF.performQuery(query).then((res) => {
                console.log(JSON.stringify(res.body));
                expect(res.body).to.be.deep.equal(ANS4);
                expect(res.code).to.be.equal(200);
            });
        });

        it("supports fancy conditions 2", function() {
            let query: any = {  
            "GET":[ "courses_id","coursesAvg"],
            "WHERE":{"AND":[  
                        {"IS":{  "courses_dept":"cpsc"}},
                        {"GT":{"courses_avg":80}}
                    ]
            },
            "GROUP":[ "courses_id" ],
            "APPLY":[ 
                { "coursesAvg":{ "AVG":"courses_id" }}
            ],
            "ORDER":{ "dir":"UP",
                "keys":[ "courses_id" ]
            },
            "AS":"TABLE"
            }

            return IF.performQuery(query).then((res) => {
                expect(res.code).to.be.equal(200);
            });
        });

        describe("group by failures", () => {
            it("fails if empty group", function(){
                let query: any = {
                    "GET": ["courses_dept", "courseAverage", "courseMax", "courseCount"],
                    "WHERE": { "IS": { "courses_dept": "cpsc" } },
                    "GROUP": [],
                    "APPLY": [
                        { "courseAverage": { "AVG": "courses_avg" } },
                        { "courseMax": { "MAX": "courses_avg" } }, 
                        { "courseCount": { "COUNT": "courses_id" } }
                    ],
                    "ORDER": { "dir": "DOWN", "keys": ["courseAverage"] },
                    "AS": "TABLE"
                }

                return IF.performQuery(query).catch((res) => {
                    expect(res.code).to.be.equal(400);
                });
            });

            it("fails if elements in get not specified", function(){
                let query: any = {
                    "GET": ["courses_dept", "courseAverage", "courseMax", "courseCount"],
                    "WHERE": { "IS": { "courses_dept": "cpsc" } },
                    "GROUP": ["courses_dept"],
                    "APPLY": [],
                    "ORDER": { "dir": "DOWN", "keys": ["courseAverage"] },
                    "AS": "TABLE"
                }

                return IF.performQuery(query).catch((res) => {
                    expect(res.code).to.be.equal(424);
                });
            });

        });

        describe("tests that were given to us", function() {

            it("test 1", function() {
                let query: any = {
                    "GET": ["courses_id", "courseAverage"],
                    "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
                    "GROUP": [ "courses_id" ],
                    "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
                    "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
                    "AS":"TABLE"
                };
                return IF.performQuery(query).then((res) => {
                    expect(res.body).to.be.deep.equal(ANS5);
                    expect(res.code).to.be.equal(200);
                });
            });

            it("test 2", function() {
                let query: any = {
                    "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
                    "WHERE": {},
                    "GROUP": [ "courses_dept", "courses_id" ],
                    "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"maxFail": {"MAX": "courses_fail"}} ],
                    "ORDER": { "dir": "UP", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
                    "AS":"TABLE"
                };
                return IF.performQuery(query).then((res) => {
                    expect(res.body).to.be.deep.equal(ANS6);
                    expect(res.code).to.be.equal(200);
                });
            });

            it("test 3", function() {
                let query: any = {
                    "GET": ["courses_dept", "courses_id", "numSections"],
                    "WHERE": {},
                    "GROUP": [ "courses_dept", "courses_id" ],
                    "APPLY": [ {"numSections": {"COUNT": "courses_uuid"}} ],
                    "ORDER": { "dir": "UP", "keys": ["numSections", "courses_dept", "courses_id"]},
                    "AS":"TABLE"
                };
                return IF.performQuery(query).then((res) => {
                    expect(res.body).to.be.deep.equal(ANS7);
                    expect(res.code).to.be.equal(200);
                });
            });

        });
        
        after(function () {
            return IF.removeDataset(DATASET_ID).then((res) => {
                expect(res.code).to.be.equal(204);
            })
        });
    });

    describe("fails if no dataset", function () {
        it("removes any dataset and response codes are valid", function (done) {
            IF.removeDataset(DATASET_ID).then((res) => {
                expect(res.code).to.be.equal(204);
                done();
            }).catch((err) => {
                expect(err.code).to.be.equal(404);
                done();
            })
        });

        it("returns 424 if the dataset is not present", () => {
            let query: any = {
                "GET": ["courses_dept", "courseAverage", "courseMax"],
                "WHERE": { },
                "GROUP": ["courses_dept"],
                "APPLY": [{ "courseAverage": { "AVG": "courses_avg" } }, { "courseMax": { "MAX": "courses_avg" } }],
                "ORDER": { "dir": "DOWN", "keys": ["courseAverage"] },
                "AS": "TABLE"
            }

            return IF.performQuery(query).catch((res) => {
                expect(res.body.missing).to.be.deep.equal(['courses_dept']);
                expect(res.code).to.be.equal(424);
            });
        });
    });

    describe("dummy tests for coverage", function () {
        it("catches for add dataset", function () {
            return IF.addDataset("HELLO", null).catch((error) => {
                expect(error.code).to.be.equal(400);
            })
        });

        it("returns 400 on invalid query", function (done) {
            let invQuery: any = {};
            IF.performQuery(invQuery).catch((err) => {
                expect(err.code).to.be.equal(400);
                done();
            })
        });
    });
});