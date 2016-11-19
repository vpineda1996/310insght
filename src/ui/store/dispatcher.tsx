import $ = require('jquery');

export function fetch(id: string, query: {}): JQueryXHR {
    return $.ajax('/query', {
       type: 'POST',
       contentType: 'application/json',
       data: JSON.stringify(query),
       dataType: 'json'
    });
}
