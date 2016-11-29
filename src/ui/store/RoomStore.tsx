
import { ROOMS_COLUMNS } from './constants';
import { RoomFilterType } from '../components/RoomExplorerFilter';
import { RoomFilterProps, SubFilterProps } from '../components/Filter';

export function buildRoomQuery(filter: RoomFilterProps, subfilters: {[field: string]: SubFilterProps }): {} {

    let f = ROOMS_COLUMNS.find(rc => rc.name === filter.field);
    let column = f.dataset + f.name;

    switch (filter.type) {
        case RoomFilterType.CHECKBOX:
            let subfilter = subfilters[filter.field];

            if (!filter.value || filter.value.length === 0 || filter.all) {
                return null;
            } else if (!subfilter || !Object.keys(subfilter).length) {
                return { 'OR': filter.value.map((val: string) => { return { 'IS': { [column]: val } } } ) };
            }

            return buildRoomSubquery(filter, column, subfilters);
        case RoomFilterType.RANGE:
            return buildRoomRangeQuery(filter, column);
        default:
            return null;
    }
}

export const boundQuery = (overlay: any) => {
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

function buildRoomRangeQuery (filter: RoomFilterProps, column: string): {} {
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
}

function buildRoomSubquery (filter: RoomFilterProps, column: string, subfilters: {[field: string]: SubFilterProps }): {} {
    let subfilter = subfilters[filter.field];
    let conversionMap = ['number'].
        map((dep: string) => ROOMS_COLUMNS.find(rc => rc.name === dep)).
        reduce((map: {[field: string]: string}, rc: any) => {
        map[rc.name] = rc.dataset + rc.name;
        return map;
    }, {});

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

