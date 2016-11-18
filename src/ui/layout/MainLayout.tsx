import * as React from 'react';
import { MainNavBar, NavBarStates } from '../components/MainNavBar'
import { RoomExplorer } from '../components/RoomExplorer'
import { DataUploader, Uploadable } from '../components/DataUploader'
import { Sidebar } from '../components/Sidebar'
import { SidebarLayout } from '../layout/SidebarLayout'

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

    renderSidebar () {
        switch (this.state.currentTab) {
            case NavBarStates.ROOMS:
                return <DataUploader uploadType={Uploadable.ROOMS} />;
            case NavBarStates.COURSES:
                return <DataUploader uploadType={Uploadable.COURSES} />;
            case NavBarStates.SCHEDULING:
                return <div />;
            default:
                return <div />;
        }
    }

    renderMainPage () {
        switch (this.state.currentTab) {
            case NavBarStates.ROOMS:
                return <RoomExplorer />;
            default:
                return <div/>
        }
    }

    render() {
        return <div>
            <MainNavBar navState={this.state.currentTab} onChangeState={this.onChangeTab.bind(this)} />
            <SidebarLayout>
                <Sidebar>
                    {this.renderSidebar()}
                </Sidebar>
            </SidebarLayout>
            {this.renderMainPage()}
        </div>;
    }
}
