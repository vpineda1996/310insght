import * as React from 'react';
import { MainNavBar, NavBarStates } from '../components/MainNavBar';

export interface MainLayoutProps {
    currentTab: NavBarStates,
    handleChangeTab: Function
}

export class MainLayout extends React.Component<MainLayoutProps, {}> {
    render() {
        return (
            <div>
                <MainNavBar navState={this.props.currentTab} onChangeState={this.props.handleChangeTab} />
                {this.props.children}
            </div>
        );
    }
}
