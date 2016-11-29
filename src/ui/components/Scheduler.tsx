import * as React from 'react'

import { WhereCourseSelector } from './WhereCourseSelector'
import { RoomExplorer } from './RoomExplorer'

export interface SchedulerProps {
    queries: {
        rooms: {}
        courses: {}
        [id:string]: {}
    }
}

export class Scheduler extends React.Component<SchedulerProps, {}> {
    render () {
        return <div>
            <WhereCourseSelector onStatusChanged={()=>{}}/>
            <RoomExplorer dataId='rooms' onNewQuery={() => {}} />;
        </div>
    }
}
