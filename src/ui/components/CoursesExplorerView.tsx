import * as React from "react";
import { AgGridReact } from 'ag-grid-react';
import { Store } from '../store/store'
import { COURSES_COLUMNS, ColumnType, ApplyColumn, QUERY, APPLY_EXTENSION, APPLYTOKENS, SORTDIRECTION } from '../store/constants'

import { WhereCourseSelector } from './WhereCourseSelector'
import { GroupCourseSelector, GroupCourseSelectorState } from './GroupCourseSelector'
import { SortCourseSelector, SortCourseSelectorState } from './SortCourseSelector'

import "../styles/course_explorer.scss";
import 'ag-grid-root/dist/styles/ag-grid.css';
import 'ag-grid-root/dist/styles/theme-fresh.css';

export interface CoursesExplorerViewProps {
    columns?: ColumnType[]
}

export interface CoursesExplorerViewState {
    columns?: ColumnType[],
    groupCols?: ColumnType[],
    applyCols?: ApplyColumn[],
    whereClause? : any,
    sortClause? : any
}

export class CoursesExplorerView extends React.Component<CoursesExplorerViewProps, CoursesExplorerViewState> {

    static defaultProps: CoursesExplorerViewProps = {
        columns: $.extend([], COURSES_COLUMNS)
    }

    api: any;
    columnApi: any;

    constructor(props: any) {
        super(props);
        this.state = $.extend({},this.props, {groupCols: [], applyCols: [], whereClause: {}, sortClause: {}} );
    }

    onFilterChange = (whereClause: any) => {
        this.state.whereClause = whereClause;
        this.query();
    }

    query(){
        this.onColumnShowSelection();
        let query = $.extend({}, QUERY, this.state.whereClause, { GET: this.state.columns.map(v => v.dataset + v.name) });
        if(this.state.groupCols.length){
            $.extend(query, {
                GROUP: this.state.groupCols.map(v => v.dataset + v.name),
                APPLY: this.state.applyCols.map(v => {
                    let aggOp = APPLYTOKENS[v.aggregateType];
                    return {[v.newColId.name] : {[ aggOp ]: v.originalCol.dataset + v.originalCol.name}};
                })
            })
        }
        if(this.state.sortClause.ORDER && this.state.sortClause.ORDER.keys.length){
            $.extend(query, this.state.sortClause);
        }
        if(query.WHERE.AND && !query.WHERE.AND.length) delete query.WHERE.AND;
        Store.fetch('courses', query).then(result => this.api.setRowData(result));
    }
    
    onGroupChange = (cols : GroupCourseSelectorState) => {
        let newCols : ColumnType[] = $.extend([], cols.groupCols);
        cols.applyCols.forEach((aCol) => {
            newCols.push(aCol.newColId);
        })
        this.state.groupCols = cols.groupCols;
        this.state.applyCols = cols.applyCols;
        this.state.columns = newCols;
        this.query();
    }

    onSortChange = (cols : SortCourseSelectorState) => {
        this.state.sortClause = {"ORDER": { 
            "dir": SORTDIRECTION[cols.sortDirection],
             "keys": cols.sortCols.map((oCol) => oCol.dataset + oCol.name)
        }};
        this.query();
    }

    onGridReady = (params: any) => {
        this.api = params.api;
        this.columnApi = params.columnApi;
    };

    onColumnShowSelection = () => {
        this.api.setColumnDefs(this.getHeaderDefinition());
    }

    getHeaderDefinition = () => {
        if(!this.state.columns.length) this.state.columns = COURSES_COLUMNS;
        return this.state.columns.map(colDefn => {
            return { headerName: colDefn.locale, field: colDefn.dataset + colDefn.name }
        });
    }

    render() {
        return <div className="container course-explorer">
            <WhereCourseSelector onStatusChanged={this.onFilterChange} />
            <div className="advanced-controls">
                <GroupCourseSelector columns={COURSES_COLUMNS} className="col-md-7"
                                    onStatusChanged={this.onGroupChange}/>

                <SortCourseSelector columns={this.state.columns} className="col-md-4" ref="sortSelector"
                                    onStatusChanged={this.onSortChange}/>
            </div>
            <div className={"col-md-12 columns-height-courses-explorer table-courses-explorer ag-fresh"}>
                <AgGridReact
                    columnDefs={this.getHeaderDefinition()}
                    onGridReady={this.onGridReady}

                    // or provide props the old way with no binding
                    rowSelection="multiple"
                    enableSorting="true"
                    enableFilter="true"
                    rowHeight="22"
                    rowData={[]}
                    />
            </div>
        </div>;
    }
}