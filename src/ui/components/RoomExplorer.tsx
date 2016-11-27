import * as React from 'react'

import { SidebarLayout } from '../layout/SidebarLayout'
import { RoomExplorerSidebar } from './RoomExplorerSidebar'
import { RoomFilter, FilterProps, FilterOptionProps, DataType, Filters } from './RoomFilter';
import { RoomExplorerFilter, RoomFilterType } from './RoomExplorerFilter';
import { Range } from './RangeInput';
import { RoomFilterProps } from './Filter';
import { Map, MarkerProps } from './Map'
import { Store, Data } from '../store/store'

interface RoomExplorerProps {
    dataId: string;
    onNewQuery: (who: string, query: {}) => void;
}

interface RoomExplorerState {
    filters: RoomFilterProps[],
    markers: MarkerProps[]
    regions: any[]
    options: Filters
    minMax: {[field:string]: Range}
    overlays: any[]
}

const ALL_ROOM_QUERY = {
    "GET": ["rooms_shortname", "rooms_lat", "rooms_lon", "rooms_number", "rooms_href"]
}
const FILTER_OPTIONS: Filters = {
    'seats': DataType.NUMBER,
    'furniture': DataType.STRING,
    'type': DataType.STRING,
    'lat': DataType.NUMBER,
    'lon': DataType.NUMBER
};

const PRECEDENCE: {[operator:string]: number} = {
    'AND': 0,
    'OR': 1
}

const boundQuery = (overlay: any) => {
    switch (overlay.type) {
        case google.maps.drawing.OverlayType.RECTANGLE:
            return RECTANGULAR_QUERY(overlay.overlay.bounds);
        case google.maps.drawing.OverlayType.CIRCLE:
            return CIRCULAR_QUERY(overlay.overlay);
        case google.maps.drawing.OverlayType.POLYGON:
            return POLYGON_QUERY(overlay.overlay);
        default:
            return {};
    }
}

const RECTANGULAR_QUERY = (bounds: any) => {
    return {
        "AND": [
            { "GT": { "rooms_lat": bounds.f.f } },
            { "LT": { "rooms_lat": bounds.f.b } },
            { "LT": { "rooms_lon": bounds.b.f } },
            { "GT": { "rooms_lon": bounds.b.b } }
        ]
    };
}

const CIRCULAR_QUERY = (overlay: any) => {
    return {
        "WITHIN": {
            "rooms_lat": overlay.center.lat(),
            "rooms_lon": overlay.center.lng(),
            "radius": overlay.radius
        }
    };
}

