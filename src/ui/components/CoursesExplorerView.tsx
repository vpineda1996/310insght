import * as React from "react";
import { AgGridReact } from 'ag-grid-react';
import { Store } from '../store/store'
import { COURSES_COLUMNS, ColumnType, ApplyColumn, QUERY, APPLY_EXTENSION, APPLYTOKENS, SORTDIRECTION } from '../store/constants'

import { WhereCourseSelector } from './WhereCourseSelector'
import { GroupCourseSelector, GroupCourseSelectorState } from './GroupCourseSelector'
import { SortCourseSelector, SortCourseSelectorState } from './SortCourseSelector'
import { TableModal, TableModalState } from './TableModal'

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

    constructor(props: any) {
        super(props);
        this.state = $.extend({},this.props, {groupCols: [], applyCols: [], whereClause: {}, sortClause: {}} );
    }

    onFilterChange = (whereClause: any) => {
        this.state.whereClause = whereClause;
    }

    query = () => {
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
        Store.fetch('courses', query).then(result => this.activateTable(result));
    }
    
    onGroupChange = (cols : GroupCourseSelectorState) => {
        let newCols : ColumnType[] = $.extend([], cols.groupCols);
        cols.applyCols.forEach((aCol) => {
            newCols.push(aCol.newColId);
        })
        this.state.groupCols = cols.groupCols;
        this.state.applyCols = cols.applyCols;
        this.updateColumnDefinition(newCols);
    }

    onSortChange = (cols : SortCourseSelectorState) => {
        this.state.sortClause = {"ORDER": { 
            "dir": SORTDIRECTION[cols.sortDirection],
             "keys": cols.sortCols.map((oCol) => oCol.dataset + oCol.name)
        }};
    }

    activateTable(rowData : any){
        let table : any = this.refs["table-modal"];
        table.setState({
            isOpen: true,
            rowData: rowData,
            columns: this.state.columns
        });
    }

    updateColumnDefinition = (cols: ColumnType[]) => {
        this.state.columns = cols;
        if(!this.state.columns.length) this.state.columns = COURSES_COLUMNS;

        let sortDiv :any = this.refs["sortSelector"];
        sortDiv.setState({
            sortCols: [],
            sortDirection: SORTDIRECTION.UP,
            nonSortCols: this.state.columns 
        });
    }

    render() {
        return <div className="container course-explorer">
            <div className="flex-row where-panel-row">
                <div className={"panel panel-primary col-sm-12 where-panel"}>
                    <div className="panel-heading">Where Selector</div>
                    <div className="panel-body">
                        <WhereCourseSelector onStatusChanged={this.onFilterChange} />  
                    </div>
                </div>
            </div>
            <div className="advanced-controls">
                <GroupCourseSelector columns={COURSES_COLUMNS} className="col-md-7"
                                    onStatusChanged={this.onGroupChange}/>

                <SortCourseSelector columns={this.state.columns} className="col-md-4" ref="sortSelector"
                                    onStatusChanged={this.onSortChange}/>
            </div>
            <div className="flex-row flex-button">
                    <div type="button" className="col-sm-11 btn btn-primary bottom-button" 
                         onClick={this.query}>Query!</div>
            </div>
            <TableModal ref="table-modal"/>
        </div>;
    }
}