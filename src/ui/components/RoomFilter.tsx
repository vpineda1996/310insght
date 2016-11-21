import * as React from 'react';
import InputRange = require('react-input-range');

require('../styles/InputRange.scss');
require('../styles/sidebar.scss');

export interface FilterProps {
    keyId: string;
    options: Filters;
    connector: string;
    connectors: string[];
    operator: string;
    operators: string[];
    field: string
    values: {
        min: number;
        max: number;
    }
    textValue: string;
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
    renderDropdown = () => {
        return <select onChange={this.props.onFieldChange}>
            {Object.keys(this.props.options).map((field: string, index: number) => (
                <option
                    key={'room-filter-option-'+index}
                    value={field}>
                    {field}
                </option>))
            }
        </select>
    }

    handleDropdownSelect = (e: any) => {
        this.setState({ value: e.target.value });
    }

    renderFilterOption = () => {
        return (
            <div className='range-slider-field'>
                <InputRange
                    maxValue={20}
                    minValue={0}
                    value={this.props.values}
                    onChange={this.props.onRangeChange} />
            </div>
        );
    }

    renderTextInput = () => {
        return (
            <div>
                <select onChange={this.props.onOperatorChange}>
                    {this.props.operators.map((operator: string, index: number) => (
                        <option
                            key={'filter-operator-'+index}
                            value={operator}>
                            {operator}
                        </option>))}
                </select>
                <input type='text' onChange={this.props.onTextValueChange} />
            </div>
        );
    }

    renderConnector = () => {
        return (
            <div>
                <select onChange={this.props.onConnectorChange}>
                    {this.props.connectors.map((connector: string, index: number) => (
                        <option
                            key={'filter-connector-'+index}
                            value={connector}>
                            {connector}
                        </option>))}
                </select>
                <input type='text' onChange={this.props.onTextValueChange} />
            </div>
        );
    }

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
