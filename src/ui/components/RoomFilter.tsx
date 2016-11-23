import * as React from 'react';
import InputRange = require('react-input-range');

require('../styles/InputRange.scss');
require('../styles/sidebar.scss');

export interface FilterProps {
    keyId: string;
    options: Filters;
    connector: string;
    connectors: string[];
    operator: {[field:string]: string};
    operators: string[];
    field: string
    textValue: {[field:string]: string};
    values: {[field:string]:{
        min: number;
        max: number;
    }}
    range: {
        min: number;
        max: number;
    }
    onRangeChange: any;
    onFieldChange: any;
    onTextValueChange: any;
    onOperatorChange: any;
    onConnectorChange: any;
    [anyprops:string]: any;
}

export enum DataType {
    NUMBER,
    STRING
}

export interface Filters {
    [field: string]: DataType;
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

    renderFilterOption = () => {
        if (!!this.props.range) {
            return (
                <div className='range-slider-field'>
                    <InputRange
                        maxValue={this.props.range.max}
                        minValue={this.props.range.min}
                        value={this.props.values[this.props.field]}
                        onChange={this.props.onRangeChange} />
                </div>
            );
        } else {
            return (
                <div><h5>no data, sir</h5></div>
            );
        }
    }

    renderTextInput = () => (
        <div>
            <select
                onChange={this.props.onOperatorChange}
                value={this.props.operator[this.props.field]}>
                {this.props.operators.map((operator: string, index: number) => (
                    <option
                        key={'filter-operator-'+index}
                        value={operator}>
                        {operator}
                    </option>))}
            </select>
            <input type='text' value={this.props.textValue[this.props.field]} onChange={this.props.onTextValueChange} />
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

    render () {
        let keys = this.props.keyId.split('-');
        return(
            <div className='range-slider'>
                {keys[keys.length-1] !== '0' && this.renderConnector()}
                {this.renderDropdown()}
                {this.props.options[this.props.field] === DataType.NUMBER && this.renderFilterOption()}
                {this.props.options[this.props.field] === DataType.STRING && this.renderTextInput()}
            </div>
        );
    }
}
