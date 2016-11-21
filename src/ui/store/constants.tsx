export interface ColumnType {
    name: string;
    type: Datatype;
}

export enum Datatype {
    STRING,
    NUMBER
};

export const COURSES_COLUMNS: ColumnType[] = [{
    name: 'dept',
    type: Datatype.STRING
}, {
    name: 'id',
    type: Datatype.NUMBER
}, {
    name: 'avg',
    type: Datatype.NUMBER
}, {
    name: 'instructor',
    type: Datatype.STRING
}, {
    name: 'title',
    type: Datatype.STRING
}, {
    name: 'pass',
    type: Datatype.NUMBER
}, {
    name: 'fail',
    type: Datatype.NUMBER
}, {
    name: 'audit',
    type: Datatype.NUMBER
}, {
    name: 'uuid',
    type: Datatype.NUMBER
}, {
    name: 'year',
    type: Datatype.NUMBER
}];

export const ROOMS_COLUMNS: ColumnType[] = [{
    name: 'fullname',
    type: Datatype.STRING
}, {
    name: 'shortname',
    type: Datatype.STRING
}, {
    name: 'number',
    type: Datatype.STRING
}, {
    name: 'name',
    type: Datatype.STRING
}, {
    name: 'address',
    type: Datatype.STRING
}, {
    name: 'lat',
    type: Datatype.NUMBER
}, {
    name: 'lon',
    type: Datatype.NUMBER
}, {
    name: 'seats',
    type: Datatype.NUMBER
}, {
    name: 'type',
    type: Datatype.STRING
}, {
    name: 'furniture',
    type: Datatype.STRING
}, {
    name: 'href',
    type: Datatype.STRING
}];