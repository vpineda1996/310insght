import * as React from 'react';
import { Sidebar } from '../components/Sidebar';

require('../styles/mixins/colour.scss');
require('../styles/sidebar.scss');

export class SidebarLayout extends React.Component<{}, {}> {
    render () {
        return (
            <div className='sidebar-layout rainbow'>
                {this.props.children}
            </div>
        );
    }
}
