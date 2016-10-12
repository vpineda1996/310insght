import { Datasets, Datatable, Datatype, Column } from "../common/Common";
import { MCOMPARATORS, SCOMPARATORS, LOGICCOMPARATORS, NEGATORS, APPLYTOKENS } from '../common/Constants'

import { isString, isStringOrStringArray } from '../util/String'
import { areFilters, isAsTable, queryIdsValidator, QueryRequest, QueryResponse, QueryData, ApplyElement } from '../util/Query'
import { getFirstKey, getFirst } from '../util/Object'
import { isNumber } from '../util/String'
import { MissingDatasets } from '../util/Errors'
import Log from "../Util";

interface AggregateColumns {
    [colName : string] : {
        aggType: APPLYTOKENS,
        name: string
    }
}

interface AggregatedRows {
    [idJoinedByUnd: string]: {
        groupKeys: Array<string|number>;                               // Push in the values that we joined on
        aggregatedCols: Array<Array<string|number>>;       // Push values per column that we are going to agreggate on
        aggrSol? : Array<string|number>
    }
}

interface Columns{
    [columnName: string] : Array<string|number>
}

export default (() => {
    function isValidGroupQuery (q: QueryRequest) : boolean {
        return true;
    };

    function groupBy(query: QueryRequest, queryData : QueryData[]) : Promise<QueryData[]>|QueryData[]{
        if(query.GROUP){
            let groupCols: Columns = getGroupCols(query.GROUP, queryData);
            let aggregateCols : Columns = getAggregateCols(query, queryData);


            let curRowIdx : number = 0, 
                colLength : number = queryData[0][getFirstKey(queryData[0])].length;
            let oAcum : AggregatedRows = {}
            for(var i = 0; i < colLength; i++){
                // grab cols that we are going to group by and create AggregatedRows
                let key = getKey(groupCols, i);
                let aGroupKeys = getGroupKeys(groupCols,i);
                let aAggVals = getGroupKeys(aggregateCols,i)
                pushValueToAccum(oAcum, key, aGroupKeys, aAggVals);
            }

            // Aggregate values and store the in aggrSol
            for(var rowKey in oAcum){
                let aAggregatedCols = oAcum[rowKey].aggregatedCols;
                let aRes = aAggregatedCols.map((aValuesOfInNeedOfAggregation: Array<string|number>, idx: number) => {
                    return aggregateValues(aValuesOfInNeedOfAggregation, idx);
                });
                oAcum[rowKey].aggrSol = aRes;
            }

            let colNames = getColNamesFromQueryData(queryData);
            let colIndecesOfGroup = getIndecesOfGroupByColNames(colNames, groupCols);
            let colIndecesOfAggr = getIndecesOfGroupByColNames(colNames, aggregateCols);
            let newQueryData = createEmptyQueryData(colNames);

            // Return to QueryData[] form from AggregatedRows
            for(var rowKey in oAcum){
                let oRow = oAcum[rowKey];
                Object.keys(groupCols).forEach((key, idx) => {
                    let colInNewQueryIdx = colIndecesOfGroup[idx];
                    getFirst(newQueryData[colInNewQueryIdx]).push(oRow.groupKeys[idx]); 
                });
                Object.keys(aggregateCols).forEach((key, idx) => {
                    let colInNewQueryIdx = colIndecesOfAggr[idx];
                    getFirst(newQueryData[colInNewQueryIdx]).push(oRow.aggrSol[idx]); 
                })
            }

            queryData = newQueryData;
        }
        return queryData;

        function getIndecesOfGroupByColNames(colNames : string[], groupCols: Columns){
            return Object.keys(groupCols).map((key) => colNames.indexOf(key));
        }

        function pushValueToAccum(oAcum : AggregatedRows, key: string, groupKeys:  Array<string|number>, aggVal : Array<string|number>) {
            if(oAcum[key]){
                aggVal.forEach((val, idx) => oAcum[key].aggregatedCols[idx].push(val));
            } else {
                oAcum[key] = {
                    groupKeys: groupKeys,
                    aggregatedCols: aggVal.map(val => [val])
                }
            }

        }

        function getGroupKeys (groupCols: Columns, i: number): Array<string|number> {
            return Object.keys(groupCols).map((key) => {
                return groupCols[key][i];
            });
        }

        function getKey(groupCols: Columns, i: number) : string{
           return getGroupKeys(groupCols, i).join("_");
        }
    }

    function createEmptyQueryData(colNames : string[]) : QueryData[] {
        return colNames.map((name) => {
            let obj :any = {};
            obj[name] = [];
            return obj;
        });
    }

    function aggregateValues(aValues: Array<string|number>, colIndex: number): number|string {
        // TODO: aggregate values!!!!
        return 0;
    }

    function getAggregateCols(query: QueryRequest, queryData : QueryData[]){
        let aggregateApDatasetColNames = getAggregateDatasetColNames(query.APPLY);
        return getGroupCols(aggregateApDatasetColNames, queryData);
    }

    function getGroupCols(groupCols: string[], queryData : QueryData[]) : Columns {
        let oRet : Columns = {};
        return queryData.filter((qDataCol: QueryData)=> {
            let colData = getFirst(qDataCol);
            let colName = getFirstKey(qDataCol);
            return groupCols.includes(colName);
        }).reduce((oAcum: Columns, qDataCol: QueryData) => {
            let colData = getFirst(qDataCol);
            let colName = getFirstKey(qDataCol);
            oAcum[colName] = colData;
            return oAcum;
        }, oRet);
    }

    function getAggregateDatasetColNames(queryApply: ApplyElement[]): string[] {
        return queryApply.map((oApplyE: ApplyElement) => {
            return getFirstKey(getFirst(queryApply));
        });
    }

    function getColNamesFromQueryData(queryData: QueryData[]) : string[]{
        return queryData.map((oQDataObj) => {
            return getFirstKey(oQDataObj);
        });
    }

    return {
        isValidGroupQuery: isValidGroupQuery,
        groupBy: groupBy
    }
})();