import * as React from "react";
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from 'react-modal-bootstrap';
import { COURSES_COLUMNS, ColumnType, ApplyColumn, QUERY, APPLY_EXTENSION, APPLYTOKENS, Datatype } from '../store/constants'

export interface ApplyModalProps {
    orginalColumn : ColumnType
    isOpen: boolean;
    onOk: any;
    onCancel: any;
}

export class ApplyModal extends React.Component<ApplyModalProps, {}> {

    static defaultProps = {
        isOpen: false
    }

    onOk = (ev: React.MouseEvent<HTMLFormElement>) => {
        // grab Data
        ev.preventDefault();
        let retVal : any = {
            originalCol: this.props.orginalColumn,
            newColId: {
                dataset: "",
                locale: $(ev.target).find("#colName").val(),
                type: Datatype.NUMBER,
                name: $(ev.target).find("#colName").val()
            },
            aggregateType: parseInt($(ev.target).find("#agg-type").val())
        }
        this.props.onOk(retVal);
    }

    renderOptions = () => {
        return APPLYTOKENS.indices().map((idx) => {
            return <option key={idx} value={idx}>{APPLYTOKENS[idx]}</option>
        })
    }


    render() {
        return <Modal isOpen={this.props.isOpen} onRequestHide={this.props.onCancel}>
            <form data-toggle="validator" role="form" onSubmit={this.onOk}> 
                <ModalHeader>
                    <ModalClose onClick={this.props.onCancel} />
                    <ModalTitle>Create calculated column</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <p>Select which type of aggregate you want</p>
                        <div className="form-group">
                            <label htmlFor="agg-type">Type of Aggregation</label>
                            <select className="form-control" id="agg-type" defaultValue={'0'}>
                                {this.renderOptions()}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="colName">Column Name</label>
                            <input pattern="^[A-z]{1,}([A-Z][a-z]+)+$" maxLength={15} 
                                className="form-control" id="colName" 
                                aria-describedby="colmnName" placeholder="Enter column name" required></input>
                            <small id="colmnName" className="form-text text-muted">Cammel cased and no underscores or spaces</small>
                        </div>

                </ModalBody>
                <ModalFooter>
                    <button type="submit" className='btn btn-primary'>Save changes</button>
                </ModalFooter>
            </form>
        </Modal>;
    }
}