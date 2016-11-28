import { SECTION_SIZE, SECTION_COUNT, NUM_AVAILABLE_TIME_SLOTS, TIMES } from '../common/Constants'

export interface CourseQuery {
    [column: string]: any;
}

export interface RoomQuery {
    [column: string]: any;
}

interface Schedule {
    course: string; //uuid
    room: string; // fullname
    time: string; // MWF8, TT95, ...
}

interface CourseTimetable {
    [couse: string]: Schedule;
    // CPSC110: {},
    // ARTS999: {},
    // ...
}

interface RoomTimetable {
    [room: string]: Schedule;
    // DMP101: {},
    // BUCH110: {},
    // ...
}

interface DailyTimetable {
    [time: string]: Schedule[];
    // MWF8: [ {}, {}, {} ],
    // TT11: [ {}, {}, {}, {} ],
    // ...
}

export type Timetable = CourseTimetable | RoomTimetable | DailyTimetable;

interface CourseData {
    courses_dept: string;
    courses_id: string;
    courses_uuid: string;
    courses_size: number;
    [id: string]: any;
}

interface RoomData {
    rooms_number: string;
    rooms_seats: number;
    rooms_fullname: string;
}

function courseCount(course: CourseData): number {
    return Math.floor(course[SECTION_COUNT]/ 3) + 1;
}

function totalCourseSize(courses: CourseData[]): number {
    return courses.reduce((count: number, course: CourseData) => {
        return count + course[SECTION_SIZE] * courseCount(course);
    }, 0);
}

function totalRoomSize(rooms: RoomData[]): number {
    return rooms.reduce((count: number, room: RoomData) => {
        return count + room['rooms_seats']* NUM_AVAILABLE_TIME_SLOTS;
    }, 0);
}

function everoneIsHappy (courses: CourseData[], rooms: number[]): boolean {
    let courseSectionSize: number[] = [];
    courses.forEach(course => {
        for (let i = 0; i < courseCount(course); ++i) {
            courseSectionSize.push(course[SECTION_SIZE]);
        }
    });
    let satisfied = courseSectionSize.every((course: number, index: number) => {
        return course < rooms[Math.floor(index / NUM_AVAILABLE_TIME_SLOTS)];
    });
    return satisfied;
}

function happyTimetable (courses: CourseData[], rooms: RoomData[]): DailyTimetable {
    let timetable: DailyTimetable = {};

    let sections: CourseData[] = [];
    courses.forEach(course => {
        for (let i = 0; i < courseCount(course); ++i) {
            sections.push(course);
        }
    });

    sections.forEach((section: CourseData, index: number) => {
        let time = TIMES[index % NUM_AVAILABLE_TIME_SLOTS];

        if (!timetable[time]) {
            timetable[time] = [];
        }
        timetable[time].push({
            course: section.courses_dept + '_' + section.courses_id,
            room: rooms[Math.floor(index / NUM_AVAILABLE_TIME_SLOTS)].rooms_fullname,
            time: time
        });
    });

    return timetable;
}

export function computeQuick (courses: CourseData[], rooms: RoomData[]): Timetable {

    let roomSize = rooms.map(room => room.rooms_seats);
    if (everoneIsHappy(courses, roomSize)) {
        return happyTimetable(courses, rooms);
    } else {
        return null;
    }
}

export function computeDirty (courses: CourseData[], rooms: RoomData[]): Timetable {

    return null;
}
