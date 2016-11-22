import * as React from "react";
import { AgGridReact } from 'ag-grid-react';

export interface ColumnProps {
    data?: Array<string>,
    name?: string,
    onSelectOption?: Function,
    fieldId: string,
    className?: string
}

export class Column extends React.Component<ColumnProps, {}> {
    static defaultProps: ColumnProps = {
        className: "",
        data: [],
        name: "Example",
        fieldId: "a",
        onSelectOption: () => { }
    };

    api: any;
    columnApi: any;
    data: Array<number | string>;

    onGridReady(params: any) {
        this.api = params.api;
        this.columnApi = params.columnApi;
        this.api.sizeColumnsToFit()
    };

    render() {
        return <div className={"ag-fresh " + this.props.className}>
            <AgGridReact

                // listen for events with React callbacks
                // onRowSelected={this.onRowSelected.bind(this)}
                // onCellClicked={this.onCellClicked.bind(this)}
                onGridReady={this.onGridReady.bind(this)}

                // binding to properties within React State or Props
                // showToolPanel={this.state.showToolPanel}
                // quickFilterText={this.state.quickFilterText}
                // icons={this.state.icons}

                // column definitions and row data are immutable, the grid
                // will update when these lists change
                columnDefs={[
                    {
                        headerName: '', width: 30, checkboxSelection: true, suppressSorting: true,
                        suppressMenu: true, pinned: true, cellClass: "cell-centered"
                    },
                    { headerName: this.props.name, field: this.props.fieldId }
                ]}
                rowData={this.props.data}
                onSelectionChanged={() => this.props.onSelectOption(this.api)}

                // or provide props the old way with no binding
                rowSelection="multiple"
                enableSorting="true"
                enableFilter="true"
                rowHeight="22"
                />
        </div>;
    }
}