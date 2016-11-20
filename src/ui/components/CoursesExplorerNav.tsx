import * as React from "react";

export interface CoursesExplorerProps {}

export class CoursesExplorerNav extends React.Component<CoursesExplorerProps, {}> {
    static defaultProps : CoursesExplorerProps  = {}

    render() {
        return <div height={"100px"} width={"200px"} > Hello </div>;
    }
}