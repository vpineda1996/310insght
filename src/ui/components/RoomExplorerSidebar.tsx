import * as React from 'react';
import { DataUploader, Uploadable } from './DataUploader';
import { FilterContainer } from './FilterContainer';
import { Filters, FilterOptionProps, Range } from './RoomFilter';

interface RoomExplorerSidebarProps {
    options: Filters;
    filters: FilterOptionProps[];
    minMax: {[field:string]: Range};
    onNewFilter: Function;
    onUpdateFilter: Function;
    onUpdateRange: Function;
    performSearch: any;
    [id:string]: any
}

export class RoomExplorerSidebar extends React.Component<RoomExplorerSidebarProps, {}> {
    render () {
        return (
            <div className='sidebar-left'>
                <FilterContainer {...this.props} />
            </div>
        );
    }
}
