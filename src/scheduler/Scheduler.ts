import { SECTION_SIZE, SECTION_COUNT, NUM_LEGAL_TIME_SLOTS, TIMES, LEGAL_TIMES } from '../common/Constants'

export interface CourseQuery {
    includes?: string[];
    [column: string]: any;
}

export interface RoomQuery {
    includes?: string[];
    [column: string]: any;
}

export interface Schedule {
    course: string; //uuid
    room: string; // name
    time: string; // MWF8, TT95, ...
    course_size: number;
    room_size: number;
}

interface CourseTimetable {
    [couse: string]: Schedule[];
    // CPSC110: {},
    // ARTS999: {},
    // ...
}

interface RoomTimetable {
    [room: string]: Schedule[];
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

export interface Timetable {
    timetable: CourseTimetable | RoomTimetable | DailyTimetable;
    quality: number;
}

export interface CourseData {
    courses_dept?: string;
    courses_id?: string;
    [id: string]: any;
}

export interface RoomData {
    rooms_number: string;
    rooms_seats: number;
    rooms_name: string;
}

function courseName (course: CourseData): string {
    return course.courses_dept + '_' + course.courses_id;
}

export function courseCount(course: CourseData): number {
    return Math.floor(course[SECTION_COUNT]/ 3) + 1;
}

function totalCourseSize(courses: CourseData[]): number {
    return courses.reduce((count: number, course: CourseData) => {
        return count + course[SECTION_SIZE] * courseCount(course);
    }, 0);
}

function quickTimetable (courses: CourseData[], rooms: RoomData[]): Timetable{
    let schedules: DailyTimetable = {};
    let onHold: CourseData[] = [];
    let failed: CourseData[] = [];
    let filled: number = 0;

    let allCourses: CourseData[] = [];
    courses.forEach(course => {
        for (let i = 0; i < courseCount(course); i++) {
            allCourses.push(course);
        }
    });
    let totalSize = allCourses.length;
    let roomSize = rooms.length * NUM_LEGAL_TIME_SLOTS;

    while (allCourses && (filled + failed.length < totalSize) && filled < roomSize) {

        let course = allCourses[0];
        if (!course) { break; }
        let room = rooms[Math.floor(filled / NUM_LEGAL_TIME_SLOTS)];
        let time = TIMES[LEGAL_TIMES[ filled % NUM_LEGAL_TIME_SLOTS ]];
        let index: number = -1;

        if (onHold.length && (index = tryScheduleAgain(time, room)) !== -1) {
            addSchedule(time, room, onHold[index]);
            onHold.splice(index, 1);
        } else if (impossible(time, room, course)) {
            failed.push(course);
            allCourses.shift();
        } else if (trySchedule(time, room, course)) {
            addSchedule(time, room, course);
            allCourses.shift();
        } else {
            onHold.push(course);
            allCourses.shift();
        }
    }

    // TODO do whatever with failed courses

    let timetable = {
        timetable: schedules,
        quality: filled / totalSize
    }
    return timetable;

    function impossible (time: string, room: RoomData, course: CourseData): boolean {
        return course[SECTION_SIZE] > room.rooms_seats;
    }

    function trySchedule (time: string, room: RoomData, course: CourseData): boolean {
        if (!schedules[time]) {
            schedules[time] = [];
            return true;
        }

        let index = schedules[time].findIndex((s: Schedule) => s.course === courseName(course));
        return index === -1;
    }

    function tryScheduleAgain (time: string, room: RoomData): number {
        let index = 0;
        while (index < onHold.length) {
            if (trySchedule(time, room, onHold[index])) {
                return index;
            }
            index ++;
        }
        return -1;
    }

    function addSchedule (time: string, room: RoomData, course: CourseData): void {
        schedules[time].push({
            course: courseName(course),
            room: room.rooms_name,
            room_size: room.rooms_seats,
            course_size: course[SECTION_SIZE],
            time: time
        });
        filled ++;
    }
}

function findquickTimetable (courses: CourseData[], rooms: RoomData[]): DailyTimetable {
    let timetable: DailyTimetable = {};

    let sections: CourseData[] = [];
    courses.forEach(course => {
        for (let i = 0; i < courseCount(course); ++i) {
            sections.push(course);
        }
    });

    sections.forEach((section: CourseData, index: number) => {
        let time = TIMES[LEGAL_TIMES[index % NUM_LEGAL_TIME_SLOTS]];

        if (!timetable[time]) {
            timetable[time] = [];
        }
        timetable[time].push({
            course: section.courses_dept + '_' + section.courses_id,
            room: rooms[Math.floor(index / NUM_LEGAL_TIME_SLOTS)].rooms_name,
            time: time,
            course_size: section[SECTION_SIZE],
            room_size: rooms[Math.floor(index / NUM_LEGAL_TIME_SLOTS)].rooms_seats
        });
    });

    return timetable;
}

export function computeQuick (courses: CourseData[], rooms: RoomData[], PER?: string): Timetable {

    if (!PER) { PER = 'DAILY' }

    let schedules = quickTimetable(courses, rooms);
    if (PER === 'ROOMS') {
        return convertDailyToRoom(schedules);
    } else if (PER === 'COURSES') {
        return convertDailyToCourse(schedules);
    } else {
        return schedules;
    }
}

function convertDailyToRoom (timetable: Timetable): Timetable {
    let schedules: RoomTimetable = {};

    Object.keys(timetable.timetable).forEach(key => {
        (<Schedule[]>timetable.timetable[key]).forEach(schedule => {
            let room = schedule.room;
            if (!schedules[room]) {
                schedules[room] = [];
            }
            schedules[room].push(schedule);
        });
    })

    let _timetable: Timetable = {
        timetable: schedules,
        quality: timetable.quality
    }
    return _timetable;
}

function convertDailyToCourse (timetable: Timetable): Timetable {
    let schedules: RoomTimetable = {};

    Object.keys(timetable.timetable).forEach(key => {
        (<Schedule[]>timetable.timetable[key]).forEach(schedule => {
            let course = schedule.course;
            if (!schedules[course]) {
                schedules[course] = [];
            }
            schedules[course].push(schedule);
        });
    })

    let _timetable: Timetable = {
        timetable: schedules,
        quality: timetable.quality
    }
    return _timetable;
}

export function computeDirty (courses: CourseData[], rooms: RoomData[]): Timetable {

    return null;
}
