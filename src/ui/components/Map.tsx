import * as React from 'react';
import * as $ from 'jquery'

import {
    withGoogleMap,
    GoogleMap,
    Marker,
    InfoWindow
} from 'react-google-maps';

require('../styles/roomview.scss');

export interface Geo {
    lat: number;
    lng: number;
}

export interface MarkerProps {
    name: string
    position: Geo
    showInfo: boolean
    infoContent: any[]
}

interface MapProps {
    markers?: MarkerProps[]
    handleClick?: Function
    defaultZoom?: number
    zoomLevel?: number
    defaultCenter?: Geo
    center?: Geo,
}

const defaultProps: MapProps = {
    markers: [],
    defaultCenter: {
        lat: 49.264086,
        lng: -123.249864
    },
    defaultZoom: 16
}

const UBCMap = withGoogleMap((props: any) => (
    <GoogleMap
        defaultZoom={props.defaultZoom}
        defaultCenter={props.defaultCenter}>
        {props.markers}
    </GoogleMap>
));


export class Map extends React.Component<MapProps, {}> {
    static defaultProps: MapProps = defaultProps;

    onClick() {
        console.info('onClick');
    }

    onRightClick () {
        console.info('onRightClick')
    }

    onDrug () {
        console.info('onDrug')
    }

    onInfoClose () {
        console.info('info closed');
    }

    onInfoReady () {
        console.info('info ready');
    }

    onInfoZChanged () {
        console.info('info z index changed');
    }

    private renderMarker = (marker: MarkerProps, handleClick: Function) => (
        <Marker
            onClick={() => handleClick(marker.name)}
            onRightClick={this.onRightClick}
            onDragStart={this.onDrug}
            position={marker.position}
            key={'marker-' + marker.name + '-' + marker.showInfo}>
            {marker.showInfo && this.infoWindow(marker.name, marker.infoContent, () => handleClick(marker))}
        </Marker>
    )

    private infoWindow = (buildingName: string, content: any[], handleClick: Function) => (
        <InfoWindow
            onCloseClick={handleClick}
            onDomReady={this.onInfoReady}
            onZIndexChanged={this.onInfoZChanged}>
            <div className='map-info-content'>
                <label>{buildingName}</label>
                <ul className='map-info-table'>
                    {content.map((c: any) => (
                        <li><a target='_blank'
                              href={c.rooms_href}
                              key={'marker-info-' + buildingName + c.rooms_number}>
                            {c.rooms_number}
                        </a></li>)
                    )}
                </ul>
            </div>
        </InfoWindow>
    )

    render () {
        // this.props is read-only object
        let props: any = $.extend({}, this.props);
        props.markers = this.props.markers.map((marker) => this.renderMarker(marker, this.props.handleClick));

        return <div className='room-explorer'>
            <UBCMap
                containerElement={<div className='map' />}
                mapElement={<div className='map' />}
                {...props}>
            </UBCMap>
        </div>
    }
}
