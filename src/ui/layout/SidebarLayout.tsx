import * as React from 'react';

require('../styles/mixins/colour.scss');
require('../styles/sidebar.scss');

interface SidebarLayoutProps {

}

const defaultProps = {

}

export class SidebarLayout extends React.Component<SidebarLayoutProps, {}> {
    static defaultProps: SidebarLayoutProps = defaultProps;

    render () {
        return (
            <div className='sidebar-layout rainbow'>
                {this.props.children}
            </div>
        );
    }
}
