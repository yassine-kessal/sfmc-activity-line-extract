module.exports = function configJSON(req) {
    return {
        workflowApiVersion: '1.1',
        metaData: {
            icon: 'assets/icon.png',
            category: 'flow',
            isConfigured: true
        },
        type: 'REST',
        arguments: {
            execute: {
                inArguments: [
                    {
                        file: {},
                        fields: []
                    }
                ],
                url: 'https://eogropaqow7rzxc.m.pipedream.net'
            }
        },
        configurationArguments: {
            publish: {
                url: 'https://eogropaqow7rzxc.m.pipedream.net'
            }
        },
        userInterfaces: {
            configInspector: {
                size: 'medium'
            }
        },
        editable: true,
        errors: []
    };
};
