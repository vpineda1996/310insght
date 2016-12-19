import * as React from "react";
import { Modal, ModalHeader, ModalTitle, ModalClose, ModalBody, ModalFooter } from 'react-modal-bootstrap';
import { COURSES_COLUMNS, ColumnType, ApplyColumn, QUERY, APPLY_EXTENSION, APPLYTOKENS, Datatype } from '../store/constants'
import { AgGridReact } from 'ag-grid-react';
var BarStackChart = require('react-d3-basic').BarStackChart;

export interface TableModalProps {
}

export interface TableModalState {
    isOpen : boolean;
    rowData: any;
    columns? : ColumnType[];
}

export class TableModal extends React.Component<TableModalProps, TableModalState> {

    constructor(props: any) {
        super(props);
        this.state = {
            isOpen: false,
            rowData: [],
            columns: []
        }
    }

    api: any;
    columnApi: any;

    onGridReady = (params: any) => {
        this.api = params.api;
        this.columnApi = params.columnApi;
    };

    onClose = () => {
        this.setState({
            isOpen: false,
            rowData: []
        });
    }

    getHeaderDefinition = () => {
        return this.state.columns.map(colDefn => {
            return { headerName: colDefn.locale, field: colDefn.dataset + colDefn.name }
        });
    }


    render() {
        return <Modal isOpen={this.state.isOpen} onRequestHide={this.onClose}>
                <ModalHeader>
                    <ModalClose onClick={this.onClose} />
                    <ModalTitle>Table view</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <div className="row">
                        <div className="col-md-12 columns-height-courses-explorer table-courses-explorer ag-fresh">
                            <AgGridReact
                                columnDefs={this.getHeaderDefinition()}
                                onGridReady={this.onGridReady}

                                // or provide props the old way with no binding
                                rowSelection="multiple"
                                enableSorting="true"
                                enableFilter="true"
                                rowHeight="22"
                                rowData={this.state.rowData}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <button className='btn btn-primary' onClick={this.onClose}>Close</button>
                </ModalFooter>
        </Modal>;
    }
}