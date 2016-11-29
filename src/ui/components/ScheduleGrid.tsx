import * as React from 'react'

export interface ScheduleGridProps { }

export interface ScheduleGridState {
    quality: number,
    data: TimetableByBldng
}

export interface TimetableByBldng {
    timetable: { [building_id: string] : TimetableEntry[] }
}

export interface TimetableEntry {
    course: string
    room: string,
    room_size: number,
    course_size: number,
    time: string
}

export class ScheduleGrid extends React.Component<ScheduleGridProps, ScheduleGridState> {

    constructor(p:any){
        super(p);
        this.state = { 
            quality: 0,
            data: { timetable: {} }
        };
    }

    render () {
        return <div>
        {JSON.stringify(this.state.data)}
        </div>
    }
}
