import * as React from "react";
import { MainNavBar, NavBarStates } from "../components/MainNavBar"
import { RoomExplorer } from '../components/RoomExplorer'

export interface MainLayoutProps {}
export interface MainLayoutState {
    currentTab: NavBarStates
}

export class MainLayout extends React.Component<MainLayoutProps, MainLayoutState> {
    constructor(props: any){
        super(props);
        this.state = {
            currentTab: NavBarStates.COURSES
        };
    }

    onChangeTab(newState: NavBarStates){
        this.setState((prev, props) => {
            prev.currentTab = newState;
            return prev;
        });
    }

    render() {
        return <div>
            <MainNavBar navState={this.state.currentTab} onChangeState={this.onChangeTab.bind(this)}/>
            <RoomExplorer />
        </div>
    }
}
