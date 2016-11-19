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
    position: Geo
    showInfo: boolean
    infoContent: any
}

interface MapProps {
    markers?: MarkerProps[]
    defaultZoom?: number
    zoomLevel?: number
    defaultCenter?: Geo
    center?: Geo,
}

const defaultProps: MapProps = {
    markers: [{
        position: {
            lat: 49.264086,
            lng: -123.249864
        },
        showInfo: false,
        infoContent: <div className='rainbow'/>
    }],
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

    private renderMarker = (marker: MarkerProps) => <Marker
        onClick={this.onClick}
        onRightClick={this.onRightClick}
        onDragStart={this.onDrug}
        position={marker.position}
        key={'marker-' + JSON.stringify(marker.position)}>
        {marker.showInfo && this.infoWindow(marker)}
    </Marker>

    private infoWindow = (marker: MarkerProps) => <InfoWindow
        onCloseClick={this.onInfoClose}
        onDomReady={this.onInfoReady}
        onZIndexChanged={this.onInfoZChanged}
    />

    render () {
        // this.props is read-only object
        let props: any = $.extend({}, this.props);
        props.markers = this.props.markers.map(this.renderMarker);

        return <div className='room-explorer'>
            <UBCMap
                containerElement={<div className='map' />}
                mapElement={<div className='map' />}
                {...props}>
            </UBCMap>
        </div>
    }
}
