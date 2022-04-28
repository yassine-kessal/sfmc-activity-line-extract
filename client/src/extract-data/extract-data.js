import setupTestMock from './../test/testMock';
import {
    LightningElement,
    track
} from 'lwc';
import Postmonger from 'postmonger';
const connection = new Postmonger.Session();

export default class ExtractData extends LightningElement {
    @track hasFields;

    @track payload;

    @track fields = [{
        id: 0,
        name: '',
        value: ''
    }];

    @track file = {
        filename: 'test.csv'
    };

    @track eventDefinitionKey = 'loading...';

    connectedCallback() {
        setupTestMock(connection);

        connection.trigger('ready');
        connection.trigger('requestEntryEventDefinitionKey');

        connection.on('initActivity', (payload) => this.init(payload));

        connection.on('clickedNext', () => this.clickedNext());

        connection.on('requestedEntryEventDefinitionKey', (payload) => {
            console.log(payload);
            this.eventDefinitionKey = payload.entryEventDefinitionKey;
        });
    }

    /**
     *
     */
    renderedCallback() {
        this.hasFields = this.fields.length > 0;
    }

    onFilenameChange(event) {
        this.file = {
            filename: event.target.value
        };
    }

    /**
     *
     * @param {*} event
     */
    onFieldChange(event) {
        let fieldId = event.target.dataset.fieldid;
        let fieldType = event.target.dataset.fieldtype;

        let indexOfField = this.fields.indexOf(
            this.fields.find((field) => field.id == fieldId)
        );

        if (indexOfField > -1) {
            if (fieldType == 'name') {
                this.fields[indexOfField].name = event.target.value;
            } else if (fieldType == 'value') {
                this.fields[indexOfField].value = event.target.value;
            }
        }
    }

    /**
     *
     */
    addField() {
        console.log(`[fields] Add new field`);

        let lastField = this.fields.slice(-1).pop();

        // if lastField.id == undefined (ex: removed field) make = 0
        let lastFieldId = typeof lastField != 'undefined' ? lastField.id : 0;

        this.fields.push({
            id: lastFieldId + 1,
            name: '',
            value: ''
        });
    }

    /**
     *
     * @param {*} event
     */
    removeField(event) {
        // We save field id in name property of button icon lws el
        let fieldId = parseInt(event.target.dataset.id, 10);

        console.log(`[fields] Remove field ID : ${fieldId}`);

        let indexOfField = this.fields.indexOf(
            this.fields.find((field) => field.id == fieldId)
        );

        this.fields.splice(indexOfField, 1);
    }

    /**
     * Init Activity
     *
     * @param {*} payload
     */
    init(payload) {
        this.payload = JSON.parse(JSON.stringify(payload));

        if (
            payload.arguments &&
            payload.arguments.execute &&
            payload.arguments.execute.inArguments &&
            payload.arguments.execute.inArguments.length > 0
        ) {
            let args = payload.arguments.execute.inArguments[0];

            if (args.file) this.file = {
                ...args.file
            };

            if (args.fields && args.fields.length > 0) this.fields = [...args.fields];
        }

        console.log('[Init Activity]');
        console.log(JSON.stringify(payload));
    }

    clickedNext() {
        this.save();
    }

    save() {
        const newPayload = JSON.parse(JSON.stringify(this.payload));

        const newInArguments = {
            file: this.file,
            fields: this.fields
        };

        newPayload.arguments.execute.inArguments = [newInArguments];

        newPayload.configurationArguments.publish.url = `${newPayload.configurationArguments.publish.url}?filename=${this.file.filename}`;

        // check if no empty field
        newPayload.metaData.isConfigured =
            this.fields.filter((field) => !field.value).length === 0;

        console.log('[Save activity]', JSON.stringify(newPayload));
        connection.trigger('updateActivity', newPayload);
    }
}