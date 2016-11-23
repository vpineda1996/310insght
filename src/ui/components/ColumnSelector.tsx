import * as React from "react";
import { COURSES_COLUMNS, ColumnType, ApplyColumn, QUERY, APPLY_EXTENSION, APPLYTOKENS } from '../store/constants'


interface ColumnsSelectorProps {
    cols: ColumnType[],
    onSelectColumn: Function,
    name: string
}

interface ColumnsSelectorState {
    cols: ColumnType[]
}

class ColumnsSelector extends React.Component<ColumnsSelectorProps, ColumnsSelectorState> {

    constructor(props: ColumnsSelectorProps) {
        super(props);
        this.state = {
            cols: []
        };
    }

    onSelectColumn = (oCol: ColumnType) => {
        let oButton: any = this.refs[oCol.name];
        let $button = $(oButton);
        $button.hasClass("active") ? $button.removeClass("active") : $button.addClass("active");
        this.props.onSelectColumn(this.updateState());
    }

    updateState = () => {
        let aCols = this.props.cols.filter((oCol) => {
            let oButton = this.refs[oCol.name];
            let $button = $(oButton);
            return $button.hasClass("active");
        });

        this.setState((p) => {
            p.cols = aCols;
            return p;
        });

        return aCols;
    }

    renderButtons = () => {
        return this.props.cols.map((oCol, idx) => {
            return <button type="button" className="col-sm-1 btn btn-default"
                ref={oCol.name} key={idx} onClick={() => this.onSelectColumn(oCol)}>
                {oCol.locale}
            </button>
        });
    }

    render() {
        return <div className="col-selector">
            <div className="col-md-1 col-selector-label">{this.props.name}</div>
            {this.renderButtons()}
        </div>;
    }
}
