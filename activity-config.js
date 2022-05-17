module.exports = function configJSON(req) {
    return {
        workflowApiVersion: '1.1',
        metaData: {
            icon: 'assets/icon.png',
            category: 'flow',
            backgroundColor: "#fff",
            isConfigured: true
        },
        type: 'REST',
        arguments: {
            execute: {
                inArguments: [{
                    file: {},
                    fields: []
                }],
                url: 'https://sfmc-activity-extract-data.herokuapp.com/execute',
                verb: 'POST',
                timeout: 100000,
                retryCount: 3,
                retryDelay: 20000,
                concurrentRequests: 3
            }
        },
        configurationArguments: {
            publish: {
                url: 'https://sfmc-activity-extract-data.herokuapp.com/publish',
                verb: 'POST'
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