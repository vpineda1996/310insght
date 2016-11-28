import { QueryRequest, QueryData } from '../util/Query'
import { getQueryData } from '../queryHelpers/queryWhere'
import { renderTable } from '../queryHelpers/queryAs'
import QueryController from './QueryController'
import { CourseQuery, RoomQuery, Timetable, computeQuick, computeDirty } from '../scheduler/Scheduler'
import { SECTION_SIZE, SECTION_COUNT } from '../common/Constants'

export default class ScheduleController {
    private static instance: ScheduleController = null;

    public static getInstance (): ScheduleController {
        if (!this.instance) {
            this.instance = new ScheduleController();
        }
        return this.instance;
    }

    public computeTimetable (courseQuery: CourseQuery, roomQuery: RoomQuery): Promise<Timetable> {
        return new Promise<Timetable>((resolve, reject) => {

            let courses: any[];
            let rooms: any[];

            this.findCourses(courseQuery).then(c => {
                if (!c) { throw null; }
                courses = c;

                this.findRooms(roomQuery).then(r => {
                    if (!r) { throw null; }
                    rooms = r;

                    let timetable = computeQuick(courses, rooms);
                    if (!timetable) {
                        timetable = computeDirty(courses, rooms);
                    }

                    // TODO need to grab uuid *here*
                    return resolve(timetable);
                })
            })
        });
    }

    private findRooms (query: RoomQuery): Promise<any> {
        let _query: QueryRequest = {
            'GET': ['rooms_name', 'rooms_seats', 'rooms_fullname'],
            'WHERE': query,
            'ORDER': { 'dir': 'DOWN', 'keys': ['rooms_seats']},
            'AS': 'TABLE'
        }
        return this.getData(_query);
    }

    private findCourses (query: CourseQuery): Promise<any> {
        let _query: QueryRequest = {
            'GET': ['courses_dept', 'courses_id', SECTION_SIZE, SECTION_COUNT],
            'WHERE': query,
            'GROUP': ['courses_dept', 'courses_id'],
            'APPLY': [
                { [SECTION_SIZE]: { 'MAX': 'courses_size' } },
                { [SECTION_COUNT]: { 'COUNT': 'courses_size' } }
            ],
            'ORDER': { 'dir': 'DOWN', 'keys': [SECTION_SIZE]},
            'AS': 'TABLE'
        }
        return this.getData(_query);
    }

    private getData (query: QueryRequest): Promise<QueryData[]> {
        return new QueryController().query(query).then(res => {
            return res.result;
        }).catch(a => a.message);
    }

}
