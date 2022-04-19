import { LightningElement, track } from 'lwc';

export default class ExtractData extends LightningElement {
    @track hasFields;
    @track fields = [
        {
            id: 0,
            name: '',
            value: ''
        }
    ];
    @track eventDefinitionKey = 'loading...';

    //to communicate with framework
    activity;

    events = ['dataSources', 'contactsSchema', 'entryEventDefinitionKey'];

    /**
     *
     */
    renderedCallback() {
        this.hasFields = this.fields.length > 0;
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
            } else if (fieldType == 'label') {
                this.fields[indexOfField].value = event.target.value;
            }
        }

        this.updateActivity();
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

        this.updateActivity();
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
            this.fields.find((field) => field.id === fieldId)
        );

        this.fields.splice(indexOfField, 1);

        this.updateActivity();
    }

    /**
     *
     * @param {*} event
     */
    async getContext(event) {
        this.activity = this.template.querySelector('common-activity');
        this.config = event.detail;

        if (this.config.entryEventDefinitionKey) {
            this.eventDefinitionKey = this.config.entryEventDefinitionKey;
        }

        if (
            this.config.payload &&
            this.config.payload.arguments &&
            this.config.payload.arguments.execute &&
            this.config.payload.arguments.execute.inArguments &&
            this.config.payload.arguments.execute.inArguments.length > 0
        ) {
            let newFields = [];

            this.config.payload.arguments.execute.inArguments.forEach(
                (arg, index) => {
                    newFields.push({
                        id: index,
                        name: arg.name,
                        value: arg.value
                    });
                }
            );
        }

        console.log('[context]', event);
    }

    /**
     *
     */
    updateActivity() {
        const newPayload = JSON.parse(JSON.stringify(this.config.payload));

        const argfields = this.fields.reduce((obj, field) => {
            obj[field.name] = field.value;
            return obj;
        }, {});

        this.fields.forEach((field) => {
            newPayload.arguments.execute.inArguments.push({
                name: field.name,
                value: field.value
            });
        });

        newPayload.configurationArguments.params = argfields;

        // check if no empty field
        newPayload.metaData.isConfigured =
            this.fields.filter((field) => !field.value).length === 0;

        console.log('[newPayload]', newPayload);
        this.activity.update(newPayload);
    }
}
