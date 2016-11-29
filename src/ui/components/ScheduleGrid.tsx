import * as React from 'react'

export interface ScheduleGridProps { }

export interface ScheduleGridState {
    quality: number,
    data: TimetableByBldng,
    currentBldg?: string
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
            quality: -1,
            data: { timetable: {} },
            currentBldg: undefined
        };
    }

    onNavClick = (bldngName : string) => {
        this.state.currentBldg = bldngName;
        this.setState(this.state);
    }

    renderBreadcrums = () => {
        return Object.keys(this.state.data.timetable).map((bldngName: string, idx: number) => {
             return <li className="nav-item">
                <a className="nav-link active" onClick={(e) => {e.preventDefault(); this.onNavClick(bldngName)}} >{bldngName}</a>
            </li>
        });
    }

    renderRoomTable = () => {
        if(!this.state.currentBldg) return <div />

        let buldingSchedule = this.state.data.timetable[this.state.currentBldg];

        return <div>{JSON.stringify(buldingSchedule)}</div>
    }

    renderQuality = () => {
        if(this.state.quality === -1) return <div />;
        return <p>{this.state.quality}</p>
    }

    render () {
        return <div>
            <ul className="nav nav-tabs">
                {this.renderBreadcrums()}
            </ul> 
            {this.renderRoomTable()}
            {this.renderQuality()}
        </div>
    }
}


