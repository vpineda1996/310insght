import $ = require('jquery');

const DOMAIN = 'localhost:4321';

export function uploadData(id: string, data: any): JQueryXHR {
    return $.ajax(DOMAIN + '/dataset/' + id, {
        type: 'PUT',
        data: data,
        processData: false
    });
}
