import * as React from "react";
import { AgGridReact } from 'ag-grid-react';
import { Store } from '../store/store'
import { COURSES_COLUMNS, ColumnType, QUERY, APPLY_EXTENSION, APPLYTOKENS } from '../store/constants'
import { DataUploader, Uploadable } from './DataUploader';
import { WhereCourseSelector } from './WhereCourseSelector'

import "../styles/course_explorer.scss";
import 'ag-grid-root/dist/styles/ag-grid.css';
import 'ag-grid-root/dist/styles/theme-fresh.css';

export interface CoursesExplorerViewProps {
    columns?: ColumnType[]
}

export interface CoursesExplorerViewState {
    columns?: ColumnType[]
}

export class CoursesExplorerView extends React.Component<CoursesExplorerViewProps, CoursesExplorerViewState> {

    static defaultProps: CoursesExplorerViewProps = {
        columns: $.extend([], COURSES_COLUMNS)
    }

    api: any;
    columnApi: any;

    constructor(props: any){
        super(props);
        this.state = this.props;
    }

    onFilterChange(whereClause: any) {
        let query = $.extend({}, QUERY, whereClause, { GET: this.state.columns.map(v => v.dataset + v.name) });
        Store.fetch('courses', query).then(result => this.api.setRowData(result));
    }

    onGridReady(params: any) {
        this.api = params.api;
        this.columnApi = params.columnApi;
    };

    onColumnShowSelection(selectedCols : ColumnType[]) {
        this.api.setColumnDefs(this.getHeaderDefinition())
    }

    getHeaderDefinition() {
        return this.state.columns.map(colDefn => {
            return { headerName: colDefn.locale, field: colDefn.dataset + colDefn.name }
        });
    }

    render() {
        return <div className="container course-explorer">
            <WhereCourseSelector onStatusChanged={this.onFilterChange.bind(this)} />
            <GroupCourseSelector columns={this.state.columns}/>
            <div className={"columns-height-courses-explorer table-courses-explorer ag-fresh"}>
                <AgGridReact 
                    columnDefs={this.getHeaderDefinition()}
                    onGridReady={this.onGridReady.bind(this)}

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

interface GroupCourseSelectorProps {
    columns: ColumnType[]
}

interface ApplyColumns {
    originalCol: ColumnType,
    newColId: ColumnType,
    aggregateType: APPLYTOKENS
}

interface GroupCourseSelectorState { 
    groupCols: ColumnType[];
    applyCols: ApplyColumns[]
}

class GroupCourseSelector extends React.Component<GroupCourseSelectorProps, GroupCourseSelectorState> {
    
    constructor(args: any) {
        super(args);
        this.state = {
            groupCols: [],
            applyCols: []
        }
    }

    allowDrop(ev: React.DragEvent<HTMLDivElement>){
        ev.preventDefault();       
    }

    drag(ev : React.DragEvent<HTMLDivElement>, oCol: ColumnType){
        ev.dataTransfer.setData("text/plain", JSON.stringify(oCol));
    }

    dropOnGroup(ev: any){
        ev.preventDefault(); 
        var oCol = JSON.parse(ev.dataTransfer.getData("text/plain"));
        this.setState((prev) => {
            prev.groupCols.push(oCol);
            return prev;
        });
    }

    dropOnApply(ev: any){
        ev.preventDefault(); 
        var oCol : ColumnType = JSON.parse(ev.dataTransfer.getData("text/plain"));
        this.setState((prev) => {
            prev.applyCols.push({
                originalCol: oCol,
                newColId: oCol,
                aggregateType: APPLYTOKENS.AVG
            });
            return prev;
        });
    }

    onGroupButtonClick(oButtonCol: ColumnType){
        let idx = -1;
        this.state.groupCols.some((oCol, i) => {
            if (oCol.name === oButtonCol.name){
                idx = i;
                return true;
            }
        });
        this.setState((prev) => {
            prev.groupCols.splice(idx, 1);
            return prev;
        })
    }

    onApplyButtonClick(oButtonCol: ApplyColumns){
        let idx = -1;
        this.state.applyCols.some((oCol, i) => {
            if (oCol.newColId.name === oButtonCol.newColId.name){
                idx = i;
                return true;
            }
        });
        this.setState((prev) => {
            prev.applyCols.splice(idx, 1);
            return prev;
        })
    }

    renderButtonDefn() {
        return this.props.columns.filter((oCol) => {
            return !this.state.groupCols.find((groupCol) => {
                return groupCol.name === oCol.name;
            });
        }).map((oCol, idx) =>{
            return <div draggable={true} type="button" className="col-sm-6 btn btn-default" 
                        onDragStart={(ev) => { this.drag(ev, oCol)}} 
                        ref={oCol.name} key={idx}>{oCol.locale}
                   </div>
        });
    }

    renderGroupButtons(){
        return this.state.groupCols.map((oCol, idx) => {
            return <div type="button" className="col-sm-6 btn btn-default" 
                        onClick={this.onGroupButtonClick.bind(this, oCol)}
                        ref={oCol.name} key={idx}>{oCol.locale}
                   </div>
        });
    }

    renderApplyButtons(){
        return this.state.applyCols.map((oCol, idx) => {
            return <div type="button" className="col-sm-6 btn btn-default" 
                        onClick={this.onApplyButtonClick.bind(this, oCol)}
                        ref={oCol.newColId.name} key={idx}>{oCol.newColId.locale}
                   </div>
        });
    }

    render() {
        return <div className="row group-selector">
            <div className="col-md-3 flex-vertical col-defn">{this.renderButtonDefn()}</div>
            <div className="col-md-9 flex-vertical">
                <div className="group-section" onDrop={this.dropOnGroup.bind(this)} 
                     onDragOver={this.allowDrop.bind(this)}>{this.renderGroupButtons()}</div>
                <div className="apply-section" onDrop={this.dropOnApply.bind(this)} 
                     onDragOver={this.allowDrop.bind(this)}>{this.renderApplyButtons()}</div>
            </div>
        </div>;
    }
}

interface ColumnsSelectorProps {
    cols: ColumnType[],
    onSelectColumn: Function,
    name: string
}

interface ColumnsSelectorState {
    cols: ColumnType[]
}

class ColumnsSelector extends React.Component<ColumnsSelectorProps, ColumnsSelectorState> {

    constructor(props : ColumnsSelectorProps) {
        super(props);
        this.state = {
            cols: []
        };
    }

    onSelectColumn(oCol: ColumnType){
        let oButton : any = this.refs[oCol.name];
        let $button = $(oButton);
        $button.hasClass("active") ? $button.removeClass("active") : $button.addClass("active");
        this.props.onSelectColumn(this.updateState());
    }

    updateState(){
        let aCols = this.props.cols.filter((oCol) => {
            let oButton = this.refs[oCol.name];
            let $button = $(oButton);
            return $button.hasClass("active");
        });

        this.setState((p) => {
            p.cols = aCols;
            return p;
        });

        return aCols;
    }
    
    renderButtons(){
        return this.props.cols.map((oCol, idx) => {
            return <button type="button" className="col-sm-1 btn btn-default" 
                           ref={oCol.name} key={idx} onClick={() => this.onSelectColumn(oCol)}>
                                {oCol.locale}
                   </button>
        });
    }

    render() {
        return <div className="row col-selector">
                    <div className="col-md-1 col-selector-label">{this.props.name}</div>
                    {this.renderButtons()}
               </div>;
    }
}
