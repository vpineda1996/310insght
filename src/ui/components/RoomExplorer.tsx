import * as React from 'react'
import { Map, MarkerProps } from './Map'
import { Store, Data } from '../store/store'

interface RoomExplorerProps {

}
interface RoomExplorerState {
    markers?: MarkerProps[]
}

const defaultProps = {

}

const defaultQueryParams = {
    'id': 'rooms'
}

export class RoomExplorer extends React.Component<RoomExplorerProps, RoomExplorerState> {
    static defaultProps: RoomExplorerProps = defaultProps;

    constructor (props: any) {
        super(props);
        this.state = {
        };
    }

    createMarker(room: any): MarkerProps {
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

    handleMarkerClick = (name: string) => {
        let markerIndex = this.state.markers.findIndex(marker => marker.name === name);
        let marker = this.state.markers[markerIndex];

        marker.showInfo = !marker.showInfo;
        this.setState({ markers: this.state.markers });
    }

    fetchData = () => {
        const query = {
            "GET": ["rooms_shortname", "rooms_lat", "rooms_lon", "rooms_number", "rooms_href"],
            "WHERE": {},
            "AS": "TABLE"
        }

        Store.fetch('rooms_map', query).then((data) => {
            let buildingMarkers = data.reduce((markers: {[id:string]: MarkerProps}, room: any) => {
                let marker = markers[room.rooms_shortname];
                if (!marker) {
                    marker = this.createMarker(room);
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
            this.setState({ markers: markers});
        });

    }

    render () {
        return <div className='room-explorer'>
            <Map markers={this.state.markers} handleClick={this.handleMarkerClick} />
            <button className='uppercase' onClick={this.fetchData}> Load Data </button>
        </div>
    }
}
