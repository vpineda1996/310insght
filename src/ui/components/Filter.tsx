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
    dependencies?: {[id: string]: { [dependency: string]: any[] } };
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
        if (!!CHECKBOX_LIST[props.field].length) {
            this.state.dependencies = {};
        }
        this.fetchOptions(ROOMS_COLUMNS.find(rc => rc.name === props.field));
    }

    renderCheckBox = () => {
        return this.state.checkboxOpions.filter(opt => !this.props.value.includes(opt)).map((opt: any) => (
            <span key={opt}><input type='checkbox' value={opt} id={'checkbox-'+opt} onChange={this.onSelect} />
                <small htmlFor={'checkbox-'+opt} className={this.props.all ? 'rip':''}>{opt}</small><br/>
            </span>
        ));
    }

    renderSubCheckBox = () => {
        let width = Math.round(12 / (1 + CHECKBOX_LIST[this.props.field].length));
        console.info(this.props.field,this.props.value,this.state.dependencies);

        return CHECKBOX_LIST[this.props.field].map(dep => (
            <div key={'checkbox-subfilter-dependency-'+dep} className={'filter-checkbox-container col-md-'+width}>
                <strong className='checkbox-subfilter-header divider-sm'>{ROOMS_COLUMNS.find(rc => rc.name === dep).locale}</strong>
                { this.props.value.map((key: string) => (
                    <div key={'checkbox-subfilter-'+this.props.field+'-'+key}>
                        <button className='room-subfilter' onClick={this.onUnselect} value={key}>{key}</button>
                        {
                            this.state.dependencies[key] && this.state.dependencies[key][dep].map((opt: string) => (
                            <div key={'checkbox-subfilter-'+this.props.field+'-'+key+'-'+opt}>
                                <input type='checkbox' value={[key,opt]} id={'checkbox-subfilter-'+this.props.field+'-'+key+'-'+opt+'-box'} onChange={this.onSelectSuboption}/>
                                <label htmlFor={'checkbox-subfilter-'+this.props.field+'-'+key+'-'+opt+'-box'}>{opt}</label>
                            </div>))
                        }
                    </div>))
                }
            </div>));
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
        this.props.onSelect(this.props.field, e.target.value);
        if (this.state.dependencies && !this.state.dependencies[e.target.value]) {
            this.fetchSubOptions(e.target.value);
        }
    }

    onUnselect = (e: any) => {
        console.info(e.target,e.target.value);
        this.props.onSelect(this.props.field, e.target.value);
    }

    onSelectSuboption = (e: any) => {
         console.info('onSelectSuboption',e.target,e.target.value);
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
            this.props.onSelect(this.props.field, null);
        });
    }

    fetchSubOptions = (source: string) => {
        let parent = ROOMS_COLUMNS.find(rc => rc.name === this.props.field);

        let cols = CHECKBOX_LIST[this.props.field].map(col => {
            let f = ROOMS_COLUMNS.find(rc => rc.name === col);
            return f.dataset + f.name;
        });

        Store.fetch('room-suboptions', {
            'GET': cols,
            'WHERE': {
                'IS': { [parent.dataset + parent.name]: source }
            },
        }).then(data => {
            let state = this.state;
            state.dependencies[source] = {}
            let conversionMap: {[i:string]: string} = {};
            cols.forEach(col => {
                conversionMap[col] = col.split('_')[1];
                state.dependencies[source][conversionMap[col]] = [];
            });

            data.forEach(val => {
                Object.keys(val).forEach(key => {
                    state.dependencies[source][conversionMap[key]].push(val[key]);
                });
            });
            this.setState(state);
        });
    }

    render () {
        let column = ROOMS_COLUMNS.find(rc => rc.name === this.props.field);
        let width = Math.round(12 / (1 + CHECKBOX_LIST[this.props.field].length));
        console.info(this.props.field, this.state.dependencies);

        return (
            <div>
                <strong>{column.locale}</strong>
                <div className='divider-sm' />
                <div className={'filter-checkbox-container col-md-'+width}>
                    { this.props.onSelectAll && this.renderAllCheckBox() }
                    { this.props.value && this.renderCheckBox() }
                </div>
                { this.props.value && this.renderSubCheckBox() }
            </div>
        );
    }
}
