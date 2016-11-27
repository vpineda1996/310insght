import * as React from 'react'

import { RoomExplorerFilter, RoomFilterType } from './RoomExplorerFilter';
import { Range } from './RangeInput';
import { RoomFilterProps, SubFilterProps } from './Filter';
import { Map, MarkerProps } from './Map';
import { Store, Data } from '../store/store';
import { ROOMS_COLUMNS } from '../store/constants';

interface RoomExplorerProps {
    dataId: string;
    onNewQuery: (who: string, query: {}) => void;
}

interface RoomExplorerState {
    filters: RoomFilterProps[],
    subfilters: {[field: string]: SubFilterProps },
    markers: MarkerProps[]
    regions: any[]
    minMax: {[field:string]: Range}
    overlays: any[]
}

const ALL_ROOM_QUERY = {
    "GET": ["rooms_shortname", "rooms_lat", "rooms_lon", "rooms_number", "rooms_href"]
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
            filters: [{
                all: true,
                field: 'shortname',
                type: RoomFilterType.CHECKBOX,
                value: null
            }, {
                all: true,
                field: 'furniture',
                type: RoomFilterType.CHECKBOX,
                value: null
            }, {
                all: true,
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
            subfilters: {},
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
            case google.maps.drawing.OverlayType.RECTANGLE:
            case google.maps.drawing.OverlayType.CIRCLE:
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
        this.addMapOverlayFilter(overlay);
        this.performSearch();
    }

    performSearch = () => {
        let query = this.buildQuery(this.state.filters);

        let _query: {};

        if (this.state.overlays.length === 0) {
            _query = $.extend({}, ALL_ROOM_QUERY, { "WHERE": query })
        } else {
            if (!!Object.keys(query)) {
                _query = $.extend({}, ALL_ROOM_QUERY, { "WHERE": { "AND": [ { "OR": this.state.overlays.map(boundQuery) }, query ] } });
            } else {
                _query = $.extend({}, ALL_ROOM_QUERY, { "WHERE": { "OR": this.state.overlays.map(boundQuery) } });
            }
        }
        this.fetchMarkerData(_query);
    }

    buildQuery = (filters: RoomFilterProps[]) => {
        let query: any = filters.reduce((query: any, filter: RoomFilterProps) => {
            if (!query.AND) query.AND = [];

            let partialQuery = this.buildFilterQuery(filter);
            if (!!partialQuery) {
                query.AND.push(partialQuery);
            }

            return query;
        }, {});
        return query;
    }

    buildFilterQuery(filter: RoomFilterProps): {} {

        let f = ROOMS_COLUMNS.find(rc => rc.name === filter.field);
        let column = f.dataset + f.name;

        switch (filter.type) {
            case RoomFilterType.CHECKBOX:
                let subfilter = this.state.subfilters[filter.field];

                if (!filter.value || filter.value.length === 0 || filter.all) {
                    // return all
                    return null;
                } else if (!subfilter || !Object.keys(subfilter).length) {
                    // find all the selected ones
                    return { 'OR': filter.value.map((val: string) => { return { 'IS': { [column]: val } } } ) };
                }

                // find all selected sub options
                let conversionMap = ['number'].
                    map((dep: string) => ROOMS_COLUMNS.find(rc => rc.name === dep)).
                    reduce((map: {[field: string]: string}, rc: any) => {
                        map[rc.name] = rc.dataset + rc.name;
                        return map;
                }, {});

                /*
                'OR': [
                    { parent: opt0 && 'AND': [
                        { suboption0: { OR: [suboptions] } }
                        { suboption1: { OR: [suboptions] } }
                    ] }
                ]
                */

                let subquery: any = {
                    'OR': filter.value.map((val: string) => {
                        return {
                            'AND': [
                                { 'IS': { [column]: val } },
                                { 'OR': Object.keys(subfilter[val]).map(opt => {
                                    return {
                                        'AND': Object.keys(subfilter[val][opt]).map(dep => {
                                            if (subfilter[val][opt][dep]) {
                                                return { 'IS': { [conversionMap[dep]]: opt } };
                                            } else {
                                                return null;
                                            }
                                        }).filter(dep => !!dep)
                                    }
                                }).filter(q => q.AND && q.AND.length)
                            }]
                        }
                    }).filter((q: any) => q.AND && q.AND.length && q.AND[1].OR && q.AND[1].OR.length)
                }

                if (!subquery.OR.length) {
                    return null;
                }
                return subquery;
            case RoomFilterType.RANGE:
                return {
                    'OR': [{
                        'AND': [
                            { 'GT': { [column]: filter.value.min } },
                            { 'LT': { [column]: filter.value.max } }
                        ]
                    }, {
                        'EQ': { [column]: filter.value.min }
                    }, {
                        'EQ': { [column]: filter.value.max }
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

    onSelect = (field: string, value: string, values?: any) => {
        let state = this.state;
        let index = state.filters.findIndex(filter => filter.field === field);
        if (!state.filters[index].value && !value) {
            state.filters[index].value = [];
            this.setState(state);
            return;
        }

        if (value.split('-----').length > 1) {
            this.onSelectSuboptions(field, value.split('-----'), values)
            return;
        }

        let valIndex = state.filters[index].value.indexOf(value);
        if (valIndex === -1) {
            state.filters[index].value.push(value);
        } else {
            state.filters[index].value.splice(valIndex,1);
        }
        if (state.filters[index].value.length === 0) {
            this.onSelectAll(field, true);
        }
        this.setState(state);
    }

    onSelectSuboptions = (field: string, value: string[], values?: {[parent: string]: {[dep: string]: boolean}}) => {
        let state = this.state;
        if (!state.subfilters[field]) {
            state.subfilters[field] = {};
        }

        if (!state.subfilters[field][value[0]] && values) {
            state.subfilters[field][value[0]] = values;
            this.setState(state);
            return;
        }

        state.subfilters[field][value[0]][value[1]][value[2]] = !state.subfilters[field][value[0]][value[1]][value[2]];
        this.setState(state);

    }

    onSelectAll = (field: string, selected: boolean) => {
        let state = this.state;
        let index = state.filters.findIndex(filter => filter.field === field);

        state.filters[index].all = selected;
        this.setState(state);
    }

    render () {
        return (
            <div className='room-explorer container-fluid'>
                <RoomExplorerFilter filters={this.state.filters} subfilters={this.state.subfilters} onRangeChange={this.onRangeChange} onSelect={this.onSelect} onSelectAll={this.onSelectAll} />
                <div className='row'>
                    <div className='col-md-12 col-sm-12'>
                    <button className='query-btn divider-sm' onClick={this.performSearch}><strong>Find Me Some Rooms!</strong></button>
                    </div>
                </div>
                <Map markers={this.state.markers} handleClick={this.handleMarkerClick} handleDrawOverlay={this.handleDrawOverlay} />
            </div>
        );
    }
}
