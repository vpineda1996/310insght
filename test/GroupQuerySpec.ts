import GroupQuery from '../src/queryHelpers/GroupQuery';
import {expect} from 'chai';

describe("GroupQuery", function () {

    before(function(){

    });

     let aQueryData :any = [
            {course_id: [310, 320, 310]},
            {course_avg: [50, 100, 100]}  
    ];
    

    it("it groups and averages by one col", function() {

        let query :any = {
            "GROUP": [ "course_id", "courses_id" ],
            "APPLY": [ {"course_avg": {"AVG": "course_avg"}}]
        }

        var res = GroupQuery.groupBy(query, aQueryData);
        expect(res).to.be.deep.equal([
                {course_id: [310, 320]},
                {course_avg: [75, 100]}  
        ]);
    });
});