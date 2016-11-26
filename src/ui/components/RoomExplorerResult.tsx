import * as React from 'react';

interface RoomExplorerResultProps {
}

interface RoomExplorerResultState {
    open: boolean;
}

export class RoomExplorerResult extends React.Component<RoomExplorerResultProps, RoomExplorerResultState> {
    constructor (props: any) {
        super(props);
        this.state = {
            open: false
        }
    }

    onOpen = () => {
        this.setState({ open: !this.state.open });
    }

    renderCollapsed = () => {
        return (
            <div className='column-index'>
                <button onClick={this.onOpen}>{this.state.open ? '>>' : '<<'}</button>
            </div>
        );
    }

    renderExpanded = () => {
        return (
            <div className='column-index'>
                <button onClick={this.onOpen}>{this.state.open ? '>>' : '<<'}</button>
            </div>
        );
    }

    render () {
        return (
            <div className='sidebar-right'>
                {this.state.open ? this.renderExpanded() : this.renderCollapsed()}
            </div>
        );
    }
}
