module.exports = function configJSON(req) {
    return {
        workflowApiVersion: '1.1',
        metaData: {
            icon: 'assets/icon.png',
            category: 'flow',
            isConfigured: true
        },
        type: 'REST',
        name: 'Line Extract',
        arguments: {
            execute: {
                inArguments: [{
                    file: {},
                    fields: []
                }],
                outArguments: [],
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
                    branchResult: 'success'
                },
                metaData: {
                    label: 'Success'
                }
            },
            // {
            //     arguments: {
            //         branchResult: 'failed'
            //     },
            //     metaData: {
            //         label: 'Failed'
            //     }
            // }
        ],
        editable: true,
        errors: []
    };
};