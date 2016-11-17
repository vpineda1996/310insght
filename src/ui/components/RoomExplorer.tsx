import * as React from "react";

import {
    withGoogleMap,
    GoogleMap,
    Marker
} from 'react-google-maps';

interface Geo {
    lat: number;
    lng: number;
}

interface MapProps {
    defaultZoom?: number
    zoomLevel?: number
    defaultCenter?: Geo
    center?: Geo,
}

const defaultProps: MapProps = {
    defaultCenter: {
        lat: 49.264086,
        lng: -123.249864
    },
    defaultZoom: 16
}

const Map = withGoogleMap((props: any) => (
    <GoogleMap
        defaultZoom={props.defaultZoom}
        defaultCenter={props.defaultCenter}>
        {props.markers}
    </GoogleMap>
));


export class RoomExplorer extends React.Component<MapProps, {}> {
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

    private marker = (
        <Marker
            onClick={this.onClick}
            onRightClick={this.onRightClick}
            onDragStart={this.onDrug}
        />
    );

    render () {
        return (
            <Map
                containerElement={<div className='map-container' />}
                mapElement={<div className='map-container' />}
                markers = {this.marker}
                {...this.props}
            />
        )
    }
}
