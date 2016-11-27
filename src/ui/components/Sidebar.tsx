import * as React from 'react';

interface SidebarProps {
    orientation: string;
}

export class Sidebar extends React.Component<SidebarProps, {}> {
    render () {
        return (

            <div className={'container-fluid sidebar-' + this.props.orientation} aria-expanded='true'>
                <div className='row'>
                    <div className={'col-xs-7 col-sm-4 col-md-3 sidebar sidebar-' + this.props.orientation + ' sidebar-show-lg'}>
                        <li className='sidebar-brand'>
                            <span className='sidebar-toggle glyphicon glyphicon-align-justify' data-toggle='collapse' data-target={'.sidebar-' + this.props.orientation}></span></li>
                            <button type='button' className='navbar navbar-default navbar-header navbar-toggle sidebar-toggle' data-toggle='collapse' data-target={'.sidebar-' + this.props.orientation} >
                            <span className='sr-only'>Toggle navigation</span>
                            <span className='icon-bar'></span>
                            <span className='icon-bar'></span>
                            <span className='icon-bar'></span>
                        </button>
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}
