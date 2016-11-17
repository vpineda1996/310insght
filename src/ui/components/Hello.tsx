import * as React from "react";
import { RoomExplorer } from './RoomExplorer'

export interface HelloProps { compiler: string; framework: string; }

export class Hello extends React.Component<HelloProps, {}> {
    render() {
        return (
            <div>
                <h1>Hello from {this.props.compiler} and a {this.props.framework}!</h1>;
                <RoomExplorer />
            </div>
        )
    }
}
