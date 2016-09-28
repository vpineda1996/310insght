
import {Datatable} from "../common/Common";
import {Column} from "../common/Common";
import {Row} from "../common/Common";

import Log from '../Util';

const COLUMNS: string[] = [
    'courses_dept',
    'courses_id',
    'courses_avg',
    'courses_instructor',
    'courses_title',
    'courses_pass',
    'courses_fail',
    'courses_audit'
];
const COURSE_KEY_LEN = 4;

// courses_dept: string; The department that offered the course.
// courses_id: string; The course number (will be treated as a string (e.g., 499b)).
// courses_avg: number; The average of the course offering.
// courses_instructor: string; The instructor teaching the course offering.
// courses_title: string; The name of the course.
// courses_pass: number; The number of students that passed the course offering.
// courses_fail: number; The number of students that failed the course offering.
// courses_audit: number; The number of students that audited the course offering.


export default class JSONParser {

    public static parse(zipFiles: { [id: string]: JSZipObject }, datatable: Datatable): Promise<Datatable> {
        Log.trace('JSONParser::parse( ... )');
        this.createColumns(datatable);
        let aRowsArray: Row[] = [];
        let aPromiseArray: Promise<any>[] = [];
        for (var i in zipFiles) {
            if (zipFiles[i]) {
                let oPromise = this.parseCourse(zipFiles[i], i).then((course) => {
                    Array.prototype.push.apply(aRowsArray, course);
                });
                aPromiseArray.push(oPromise);
            }
        }
        return Promise.all(aPromiseArray).then(() => {
            Log.trace('JSONParser::parse( pushing columns... )');
            this.pushDataToColumns(datatable, aRowsArray);
            return datatable;
        });
    }

    private static createColumns(datatable: Datatable) {
        Log.trace('JSONParser::createColumns( ... )');
        COLUMNS.forEach((colName) => {
            datatable.createColumn(colName);
            datatable.getColumn(colName).getData();
        });
    };

    private static pushDataToColumns(datatable: Datatable, aRowsArray: Row[]) {
        Log.trace('JSONParser::pushDataToColumns( ... )');
        aRowsArray.forEach((oRow) => {
            datatable.insertRow(oRow);
        });
    }

    private static parseCourse(courseZip: JSZipObject, coursePath: string): Promise<Row[]> {
        return new Promise((resolve, reject) => {
            courseZip.async('string').then((res) => {
                try {
                    let listOfCourseYears = JSON.parse(res);
                    let aRet: Row[] = [];
                    if (listOfCourseYears.result && listOfCourseYears.result.length) {
                        listOfCourseYears.result.forEach((courseOffering: any) => {
                            let row: Row = {
                                courses_dept: this.getCourseDept(coursePath),
                                courses_id: this.getCourseId(coursePath),
                                courses_avg: this.getCourseAvg(courseOffering),
                                courses_instructor: this.getCourseInstructor(courseOffering),
                                courses_title: this.getCourseTitle(courseOffering),
                                courses_pass: this.getCoursePass(courseOffering),
                                courses_fail: this.getCourseFail(courseOffering),
                                courses_audit: this.getCourseAudit(courseOffering)
                            };
                            aRet.push(row);
                        });
                    }
                    resolve(aRet);
                } catch (e) {
                    Log.trace('JSONParser::pushDataToColumns( ... ) ' +  e + " " + res);
                    resolve([]);
                }
            }).catch((err) => Log.trace(err));
        });
    };

    private static getCourseDept(coursePath: string) {
        let course = coursePath.split(/\//);
        return course[course.length - 1].substring(0, COURSE_KEY_LEN);
    }

    private static getCourseId(coursePath: string) {
        let course = coursePath.split(/\//);
        return course[course.length - 1].substring(COURSE_KEY_LEN);
    }
    private static getCourseAvg(courseOffering: any) {
        return courseOffering.Avg || 0;
    }
    private static getCourseInstructor(courseOffering: any) {
        return courseOffering.Professor || "";
    }
    private static getCourseTitle(courseOffering: any) {
        return courseOffering.Title || "";
    }
    private static getCoursePass(courseOffering: any) {
        return courseOffering.Pass || 0;
    }
    private static getCourseFail(courseOffering: any) {
        return courseOffering.Fail || 0;
    }
    private static getCourseAudit(courseOffering: any) {
        return courseOffering.Audit || 0;
    }
};
