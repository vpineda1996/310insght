export class MissingDatasets extends Error {
    missing : string[];

    constructor(missing: string[]) {
        super(missing.join(', '));
        this.name = this.constructor.name;
        this.message = missing.join(', ');
        this.missing = missing;
    }
}
