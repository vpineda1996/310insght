import * as React from 'react';

interface SidebarProps {

}

const defaultProps = {

}

export class Sidebar extends React.Component<SidebarProps, {}> {
    static defaultProps: SidebarProps = defaultProps;

    render () {
        return (
            <div className='sidebar'>
                {this.props.children}
            </div>
        );
    }
}
