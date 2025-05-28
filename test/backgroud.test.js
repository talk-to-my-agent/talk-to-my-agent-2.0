const { expect } = require('chai');
const sinon = require('sinon');

describe('backgroud.js', () => {
    let sendResponse;
    let onMessageListener;

    beforeEach(() => {
        sendResponse = sinon.spy();

        global.chrome = {
            runtime: {
                onInstalled: {
                    addListener: sinon.spy()
                },
                onMessage: {
                    addListener: (fn) => {
                        onMessageListener = fn;
                    }
                }
            }
        };

        require('../background');
    })

    afterEach(() => {
        sinon.restore();
        delete global.chrome;
    })

    it('Should return error if required fields are missing ', () => {
        // Simulate a message with missing jobDescription and career Goals
        const request = {
            action: 'generate',
            data: {}
        };

        onMessageListener(request, {}, sendResponse);

        // sendResponse should be called with an error
        expect(sendResponse.calledOnce).to.be.true;
        const responseArg = sendResponse.firstCall.args[0];
        expect(responseArg.success).to.be.false;
        expect(responseArg.error).to.include('Missing required fields');
    });
})