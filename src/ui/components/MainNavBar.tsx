import * as React from "react";
import { Button } from './Button'

// Styesheet
require("../styles/navbar.scss");

export interface MainNavBarPros { navState: NavBarStates; onChangeState: Function; }

export enum NavBarStates {
    COURSES, ROOMS, SCHEDULING
};

export namespace NavBarStates {
    function isIndex(key: any): boolean {
        const n = ~~Number(key);
        return String(n) === key && n >= 0;
    }

    const _names: string[] = Object
        .keys(NavBarStates)
        .filter(key => !isIndex(key));

    const _indices: number[] = Object
        .keys(NavBarStates)
        .filter(key => isIndex(key))
        .map(index => Number(index));

    export function names(): string[] {
        return _names;
    }

    export function indices(): number[] {
        return _indices;
    }
}

export class MainNavBar extends React.Component<MainNavBarPros, {}> {
    private onSelectState(navState: NavBarStates) {
        this.props.onChangeState(navState);
    };
    render() {
        let navBarButtons = NavBarStates.indices().map((state: any) => {
            let active = state === this.props.navState ? "active" : "";
            return <li key={state} className={active}>
                <Button text={NavBarStates[state]} onClick={this.onSelectState.bind(this, state)} cssClass={"button"}/>
            </li>;
        });
        return <nav className="navbar navbar-default main-nav-bar">
            <div className="container-fluid">
                <div className="navbar-header">
                    <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                        <span className="sr-only">Toggle navigation</span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </button>
                    <a className="navbar-brand" href="#">insightUBC</a>
                </div>

                <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                    <ul className="nav navbar-nav">
                        { navBarButtons }
                    </ul>
                </div>
            </div>
        </nav>;
    }
}

