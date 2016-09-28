/**
 * Created by rtholmes on 2016-06-19.
 */

import {Datasets} from "../common/Common";
import Log from "../Util";

export interface QueryRequest {
    GET: string|string[];
    WHERE: {
        GT?: {
            [s:string]:number
        },
        LT?: {
            [s:string]:number
        },
        EQ?: {
            [s:string]:number
        },
        IS?: string|string[]
    };
    ORDER?: string;
    AS: string;
}

export interface QueryResponse {
}

export default class QueryController {
    private datasets: Datasets = null;

    constructor(datasets: Datasets) {
        this.datasets = datasets;
    }

    public isValid(query: QueryRequest): boolean {
        if (typeof query !== 'undefined' && query !== null && Object.keys(query).length > 0) {
            return (typeof query.WHERE === 'undefined') || this.isValidQuery(query);
        }
        return false;
    }

    public query(query: QueryRequest): QueryResponse {
        Log.trace('QueryController::query( ' + JSON.stringify(query) + ' )');
        return {};
    }

    private isLogicComparison(key:string, val:any) : boolean {
        const LOGICCOMPARISON = ['AND', 'OR'];
        let k : string;
        let values : {[s:string]:any}

        return LOGICCOMPARISON.includes(key) &&
            this.isArray(val) &&
            val.every((v:any) => this.isHash(v) && this.isFilter((k=Object.keys((values=v))[0]), values[k]))
    }

    private isMComparison(key:string, val:any) : boolean {
        const MCOMPARATOR = ['LT', 'GT', 'EQ'];
        let keys : string[];

        return MCOMPARATOR.includes(key) &&
            this.isHash(val) &&
            (keys = Object.keys(val)).length === 1 &&
            this.isString(keys[0]) &&
            (this.isString(val[keys[0]]) || this.isNumber(val[keys[0]]));
    }

    private isSComparison(key:string, val:any) : boolean {
        const SCOMPARATOR = ['IS'];
        let keys : string[];

        return SCOMPARATOR.includes(key) &&
            this.isHash(val) &&
            (keys = Object.keys(val)).length === 1 &&
            this.isString(keys[0]) &&
            this.hasString(val[keys[0]]);
    }

    private isNegation(key:string, val:any) : boolean {
        const NEGATORS = ['NOT'];

        return NEGATORS.includes(key) &&
            this.isHash(val) &&
            this.areFilters(Object.keys(val)[0], val)
    }
    private isStringOrStringArray(key:string, val: any) : boolean {
        return this.isString(val) || val.constructor === Array && val.every((v:any) => this.isString(v));
    }
    private isTypeString(val: any) : boolean {
        return typeof val === 'string';
    }
    private isString(val:string) : boolean {
        const regex = /^[a-zA-Z0-9_]+$/;
        return this.isTypeString(val) && regex.test(val);
    }
    private hasString(val: any) : boolean {
        const regex = /[a-zA-Z0-9_]+/;
        return this.isTypeString(val) && regex.test(val);
    }
    private isNumber(val: any) : boolean {
        return !isNaN(parseFloat(val)) && isFinite(val);
    }
    private isHash(val: any) : boolean {
        return val !== null && typeof val === 'object';
    }
    private isArray(val: any) : boolean {
        return !!val && val.constructor === Array;
    }
    private isAsTable(key:string, val:any) : boolean {
        return key === 'AS' &&
            this.isString(val) &&
            val === 'TABLE';
    }
    private isValidColumnKey(name: string) {
        const VALID_KEYS = [
            'courses_dept',
            'courses_id',
            'courses_avg',
            'courses_instructor',
            'courses_title',
            'courses_pass',
            'courses_fail',
            'courses_audit'
        ];
        return VALID_KEYS.includes(name);
    }


    private areFilters(key:string, val:{[s:string]:any}) : boolean {
        return Object.keys(val).every((k:string) => this.isFilter(k, val[k]));
    }

    private isFilter(key:string, val:any) : boolean {
        return this.isLogicComparison(key, val) ||
            this.isMComparison(key, val) ||
            this.isSComparison(key, val) ||
            this.isNegation(key, val);
    }

    private isValidQuery(query: QueryRequest) : boolean {
        const TOP_LEVEL_REQUIREMENTS : {[s:string]:Function} = {
            'GET': this.isStringOrStringArray,
            'WHERE': this.areFilters,
            'AS': this.isAsTable
        }
        const TOP_LEVEL_OPTIONALS : {[s:string]:Function} = {
             'ORDER': this.isString
        }

        let keys = Object.keys(query);
        let q : any = query;

        return Object.keys(TOP_LEVEL_REQUIREMENTS).every((req_key:string) => {
            return keys.includes(req_key) && TOP_LEVEL_REQUIREMENTS[req_key].bind(this)(req_key, q[req_key]);
        }) && Object.keys(TOP_LEVEL_OPTIONALS).every((opt_key:string) => {
            return !keys.includes(opt_key) || TOP_LEVEL_OPTIONALS[opt_key].bind(this)(opt_key, q[opt_key]);
        })
    }
}
