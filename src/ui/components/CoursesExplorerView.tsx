import * as React from "react";
import { AgGridReact } from 'ag-grid-react';
import { Store } from '../store/store'

import "../styles/course_explorer.scss";
import 'ag-grid-root/dist/styles/ag-grid.css';
import 'ag-grid-root/dist/styles/theme-fresh.css';

export interface CoursesExplorerViewProps { }

export class CoursesExplorerView extends React.Component<CoursesExplorerViewProps, {}> {

    static defaultProps: CoursesExplorerViewProps = {}

    render() {
        return <div className="container course-explorer">
                <CourseSelector />
                </div>;
    }
}

interface SelectedElements {
    prof : { [selectedKey: string]: boolean},
    dept : { [selectedKey: string]: boolean},
    course : { [selectedKey: string]: boolean},
    year : { [selectedKey: string]: boolean}
}

class CourseSelector extends React.Component<{}, {}> {
    selectedElements : SelectedElements = {
        prof: {},
        dept: {},
        course: {},
        year: {}
    };

    onSelectProf(){

    }

    onSelectDept(){

    }

    onSelectCourse(){

    }

    onSelectYear(){

    }

    render() {
        return <div className="row flex-row">
            <Column className="col-md-3 columns-height-courses-explorer" name="Professor" 
                onSelectOption={this.onSelectProf.bind(this)}/>
            <Column className="col-md-3 columns-height-courses-explorer" name="Department"
                onSelectOption={this.onSelectDept.bind(this)}/>
            <Column className="col-md-3 columns-height-courses-explorer" name="Course"
                onSelectOption={this.onSelectCourse.bind(this)}/>
            <Column className="col-md-3 columns-height-courses-explorer" name="Year"
                onSelectOption={this.onSelectYear.bind(this)}/>
        </div>;
    }
}

interface ColumnProps { 
    data?: Array<string>,
    name?: string,
    onSelectOption?: Function,
    className?: string
}

class Column extends React.Component<ColumnProps, {}> {
    static defaultProps: ColumnProps = {
        className: "",
        data: [],
        name: "Example",
        onSelectOption: () => {}
    };

    api :any;
    columnApi : any;
    data: Array<number|string>;

    onGridReady(params : any) {
        this.api = params.api;
        this.columnApi = params.columnApi;
        this.api.sizeColumnsToFit()
        console.log('onGridReady');
    };

    render() {
        return <div className={"ag-fresh " + this.props.className}>
                <AgGridReact

                    // listen for events with React callbacks
                    // onRowSelected={this.onRowSelected.bind(this)}
                    // onCellClicked={this.onCellClicked.bind(this)}
                    onGridReady={this.onGridReady.bind(this)}

                    // binding to properties within React State or Props
                    // showToolPanel={this.state.showToolPanel}
                    // quickFilterText={this.state.quickFilterText}
                    // icons={this.state.icons}

                    // column definitions and row data are immutable, the grid
                    // will update when these lists change
                    columnDefs={[
                        {headerName: '', width: 30, checkboxSelection: true, suppressSorting: true,
                             suppressMenu: true, pinned: true, cellClass: "cell-centered"},
                        {headerName: this.props.name, field: "a",}
                    ]}
                    rowData={this.props.data.map(d => {return {a: d}; })}

                    // or provide props the old way with no binding
                    rowSelection="multiple"
                    enableSorting="true"
                    enableFilter="true"
                    rowHeight="22"
                    />
                </div>;
    }
}
