import * as React from 'react'
import { AgGridReact } from 'ag-grid-react';

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

let TimetableEntryList = [{
    locale: "Course",
    key: "course"
},{
    locale: "Room",
    key: "room"
},{
    locale: "Room Size",
    key: "room_size"
},{
    locale: "Course Size",
    key: "course_size"
},{
    locale: "Time",
    key: "time"
}];

export class ScheduleGrid extends React.Component<ScheduleGridProps, ScheduleGridState> {

    constructor(p:any){
        super(p);
        this.state = { 
            quality: -1,
            data: { timetable: {} },
            currentBldg: undefined
        };
    }

    onNavClick = (e : React.MouseEvent<HTMLElement>,bldngName : string) => {
        this.state.currentBldg = bldngName;
        this.setState(this.state);
    }

    renderNav = () => {
        return Object.keys(this.state.data.timetable).map((bldngName: string, idx: number) => {
            let activeState = (this.state.currentBldg === bldngName) ? "active" : "";
             return <li className="nav-item" key={idx}>
                <a className={"nav-link " + activeState } onClick={(e) => {this.onNavClick(e,bldngName)}}>{bldngName}</a>
            </li>
        });
    }

    renderRoomTable = () => {
        if(!this.state.currentBldg) return <div />

        let buldingSchedule = this.state.data.timetable[this.state.currentBldg];

        return <RoomSchedule rowData={buldingSchedule} columns={TimetableEntryList}/>
    }

    renderQuality = () => {
        if(this.state.quality === -1) return <div />;
        return <p>Quality: {this.state.quality}</p>
    }

    render () {
        return <div>
            <ul className="nav nav-pills">
                {this.renderNav()}
            </ul> 
                {this.renderRoomTable()}
            <div>
                {this.renderQuality()}
            </div>
        </div>
    }
}

export interface RoomScheduleProps {
    rowData: any;
    columns: {
        locale: string;
        key: string;
    }[];
}

export class RoomSchedule extends React.Component<RoomScheduleProps, {}> {

    constructor(p: any) {
        super(p);
    }

    api : any;
    columnApi: any;

    onGridReady = (params: any) => {
        this.api = params.api;
        this.columnApi = params.columnApi;
    };

    getHeaderDefinition = () => {
        return this.props.columns.map(colDefn => {
            return { headerName: colDefn.locale, field: colDefn.key }
        });
    }
    render() {
        return <div className="room-schedule-grid"><AgGridReact
                columnDefs={this.getHeaderDefinition()}
                onGridReady={this.onGridReady}

                // or provide props the old way with no binding
                rowSelection="multiple"
                enableSorting="true"
                enableFilter="true"
                rowHeight="22"
                rowData={this.props.rowData}
            />
            </div>
    }
}