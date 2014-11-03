/**
 * Created by stephen on 16/10/2014.
 */

var nm = require('node-moog');
var util = require('util');
var options = {
    'url': 'https://innomoog:8881',
    'auth_token': 'my_secret',
    certFile: '../ssl/server.crt',
    caFile: '../ssl/client.crt'
};
var moogEvent = new nm.MoogEvent();
var moogRest = new nm.MoogREST(options);

var debug = function () {
    if (!process.env.DEBUG) return;
    var stack = new Error().stack;
    var args = Array.prototype.slice.call(arguments);
    var lines = stack.split('\n');
    var callee = lines[2].match(/at .* /i); //used because of use strict
    util.debug('[test.js] '+callee+' -> '+args);
};

moogEvent.description = 'My new description';
debug('Event generated ' + JSON.stringify(moogEvent));

moogRest.sendEvent(moogEvent, function (res, rtn) {
    if (rtn == 200) {
        util.log('moogRest message sent, return code: ' + rtn);
        util.log('moogRest result: ' + res.message);
        process.exit(0);
    } else {
        util.error('moogRest - ' + rtn);
        util.error('moogRest - ' + res);
        process.exit(1);
    }
});
