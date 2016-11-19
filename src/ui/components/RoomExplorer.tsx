import * as React from 'react'
import { Map, MarkerProps } from './Map'
import { Store } from '../store/store'

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

    fetchData = () => {
        console.info('fetching data');
        const query = {
            "id": "rooms",
            "GET": ["rooms_shortname"],
            "WHERE": {
                "GT": { "rooms_seat": 0 }
            },
            "AS": "TABLE"
        }
        Store.fetch('rooms_map', query);

    }

    render () {
        return <div className='room-explorer'>
            <Map />
            <button className='uppercase' onClick={this.fetchData}> Load Data </button>
        </div>
    }
}
