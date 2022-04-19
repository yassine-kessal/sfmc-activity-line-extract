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

    events = ['dataSources', 'contactsSchema'];

    renderedCallback() {
        this.hasFields = this.fields.length > 0;
    }

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

    removeField(event) {
        // We save field id in name property of button icon lws el
        let fieldId = parseInt(event.target.name, 10);

        console.log(`[fields] Remove field ID : ${fieldId}`);

        let indexOfField = this.fields.indexOf(
            this.fields.find((field) => field.id === fieldId)
        );

        this.fields.splice(indexOfField, 1);
    }

    getContext(event) {
        console.log(event.detail);
    }
}
