import $ = require('jquery');

export function uploadData(id: string, data: any): JQueryXHR {
    return $.ajax('/dataset/' + id, {
        type: 'PUT',
        data: data,
        processData: false
    });
}
