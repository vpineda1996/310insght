import * as React from 'react';

import { Sidebar } from './Sidebar';
import { RoomFilterProps } from './Filter';

interface RoomExplorerResultProps {
    filters: RoomFilterProps[]
}

interface RoomExplorerResultState {
}

export class RoomExplorerResult extends React.Component<RoomExplorerResultProps, RoomExplorerResultState> {
    render () {
        return (
            <Sidebar orientation='right' />
        );
    }
}
