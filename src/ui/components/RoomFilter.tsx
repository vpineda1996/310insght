import * as React from 'react';
import InputRange = require('react-input-range');

require('../styles/InputRange.scss');
require('../styles/sidebar.scss');

export interface FilterDefaultProps {
    connectors: string[];
    onConnectorChange: any;
    onFieldChange: any;
    onNewNestedFiter: any;
    onOperatorChange: any;
    onRangeChange: any;
    onTextValueChange: any;
    operators: string[];
    options: Filters;
    range: {[field:string]: Range};
}

export interface FilterOptionProps {
    depth: number;
    keyId: string;
    [anyprops:string]: any;
    connector: string;
    field: string
    filters: FilterOptionProps[];
    mapoverlay: any
    operatorValues: {[field:string]: string};
    rangeValues: {[field:string]: Range}
    textValues: {[field:string]: string};
    filterDefaultProps: Function;
}

export interface FilterProps extends FilterOptionProps, FilterDefaultProps {}

export enum DataType {
    NUMBER,
    STRING
}

export interface Filters {
    [field: string]: DataType;
}

export interface Range {
    min: number
    max: number
}

export class RoomFilter extends React.Component<FilterProps, {}> {
    renderDropdown = () => (
        <select onChange={this.props.onFieldChange}>
            {Object.keys(this.props.options).map((field: string, index: number) => (
                <option
                    key={'room-filter-option-'+index}
                    value={field}>
                    {field}
                </option>))
            }
        </select>
    );

    calcStepSize(range: Range): number {
        let diff = range.max - range.min;
        if (diff % 1 === 0) {
            return 1;
        } else {
            return diff / 1000;
        }
    }

    renderFilterOption = () => {
        if (!!this.props.range) {
            return (
                <div className='range-slider-field'>
                    <InputRange
                        maxValue={this.props.range[this.props.field].max}
                        minValue={this.props.range[this.props.field].min}
                        value={this.props.rangeValues[this.props.field]}
                        onChange={this.props.onRangeChange}
                        onChangeComplete={this.props.onRangeChange}
                        step={this.calcStepSize(this.props.range[this.props.field])}/>
                </div>
            );
        } else {
            return (
                <div><h5>we have no data, sir</h5></div>
            );
        }
    }

    renderTextInput = () => (
        <div>
            <select
                onChange={this.props.onOperatorChange}
                value={this.props.operatorValues[this.props.field]}>
                {this.props.operators.map((operator: string, index: number) => (
                    <option
                        key={'filter-operator-'+index}
                        value={operator}>
                        {operator}
                    </option>))}
            </select>
            <input type='text' value={this.props.textValues[this.props.field]} onChange={this.props.onTextValueChange} />
        </div>
    );

    renderConnector = () => (
        <div>
            <select onChange={this.props.onConnectorChange}>
                {this.props.connectors.map((connector: string, index: number) => (
                    <option
                        key={'filter-connector-'+index}
                        value={connector}>
                        {connector}
                    </option>))}
            </select>
        </div>
    );

    addNestedRule = (e: any) => {
        let or = this, that = this, should = this, fail = this
        this
        or
        that
        should
        fail
        this.props.onNewNestedFiter(this.props);
    }

    render (): any {
        let keys = this.props.keyId.split('-');
        return(
            <div className=''>
                <div className='filter-connector'>
                    {keys[keys.length-1] !== '0' && this.renderConnector()}
                </div>
                <div className='range-slider panel panel-border'>
                    {this.props.filters && this.props.filters.length !== 0 ? (
                        <div>
                            {this.props.filters && this.props.filters.map(filter => (
                                <RoomFilter
                                    key={'room-filter-'+this.props.keyId+'-'+filter.keyId}
                                    {...this.props}
                                    {...this.props.filterDefaultProps(filter.keyId)}
                                    range={this.props.range}
                                    {...filter} />))}
                        </div>) : (
                        <div>
                            {this.renderDropdown()}
                            {this.props.options[this.props.field] === DataType.NUMBER && this.renderFilterOption()}
                            {this.props.options[this.props.field] === DataType.STRING && this.renderTextInput()}
                        </div>)
                    }
                    {this.props.depth === 0 && <button onClick={this.addNestedRule} className=''>Add more rule!</button>}
                </div>
                <div className='divider' />
            </div>
        );
    }
}
