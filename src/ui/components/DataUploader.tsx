import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { uploadData } from '../store/uploader'

export enum Uploadable {
    COURSES,
    ROOMS
}

interface DataUploaderProps {
    uploadType: Uploadable
}

const defaultProps = {
    uploadType: Uploadable.COURSES
}

const fileId = (uploadType: Uploadable) => {
    switch (uploadType) {
        case Uploadable.COURSES:
            return 'courses';
        case Uploadable.ROOMS:
            return 'rooms';
        default:
            return null;
    }
}

export class DataUploader extends React.Component<DataUploaderProps, {}> {
    static defaultProps: DataUploaderProps = defaultProps;

    onSubmit (e: any) {
        e.preventDefault();

        let files = ReactDOM.findDOMNode<HTMLInputElement>(this.refs['file-upload']).files;
        let data = new FormData();
        data.append('zip', files[0]);

        uploadData(fileId(this.props.uploadType), data).then((data: any) => {
            console.info('ok it was barely ok');
        }).fail((xhr, status, error) => {
            console.info('plz');
        });
    }

    render () {
        return <div className='data-uploader'>
            <div className='file-submit'>
                <input ref='file-upload' type='file' className='colourless form-control' />
                <button type='button' onClick={this.onSubmit.bind(this)} className='btn btn-primary'>Add Dataset</button>
                <button type='button' className='btn btn-primary'>Remove Dataset</button>
            </div>
        </div>;
    }
}
