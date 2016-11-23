import * as React from 'react'

import { MainLayout } from './layout/MainLayout'
import { NavBarStates } from './components/MainNavBar'
import { RoomExplorer } from './components/RoomExplorer'
import { CoursesExplorerView } from './components/CoursesExplorerView'
import { Scheduler, SchedulerProps } from './components/Scheduler'

interface AppState extends SchedulerProps {
    currentTab: NavBarStates
}

export class App extends React.Component<{}, AppState> {

    constructor (props: any) {
        super(props);
        this.state = {
            currentTab: NavBarStates.COURSES,
            queries: {
                rooms: {},
                courses: {}
            }
        }
    }

    handleChangeTab = (newState: NavBarStates) => {
        let state = this.state;
        state.currentTab = newState;
        this.setState(state);
    }

    onNewQuery = (who: string, query: {}) => {
        let state = this.state;
        state.queries[who] = query;
        this.setState(state);
    }

    renderTabContent = () => {
        switch (this.state.currentTab) {
            case NavBarStates.ROOMS:
                return <RoomExplorer dataId='rooms' onNewQuery={this.onNewQuery} />;
            case NavBarStates.COURSES:
                return <CoursesExplorerView dataId='courses' onNewQuery={this.onNewQuery}/>;
            default:
                return <Scheduler {...this.state} />;
        }
    }

    render () {
        return (
            <MainLayout currentTab={this.state.currentTab} handleChangeTab={this.handleChangeTab} >
                {this.renderTabContent()}
            </MainLayout>
        );
    }
}
