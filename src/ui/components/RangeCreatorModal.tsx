import * as React from "react";
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from 'react-modal-bootstrap';
import { Store } from '../store/store'
import { COURSES_NUMERIC_COLUMNS, ColumnType, QUERY, APPLY_EXTENSION, APPLYTOKENS, COURSES_ID, RangeSelectorData } from '../store/constants'

export interface RangeCreatorModalProps {
    isOpen: boolean;
    onOk: any;
}

export interface RangeCreatorModalState {
    isOpen: boolean;
}

export class RangeCreatorModal extends React.Component<RangeCreatorModalProps, RangeCreatorModalState> {

    static defaultProps = {
    }

    constructor(p: any){
        super(p);
        this.state = {
            isOpen: this.props.isOpen
        };
    }

    getMaxMin = (oCol : ColumnType) => {
        let query = $.extend({}, QUERY, APPLY_EXTENSION, 
            {GET: [oCol.dataset + "year","maxCol", "minCol"]}, 
            {GROUP: [oCol.dataset + "year"], 
                APPLY: [ { "maxCol": { "MAX": oCol.dataset + oCol.name } },
                            { "minCol": { "MIN": oCol.dataset + oCol.name } }
                        ]
            });

        return Store.fetch(COURSES_ID,query).then((data : any[]) => {
            return data.reduce((prev, next) => {
                if(next.maxCol > prev.max) prev.max = next.maxCol;
                if(next.minCol < prev.min) prev.min = next.minCol;
                return prev;
            }, {
                max: 0,
                min: 0
            });
        });
    }

    onOk = (ev: React.MouseEvent<HTMLFormElement>) => {
        // grab Data
        ev.preventDefault();
        let oCol = COURSES_NUMERIC_COLUMNS[$(ev.target).find("#agg-type").val()]
        this.getMaxMin(oCol).then((oMaxMin) => {
            let retVal : RangeSelectorData = {
                col: oCol,
                max: oMaxMin.max,
                min: oMaxMin.min
            };
            this.props.onOk(retVal);
            this.setState({isOpen: false})
        });
    }

    onCancel = () => {
        this.setState({isOpen: false});
    }
    renderOptions = () => {
        return COURSES_NUMERIC_COLUMNS.map((col,idx) => {
            return <option key={idx} value={idx}>{col.locale}</option>
        })
    }


    render() {
        return <Modal isOpen={this.state.isOpen} onRequestHide={this.onCancel}>
            <form data-toggle="validator" role="form" onSubmit={this.onOk}> 
                <ModalHeader>
                    <ModalClose onClick={this.onCancel} />
                    <ModalTitle>{"Range creator"}</ModalTitle>
                </ModalHeader>
                <ModalBody>
                        <div className="form-group">
                            <label htmlFor="agg-type">Select column</label>
                            <select className="form-control" id="agg-type" defaultValue={'0'}>
                                {this.renderOptions()}
                            </select>
                        </div>
                </ModalBody>
                <ModalFooter>
                    <button type="submit" className='btn btn-primary'>OK</button>
                </ModalFooter>
            </form>
        </Modal>;
    }
}