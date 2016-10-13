import { Datasets, Datatable, Datatype, Column } from "../common/Common";
import { MCOMPARATORS, SCOMPARATORS, LOGICCOMPARATORS, NEGATORS, APPLYTOKENS }
from '../common/Constants'

import { isString, isStringOrStringArray } from '../util/String'
import { areFilters, isAsTable, queryIdsValidator, QueryRequest, QueryResponse, QueryData, ApplyElement } from '../util/Query'
import { getFirstKey, getFirst } from '../util/Object'
import { isNumber } from '../util/String'
import { getApplyTargets, getApplyNames } from './queryApply'
import { MissingDatasets } from '../util/Errors'
import Log from "../Util";

interface AggregateColumns {
    [colName: string]: {
        aggType: APPLYTOKENS,
        name: string
    }
}

interface AggregatedRows {
    [idJoinedByUnd: string]: {
        groupKeys: Array<string | number>;                               // Push in the values that we joined on
        aggregatedCols: Array<Array<string | number>>;       // Push values per column that we are going to agreggate on
        aggrSol?: Array<string | number>
    }
}

interface Columns {
    col: {
        [columnName: string]: Array<string | number>;
    }
    mapFromAggNameToColName: {
        [aggColName: string]: string; //  mapFromAggNameToColName corresponding col
    };
}

