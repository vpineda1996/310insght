import * as React from 'react';
import { Sidebar } from './Sidebar';
import { DataUploader, Uploadable } from './DataUploader';
import { FilterContainer } from './FilterContainer';
import { Filters, DataType } from './RoomFilter';


const FILTER_OPTIONS: Filters = {
    'capacity': DataType.NUMBER,
    'feature': DataType.STRING,
    'type': DataType.STRING,
    'latitude': DataType.NUMBER,
    'longitude': DataType.NUMBER
};
export class RoomExplorerSidebar extends Sidebar {
    renderSidebar = () => (
        <div>
            <DataUploader uploadType={Uploadable.ROOMS} />
            <FilterContainer dataId='rooms' options={FILTER_OPTIONS} />
        </div>
    );
}