const POLYGON_QUERY = (bounds: any) => {
    return {};
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
    constructor (props: any) {
        super(props);
        this.state = {
            markers: [],
            regions: [],
            options: FILTER_OPTIONS,
            filters: [{
              field: 'shortname',
              type: RoomFilterType.CHECKBOX,
              value: null
            }, {
                field: 'furniture',
                type: RoomFilterType.CHECKBOX,
                value: null
            }, {
                field: 'type',
                type: RoomFilterType.CHECKBOX,
                value: null
            }, {
                field: 'seats',
                type: RoomFilterType.RANGE,
                value: null
            }, {
                field: 'lat',
                type: RoomFilterType.RANGE,
                value: null
            }, {
                field: 'lon',
                type: RoomFilterType.RANGE,
                value: null
            }],
            minMax: {},
            overlays: []
        };
    }

    handleMarkerClick = (name: string) => {
        let markerIndex = this.state.markers.findIndex(marker => marker.name === name);
        let state = this.state;
        let marker = state.markers[markerIndex];

        marker.showInfo = !marker.showInfo;
        this.setState(state);
    }

    fetchMarkerData = (query: {}) => {
        Store.fetch('rooms_map', query).then((data) => {
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
            this.props.onNewQuery(this.props.dataId, query);
        });
    }

    addMapOverlayFilter = (overlay: any) => {
        switch (overlay.type) {
            case google.maps.drawing.OverlayType.RECTANGLE, google.maps.drawing.OverlayType.CIRCLE:
                let state = this.state;
                state.overlays.push(overlay);
                this.setState(state);
                return;
            case google.maps.drawing.OverlayType.POLYGON:
                return;
            default:
                return;;
        }
    }

    handleDrawOverlay = (overlay: any) => {
        let query: any = boundQuery(overlay);
        this.addMapOverlayFilter(overlay);
        query.GET = ["rooms_shortname", "rooms_number"];
        query.AS = "TABLE";
        this.performSearch();
    }

    buildQuery = (filters: any[]) => {
        let query: {} = filters.reduce((query: {[key:string]:any}, filter: FilterProps) => {
            if (filter.filters && filter.filters.length !== 0) {
                return this.buildQuery(filter.filters);
            }

            if (Object.keys(query).length === 0) {
                return this.buildFilterQuery(filter);
            }

            let key = Object.keys(query)[0];
            let precedence1 = PRECEDENCE[filter.connector];
            let precedence2 = PRECEDENCE[key];
            if (typeof precedence1 === 'undefined') precedence1 = 2;
            if (typeof precedence2 === 'undefined') precedence2 = 2;

            if (precedence1 === precedence2) {
                // append new filter
                if (!query[key]) query[key] = [];
                query[key].push(this.buildFilterQuery(filter));
            } else {
                query = {
                    [filter.connector]: [
                        query,
                        this.buildFilterQuery(filter)
                    ]
                }

            }
            return query;
        }, {});
        return query;
    }

    performSearch = () => {
        let query = this.buildQuery(this.state.filters);

        let _query: {};

        if (this.state.overlays.length === 0) {
            _query = $.extend({}, ALL_ROOM_QUERY, { "WHERE": query })
        } else {
            if (!!Object.keys(query)) {
                _query = $.extend({}, ALL_ROOM_QUERY, { "WHERE": { "AND": [ { "OR": this.state.overlays.map(o => this.buildMapQuery(o)) }, query ] } });
            } else {
                _query = $.extend({}, ALL_ROOM_QUERY, { "WHERE": { "OR": this.state.overlays.map(o => this.buildMapQuery(o)) } });
            }
        }
        this.fetchMarkerData(_query);
    }

    buildMapQuery(overlay: any): {} {
        switch (overlay.type) {
            case google.maps.drawing.OverlayType.CIRCLE:
                return CIRCULAR_QUERY(overlay.overlay);
            case google.maps.drawing.OverlayType.RECTANGLE:
                return RECTANGULAR_QUERY(overlay.overlay.bounds);
            default:
                return {}
        }
    }

    buildFilterQuery(filter: FilterProps): {} {
        let field = filter.field;
        let column = 'rooms_' + field;

        switch (this.state.options[field]) {
            case DataType.STRING:
                switch (filter.operatorValues[field]) {
                    case 'contains':
                        return { 'IS': { [column]: '*' + filter.textValues[field] + '*' } };
                    case 'equals':
                        return { 'IS': { [column]: filter.textValues[field] } };
                }
            case DataType.NUMBER:
                return {
                    'OR': [{
                        'AND': [
                            { 'GT': { [column]: filter.rangeValues[field].min } },
                            { 'LT': { [column]: filter.rangeValues[field].max } }
                        ]
                    }, {
                        'EQ': { [column]: filter.rangeValues[field].min }
                    }, {
                        'EQ': { [column]: filter.rangeValues[field].max }
                    }]
                };
            default:
                return null;
        }
    }

    onRangeChange = (field: string, component: any, value: any) => {
        let filterIndex = this.state.filters.findIndex(filter => filter.field === field);
        let state = this.state;
        state.filters[filterIndex].value = value;
        this.setState(state);
    }

    onSelect = (field: string, e: any) => {
        let state = this.state;
        let index = state.filters.findIndex(filter => filter.field === field);
        if (!state.filters[index].value) {
            state.filters[index].value = []
        }

        let val = e.target.value;
        let valIndex = state.filters[index].value.indexOf(val);
        if (valIndex === -1) {
            state.filters[index].value.push(val);
        } else {
            state.filters[index].value.splice(valIndex,1);
        }
        this.setState(state);
    }

    render () {
        return (
            <div className='room-explorer container-fluid'>
                <SidebarLayout>
                    <RoomExplorerFilter filters={this.state.filters} onRangeChange={this.onRangeChange} onSelect={this.onSelect} />
                </SidebarLayout>
                <div className='row'>
                    <div className='col-md-12 col-sm-12'>
                    <button className='query-btn'><strong>Try some queries!</strong></button>
                    </div>
                </div>
                <Map markers={this.state.markers} handleClick={this.handleMarkerClick} handleDrawOverlay={this.handleDrawOverlay} />
            </div>
        );
    }
}
