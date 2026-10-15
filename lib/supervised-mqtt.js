'use strict';

// Use the SDK's transport-constructor injection point, not SDK private fields.
// The SDK owns signing, trust, renewal scheduling, and transport shutdown. Keep
// the error listener for the provider's lifetime: a signing callback can arrive
// after client close. The owner generation check ignores those stale failures.
module.exports = function supervisedMqtt(Mqtt, onAuthenticationError) {
    return class SupervisedMqtt extends Mqtt {
        constructor(authenticationProvider) {
            super(authenticationProvider);
            authenticationProvider.on('error', onAuthenticationError);
        }
    };
};
