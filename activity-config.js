module.exports = function configJSON(req) {
    return {
        workflowApiVersion: '1.1',
        metaData: {
            icon: 'assets/icon.png',
            category: 'flow',
            isConfigured: true
        },
        type: 'RESTDECISION',
        name: 'Line Extract',
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
                retryDelay: 10000,
                concurrentRequests: 2
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
        outcomes: [{
                arguments: {
                    result: 'success'
                },
                metaData: {
                    label: 'Success'
                }
            },
            {
                arguments: {
                    result: 'failed'
                },
                metaData: {
                    label: 'Failed'
                }
            }
        ],
        editable: true,
        errors: []
    };
};