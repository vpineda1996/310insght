import * as React from 'react';

import { ColumnType, ROOMS_COLUMNS } from '../store/constants';
import { Store } from '../store/store';

export interface RoomFilterProps {
    field: string;
    type: any;
    value: any;
    onSelect?: any;
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
            <span key={opt}><small><input type='checkbox' value={opt} onChange={this.onSelect} />{opt}</small><br/></span>
        ));
    }

    onSelect = (e: any) => {
        console.info(this.props,e.target);
        this.props.onSelect(this.props.field, e);
    }

    fetchOptions = (column: ColumnType) => {
        let field = column.dataset + column.name;
        return Store.fetch('room-options', {
            'GET': [field, 'doCount'],
            'WHERE': {},
            'GROUP': [field],
            'APPLY': [ {'doCount': { 'COUNT': field } } ]
        }).then(data => {
            console.info(data);
            let options = data.map(val => val[column.dataset + column.name]);
            this.setState({ checkboxOpions: options });
        });
    }

    render () {
        let column = ROOMS_COLUMNS.find(rc => rc.name === this.props.field);
        return (
            <div className='col-md-3'>
                <strong>{column.locale}</strong><br />
                <div className='filter-checkbox-container'>
                    { this.state.checkboxOpions && this.renderCheckBox() }
                </div>
            </div>
        );
    }
}
