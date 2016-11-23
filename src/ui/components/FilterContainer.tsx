import * as React from 'react';
import { Store } from '../store/store';
import { RoomFilter, FilterProps, FilterDefaultProps, FilterOptionProps, DataType, Filters, Range } from './RoomFilter';

interface FilterContainerProps {
    options: Filters;
    filters: FilterOptionProps[];
    minMax: {[field:string]:Range}
    onNewFilter: Function;
    onUpdateFilter: Function;
    onUpdateRange: Function;
    performSearch: any;
}

const OPERATORS = [
    'equals',
    'contains'
]

const CONNECTORS = [
    'AND',
    'OR'
]

function findMin(data: {[key:string]:number}[], key: string): number {
    return data.reduce((max: number, val: {[k:string]:number}) => Math.min(max, val[key]), Infinity)
}
function findMax(data: {[key:string]:number}[], key: string): number {
    return data.reduce((max: number, val: {[k:string]:number}) => Math.max(max, val[key]), -Infinity)
}

export class FilterContainer extends React.Component<FilterContainerProps, {}> {
    constructor (props: any) {
        super(props);
        this.fetchRangeData();
    }

    key = (parentKey: string, index: number) => (!parentKey ? 'rooom-filter--' : (parentKey + '--')) + index;

    fetchRangeData = () => {
        let query: any = {}
        Object.keys(this.props.options).forEach((optionKey: string) => {
            if (this.props.options[optionKey] === DataType.NUMBER) {
                let queryField = 'rooms_' + optionKey;
                let countKey = 'roomsCount';
                query = {
                    "GET": [ queryField, countKey ],
                    "GROUP": [ queryField ],
                    "APPLY": [ { [countKey]: { "COUNT": queryField } } ]
                }
                Store.fetch('rooms-filter-range-values', query).then(data => {
                    let max = findMax(data, queryField);
                    let min = findMin(data, queryField);

                    this.props.onUpdateRange(optionKey, { min:min, max:max });
                });
            }
        });
    }

    renderFilter = (filter: FilterProps, index: number) => {
        let key = filter.keyId;
        return <RoomFilter
            key={key}
            options={this.props.options}
            {...filter}
            {...this.filterDefaultProps(key)}
            range={this.props.minMax}/>
    }

    createNewFilter = () => {
        let key = this.key(null, this.props.filters.length);
        let filter = this.initializeNewFilter(key);
        this.props.onNewFilter(filter);
    }

    createNestedFilter = (filter: FilterProps) => {
        if (!filter.filters || filter.filters.length === 0) {
            filter.filters = [];
            filter.filters.push($.extend({}, filter, {depth: filter.depth+1}))
        }
        let length = filter.filters && filter.filters.length;

        let key = this.key(filter.keyId, length);
        let f = this.initializeNewFilter(key, filter.depth);

        filter.filters.push(f);
        this.props.onUpdateFilter(filter.keyId, 'filters', filter.filters, length, false);
    }

    filterDefaultProps = (key: string) => {
        let props: FilterDefaultProps = {
            operators: OPERATORS,
            connectors: CONNECTORS,
            options: this.props.options,
            range: null,
            onConnectorChange: this.onConnectorChange.bind(null, key),
            onFieldChange: this.onFieldChange.bind(null, key),
            onOperatorChange: this.onOperatorChange.bind(null, key),
            onRangeChange: this.onRangeChange.bind(null, key),
            onTextValueChange: this.onTextValueChange.bind(null, key),
            onNewNestedFiter: this.createNestedFilter,
        }
        return props;
    }

    initializeNewFilter = (key: string, depth?: number) => {
        let field = Object.keys(this.props.options)[0];

        let rangeValues: {[field: string]: Range} = {};
        let textValues: {[field: string]: string} = {};
        let operatorValues: {[field: string]: string} = {};

        Object.keys(this.props.options).forEach(opt => {
            if (this.props.options[opt] === DataType.NUMBER) {
                rangeValues[opt] = this.props.minMax[opt];
            } else {
                operatorValues[opt] = OPERATORS[0];
                textValues[opt] = '';
            }
        });

        if (typeof depth === 'undefined') depth = 0;
        else depth = depth + 1;
        let filter: FilterOptionProps = {
            depth: depth,
            connector: CONNECTORS[0],
            field: field,
            filters: [],
            filterDefaultProps: this.filterDefaultProps,
            keyId: key,
            mapoverlay: null,
            operatorValues: operatorValues,
            rangeValues: rangeValues,
            textValues: textValues
        };
        return filter;
    }

    onOptionStateChange = (key: string, field: string, value: any) => {
        let filters = this.props.filters;
        let filterIndex = filters.findIndex(filter => filter.keyId === key);

        this.props.onUpdateFilter(key, field, value, filterIndex, false)
    }

    onStateChange = (key: string, field: string, value: any) => {
        let filterIndex = this.props.filters.findIndex(filter => filter.keyId === key);
        this.props.onUpdateFilter(key, field, value, filterIndex, true)
    }

    onConnectorChange = (key: string, event: any) => {
        this.onStateChange(key, 'connector', event.target.value);
    }

    onOperatorChange = (key: string, event: any) => {
        this.onOptionStateChange(key, 'operatorValues', event.target.value);
    }

    onTextValueChange = (key: string, event: any) => {
        this.onOptionStateChange(key, 'textValues', event.target.value);
    }

    onFieldChange = (key: string, event: any) => {
        this.onStateChange(key, 'field', event.target.value);
    }

    onRangeChange = (key: string, component: any, value: any) => {
        if (typeof value === 'undefined' || value === null) return;
        this.onOptionStateChange(key, 'rangeValues', value);
    }

    render () {
        return <div>
            <label>Customize your search here</label>
                {this.props.filters.map(this.renderFilter)}
            <button onClick={this.createNewFilter}>Create new filter</button>
            <div><span /></div>
            <button onClick={this.props.performSearch} > Filter </button>
        </div>
    }
}
