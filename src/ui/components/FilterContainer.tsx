import * as React from 'react';
import { RoomFilter, FilterProps, DataType, Filters } from './RoomFilter';

interface FilterContainerProps {
    dataId: string;
    options: Filters
}

interface FilterContainerState {
    filters: FilterProps[]
}

const OPERATORS = [
    'eqauls',
    'contains'
]

const CONNECTORS = [
    'and',
    'or'
]

export class FilterContainer extends React.Component<FilterContainerProps, FilterContainerState> {
    constructor (props: any) {
        super(props);
        this.state = {
            filters: []
        }
    }

    renderFilter = (filter: FilterProps, index: number) => {
        return <RoomFilter key={'room-filter-'+index} {...filter} options={this.props.options} />
    }

    createNewFilter = () => {
        let filters = this.state.filters;
        let key = 'filter-' + filters.length;

        filters.push({
            keyId: key,
            options: this.props.options,
            operators: OPERATORS,
            connector: CONNECTORS[0],
            connectors: CONNECTORS,
            operator: OPERATORS[0],
            field: Object.keys(this.props.options)[0],
            values: {
                min: 2,
                max: 10
            },
            textValue: '',
            onRangeChange: this.onRangeChange.bind(null, key),
            onFieldChange: this.onFieldChange.bind(null, key),
            onTextValueChange: this.onTextValueChange.bind(null, key),
            onOperatorChange: this.onOperatorChange.bind(null, key),
            onConnectorChange: this.onConnectorChange.bind(null, key)
        });
        this.setState({ filters: filters });
    }

    onStateChange = (key: string, field: string, value: any) => {
        let filters = this.state.filters;
        let filterIndex = filters.findIndex(filter => filter.keyId === key);

        filters[filterIndex][field] = value;
        this.setState({ filters: filters });
    }

    onConnectorChange = (key: string, event: any) => {
        this.onStateChange(key, 'connector', event.target.value);
    }

    onOperatorChange = (key: string, event: any) => {
        this.onStateChange(key, 'operator', event.target.value);
    }

    onTextValueChange = (key: string, event: any) => {
        this.onStateChange(key, 'textValue', event.target.value);
    }

    onFieldChange = (key: string, event: any) => {
        this.onStateChange(key, 'field', event.target.value);
    }

    onRangeChange = (key: string, component: any, value: any) => {
        this.onStateChange(key, 'values', value);
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
