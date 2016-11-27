import * as React from 'react';

import { ColumnType, ROOMS_COLUMNS } from '../store/constants';
import { Store } from '../store/store';

export interface RoomFilterProps {
    all?: boolean;
    field: string;
    onSelect?: any;
    onSelectAll?: any;
    type: any;
    value: any;
    [id: string]: any;
}

interface RoomFilterState {
    checkboxOpions: any[];
}

const CHECKBOX_LIST: {[column: string]: string[]} = {
    'fullname': [],
    'shortname': ['number'],
    'furniture': [],
    'type': []
}

export class RoomFilter extends React.Component<RoomFilterProps, RoomFilterState> {

    constructor (props: RoomFilterProps) {
        super(props);
        this.state = {
            checkboxOpions: null
        };
        this.fetchOptions(ROOMS_COLUMNS.find(rc => rc.name === props.field));
    }

    renderCheckBox = () => {
        return this.state.checkboxOpions.map((opt: any) => (
            <span key={opt}><input type='checkbox' value={opt} id={'checkbox-'+opt} onChange={this.onSelect} />
                <small htmlFor={'checkbox-'+opt} style={this.props.all ? {opacity:0.5}:{}}>{opt}</small><br/>
            </span>
        ));
    }

    renderAllCheckBox = () => {
        return (
            <span><label>
                <input type='checkbox' value='all' onChange={this.onSelectAll} checked={this.props.all} />
                All
            </label><br/><br/></span>
        );
    }

    onSelectAll = (e: any) => {
        if (!this.props.onSelectAll) { return }

        this.props.onSelectAll(this.props.field, e.target.checked);
    }

    onSelect = (e: any) => {
        this.props.onSelectAll(this.props.field, false);
        this.props.onSelect(this.props.field, e);
    }

    fetchOptions = (column: ColumnType) => {
        let field = column.dataset + column.name;
        return Store.fetch('room-options', {
            'GET': [field],
            'GROUP': [field],
            'APPLY': []
        }).then(data => {
            let options = data.filter(val => val[field]).map(val => val[field]);
            let state = this.state;
            state.checkboxOpions = options;
            this.setState(state);
        });
    }

    render () {
        let column = ROOMS_COLUMNS.find(rc => rc.name === this.props.field);
        return (
            <div>
                <strong>{column.locale}</strong>
                <div className='divider-sm' />
                <div className='filter-checkbox-container'>
                    { this.props.onSelectAll && this.renderAllCheckBox() }
                    { this.state.checkboxOpions && this.renderCheckBox() }
                </div>
            </div>
        );
    }
}
