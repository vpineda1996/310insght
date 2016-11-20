import * as React from 'react'
import { Map, MarkerProps } from './Map'
import { Store, Data } from '../store/store'

interface RoomExplorerProps {
}

interface RoomExplorerState {
    markers: MarkerProps[]
    regions: any[]
}

const defaultProps = {}

const ALL_ROOM_QUERY = {
    "GET": ["rooms_shortname", "rooms_lat", "rooms_lon", "rooms_number", "rooms_href"],
    "WHERE": {},
    "AS": "TABLE"
}

const boundQuery = (overlay: any) => {
    let bounds: any = overlay.overlay.bounds;

    switch (overlay.type) {
        case google.maps.drawing.OverlayType.RECTANGLE:
            return RECTANGULAR_QUERY(bounds);
        case google.maps.drawing.OverlayType.CIRCLE:
            return CIRCULAR_QUERY(bounds);
        case google.maps.drawing.OverlayType.POLYGON:
            return POLYGON_QUERY(bounds);
        default:
            return {};
    }
}

const RECTANGULAR_QUERY = (bounds: any) => {
    return {
        "WHERE": {
            "AND": [
                { "GT": { "rooms_lat": bounds.f.f } },
                { "LT": { "rooms_lat": bounds.f.b } },
                { "LT": { "rooms_lon": bounds.b.f } },
                { "GT": { "rooms_lon": bounds.b.b } }
            ]
        }
    };
}

const CIRCULAR_QUERY = (bounds: any) => {
    return {
        "WHERE": {}
    };
}

const POLYGON_QUERY = (bounds: any) => {
    return {
        "WHERE": {}
    };
}

const createMarker = (room: any) => {
    return {
        name: room.rooms_shortname,
        position: {
            lat: room.rooms_lat,
            lng: room.rooms_lon
        },
        showInfo: false,
        infoContent: [room]
    }
}

export class RoomExplorer extends React.Component<RoomExplorerProps, RoomExplorerState> {
    static defaultProps: RoomExplorerProps = defaultProps;

    constructor (props: any) {
        super(props);
        this.state = {
            markers: [],
            regions: []
        };
    }

    handleMarkerClick = (name: string) => {
        let markerIndex = this.state.markers.findIndex(marker => marker.name === name);
        let state = this.state;
        let marker = state.markers[markerIndex];

        marker.showInfo = !marker.showInfo;
        this.setState(state);
    }

    fetchMarkerData = () => {
        Store.fetch('rooms_map', ALL_ROOM_QUERY).then((data) => {
            let buildingMarkers = data.reduce((markers: {[id:string]: MarkerProps}, room: any) => {
                let marker = markers[room.rooms_shortname];
                if (!marker) {
                    marker = createMarker(room);
                } else {
                    marker.infoContent.push(room);
                }
                markers[room.rooms_shortname] = marker;
                return markers;
            }, {});

            let markers: MarkerProps[] = [];
            for (let markerId in buildingMarkers) {
                markers.push(buildingMarkers[markerId]);
            }

            let state = this.state;
            state.markers = markers;
            this.setState(state);
        });
    }

    handleDrawOverlay = (overlay: any) => {
        let query: any = boundQuery(overlay);
        query.GET = ["rooms_shortname", "rooms_number"];
        query.AS = "TABLE";
        this.fetchRegionData(query)
    }

    fetchRegionData = (query: any) => {
        Store.fetch('room_bounds', query).then(data => {
            console.info('room_bounds', data);
        }).catch(error => {
            console.info('room_bounds error', error);
        });
    }

    render () {
        return <div className='room-explorer'>
            <Map markers={this.state.markers} handleClick={this.handleMarkerClick} handleDrawOverlay={this.handleDrawOverlay} />
            <button className='uppercase' onClick={this.fetchMarkerData}> Load Data </button>
        </div>
    }
}
