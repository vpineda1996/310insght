import * as React from "react";
import { AgGridReact } from 'ag-grid-react';
import { Store } from '../store/store'
import { COURSES_COLUMNS, ColumnType } from '../store/constants'

import "../styles/course_explorer.scss";
import 'ag-grid-root/dist/styles/ag-grid.css';
import 'ag-grid-root/dist/styles/theme-fresh.css';

export interface CoursesExplorerViewProps {
    columns?: ColumnType[]
}

export class CoursesExplorerView extends React.Component<CoursesExplorerViewProps, {}> {

    static defaultProps: CoursesExplorerViewProps = {
        columns: $.extend([], COURSES_COLUMNS)
    }

    api: any;
    columnApi: any;

    onFilterChange(whereClause: any) {
        let query = $.extend({}, QUERY, whereClause, { GET: this.props.columns.map(v => 'courses_' + v.name) });
        Store.fetch('courses', query).then(result => this.api.setRowData(result));
    }

    onGridReady(params: any) {
        this.api = params.api;
        this.columnApi = params.columnApi;
    };

    getHeaderDefinition() {
        return this.props.columns.map(colDefn => {
            return { headerName: colDefn.name, field: 'courses_' + colDefn.name }
        })
    }

    render() {
        return <div className="container course-explorer">
            <CourseSelector onStatusChanged={this.onFilterChange.bind(this)} />
            <div className={"columns-height-courses-explorer ag-dark"}><AgGridReact columnDefs={this.getHeaderDefinition()}
                onGridReady={this.onGridReady.bind(this)}

                // or provide props the old way with no binding
                rowSelection="multiple"
                enableSorting="true"
                enableFilter="true"
                rowHeight="22"
                rowData={[]}
                /></div>
        </div>;
    }
}
enum COLUMNS {
    PROFESSOR,
    DEPARTMENT,
    COURSE,
    YEAR
}

const QUERY: any = {
    "GET": [],
    "WHERE": {},
    "AS": "TABLE"
};

const APPLY_EXTENSION: any = {
    "GROUP": [],
    "APPLY": []
};

interface CourseSelectorProps {
    onStatusChanged: Function
}

class CourseSelector extends React.Component<CourseSelectorProps, {}> {
    staticColumns = [COLUMNS.DEPARTMENT, COLUMNS.PROFESSOR, COLUMNS.YEAR];

    getWhereComponent() {
        let possibleAndCols = this.staticColumns;

        let fnGetColTypeWhereClause = function (columnId: COLUMNS) {
            return columnId === COLUMNS.YEAR ? "EQ" : "IS";
        }

        let fnGetOrQuery = function (columnId: COLUMNS) {
            let api = this.refs[columnId.toString()].api;
            let selectedRows = api.getSelectedRows();
            if (!selectedRows.length) return;
            return selectedRows.map((e: any) => {
                for (var i in e) return e[i];
            }).map((e: any) => {
                return { [fnGetColTypeWhereClause(columnId)]: { [getDatasetId(columnId)]: e } };
            });
        }.bind(this);

        let orStatements = possibleAndCols.map((colsToSearch) => {
            return { OR: fnGetOrQuery(colsToSearch) };
        }).filter(val => val.OR);
        return { WHERE: { "AND": orStatements } };
    }

    extendWhereToCourse(originalQuery: any) {
        let ref: any = this.refs[COLUMNS.COURSE]
        let api: any = ref.api;
        let selectedRows = api.getSelectedRows();
        if (!selectedRows.length) return;
        let newSelection = selectedRows.map((e: any) => {
            for (var i in e) return e[i];
        }).map((e: any) => {
            return { EQ: { [getDatasetId(COLUMNS.COURSE)]: e } };
        });
        $.extend(originalQuery.WHERE.AND, [{ OR: newSelection}]);
        return originalQuery;
    }

    queryCourses() {
        this.getData(COLUMNS.COURSE, this.getWhereComponent()).then((datum) => {
            return this.setData(COLUMNS.COURSE, datum);
        }).then(() => {
            this.props.onStatusChanged(this.extendWhereToCourse(this.getWhereComponent()));
        });
    }

    componentDidMount() {
        this.getData(COLUMNS.YEAR).then((data: any) => {
            return this.setData(COLUMNS.YEAR, data);
        });
        this.getData(COLUMNS.PROFESSOR).then((data: any) => {
            return this.setData(COLUMNS.PROFESSOR, data);
        });
        this.getData(COLUMNS.DEPARTMENT).then((data: any) => {
            return this.setData(COLUMNS.DEPARTMENT, data);
        });
    }

    setData(columnId: COLUMNS, data: Array<string | number>) {
        let refs: any = this.refs;
        let column: Column = refs[columnId.toString()];

        column.api.setRowData(data);
    }

    getData(columnId: COLUMNS, q?: any): Promise<Array<string | number>> {
        let query = $.extend({}, QUERY, APPLY_EXTENSION, { "GET": [getDatasetId(columnId)], "GROUP": [getDatasetId(columnId)] }, q);
        return Store.fetch('courses', query);
    }

    onStatusChanged() {
        this.props.onStatusChanged(this.extendWhereToCourse(this.getWhereComponent()));
    }

    render() {
        return <div className="row flex-row hide-overflow">
            <Column className="col-md-3 columns-height-courses-explorer" name="Year"
                onSelectOption={this.queryCourses.bind(this)} ref={COLUMNS.YEAR.toString()}
                fieldId={getDatasetId(COLUMNS.YEAR)} />
            <Column className="col-md-3 columns-height-courses-explorer" name="Professor"
                onSelectOption={this.queryCourses.bind(this)} ref={COLUMNS.PROFESSOR.toString()}
                fieldId={getDatasetId(COLUMNS.PROFESSOR)} />
            <Column className="col-md-3 columns-height-courses-explorer" name="Department"
                onSelectOption={this.queryCourses.bind(this)} ref={COLUMNS.DEPARTMENT.toString()}
                fieldId={getDatasetId(COLUMNS.DEPARTMENT)} />
            <Column className="col-md-3 columns-height-courses-explorer" name="Course"
                onSelectOption={this.onStatusChanged.bind(this)} ref={COLUMNS.COURSE.toString()}
                fieldId={getDatasetId(COLUMNS.COURSE)} />
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