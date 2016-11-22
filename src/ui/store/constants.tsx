export interface ColumnType {
    name: string;
    type: Datatype;
    locale: string;
    dataset?: string;
}

export enum Datatype {
    STRING,
    NUMBER
};

export const COURSES_ID = 'courses';

export const COURSES_COLUMNS: ColumnType[] = [{
    name: 'dept',
    type: Datatype.STRING,
    locale: "Department",
    dataset: COURSES_ID + "_"
}, {
    name: 'id',
    type: Datatype.NUMBER,
    locale: "ID",
    dataset: COURSES_ID + "_"
}, {
    name: 'avg',
    type: Datatype.NUMBER,
    locale: "Average",
    dataset: COURSES_ID + "_"
}, {
    name: 'instructor',
    type: Datatype.STRING,
    locale: "Instructor",
    dataset: COURSES_ID + "_"
}, {
    name: 'title',
    type: Datatype.STRING,
    locale: "Title",
    dataset: COURSES_ID + "_"
}, {
    name: 'pass',
    type: Datatype.NUMBER,
    locale: "Pass",
    dataset: COURSES_ID + "_"
}, {
    name: 'fail',
    type: Datatype.NUMBER,
    locale: "Fail",
    dataset: COURSES_ID + "_"
}, {
    name: 'audit',
    type: Datatype.NUMBER,
    locale: "Audited",
    dataset: COURSES_ID + "_"
}, {
    name: 'uuid',
    type: Datatype.NUMBER,
    locale: "UUID",
    dataset: COURSES_ID + "_"
}, {
    name: 'year',
    type: Datatype.NUMBER,
    locale: "Year",
    dataset: COURSES_ID + "_"
}];

export const ROOMS_COLUMNS: ColumnType[] = [{
    name: 'fullname',
    type: Datatype.STRING,
    locale: "Full Name",
    dataset: COURSES_ID + "_"
}, {
    name: 'shortname',
    type: Datatype.STRING,
    locale: "Short Name",
    dataset: COURSES_ID + "_"
}, {
    name: 'number',
    type: Datatype.STRING,
    locale: "Number",
    dataset: COURSES_ID + "_"
}, {
    name: 'name',
    type: Datatype.STRING,
    locale: "Name",
    dataset: COURSES_ID + "_"
}, {
    name: 'address',
    type: Datatype.STRING,
    locale: "Address",
    dataset: COURSES_ID + "_"
}, {
    name: 'lat',
    type: Datatype.NUMBER,
    locale: "Latitude",
    dataset: COURSES_ID + "_"
}, {
    name: 'lon',
    type: Datatype.NUMBER,
    locale: "Longitude",
    dataset: COURSES_ID + "_"
}, {
    name: 'seats',
    type: Datatype.NUMBER,
    locale: "Seats",
    dataset: COURSES_ID + "_"
}, {
    name: 'type',
    type: Datatype.STRING,
    locale: "Type",
    dataset: COURSES_ID + "_"
}, {
    name: 'furniture',
    type: Datatype.STRING,
    locale: "Furniture",
    dataset: COURSES_ID + "_"
}, {
    name: 'href',
    type: Datatype.STRING,
    locale: "Link",
    dataset: COURSES_ID + "_"
}];

export enum COLUMNS {
    PROFESSOR,
    DEPARTMENT,
    COURSE,
    YEAR
}

export const QUERY: any = {
    "GET": [],
    "WHERE": {},
    "AS": "TABLE"
};

export const APPLY_EXTENSION: any = {
    "GROUP": [],
    "APPLY": []
};

export enum APPLYTOKENS {
    MAX,
    MIN,
    AVG,
    COUNT
}