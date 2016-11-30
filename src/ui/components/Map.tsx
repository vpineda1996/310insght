import * as React from 'react';
import * as $ from 'jquery'

import {
    GoogleMap,
    InfoWindow,
    Marker,
    withGoogleMap
} from 'react-google-maps';

import DrawingManager from 'react-google-maps/lib/drawing/DrawingManager'

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
    handleDrawOverlay?: Function
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
        <div>
            {props.children}
            {props.markers}
        </div>
    </GoogleMap>
));

const DRAWING_OPTIONS = {
    drawingControl: true,
    drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
            google.maps.drawing.OverlayType.CIRCLE,
            google.maps.drawing.OverlayType.POLYGON,
            google.maps.drawing.OverlayType.RECTANGLE,
        ],
    },
    circleOptions: {
        fillColor: `#ffff00`,
        fillOpacity: 0.25,
        strokeWeight: 5,
        clickable: false,
        editable: false,
        zIndex: 1,
    },
};

export class Map extends React.Component<MapProps, {}> {
    static defaultProps: MapProps = defaultProps;

    private renderMarker = (marker: MarkerProps, handleClick: Function) => (
        <Marker
            onClick={() => handleClick(marker.name)}
            position={marker.position}
            key={'marker-' + marker.name + '-' + marker.showInfo}>
            {marker.showInfo && this.infoWindow(marker.name, marker.infoContent, () => handleClick(marker))}
        </Marker>
    )

    private infoWindow = (buildingName: string, content: any[], handleClick: Function) => (
        <InfoWindow onCloseClick={handleClick}>
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

        return <UBCMap
            containerElement={<div className='map' />}
            mapElement={<div className='map' />}
            {...props}>
            <DrawingManager
                defaultDrawingMode={google.maps.drawing.OverlayType.CIRCLE}
                defaultOptions={DRAWING_OPTIONS}
                onOverlayComplete={this.props.handleDrawOverlay} />
        </UBCMap>
    }
}
