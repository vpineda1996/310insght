import * as React from 'react';

require('../styles/mixins/colour.scss');
require('../styles/sidebar.scss');

export class SidebarLayout extends React.Component<{}, {}> {
    render () {
        return (
            <div className='sidebar-layout'>
                {this.props.children}
            </div>
        );
    }
}
