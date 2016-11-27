export interface ColumnType {
    name: string;
    type: Datatype;
    locale: string;
    dataset?: string;
}

export interface ApplyColumn {
    originalCol: ColumnType,
    newColId: ColumnType,
    aggregateType: APPLYTOKENS
}

export enum Datatype {
    STRING,
    NUMBER
};

export const COURSES_ID = 'courses';
export const ROOMS_ID = 'rooms';

export interface RangeSelectorData {
    col: ColumnType;
    max: number;
    min: number;
    selectedMin?: number;
    selectedMax?: number;
    defaultValue?: number;
}

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
}, {
    name: 'size',
    type: Datatype.NUMBER,
    locale: "Course Size",
    dataset: COURSES_ID + "_"
}];

export const COURSES_NUMERIC_COLUMNS = COURSES_COLUMNS.filter(col => col.type === Datatype.NUMBER);

export const ROOMS_COLUMNS: ColumnType[] = [{
    name: 'fullname',
    type: Datatype.STRING,
    locale: "Full Name",
    dataset: ROOMS_ID + "_"
}, {
    name: 'shortname',
    type: Datatype.STRING,
    locale: "Building Name",
    dataset: ROOMS_ID + "_"
}, {
    name: 'number',
    type: Datatype.STRING,
    locale: "Number",
    dataset: ROOMS_ID + "_"
}, {
    name: 'name',
    type: Datatype.STRING,
    locale: "Name",
    dataset: ROOMS_ID + "_"
}, {
    name: 'address',
    type: Datatype.STRING,
    locale: "Address",
    dataset: ROOMS_ID + "_"
}, {
    name: 'lat',
    type: Datatype.NUMBER,
    locale: "Latitude",
    dataset: ROOMS_ID + "_"
}, {
    name: 'lon',
    type: Datatype.NUMBER,
    locale: "Longitude",
    dataset: ROOMS_ID + "_"
}, {
    name: 'seats',
    type: Datatype.NUMBER,
    locale: "Seats",
    dataset: ROOMS_ID + "_"
}, {
    name: 'type',
    type: Datatype.STRING,
    locale: "Type",
    dataset: ROOMS_ID + "_"
}, {
    name: 'furniture',
    type: Datatype.STRING,
    locale: "Furniture",
    dataset: ROOMS_ID + "_"
}, {
    name: 'href',
    type: Datatype.STRING,
    locale: "Link",
    dataset: ROOMS_ID + "_"
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

export namespace APPLYTOKENS {
    function isIndex(key: any): boolean {
        const n = ~~Number(key);
        return String(n) === key && n >= 0;
    }

    const _names: string[] = Object
        .keys(APPLYTOKENS)
        .filter(key => !isIndex(key));

    const _indices: number[] = Object
        .keys(APPLYTOKENS)
        .filter(key => isIndex(key))
        .map(index => Number(index));

    export function names(): string[] {
        return _names;
    }

    export function indices(): number[] {
        return _indices;
    }
}

export enum SORTDIRECTION {
    UP,
    DOWN
}

export namespace SORTDIRECTION {
    function isIndex(key: any): boolean {
        const n = ~~Number(key);
        return String(n) === key && n >= 0;
    }

    const _names: string[] = Object
        .keys(SORTDIRECTION)
        .filter(key => !isIndex(key));

    const _indices: number[] = Object
        .keys(SORTDIRECTION)
        .filter(key => isIndex(key))
        .map(index => Number(index));

    export function names(): string[] {
        return _names;
    }

    export function indices(): number[] {
        return _indices;
    }
}
