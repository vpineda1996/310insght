import GroupQuery from '../src/queryHelpers/GroupQuery';
import {expect} from 'chai';

describe("GroupQuery", function () {

    before(function () {

    });

    let aQueryData: any = [
        { course_id: [310, 320, 310] },
        { course_avg: [50, 100, 100] }
    ];


    it("it groups and averages by one col", function () {

        let query: any = {
            "GET": ["course_id", "courseAverage"],
            "GROUP": ["course_id"],
            "APPLY": [{ "courseAverage": { "AVG": "course_avg" } }]
        }

        var res = GroupQuery.groupBy(query, aQueryData);
        expect(res).to.be.deep.equal([
            { course_id: [310, 320] },
            { courseAverage: [75, 100] }
        ]);
    });

    it("it groups and max by one col", function () {

        let query: any = {
            "GET": ["course_id", "courseAverage"],
            "GROUP": ["course_id"],
            "APPLY": [{ "courseAverage": { "MAX": "course_avg" } }]
        }

        var res = GroupQuery.groupBy(query, aQueryData);
        expect(res).to.be.deep.equal([
            { course_id: [310, 320] },
            { courseAverage: [100, 100] }
        ]);
    });

    it("it groups and min by one col", function () {

        let query: any = {
            "GET": ["course_id", "courseAverage"],
            "GROUP": ["course_id"],
            "APPLY": [{ "courseAverage": { "MIN": "course_avg" } }]
        }

        var res = GroupQuery.groupBy(query, aQueryData);
        expect(res).to.be.deep.equal([
            { course_id: [310, 320] },
            { courseAverage: [50, 100] }
        ]);
    });

    it("it groups and count by one col", function () {

        let query: any = {
            "GET": ["course_id", "courseAverage"],
            "GROUP": ["course_id"],
            "APPLY": [{ "courseAverage": { "COUNT": "course_avg" } }]
        }

        var res = GroupQuery.groupBy(query, aQueryData);
        expect(res).to.be.deep.equal([
            { course_id: [310, 320] },
            { courseAverage: [2, 1] }
        ]);
    });

    describe("group by two or more columns", function () {

        let aQueryData: any = [
            { course_id: [310, 320, 310, 310] },
            { course_dept: ['cpsc', 'cpsc', 'cpsc', 'biol'] },
            { course_avg: [50, 100, 100, 84] }
        ];

        it("it groups and count by two col", function () {
            let query: any = {
                "GET": ["course_id", "course_dept", "courseAverage"],
                "GROUP": ["course_id", "course_dept"],
                "APPLY": [{ "courseAverage": { "COUNT": "course_avg" } }]
            }

            var res = GroupQuery.groupBy(query, aQueryData);
            expect(res).to.be.deep.equal([
                { course_id: [310, 320, 310] },
                { course_dept: ['cpsc', 'cpsc', 'biol'] },
                { courseAverage: [2, 1, 1] }
            ]);
        });

        it("it groups and count by one col, doesnt depend on apply order", function () {

            let query: any = {
                "GET": ["course_id", "dept", "courseAverage"],
                "GROUP": ["course_id"],
                "APPLY": [
                    { "courseAverage": { "AVG": "course_avg" } },
                    { "dept": { "COUNT": "course_avg" } }
                ]
            }

            var res = GroupQuery.groupBy(query, aQueryData);
            expect(res).to.be.deep.equal([
                { course_id: [310, 320] },
                { dept: [3, 1] },
                { courseAverage: [78, 100] }
            ]);
        });

         it("doesnt depend on apply order", function () {
            let query: any = {
                "GET": ["courseAverage", "course_id"],
                "GROUP": ["course_id"],
                "APPLY": [
                    { "courseAverage": { "AVG": "course_avg" } }
                ]
            }

            var res = GroupQuery.groupBy(query, aQueryData);
            expect(res).to.be.deep.equal([
                { courseAverage: [78, 100] },
                { course_id: [310, 320] }
            ]);
        });
    });


});