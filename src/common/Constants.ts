export const PARENT_DIR = 'data';
export const DATASETFILE = PARENT_DIR + '/datasets.json';

export const MCOMPARATORS = ['LT', 'GT', 'EQ'];
export const SCOMPARATORS = ['IS'];
export const LOGICCOMPARATORS = ['AND', 'OR'];
export const NEGATORS = ['NOT'];
export const MULTI_FILTERS: {[filter:string]:{token: string; count:number}} = {
    'WITHIN': { token: 'radius', count: 2} // 2 columns is needed to calc radius
}

export const LOGENABLE = true;
export enum APPLYTOKENS {
    MAX,
    MIN,
    AVG,
    COUNT
}

export const TEAM_NUMBER = 29;
export const GEO_ENDPOINT = "http://skaha.cs.ubc.ca:8022/api/v1/team" + TEAM_NUMBER + "/";

export const MAX_GEO_TRIES = 3;
export const GEO_REQ_TIMEOUT = 700; //ms

export let TIMES = [].concat.apply(
    Array.from(Array(24)).map((v: any, i: number) => 'MWF' + i),
    Array.from(Array(16)).map((v: any, i: number) => 'TT' + i)
);

export let LEGAL_TIMES = [].concat.apply(
    Array.from(Array(9)).map((v: any, i: number) => i + 7), // MWF7 - MWF15
    Array.from(Array(6)).map((v: any, i: number) => i + 29) // TT5 - TT10
);

export const SECTION_SIZE = 'sectionSize';
export const SECTION_COUNT = 'sectionCount';
export const NUM_AVAILABLE_TIME_SLOTS = TIMES.length;
export const NUM_LEGAL_TIME_SLOTS = LEGAL_TIMES.length;
