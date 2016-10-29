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

export const TEAM_NUMBER = 69;
export const GEO_ENDPOINT = "http://skaha.cs.ubc.ca:8022/api/v1/team" + TEAM_NUMBER + "/";
