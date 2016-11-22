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
    'equals',
    'contains'
]

const CONNECTORS = [
    'AND',
    'OR'
]

const PRECEDENCE: {[operator:string]: number} = {
    'AND': 0,
    'OR': 1
}

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
            connector: CONNECTORS[0],
            connectors: CONNECTORS,
            field: field,
            keyId: key,
            mapoverlay: null,
            onConnectorChange: this.onConnectorChange.bind(null, key),
            onFieldChange: this.onFieldChange.bind(null, key),
            onOperatorChange: this.onOperatorChange.bind(null, key),
            onRangeChange: this.onRangeChange.bind(null, key),
            onTextValueChange: this.onTextValueChange.bind(null, key),
            operator: operatorValues,
            operators: OPERATORS,
            options: this.props.options,
            range: null,
            textValue: textValues,
            values: rangeValues
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
        console.info(key, component, value);
        if (!value) return;
        this.onOptionStateChange(key, 'values', value);
    }

    performSearch = (e: any) => {
        let query = this.state.filters.reduce((query: {[key:string]:any}, filter: FilterProps) => {
            if (Object.keys(query).length === 0) {
                return this.buildFilterQuery(filter);
            }
            let key = Object.keys(query)[0];
            console.log(filter.connector, PRECEDENCE[filter.connector])
            let precedence1 = PRECEDENCE[filter.connector];
            let precedence2 = PRECEDENCE[key];
            if (typeof precedence1 === 'undefined') precedence1 = 2;
            if (typeof precedence2 === 'undefined') precedence2 = 2;

            console.info(key, filter.connector, precedence1, precedence2);
            if (precedence1 === precedence2) {
                // append new filter
                if (!query[key]) query[key] = [];
                query[key].push(this.buildFilterQuery(filter));
            } else {
                query = {
                    [filter.connector]: [
                        query,
                        this.buildFilterQuery(filter)
                    ]
                }

            }
            return query;
        }, {});
        console.info(query);
    }

    buildFilterQuery(filter: FilterProps): {} {
        let field = filter.field;
        let column = this.props.dataId + '_' + field;

        switch (this.props.options[field]) {
            case DataType.STRING:
                switch (filter.operator[field]) {
                    case 'contains':
                        return { 'IS': { [column]: '*' + filter.textValue[field] + '*' } };
                    case 'equals':
                        return { 'IS': { [column]: filter.textValue[field] } };
                }
            case DataType.NUMBER:
                return {
                    'OR': [{
                        'AND': [
                            { 'GT': { [column]: filter.values[field].min } },
                            { 'LT': { [column]: filter.values[field].max } }
                        ]
                    }, {
                        'EQ': { [column]: filter.values[field].min }
                    }, {
                        'EQ': { [column]: filter.values[field].max }
                    }]
                };
            default:
                return null;
        }
    }

    render () {
        return <div>
            <label>Customize your search here</label>
                {this.state.filters.map(this.renderFilter)}
            <button onClick={this.createNewFilter}>Create new filter</button>
            <div><span /></div>
            <button onClick={this.performSearch} > Filter </button>
        </div>
    }
}
