import * as React from 'react';

import { Sidebar } from './Sidebar';
import { RoomFilter, RoomFilterProps } from './Filter';
import { RangeInputProps, RangeInput } from './RangeInput';

export enum RoomFilterType {
    CHECKBOX,
    TEXT,
    RANGE
}

interface RoomExplorerFilterProps {
    filters: Array<RoomFilterProps|RangeInputProps>;
    onRangeChange: any;
    onSelect: any;
}

interface RoomExplorerFilterState {
}

export class RoomExplorerFilter extends React.Component<RoomExplorerFilterProps, RoomExplorerFilterState> {
    renderExpanded = () => {
        return (
            <div>
                {this.props.filters.map(filter => {
                    switch (filter.type) {
                        case RoomFilterType.CHECKBOX:
                            return <RoomFilter {...filter} onSelect={this.props.onSelect} />
                        case RoomFilterType.RANGE:
                            return <RangeInput {...filter} onRangeChange={this.props.onRangeChange} />
                        default:
                            return <div />
                    }
                })}
            </div>
        );
    }

    render () {
        return (
            <Sidebar orientation='left'>
                { this.renderExpanded() }
            </Sidebar>
        );
    }
}
