import { Datasets, Datatable, Datatype, Column } from "../src/common/Common";
import DatasetController from "../src/controller/DatasetController";
import QueryController from "../src/controller/QueryController";
import { QueryRequest, QueryResponse } from '../src/util/Query';

import { isFormatValid } from '../src/queryHelpers/querable';
import { isValidOrder } from '../src/queryHelpers/queryOrder';

import {expect} from 'chai';

describe("QueryController::Room", function () {
    let GET: string[] = ['rooms_lat', 'rooms_lon', 'rooms_number']
    let WHERE: {} = {
        "WITHIN": {
            "rooms_lat": 30.00000,
            "rooms_lon": -102.00000,
            "radius": 10.00000
        }
    }
    let ID = 'rooms';
    let QUERY : QueryRequest;

    let COLUMNS = [{
        name: 'lat',
        type: Datatype.NUMBER
    }, {
        name: 'lon',
        type: Datatype.NUMBER
    }, {
        name: 'number',
        type: Datatype.STRING
    }]

    let DATA: {[colName:string]:any[]} = {
        'lat': [
            20.00001,
            30.11111,
            25.22222,
            40.00000,
            30.44444
        ],
        'lon': [
            -101.99999,
            -110.00000,
            -120.00000,
            -102.00000,
            -115.00000
        ],
        'number': [
            '101',
            '105',
            '201',
            '202',
            '301'
        ]
    };

    function query() : QueryRequest {
        QUERY = { GET: GET, WHERE: WHERE, AS: "TABLE"};
        return QUERY;
    }

    function isValid() : boolean {
        return isFormatValid(query());
    }

    beforeEach(function (done) {
        let datatable = new Datatable(ID, undefined, []);

        datatable.createColumns(COLUMNS).then((columns) => {
            COLUMNS.map(c => c.name).forEach((col: string, index: number) => {
                DATA[col].forEach((val: string|number) => datatable.columns[index].insertCellFast(val));
            });
            datatable.loadColumns(COLUMNS.map(c => ID + '_' + c.name)).then(col => {
                DatasetController.getInstance().save(ID, datatable).then(() => done());
            });
        });
    });

    describe('rooms', function () {

        it('succeeds with WITHIN', function () {
            expect(isValid()).to.equal(true);
        });

        it('successfully makes query', function (done) {

            return new QueryController().query(query()).then((res: QueryResponse) => {
                expect(res.result).to.be.deep.equal([{
                    'rooms_lat': 20.00001,
                    'rooms_lon': -101.99999,
                    'rooms_number': '101'
                }, {
                    'rooms_lat': 30.11111,
                    'rooms_lon': -110,
                    'rooms_number': '105'
                }, {
                    'rooms_lat': 40,
                    'rooms_lon': -102,
                    'rooms_number': '202'
                }]);
                done();

            });
        });
    });
});
