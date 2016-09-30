
import {Datatable} from "../common/Common";
import {Column} from "../common/Common";
import {Row} from "../common/Common";

import Log from '../Util';

const COLUMNS: string[] = [
    'dept',
    'id',
    'avg',
    'instructor',
    'title',
    'pass',
    'fail',
    'audit'
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
        return this.createColumns(datatable).then(() => {
            let aPromiseArray: Promise<any>[] = [];
            for (var i in zipFiles) {
                if (zipFiles[i] && !zipFiles[i].dir) {
                    let oPromise = this.parseCourse(zipFiles[i], i, datatable);
                    aPromiseArray.push(oPromise);
                }
            }
            return Promise.all(aPromiseArray).then(() => {
                return datatable;
            }).catch((e) => {
                Log.trace('JSONParser::parse( error pushing data to columns ) ' + e );
                return e;
            });
        });
    }

    private static createColumns(datatable: Datatable) {
        Log.trace('JSONParser::createColumns( ... )');
        let aPromises: Promise<Column>[] = [];
        COLUMNS.forEach((colName) => {
            aPromises.push(datatable.createColumn(colName));
        });
        return Promise.all(aPromises).then((col) => {
            // Need to load the column data to make it fast
            let aPromiseArray: Promise<Array<string|number>>[] = [];
            COLUMNS.forEach((colName, idx) => {
                aPromiseArray.push(datatable.getColumn(idx).getData());
            });
            return Promise.all(aPromiseArray);
        });
    };

    private static parseCourse(courseZip: JSZipObject, coursePath: string, datatable: Datatable): Promise<number> {
        return new Promise((resolve, reject) => {
            courseZip.async('string').then((res) => {
                try {
                    let listOfCourseYears = JSON.parse(res);
                    if (listOfCourseYears.result && listOfCourseYears.result.length) {
                        listOfCourseYears.result.forEach((courseOffering: any) => {
                            datatable.columns[0].insertCellFast(this.getCourseDept(courseOffering, coursePath));
                            datatable.columns[1].insertCellFast(this.getCourseId(courseOffering, coursePath));
                            datatable.columns[2].insertCellFast(this.getCourseAvg(courseOffering));
                            datatable.columns[3].insertCellFast(this.getCourseInstructor(courseOffering));
                            datatable.columns[4].insertCellFast(this.getCourseTitle(courseOffering));
                            datatable.columns[5].insertCellFast(this.getCoursePass(courseOffering));
                            datatable.columns[6].insertCellFast(this.getCourseFail(courseOffering));
                            datatable.columns[7].insertCellFast(this.getCourseAudit(courseOffering));
                        });
                    } else if (!listOfCourseYears.courses && !listOfCourseYears.result && listOfCourseYears.rank === undefined) {
                        reject("Invalid JSON file: " + coursePath);
                    }
                    resolve((listOfCourseYears.result && listOfCourseYears.result.length) || 0);
                } catch (e) {
                    Log.trace('JSONParser::pushDataToColumns( ... ) ' +  e + " " + res);
                    reject("Invalid dataset with file: " + res);
                }
            }).catch((err) => {
                Log.trace(err);
                return err;
            });
        });
    };

    private static getCourseDept(courseOffering: any, coursePath: string) {
        try {
            if(courseOffering && courseOffering.Course !== undefined) {
                return courseOffering.Subject;
            }
            let course = coursePath.split(/\//);
            return course[course.length - 1].substring(0, COURSE_KEY_LEN).toLocaleLowerCase();
        } catch (err) {
            throw new Error("Unable to parse course dept -- " + coursePath);
        }
    }

    private static getCourseId(courseOffering: any, coursePath: string) {
        try {
            if(courseOffering && courseOffering.Course !== undefined) {
                return courseOffering.Course;
            }
            let course = coursePath.split(/\//);
            return course[course.length - 1].substring(COURSE_KEY_LEN).toLocaleLowerCase();
        } catch (err) {
            throw new Error("Unable to parse course id -- " + coursePath);
        }
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
