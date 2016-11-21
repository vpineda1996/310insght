import * as React from 'react';

interface SidebarProps {}

export class Sidebar extends React.Component<SidebarProps, {}> {
    renderSidebar = () => <div />

    render () {
        return (
            <div className='sidebar'>
                {this.renderSidebar()}
            </div>
        );
    }
}
