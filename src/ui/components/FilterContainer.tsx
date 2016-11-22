import * as React from 'react';
import { Store } from '../store/store';
import { RoomFilter, FilterProps, DataType, Filters } from './RoomFilter';

interface FilterContainerProps {
    dataId: string;
    options: Filters
}

interface FilterContainerState {
    filters: FilterProps[],
    minMax: {[field:string]: {
        min: number;
        max: number;
    }}
}

const OPERATORS = [
    'eqauls',
    'contains'
]

const CONNECTORS = [
    'and',
    'or'
]

function findMin(data: {[key:string]:number}[], key: string): number {
    return data.reduce((max: number, val: {[k:string]:number}) => Math.min(max, val[key]), Infinity)
}
function findMax(data: {[key:string]:number}[], key: string): number {
    return data.reduce((max: number, val: {[k:string]:number}) => Math.max(max, val[key]), -Infinity)
}

export class FilterContainer extends React.Component<FilterContainerProps, FilterContainerState> {
    constructor (props: any) {
        super(props);
        this.state = {
            filters: [],
            minMax: {}
        }

        let query: any = {}

        Object.keys(this.props.options).forEach((optionKey: string) => {
            if (props.options[optionKey] === DataType.NUMBER) {
                let queryField = props.dataId + '_' + optionKey;
                let countKey = props.dataId + "Count";
                query = {
                    "GET": [ queryField, countKey ],
                    "GROUP": [ queryField ],
                    "APPLY": [ { [countKey]: { "COUNT": queryField } } ]
                }
                Store.fetch(props.dataId + '-filter-range-values', query).then(data => {
                    let state = this.state;
                    let filters = state.filters;
                    let max = findMax(data, queryField);
                    let min = findMin(data, queryField);

                    state.minMax[optionKey] = {
                        min: min,
                        max: max
                    }
                    state.filters = filters;
                    this.setState(state);
                });
            }
        });
    }

    renderFilter = (filter: FilterProps, index: number) => {
        return <RoomFilter
            key={'room-filter-'+index}
            options={this.props.options}
            {...filter}
            range={this.state.minMax[filter.field]}/>
    }

    createNewFilter = () => {
        let state = this.state;
        let filters = state.filters;
        let key = 'filter-' + filters.length;
        let field = Object.keys(this.props.options)[0];

        let rangeValues: {[field: string]: {min: number, max: number}} = {};
        let textValues: {[field: string]: string} = {};
        let operatorValues: {[field: string]: string} = {};

        Object.keys(this.props.options).forEach(opt => {
            if (this.props.options[opt] === DataType.NUMBER) {
                rangeValues[opt] = state.minMax[opt];
            } else {
                operatorValues[opt] = OPERATORS[0];
                textValues[opt] = '';
            }
        });

        filters.push({
            keyId: key,
            options: this.props.options,
            operators: OPERATORS,
            connector: CONNECTORS[0],
            connectors: CONNECTORS,
            operator: operatorValues,
            field: field,
            range: null,
            values: rangeValues,
            textValue: textValues,
            onRangeChange: this.onRangeChange.bind(null, key),
            onFieldChange: this.onFieldChange.bind(null, key),
            onTextValueChange: this.onTextValueChange.bind(null, key),
            onOperatorChange: this.onOperatorChange.bind(null, key),
            onConnectorChange: this.onConnectorChange.bind(null, key)
        });
        state.filters = filters;
        this.setState(state);
    }

    onOptionStateChange = (key: string, field: string, value: any) => {
        let state = this.state;
        let filters = state.filters;
        let filterIndex = filters.findIndex(filter => filter.keyId === key);

        filters[filterIndex][field][filters[filterIndex].field] = value;
        state.filters = filters;
        this.setState(state);
    }

    onStateChange = (key: string, field: string, value: any) => {
        let state = this.state;
        let filters = state.filters;
        let filterIndex = filters.findIndex(filter => filter.keyId === key);

        filters[filterIndex][field] = value;
        state.filters = filters;
        this.setState(state);
    }

    onConnectorChange = (key: string, event: any) => {
        this.onStateChange(key, 'connector', event.target.value);
    }

    onOperatorChange = (key: string, event: any) => {
        this.onOptionStateChange(key, 'operator', event.target.value);
    }

    onTextValueChange = (key: string, event: any) => {
        this.onOptionStateChange(key, 'textValue', event.target.value);
    }

    onFieldChange = (key: string, event: any) => {
        this.onStateChange(key, 'field', event.target.value);
    }

    onRangeChange = (key: string, component: any, value: any) => {
        this.onOptionStateChange(key, 'values', value);
    }

    render () {
        return <div>
            <label>Customize your search here</label>
                {this.state.filters.map(this.renderFilter)}
            <button onClick={this.createNewFilter}>Create new filter</button>
            <button>Filter</button>
        </div>
    }
}
