import $ = require('jquery');

export function fetch(id: string, query: {}): JQueryXHR {
    console.info(JSON.stringify(query))
    return $.post('/query', JSON.stringify(query));
}
