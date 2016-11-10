export const PARENT_DIR = 'data';
export const DATASETFILE = PARENT_DIR + '/datasets.json';

export const MCOMPARATORS = ['LT', 'GT', 'EQ'];
export const SCOMPARATORS = ['IS'];
export const LOGICCOMPARATORS = ['AND', 'OR'];
export const NEGATORS = ['NOT'];
export const LOGENABLE = true;
export enum APPLYTOKENS {
    MAX,
    MIN,
    AVG,
    COUNT
}

export const TEAM_NUMBER = Math.floor((Math.random() * 70) + 1);
export const GEO_ENDPOINT = "http://skaha.cs.ubc.ca:8022/api/v1/team" + TEAM_NUMBER + "/";

export const MAX_GEO_TRIES = 3;
export const GEO_REQ_TIMEOUT = 700; //ms
