/**
 * Created by stephen on 16/10/2014.
 */

var moog = require('../lib/node-moog');
var util = require('util');
var options = {
    'url': 'http://localhost:8888',
    'authUser': 'graze',
    'authPass': 'graze'
};
var moogEvent = new moog.MoogEvent();
var moogREST = moog.moogREST(options);

util.log('Is it a MoogEvent? '+(moogEvent instanceof moog.MoogEvent));

var debug = function () {
    if (!process.env.DEBUG) return;
    var stack = new Error().stack;
    var args = Array.prototype.slice.call(arguments);
    var lines = stack.split('\n');
    var callee = lines[2].match(/at .* /i); //used because of use strict
    util.debug('[test.js] '+callee+' -> '+args);
};

moogEvent.description = 'My new description';
debug('Event generated ' + util.inspect(moogEvent));

moogREST.sendEvent(moogEvent, function (res, rtn) {
    if (res.statusCode == 200) {
        util.log('moogREST message sent, return code: ' + res.statusCode);
        util.log('moogREST result: ' + util.inspect(rtn));
    } else {
        util.error('moogREST - ' + util.inspect(res));
        util.error('moogREST - ' + util.inspect(rtn));
    }
});


// Now an array of events
var eArray = [];

for (var e = 0; e < 10 ; e++){
    moogEvent = new moog.MoogEvent();
    moogEvent.description = 'My new description '+e;
    eArray.push(moogEvent);
}
util.log('*** Now Sending '+eArray.length+' events');

moogREST.sendEvent(eArray, function (res, rtn) {
    if (res.statusCode == 200) {
        util.log('[pass] moogREST message array sent, return code: ' + res.statusCode);
        util.log('[pass] moogREST array result: ' + util.inspect(rtn));
    } else {
        util.log('[fail] moogREST - ' + util.inspect(res));
        util.log('[fail] moogREST - ' + util.inspect(rtn));
    }
});

// Now an error in the event
var foo = {bar:'foo'};

util.log('*** Now Sending silly event foo');

moogREST.sendEvent(foo, function (res, rtn) {
    if (res.statusCode == 200) {
        util.log('[fail] moogREST silly message sent, return code: ' + res.statusCode);
        util.log('[fail] moogREST silly result: ' + util.inspect(rtn));
    } else {
        util.log('[pass] moogREST - ' + util.inspect(res));
        util.log('[pass] moogREST - ' + util.inspect(rtn));
    }
});

// Without a new?
var mooEvent;
mooEvent = moog.MoogEvent();
if (mooEvent.description) {
    util.log('[Fail] New mooEvent - has description '+mooEvent.description);
} else {
    util.log('[Pass] New mooEvent - has no description '+mooEvent.description);
    util.log('Is it a MoogEvent? '+(mooEvent instanceof moog.MoogEvent));
}
mooEvent.description = "MOO";
mooEvent = moog.MoogEvent();
if (mooEvent.description) {
    util.log('[Fail] New mooEvent - has MOO description '+mooEvent.description);
} else {
    util.log('[Pass] New mooEvent - has no description '+mooEvent.description);
    util.log('Is it a MoogEvent? '+(mooEvent instanceof moog.MoogEvent));
}

mooEvent = new moog.MoogEvent();
if (mooEvent.description) {
    util.log('[Fail] New mooEvent - has description '+mooEvent.description);
} else {
    util.log('[Pass] New mooEvent - has no description '+mooEvent.description);
    util.log('Is it a MoogEvent? '+(mooEvent instanceof moog.MoogEvent));
}
mooEvent.description = "MOO";
mooEvent = moog.MoogEvent();
if (mooEvent.description) {
    util.log('[Fail] New mooEvent - has MOO description '+mooEvent.description);
} else {
    util.log('[Pass] New mooEvent - has no description '+mooEvent.description);
    util.log('Is it a MoogEvent? '+(mooEvent instanceof moog.MoogEvent));
}