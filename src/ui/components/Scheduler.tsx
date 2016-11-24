import * as React from 'react'

export interface SchedulerProps {
    queries: {
        rooms: {}
        courses: {}
        [id:string]: {}
    }
}

export class Scheduler extends React.Component<SchedulerProps, {}> {
    render () {
        return <div />
    }
}
