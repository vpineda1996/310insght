import * as React from "react";
import { ColumnType, SORTDIRECTION } from '../store/constants'

export interface SortCourseSelectorProps {
    columns: ColumnType[],
    onStatusChanged : Function,
    className: string
}

export interface SortCourseSelectorState {
    sortCols: ColumnType[];
    sortDirection: SORTDIRECTION;
}

export class SortCourseSelector extends React.Component<SortCourseSelectorProps, SortCourseSelectorState> {

    constructor(args: any) {
        super(args);
        this.state = {
            sortCols: [],
            sortDirection: SORTDIRECTION.UP
        }
    }

    allowDrop = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
    }

    drag = (ev: React.DragEvent<HTMLDivElement>, oCol: ColumnType) => {
        ev.dataTransfer.setData("text/plain", JSON.stringify(oCol));
    }

    dropOnSort = (ev: any) => {
        ev.preventDefault();
        var oCol = JSON.parse(ev.dataTransfer.getData("text/plain"));
        this.state.sortCols.push(oCol);
        this.setState(this.state);
        this.props.onStatusChanged(this.state);
    }

    onSortButtonClick = (oButtonCol: ColumnType) => {
        let idx = -1;
        this.state.sortCols.some((oCol, i) => {
            if (oCol.name === oButtonCol.name) {
                idx = i;
                return true;
            }
        });
        this.state.sortCols.splice(idx, 1);
        this.setState(this.state);
        this.props.onStatusChanged(this.state);
    }

    onSortOrderChanged = (ev: React.FormEvent<HTMLElement>) => {
        this.state.sortDirection = parseInt($(ev.target).val(), 10);
        this.props.onStatusChanged(this.state);
    }

    renderButtonDefn = () => {
        return this.props.columns.filter((oCol) => {
            return !this.state.sortCols.find((groupCol) => {
                return groupCol.name === oCol.name;
            });
        }).map((oCol, idx) => {
            return <div draggable={true} type="button" className="col-sm-6 btn btn-default"
                onDragStart={(ev) => { this.drag(ev, oCol) } }
                ref={oCol.name} key={idx}>{oCol.locale}
            </div>
        });
    }

    renderSortButtons = () => {
        return this.state.sortCols.map((oCol, idx) => {
            return <div type="button" className="col-sm-12 btn btn-info sort-btn"
                onClick={this.onSortButtonClick.bind(this, oCol)}
                ref={oCol.name} key={idx}>{oCol.locale}
            </div>
        });
    }

    renderOptions() {
        return SORTDIRECTION.indices().map((val) => {
            return <option value={val} key={val}>{SORTDIRECTION[val]}</option>
        });
    }

    render() {
        return <div className={"panel panel-primary sort-selector " + this.props.className}>
            <div className="panel-heading">Sort Selector</div>
            <div className="panel-body">
                <div>
                     <select className="form-control" id="selct" defaultValue={'0'} onChange={this.onSortOrderChanged}>
                        {this.renderOptions()}
                    </select>
                </div>
                <div className="sort-selector-body">
                    <div className="col-md-7 flex-vertical col-defn">{this.renderButtonDefn()}</div>
                    <div className="col-md-5 flex-vertical">
                        <div className="panel-group">
                            <div className="panel panel-info flex-row">
                                <div className="panel-body sort-section flex-vertical col-sm-11" onDrop={this.dropOnSort}
                                    onDragOver={this.allowDrop}>{this.renderSortButtons()}</div>
                                <div className="panel-heading col-sm-1">
                                    <div className="label-sort-selector">Sort Order</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>;
    }
}