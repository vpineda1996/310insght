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
    prof: { [selectedKey: string]: boolean },
    dept: { [selectedKey: string]: boolean },
    course: { [selectedKey: string]: boolean },
    year: { [selectedKey: string]: boolean }
}

enum COLUMNS {
    PROFESSOR,
    DEPARTMENT,
    COURSE,
    YEAR
}

function getDatasetId(columnId: COLUMNS): string {
        // Harcoding happening here
        switch (columnId) {
            case COLUMNS.PROFESSOR:
                return "courses_instructor";
            case COLUMNS.DEPARTMENT:
                return "courses_dept";
            case COLUMNS.COURSE:
                return "courses_id";
            case COLUMNS.YEAR:
                return "courses_year";
            default:
                throw new Error("wat");
        }
    }

const QUERY: any = {
    "GET": [],
    "WHERE": {},
    "GROUP": [],
    "APPLY": [],
    "AS": "TABLE"
};

class CourseSelector extends React.Component<{}, {}> {
    selectedElements: SelectedElements = {
        prof: {},
        dept: {},
        course: {},
        year: {}
    };

    onSelectProf(api: any) {
        console.log(api.getSelectedRows());
    }

    onSelectDept() {

    }

    onSelectCourse() {

    }

    onSelectYear() {

    }

    componentDidMount() {
        let that = this;
        this.getData(COLUMNS.PROFESSOR).then((data: any) => {
            return this.setData(COLUMNS.PROFESSOR, data);
        });

    }

    setData(columnId: COLUMNS, data: Array<string | number>) {
        let refs: any = this.refs;
        let column : Column = refs[columnId.toString()];

        column.api.setRowData(data);
    }

    getData(columnId: COLUMNS): Promise<Array<string | number>> {
        let query = $.extend(QUERY, { "GET": [getDatasetId(columnId)], "GROUP": [getDatasetId(columnId)] });
        return Store.fetch('courses', query);
    }

    render() {
        return <div className="row flex-row">
            <Column className="col-md-3 columns-height-courses-explorer" name="Professor"
                onSelectOption={this.onSelectProf.bind(this)} ref={COLUMNS.PROFESSOR.toString()} 
                fieldId= {getDatasetId(COLUMNS.PROFESSOR)}/>
            <Column className="col-md-3 columns-height-courses-explorer" name="Department"
                onSelectOption={this.onSelectDept.bind(this)} ref={COLUMNS.DEPARTMENT.toString()}
                fieldId= {getDatasetId(COLUMNS.DEPARTMENT)} />
            <Column className="col-md-3 columns-height-courses-explorer" name="Course"
                onSelectOption={this.onSelectCourse.bind(this)} ref={COLUMNS.COURSE.toString()}
                fieldId= {getDatasetId(COLUMNS.COURSE)} />
            <Column className="col-md-3 columns-height-courses-explorer" name="Year"
                onSelectOption={this.onSelectYear.bind(this)} ref={COLUMNS.YEAR.toString()}
                fieldId= {getDatasetId(COLUMNS.YEAR)} />
        </div>;
    }
}

interface ColumnProps {
    data?: Array<string>,
    name?: string,
    onSelectOption?: Function,
    fieldId: string,
    className?: string
}

class Column extends React.Component<ColumnProps, {}> {
    static defaultProps: ColumnProps = {
        className: "",
        data: [],
        name: "Example",
        fieldId: "a",
        onSelectOption: () => { }
    };

    api: any;
    columnApi: any;
    data: Array<number | string>;

    onGridReady(params: any) {
        this.api = params.api;
        this.columnApi = params.columnApi;
        this.api.sizeColumnsToFit()
        console.log('onGridReady');
    };

    render() {
        return <div className={"ag-bootstrap " + this.props.className}>
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
                    {
                        headerName: '', width: 30, checkboxSelection: true, suppressSorting: true,
                        suppressMenu: true, pinned: true, cellClass: "cell-centered"
                    },
                    { headerName: this.props.name, field: this.props.fieldId }
                ]}
                rowData={this.props.data}
                onSelectionChanged={() => this.props.onSelectOption(this.api)}

                // or provide props the old way with no binding
                rowSelection="multiple"
                enableSorting="true"
                enableFilter="true"
                rowHeight="22"
                />
        </div>;
    }
}
