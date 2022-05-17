import setupTestMock from './../test/testMock';
import { LightningElement, track } from 'lwc';
import Postmonger from 'postmonger';
const connection = new Postmonger.Session();

export default class ExtractData extends LightningElement {
    @track hasFields;

    @track payload;

    @track fields = [
        {
            id: 0,
            name: 'broadLogId',
            value: ''
        },
        {
            id: 1,
            name: 'LineId',
            value: ''
        },
        {
            id: 2,
            name: 'ActivityId',
            value: ''
        },
        {
            id: 3,
            name: 'ActivityName',
            value: ''
        }
    ];

    @track file = {
        filename: 'test.csv'
    };

    @track eventDefinitionKey = 'loading...';

    @track journeyName = '';

    connectedCallback() {
        setupTestMock(connection);

        connection.trigger('ready');
        connection.trigger('requestEntryEventDefinitionKey');
        connection.trigger('requestInteraction');

        connection.on('initActivity', (payload) => this.init(payload));

        connection.on('clickedNext', () => this.clickedNext());

        connection.on('requestedEntryEventDefinitionKey', (payload) => {
            console.log(payload);
            this.eventDefinitionKey = payload;

            if (
                this.fields[
                    this.fields.findIndex((f) => f.name == 'broadLogId')
                ]
            ) {
                this.fields[
                    this.fields.findIndex((f) => f.name == 'broadLogId')
                ].value = `{{Event.${payload}.ContactId}}`;
            }

            if (this.fields[this.fields.findIndex((f) => f.name == 'LineId')]) {
                this.fields[
                    this.fields.findIndex((f) => f.name == 'LineId')
                ].value = `{{Event.${payload}.Line_ID}}`;
            }
            console.log(JSON.stringify(this.fields));
        });

        connection.on('requestedInteraction', (payload) => {
            console.log('[Interaction]', JSON.stringify(payload));
            this.journeyName = payload.name;
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

                let activityId = this.fields.find((f) => f.name == 'ActivityId')
                    ? this.fields[
                          this.fields.findIndex((f) => f.name == 'ActivityId')
                      ].value
                    : false;

                if (activityId) {
                    var date = new Date();
                    this.file = {
                        filename: `ACTION_${activityId}_${date
                            .toISOString()
                            .replace('-', '')
                            .split('T')[0]
                            .replace('-', '')}.csv`
                    };
                }
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

            if (args.file)
                this.file = {
                    ...args.file
                };

            if (args.fields && args.fields.length > 0) {
                this.fields = [...args.fields];

                let broadLogIdValue =
                    this.fields[
                        this.fields.findIndex((f) => f.name == 'broadLogId')
                    ]?.value;

                let lineIdValue =
                    this.fields[
                        this.fields.findIndex((f) => f.name == 'LineId')
                    ]?.value;

                if (broadLogIdValue) {
                    this.fields[
                        this.fields.findIndex((f) => f.name == 'broadLogId')
                    ].value = broadLogIdValue.replace(
                        /{{Event.([^.]+).([^.{}]+)}}/,
                        '{{Event.' + this.eventDefinitionKey + '.$2}}'
                    );
                }

                if (lineIdValue) {
                    this.fields[
                        this.fields.findIndex((f) => f.name == 'LineId')
                    ].value = lineIdValue.replace(
                        /{{Event.([^.]+).([^.{}]+)}}/,
                        '{{Event.' + this.eventDefinitionKey + '.$2}}'
                    );
                }
            }
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

        var url = new URL(newPayload.configurationArguments.publish.url);

        url.searchParams.set('filename', this.file.filename);
        url.searchParams.set('activityname', this.journeyName);

        console.log('URL', JSON.stringify(url));

        newPayload.configurationArguments.publish.url = url.href;

        // check if no empty field
        newPayload.metaData.isConfigured =
            this.fields.filter((field) => !field.value).length === 0;

        console.log('[Save activity]', JSON.stringify(newPayload));
        connection.trigger('updateActivity', newPayload);
    }
}
