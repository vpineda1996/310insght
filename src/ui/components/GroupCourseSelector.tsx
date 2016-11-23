import * as React from "react";
import { ApplyModal } from './ApplyModal'
import { COURSES_COLUMNS, ColumnType, ApplyColumn, QUERY, APPLY_EXTENSION, APPLYTOKENS } from '../store/constants'

export interface GroupCourseSelectorProps {
    columns: ColumnType[],
    onStatusChanged : Function,
    className: string
}

export interface GroupCourseSelectorState {
    groupCols: ColumnType[];
    applyCols: ApplyColumn[];
    modalActive?: ColumnType
}

export class GroupCourseSelector extends React.Component<GroupCourseSelectorProps, GroupCourseSelectorState> {

    constructor(args: any) {
        super(args);
        this.state = {
            groupCols: [],
            applyCols: []
        }
    }

    allowDrop = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
    }

    drag = (ev: React.DragEvent<HTMLDivElement>, oCol: ColumnType) => {
        ev.dataTransfer.setData("text/plain", JSON.stringify(oCol));
    }

    dropOnGroup = (ev: any) => {
        ev.preventDefault();
        var oCol = JSON.parse(ev.dataTransfer.getData("text/plain"));
        this.state.groupCols.push(oCol);
        this.setState(this.state);
        this.props.onStatusChanged(this.state);
    }

    dropOnApply = (ev: any) => {
        ev.preventDefault();
        var oCol: ColumnType = JSON.parse(ev.dataTransfer.getData("text/plain"));
        
        this.state.modalActive = oCol;
        this.setState(this.state);
        this.props.onStatusChanged(this.state);
    }

    onSuccessApplyModal = (newCol : ApplyColumn) => {
        this.state.applyCols.push(newCol);
        this.onCloseModal();
    }

    onCloseModal = () => {
        this.setState(this.state);
        this.state.modalActive = null;
        this.props.onStatusChanged(this.state);
    }

    onGroupButtonClick = (oButtonCol: ColumnType) => {
        let idx = -1;
        this.state.groupCols.some((oCol, i) => {
            if (oCol.name === oButtonCol.name) {
                idx = i;
                return true;
            }
        });
        this.state.groupCols.splice(idx, 1);
        this.setState(this.state);
        this.props.onStatusChanged(this.state);
    }

    onApplyButtonClick = (oButtonCol: ApplyColumn) => {
        let idx = -1;
        this.state.applyCols.some((oCol, i) => {
            if (oCol.newColId.name === oButtonCol.newColId.name) {
                idx = i;
                return true;
            }
        });
        this.state.applyCols.splice(idx, 1);
        this.setState(this.state);
        this.props.onStatusChanged(this.state);
    }

    renderButtonDefn = () => {
        return this.props.columns.filter((oCol) => {
            return !this.state.groupCols.find((groupCol) => {
                return groupCol.name === oCol.name;
            });
        }).map((oCol, idx) => {
            return <div draggable={true} type="button" className="col-sm-6 btn btn-default"
                onDragStart={(ev) => { this.drag(ev, oCol) } }
                ref={oCol.name} key={idx}>{oCol.locale}
            </div>
        });
    }

    renderGroupButtons = () => {
        return this.state.groupCols.map((oCol, idx) => {
            return <div type="button" className="col-sm-6 btn btn-info group-btn"
                onClick={this.onGroupButtonClick.bind(this, oCol)}
                ref={oCol.name} key={idx}>{oCol.locale}
            </div>
        });
    }

    renderApplyButtons = () => {
        return this.state.applyCols.map((oCol, idx) => {
            return <div type="button" className="col-sm-6 btn btn-success apply-btn"
                onClick={this.onApplyButtonClick.bind(this, oCol)}
                ref={oCol.newColId.name} key={idx}>
                    <div className="original-apply">
                        <span>Type: </span>
                        {APPLYTOKENS[oCol.aggregateType]}
                    </div>
                    <div className="new-apply">
                        <span>New: </span>
                        {oCol.newColId.locale}
                    </div>
            </div>
        });
    }

    render() {
        return <div className={"panel panel-primary group-selector " + this.props.className}>
            <div className="panel-heading">Group Selector</div>
            <div className="panel-body group-selector-body">
                <div className="col-md-5 flex-vertical col-defn">{this.renderButtonDefn()}</div>
                <div className="col-md-7 flex-vertical">
                    <div className="panel-group">
                        <div className="panel panel-info flex-row">
                            <div className="panel-body group-section flex-vertical col-sm-11" onDrop={this.dropOnGroup}
                                onDragOver={this.allowDrop}>{this.renderGroupButtons()}</div>
                            <div className="panel-heading col-sm-1">
                                <div className="label-group-selector">Group By</div>
                            </div>
                        </div>
                        <div className="panel panel-success flex-row">    
                            <div className="panel-body apply-section flex-vertical col-sm-11" onDrop={this.dropOnApply}
                                onDragOver={this.allowDrop}>{this.renderApplyButtons()}</div>
                            <div className="panel-heading col-sm-1">
                                <div className="label-group-selector">Apply Columns</div>
                            </div>
                        </div>
                    </div>
                </div>
                <ApplyModal isOpen={!!this.state.modalActive} 
                            onOk={this.onSuccessApplyModal} 
                            onCancel={this.onCloseModal}
                            orginalColumn={this.state.modalActive}/>
            </div>
        </div>;
    }
}