import * as React from "react";
import { MainNavBar, NavBarStates } from "../components/MainNavBar"

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
        console.log(this.state)
    }

    render() {
        return <MainNavBar navState={this.state.currentTab} onChangeState={this.onChangeTab.bind(this)}/>;
    }
}