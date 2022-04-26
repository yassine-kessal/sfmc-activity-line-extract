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
                url: 'https://eogropaqow7rzxc.m.pipedream.net',
                verb: 'POST',
                useJwt: true
            }
        },
        configurationArguments: {
            publish: {
                url: 'https://eogropaqow7rzxc.m.pipedream.net',
                verb: 'POST',
                useJwt: true
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
