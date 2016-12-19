import * as React from "react";
import { ColumnType, RangeSelectorData } from '../store/constants'
import InputRange = require('react-input-range');
import { RangeCreatorModal } from './RangeCreatorModal'

interface WhereRangeSelectorProps {
    onRangeChange: Function;
}

interface WhereRangeSelectorState {
    rangeColums: RangeSelectorData[];
}

export class WhereRangeSelector extends React.Component<WhereRangeSelectorProps, WhereRangeSelectorState> {
    static defaultProps : any = {
    }
    constructor(p : any) {
        super(p);
        this.state = {
            rangeColums: []
        }
    }

    onRangeChange = (idx : number, element: any, val : any ) => {
        let rangeCol = this.state.rangeColums[idx];
        rangeCol.selectedMin = val.min;
        rangeCol.selectedMax = val.max;
        this.setState(this.state);
    }

    onDoneChangingRange = () => {
        this.props.onRangeChange(this.state.rangeColums);
    }
    
    onAddInputRange = () => {
        let rangeModal : any = this.refs["rangeModal"];
        rangeModal.setState({
            isOpen: true
        });
    }

    onOkModal = (rangeCol : RangeSelectorData) => {
        this.state.rangeColums.push(rangeCol);
        this.setState(this.state);
    } 


    renderInputRange() {
        return this.state.rangeColums.map((rangeCol, idx) => {
            return <div className="col-sm-4 col-md-3 range-selector-where" key={idx}>
                        <p className="card-title card-bottom-range">{rangeCol.col.locale}</p>
                        <InputRange
                            maxValue={rangeCol.max}
                            minValue={rangeCol.min}
                            value={{min: rangeCol.selectedMin || rangeCol.min, max: rangeCol.selectedMax || rangeCol.max}}
                            onChange={(e, v) => this.onRangeChange(idx, e, v)}
                            onChangeComplete={this.onDoneChangingRange} />
                    </div>
        });
        
    }

    render() {
        return <div className='range-slider-field'>
            <div>
                <div className="row slider-row">
                    {this.renderInputRange()}
                    <div className="col-sm-12 col-md-2 flex-vertical flex-vertical-justify">
                        <button type="button" className="btn" onClick={this.onAddInputRange}>Add Range Filter</button>
                    </div>
                </div>
            </div>
            <RangeCreatorModal isOpen={false} onOk={this.onOkModal} ref={"rangeModal"}/>
        </div>;
    }
}