import * as React from 'react'

import { WhereCourseSelector } from './WhereCourseSelector'
import { RoomExplorer } from './RoomExplorer'
import { ScheduleGrid } from './ScheduleGrid'
import { Store } from '../store/store'
import { COURSES_ID, ROOMS_ID, SCHEDULE_ID } from '../store/constants'

import "../styles/scheduler.scss";

export enum SchedulerView {
    ROOMSVIEW,
    SCHEDULEVIEW
}

export interface SchedulerProps { }

export interface SchedulerState {
    activeView: SchedulerView,
    roomsWhereQuery: any,
    coursesWhereQuery: any
}

export class Scheduler extends React.Component<SchedulerProps, SchedulerState> {

    constructor(p: any) {
        super(p);
        this.state = {
            activeView: SchedulerView.ROOMSVIEW,
            roomsWhereQuery: { WHERE: {} },
            coursesWhereQuery: { WHERE: {} }
        };
    }

    renderCurrentView = () => {
        let activeRooms = this.state.activeView === SchedulerView.ROOMSVIEW;
        let activeSchedule = this.state.activeView === SchedulerView.SCHEDULEVIEW;
        return <div>
            <div className={"col-md-12 " + (activeRooms ? " active" : "")} id="rooms-view">
                <RoomExplorer dataId='rooms' onNewQuery={this.onWhereRooms} />
            </div>
            <div className={"container col-md-12 " + (activeSchedule ? " active" : "")} id="schedule-view">
                <div className="flex-row where-panel-row">
                    <div className={"panel panel-primary col-sm-12 where-panel"}>
                        <div className="panel-heading">Where Selector</div>
                        <div className="panel-body">
                            <WhereCourseSelector onStatusChanged={this.onWhereCourses} />
                        </div>
                    </div>
                </div>
            </div>
        </div>;
    }

    renderButton = () => {
        switch (this.state.activeView) {
            case SchedulerView.ROOMSVIEW:
                return <div className="row button-padding">
                    <button id="bottom-button-rooms-view" type="button"
                        className="col-md-12 btn btn-primary" onClick={this.onNextClick}>
                        Next</button>
                </div>;
            case SchedulerView.SCHEDULEVIEW:
                return <div className="container-fluid"><div className="row text-center button-padding-schedule">
                    <button id="bottom-button-rooms-view" type="button"
                        className="col-md-6 btn btn-primary" onClick={this.onPrevClick}>
                        Go Back</button>
                    <button id="bottom-button-rooms-view" type="button"
                        className="col-md-6 btn btn-primary" onClick={this.onQueryClick}>
                        Show Schedule!</button>
                </div></div>;
            default:
                throw new Error("wat");
        }
    }

    renderSchedule = () => {
        let activeSchedule = this.state.activeView === SchedulerView.SCHEDULEVIEW;
        return <div className={(activeSchedule ? " active" : "")} id={"schedule-view"}>
            <div className={"panel panel-primary col-sm-12 schedule-panel"}>
                <div className="panel-heading">Schedule</div>
                <div className="panel-body">
                    <ScheduleGrid ref="scheduleGrid"/>
                </div>
            </div>
        </div>
    }

    onNextClick = () => {
        this.state.activeView = SchedulerView.SCHEDULEVIEW;
        this.setState(this.state);
    }

    onPrevClick = () => {
        this.state.activeView = SchedulerView.ROOMSVIEW;
        this.setState(this.state);
    }

    onQueryClick = () => {
        this.setState(this.state);
        let reqBody = {
            COURSES: this.state.coursesWhereQuery.WHERE,
            ROOMS: this.state.roomsWhereQuery.WHERE,
            "PER": "ROOMS"
        }
        Store.fetchSchedule(SCHEDULE_ID,reqBody).then(data => {
            let scheduleDiv : any = this.refs["scheduleGrid"];
            Object.keys(data.timetable).forEach((key: string) => {
                data.timetable[key] = data.timetable[key].map((col : any)=> {
                    if(typeof col === 'object') col.time = col.time.day + " " + col.time.time;
                    return col;
                });
            });
            scheduleDiv.setState({
                quality: data.quality,
                data: { timetable: data.timetable }
            });
        });
    }

    onWhereRooms = (datasetId : string, queryObj: any) => {
        console.log(datasetId);
        this.state.roomsWhereQuery.WHERE = queryObj.WHERE;
        
    }

    onWhereCourses = (whereObj: any) => {
        this.state.coursesWhereQuery.WHERE = whereObj.WHERE;
    }

    render() {
        return <div className="course-scheduler">
            <div className="container container-max-width">
                <div className="row">
                    {this.renderCurrentView()}
                </div>
                {this.renderButton()}
                {this.renderSchedule()}
            </div>
        </div>
    }
}
