import { QueryData } from '../util/Query'


// convert from QueryData[] to
// [
//   { 'courses_id: '310', 'courses_dept':'cpsc' },
//   { 'courses_id: '300', 'courses_dept':'chem' },
// ]
export function renderTable(queryData: QueryData[], queryAss: string) : {}[] {
    if (queryAss !== 'TABLE') {
        throw new Error('Invalid AS -- Unknown render type');
    }

    let i : any;
    let response : {}[] = [];
    let columnNames : string[] = queryData.map((qd) => Object.keys(qd)[0]);

    for (i in queryData[0][columnNames[0]]) {
        response.push(
            columnNames.reduce((responseRow : {[s: string]: any}, cn : string, index : number) => {
                responseRow[cn] = queryData[index][cn][i];
                return responseRow;
            }, {})
        );
    }
    return response;
}