export default (() => {
    function isValidGroupQuery(q: QueryRequest): boolean {
        return true;
    };

    function groupBy(query: QueryRequest, queryData: QueryData[]): Promise<QueryData[]> | QueryData[] {
        if (query.GROUP) {
            let groupCols: Columns = getGroupCols(query.GROUP, queryData);
            let aggregateCols: Columns = getAggregateCols(query, queryData);
            Log.trace("GroupQuery::groupBy -- aggregateCols " + JSON.stringify(aggregateCols));


            let curRowIdx: number = 0,
                colLength: number = queryData[0][getFirstKey(queryData[0])].length;
            let oAcum: AggregatedRows = {}
            for (var i = 0; i < colLength; i++) {
                // grab cols that we are going to group by and create AggregatedRows
                let key = getKey(groupCols, i);
                let aGroupKeys = getGroupKeys(groupCols, i);
                let aAggVals = getAggKeys(aggregateCols, i)
                Log.trace("GroupQuery::groupBy -- aAggVals " + JSON.stringify(aAggVals));
                pushValueToAccum(oAcum, key, aGroupKeys, aAggVals);
            }

            // Aggregate values and store the in aggrSol
            for (var rowKey in oAcum) {
                let aAggregatedCols = oAcum[rowKey].aggregatedCols;
                let aRes = aAggregatedCols.map((aValuesOfInNeedOfAggregation: Array<string | number>, idx: number) => {
                    return aggregateValues(aValuesOfInNeedOfAggregation, idx, aggregateCols, query);
                });
                oAcum[rowKey].aggrSol = aRes;
            }

            let colNames = query.GET;
            let colIndecesOfGroup = getIndecesOfGroupByColNames(colNames, groupCols);
            let colIndecesOfAggr = getIndecesOfAggByColNames(colNames, aggregateCols);
            let newQueryData = createEmptyQueryData(replaceNamesWithNewAggFiels(colNames, query));

            // Return to QueryData[] form from AggregatedRows
            for (var rowKey in oAcum) {
                let oRow = oAcum[rowKey];
                Log.trace("Key: " + rowKey + " has " + oRow.groupKeys.length + " group keys and " + JSON.stringify(oRow.aggregatedCols));
                Object.keys(groupCols.col).forEach((key, idx) => {
                    let colInNewQueryIdx = colIndecesOfGroup[idx];
                    getFirst(newQueryData[colInNewQueryIdx]).push(oRow.groupKeys[idx]);
                });
                Object.keys(aggregateCols.mapFromAggNameToColName).forEach((key, idx) => {
                    let colInNewQueryIdx = colIndecesOfAggr[idx];
                    getFirst(newQueryData[colInNewQueryIdx]).push(oRow.aggrSol[idx]);
                })
            }

            queryData = newQueryData;
        }
        return queryData;

        function getIndecesOfGroupByColNames(colNames: string[], groupCols: Columns) {
            return Object.keys(groupCols.col).map((key) => colNames.indexOf(key));
        }
        function getIndecesOfAggByColNames(colNames: string[], aggCols: Columns) {
            return Object.keys(aggCols.mapFromAggNameToColName).map((key) => colNames.indexOf(key));
        }

        function pushValueToAccum(oAcum: AggregatedRows, key: string, groupKeys: Array<string | number>, aggVal: Array<string | number>) {
            if (oAcum[key]) {
                aggVal.forEach((val, idx) => oAcum[key].aggregatedCols[idx].push(val));
            } else {
                oAcum[key] = {
                    groupKeys: groupKeys,
                    aggregatedCols: aggVal.map(val => [val])
                }
            }

        }

        function getGroupKeys(groupCols: Columns, i: number): Array<string | number> {
            return Object.keys(groupCols.col).map((key) => {
                return groupCols.col[key][i];
            });
        }

        // ie map wil contain "superName" -> "courses_id" and "superName2" -> "courses_id" 
        // then we will accesss courses_id twice to create two aggregated cols
        function getAggKeys(aggCols: Columns, i: number): Array<string | number> {
            return Object.keys(aggCols.mapFromAggNameToColName).map((key) => {
                return aggCols.col[aggCols.mapFromAggNameToColName[key]][i];
            });
        }

        function getKey(groupCols: Columns, i: number): string {
            return getGroupKeys(groupCols, i).join("_");
        }
    }

    function replaceNamesWithNewAggFiels(names: string[], query: QueryRequest): string[] {
        var aTargets = getApplyTargets(query);
        var aNewNames = getApplyNames(query);
        return names.map((sA) => {
            return aTargets.indexOf(sA) !== -1 ? aNewNames[aTargets.indexOf(sA)] : sA;
        });
    }

    function createEmptyQueryData(colNames: string[]): QueryData[] {
        return colNames.map((name) => {
            let obj: any = {};
            obj[name] = [];
            return obj;
        });
    }

    function aggregateValues(aValues: Array<string | number>, colIndexOfAggCols: number, aggregateCols: Columns, query: QueryRequest): number | string {
        Log.trace("GroupQuery::aggregateValues -- aValues " + JSON.stringify(aValues) +
            " -- colIndexOfAggCols -- " + JSON.stringify(colIndexOfAggCols) +
            " -- aggregateCols -- " + JSON.stringify(aggregateCols));
        var aggregateType = getAggregateType(aggregateCols, colIndexOfAggCols, query);
        Log.trace("GroupQuery::aggregateValues -- aggregate type: " + aggregateType);
        return AGGREGATE_FUNCTIONS[aggregateType](aValues);
    }

    function AVG(arr: Array<number>) {
        return arr.reduce((iAccum, curVal) => {
            iAccum += curVal;
            return iAccum;
        }, 0.0) / arr.length;
    }

    function COUNT(arr: Array<string | number>) {
        let oRet: { [id: string]: boolean } = {};
        return Object.keys(arr.reduce((oAccum, siCurVal) => {
            oAccum[siCurVal.toString()] = true;
            return oAccum;
        }, oRet)).length;
    }

    var AGGREGATE_FUNCTIONS: any = {
        MAX: (arr: Array<string | number>) => Math.max.apply(undefined, arr),
        MIN: (arr: Array<string | number>) => Math.min.apply(undefined, arr),
        AVG: AVG,
        COUNT: COUNT
    }

    function getAggregateType(aggregateCols: Columns, colIndexOfAggCols: number, query: QueryRequest) {
        var colName = Object.keys(aggregateCols.mapFromAggNameToColName)[colIndexOfAggCols];
        var res = query.APPLY.find((elem: ApplyElement) => {
            return getFirstKey(elem) === colName;
        });
        return getFirstKey(getFirst(res));
    }

    function getAggregateCols(query: QueryRequest, queryData: QueryData[]) {
        let aggregateApDatasetColNames = getApplyTargets(query);
        Log.trace("GroupQuery::getAggregateCols args --  " + JSON.stringify(aggregateApDatasetColNames));
        Log.trace("GroupQuery::getAggregateCols query --  " + JSON.stringify(query));
        let oRet: Columns = getGroupCols(aggregateApDatasetColNames, queryData);
        query.APPLY.forEach((elem: ApplyElement) => {
            let aggName = getFirstKey(elem);
            let origCol = getFirst(getFirst(elem));
            oRet.mapFromAggNameToColName[aggName] = origCol;
        });
        return oRet;
    }

    function getGroupCols(groupCols: string[], queryData: QueryData[]): Columns {
        let oRet: Columns = {
            col: {},
            mapFromAggNameToColName: {}
        };
        return queryData.filter((qDataCol: QueryData) => {
            let colData = getFirst(qDataCol);
            let colName = getFirstKey(qDataCol);
            return groupCols.includes(colName);
        }).reduce((oAcum: Columns, qDataCol: QueryData) => {
            let colData = getFirst(qDataCol);
            let colName = getFirstKey(qDataCol);
            oAcum.col[colName] = colData;
            return oAcum;
        }, oRet);
    }

    function getColNamesFromQueryData(queryData: QueryData[]): string[] {
        return queryData.map((oQDataObj) => {
            return getFirstKey(oQDataObj);
        });
    }

    return {
        isValidGroupQuery: isValidGroupQuery,
        groupBy: groupBy
    }
})();