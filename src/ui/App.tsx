import * as React from 'react'

import { MainLayout } from './layout/MainLayout'
import { NavBarStates } from './components/MainNavBar'
import { RoomExplorer } from './components/RoomExplorer'
import { CoursesExplorerView } from './components/CoursesExplorerView'

interface AppState {
    currentTab: NavBarStates
}

export class App extends React.Component<{}, AppState> {

    constructor (props: any) {
        super(props);
        this.state = {
            currentTab: NavBarStates.COURSES
        }
    }

    handleChangeTab = (newState: NavBarStates) => {
        this.setState({ currentTab: newState });
    }

    renderTabContent = () => {
        switch (this.state.currentTab) {
            case NavBarStates.ROOMS:
                return <RoomExplorer />;
            case NavBarStates.COURSES:
                return <CoursesExplorerView />;
            default:
                return <div/>
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
