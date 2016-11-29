import { courseCount, computeQuick, RoomData, CourseData, Schedule } from '../src/scheduler/Scheduler';
import { SECTION_SIZE, SECTION_COUNT } from '../src/common/Constants';

import { expect } from 'chai';

describe('computeQuick', function () {

    describe('courseCount', function () {
        it ('calculates fine', function () {
            expect(courseCount({[SECTION_COUNT]: 0, [SECTION_SIZE]: 1})).to.be.equal(1);
            expect(courseCount({[SECTION_COUNT]: 1, [SECTION_SIZE]: 1})).to.be.equal(1);
            expect(courseCount({[SECTION_COUNT]: 2, [SECTION_SIZE]: 1})).to.be.equal(1);
            expect(courseCount({[SECTION_COUNT]: 3, [SECTION_SIZE]: 1})).to.be.equal(2);
            expect(courseCount({[SECTION_COUNT]: 300, [SECTION_SIZE]: 1})).to.be.equal(101);
        });
    })

    describe('ok', function () {
        let courses: CourseData[] = [{
            courses_dept: 'cpsc',
            courses_id: '110',
            [SECTION_COUNT]: 30,
            [SECTION_SIZE]: 50
        }];

        let rooms: RoomData[] = [{
            rooms_number: '310',
            rooms_seats: 100,
            rooms_name: 'DMP_310'
        }];

        it ('pass', function () {
            let schedule = computeQuick(courses, rooms);
            let total = Object.keys(schedule.timetable).reduce((total: number, key: string) => total += (<Schedule[]>schedule.timetable[key]).length, 0);
            let inputTotal = courses.reduce((total: number, course: CourseData) => total += courseCount(course), 0);
            expect(total).to.be.equal(inputTotal);

        });
    });

    describe('time conflicts', function () {
        let courses: CourseData[] = [{
            courses_dept: 'cpsc',
            courses_id: '110',
            [SECTION_COUNT]: 200,
            [SECTION_SIZE]: 50
        }];

        let rooms: RoomData[] = [{
            rooms_number: '310',
            rooms_seats: 100,
            rooms_name: 'DMP_310'
        }];

        it ('pass', function () {
            let schedule = computeQuick(courses, rooms);
            let total = Object.keys(schedule.timetable).reduce((total: number, key: string) => total += (<Schedule[]>schedule.timetable[key]).length, 0);
            expect(total).to.be.equal(15);

        });
    });
    describe('time conflicts with 2 rooms', function () {
        let courses: CourseData[] = [{
            courses_dept: 'cpsc',
            courses_id: '110',
            [SECTION_COUNT]: 300,
            [SECTION_SIZE]: 50
        }];

        let rooms: RoomData[] = [{
            rooms_number: '210',
            rooms_seats: 200,
            rooms_name: 'DMP_210'
        }, {
            rooms_number: '310',
            rooms_seats: 100,
            rooms_name: 'DMP_310'
        }];

        it ('pass', function () {
            let schedule = computeQuick(courses, rooms);
            let total = Object.keys(schedule.timetable).reduce((total: number, key: string) => total += (<Schedule[]>schedule.timetable[key]).length, 0);
            expect(total).to.be.equal(15);

        });
    });
    describe('no conflicts with 2 rooms', function () {
        let courses: CourseData[] = [{
            courses_dept: 'cpsc',
            courses_id: '110',
            [SECTION_COUNT]: 44, // 15 for scheduled section
            [SECTION_SIZE]: 50
        }, {
            courses_dept: 'cpsc',
            courses_id: '210',
            [SECTION_COUNT]: 44, // 15 for scheduled section
            [SECTION_SIZE]: 80
        }];

        let rooms: RoomData[] = [{
            rooms_number: '210',
            rooms_seats: 200,
            rooms_name: 'DMP_210'
        }, {
            rooms_number: '310',
            rooms_seats: 100,
            rooms_name: 'DMP_310'
        }];

        it ('pass', function () {
            let schedule = computeQuick(courses, rooms);
            let total = Object.keys(schedule.timetable).reduce((total: number, key: string) => total += (<Schedule[]>schedule.timetable[key]).length, 0);
            expect(total).to.be.equal(30);

        });
    });
    describe('smaller room', function () {
        let courses: CourseData[] = [{
            courses_dept: 'cpsc',
            courses_id: '110',
            [SECTION_COUNT]: 44, // 15 for scheduled section
            [SECTION_SIZE]: 200
        }];

        let rooms: RoomData[] = [{
            rooms_number: '310',
            rooms_seats: 100,
            rooms_name: 'DMP_310'
        }];

        it ('pass', function () {
            let schedule = computeQuick(courses, rooms);
            let total = Object.keys(schedule.timetable).reduce((total: number, key: string) => total += (<Schedule[]>schedule.timetable[key]).length, 0);
            expect(total).to.be.equal(0);
        });
    });

    describe('2 courses + 2 rooms', function () {
        let courses: CourseData[] = [{
            courses_dept: 'cpsc',
            courses_id: '110',
            [SECTION_COUNT]: 44, // 15 for scheduled section
            [SECTION_SIZE]: 200
        }, {
            courses_dept: 'cpsc',
            courses_id: '210',
            [SECTION_COUNT]: 29, // 10 for scheduled section
            [SECTION_SIZE]: 100
        }];

        let rooms: RoomData[] = [{
            rooms_number: '310',
            rooms_seats: 300,
            rooms_name: 'DMP_310'
        }, {
            rooms_number: '210',
            rooms_seats: 100,
            rooms_name: 'DMP_210'
        }];

        it ('pass', function () {
            let schedule = computeQuick(courses, rooms);
            let total = Object.keys(schedule.timetable).reduce((total: number, key: string) => total += (<Schedule[]>schedule.timetable[key]).length, 0);
            expect(total).to.be.equal(25);
        });
    });
    describe('2 courses + enough rooms', function () {
        let courses: CourseData[] = [{
            courses_dept: 'cpsc',
            courses_id: '110',
            [SECTION_COUNT]: 11, // 4 for scheduled section
            [SECTION_SIZE]: 200
        }, {
            courses_dept: 'cpsc',
            courses_id: '210',
            [SECTION_COUNT]: 29, // 10 for scheduled section
            [SECTION_SIZE]: 100
        }];

        let rooms: RoomData[] = [{
            rooms_number: '310',
            rooms_seats: 300,
            rooms_name: 'DMP_310'
        }];

        it ('pass', function () {
            let schedule = computeQuick(courses, rooms);
            let total = Object.keys(schedule.timetable).reduce((total: number, key: string) => total += (<Schedule[]>schedule.timetable[key]).length, 0);
            expect(total).to.be.equal(14);
        });
    });
    describe('smaller room + bigger room', function () {
        let courses: CourseData[] = [{
            courses_dept: 'cpsc',
            courses_id: '110',
            [SECTION_COUNT]: 44, // 15 for scheduled section
            [SECTION_SIZE]: 200
        }];

        let rooms: RoomData[] = [{
            rooms_number: '310',
            rooms_seats: 300,
            rooms_name: 'DMP_310'
        }, {
            rooms_number: '310',
            rooms_seats: 100,
            rooms_name: 'DMP_310'
        }];

        it ('pass', function () {
            let schedule = computeQuick(courses, rooms);
            let total = Object.keys(schedule.timetable).reduce((total: number, key: string) => total += (<Schedule[]>schedule.timetable[key]).length, 0);
            expect(total).to.be.equal(15);
        });
    });
});
