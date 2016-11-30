import * as React from "react";
import { Store } from '../store/store'
import { COLUMNS, QUERY, APPLY_EXTENSION, COURSES_ID, RangeSelectorData } from '../store/constants'
import { Column } from './Column';
import InputRange = require('react-input-range');
import { RangeCreatorModal } from './RangeCreatorModal'
import { WhereRangeSelector } from './WhereRangeSelector'

export interface CourseSelectorProps {
    onStatusChanged: Function
}

export interface CourseSelectorState { 
    filterSlidersAnd: any[];
}

export class WhereCourseSelector extends React.Component<CourseSelectorProps, CourseSelectorState> {
    staticColumns = [COLUMNS.DEPARTMENT, COLUMNS.PROFESSOR, COLUMNS.YEAR];

    constructor(p: any){
        super(p);
        this.state = {
            filterSlidersAnd: []
        };
    }

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
        Array.prototype.push.apply(orStatements, this.state.filterSlidersAnd);
        return { WHERE: { "AND": orStatements } };
    }

    extendWhereToCourse(originalQuery: any) {
        let ref: any = this.refs[COLUMNS.COURSE]
        let api: any = ref.api;
        let selectedRows = api.getSelectedRows();
        if (!selectedRows.length) return originalQuery;
        let newSelection = selectedRows.map((e: any) => {
            for (var i in e) return e[i];
        }).map((e: any) => {
            return { EQ: { [getDatasetId(COLUMNS.COURSE)]: e } };
        });
        originalQuery.WHERE.AND.push({ OR: newSelection});
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
            return this.setData(COLUMNS.PROFESSOR, data.filter((d : any) => d[getDatasetId(COLUMNS.PROFESSOR)] !== ""));
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

    onRangeChange = (rangeCols : RangeSelectorData[]) => {
        let accum : any[] = [];
        let rangeWhere : any[] = rangeCols.reduce((prev,rangeCols) => {
            accum.push({
                "GT":  {[rangeCols.col.dataset + rangeCols.col.name]: (rangeCols.selectedMin || rangeCols.min) }
            });
            accum.push({
                "LT":  {[rangeCols.col.dataset + rangeCols.col.name]: (rangeCols.selectedMax || rangeCols.max) }
            });
            return accum;
        },accum);
        this.state.filterSlidersAnd = rangeWhere;
        this.queryCourses();
    }

    render() {
        return <div>
            <div className="flex-vertical"> 
                <div className="flex-row hide-overflow">
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
                </div>
            </div>
            <WhereRangeSelector onRangeChange={this.onRangeChange} />
        </div>;
    }
}

function getDatasetId(columnId: COLUMNS): string {
    // Harcoding happening here
    switch (columnId) {
        case COLUMNS.PROFESSOR:
            return COURSES_ID + "_instructor";
        case COLUMNS.DEPARTMENT:
            return COURSES_ID + "_dept";
        case COLUMNS.COURSE:
            return COURSES_ID + "_id";
        case COLUMNS.YEAR:
            return COURSES_ID + "_year";
        default:
            throw new Error("wat");
    }
}