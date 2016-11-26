import * as React from 'react';

interface RoomExplorerFilterProps {
}
interface RoomExplorerFilterState {
    open: boolean;
}

export class RoomExplorerFilter extends React.Component<RoomExplorerFilterProps, RoomExplorerFilterState> {
    constructor (props: any) {
        super(props);
        this.state = {
            open: true
        }
    }

    onOpen = () => {
        this.setState({ open: !this.state.open });
    }

    renderCollapsed = () => {
        return (
            <div className='column-index'>
                <button className='fold-btn' onClick={this.onOpen}>{this.state.open ? '<<' : '>>'}</button>
            </div>
        );
    }

    renderExpanded = () => {
        return (
            <div className='filter-container'>
                <button onClick={this.onOpen}>{this.state.open ? '<<' : '>>'}</button>
            </div>
        );
    }

    render () {
        return (
            <div className='sidebar-left'>
                {this.state.open ? this.renderExpanded() : this.renderCollapsed()}
            </div>
        );
    }
}
