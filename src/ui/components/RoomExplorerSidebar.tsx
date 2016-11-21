import * as React from 'react';
import { Sidebar } from './Sidebar';
import { DataUploader, Uploadable } from './DataUploader';

export class RoomExplorerSidebar extends Sidebar {
    renderSidebar = () => <DataUploader uploadType={Uploadable.ROOMS} />
}
