import * as React from 'react';
import { Sidebar } from './Sidebar';
import { DataUploader, Uploadable } from './DataUploader';
import { FilterContainer } from './FilterContainer';
import { Filters, DataType } from './RoomFilter';


const FILTER_OPTIONS: Filters = {
    'seats': DataType.NUMBER,
    'feature': DataType.STRING,
    'type': DataType.STRING,
    'lat': DataType.NUMBER,
    'lon': DataType.NUMBER
};
export class RoomExplorerSidebar extends Sidebar {
    renderSidebar = () => (
        <div>
            <DataUploader uploadType={Uploadable.ROOMS} />
            <FilterContainer dataId='rooms' options={FILTER_OPTIONS} />
        </div>
    );
}
