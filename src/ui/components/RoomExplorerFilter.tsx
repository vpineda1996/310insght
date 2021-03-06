import * as React from 'react';

import { RoomFilter, RoomFilterProps, SubFilterProps } from './Filter';
import { RangeInputProps, RangeInput } from './RangeInput';

require('../styles/InputRange.scss');
require('../styles/sidebar.scss');

export enum RoomFilterType {
    CHECKBOX,
    TEXT,
    RANGE
}

interface RoomExplorerFilterProps {
    filters: Array<RoomFilterProps|RangeInputProps>;
    subfilters: { [field: string]: SubFilterProps };
    onRangeChange: any;
    onSelect: any;
    onSelectAll: any;
}

interface RoomExplorerFilterState {
}

export class RoomExplorerFilter extends React.Component<RoomExplorerFilterProps, RoomExplorerFilterState> {
    render () {
        return (
            <div className='sidebar sidebar-left sidebar-show-lg'>
                {this.props.filters.filter(filter => filter.type === RoomFilterType.CHECKBOX).map(filter => {
                    return <div className='col-md-3' key={'room-filter-'+filter.field}>
                        <RoomFilter {...filter} subfilters={this.props.subfilters[filter.field]} onSelect={this.props.onSelect} onSelectAll={this.props.onSelectAll} />
                        </div>
                })}
                <div className='range-input col-md-3'>
                    {this.props.filters.filter(filter => filter.type === RoomFilterType.RANGE).map(filter => {
                        return <div className='row' key={'room-filter-'+filter.field}>
                            <RangeInput {...filter} onRangeChange={this.props.onRangeChange} />
                        </div>
                    })}
                </div>
            </div>
        );
    }
}
