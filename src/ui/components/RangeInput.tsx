import * as React from 'react';

import { ColumnType, ROOMS_COLUMNS } from '../store/constants';
import { Store } from '../store/store';

import InputRange = require('react-input-range');

export interface RangeInputProps {
    field: string;
    type: any;
    value: Range;
    onRangeChange: any;
    [id: string]: any;
}

export interface Range {
    min: number;
    max: number;
}

interface RangeInputState {
    range: Range,
}

export class RangeInput extends React.Component<RangeInputProps, RangeInputState> {

    constructor (props: RangeInputProps) {
        super(props);
        this.state = {
          range: null
        };
        this.fetchRange(ROOMS_COLUMNS.find(rc => rc.name === props.field));
    }

    calcStepSize(range: Range): number {
        let diff = range.max - range.min;
        if (diff % 1 === 0) {
            return 1;
        } else {
            return diff / 10000;
        }
    }

    renderRangeInput = () => {
        let range = this.state.range;
        let value = this.props.value;
        if (!range) {
            range = { min: 0, max: 0 }
            value = range;
        }
        // happens when range is updated and waiting for value to be updated
        if (!value) {
            value = range;
        }

        return (
            <div className='range-slider-field'>
                <InputRange
                    maxValue={range.max}
                    minValue={range.min}
                    value={value}
                    onChange={this.onRangeChange}
                    step={this.calcStepSize(range)} />
            </div>
        );
    }

    fetchRange = (column: ColumnType) => {
        let field = column.dataset + column.name;
        return Store.fetch('room-range', {
            'GET': [field],
            'GROUP': [field],
            'APPLY': [],
            'ORDER': { 'dir': 'UP', 'keys': [field] }
        }).then(data => {
            let range = {
                min: data[0][field],
                max: data[data.length - 1][field]
            }
            let margin = range.max - range.min;
            if (margin % 1 !== 0) {
                margin = margin / 10;
            } else {
                margin = 0;
            }
            let oversizedRange = {
                min: range.min - margin,
                max: range.max + margin
            }
            this.setState({ range: oversizedRange });
            this.onRangeChange(undefined, range);
        });
    }

    onRangeChange = (component: any, value: Range) => {
        this.props.onRangeChange(this.props.field, component, value);
    }

    render () {
        let column = ROOMS_COLUMNS.find(rc => rc.name === this.props.field);
        return (
            <div className='filter-range-container'>
                <strong>{column.locale}</strong>
                <div className='divider-sm' />
                <div>
                    { this.state.range && this.renderRangeInput() }
                </div>
            </div>
        );
    }
}
