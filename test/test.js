/**
 * Created by stephen on 16/10/2014.
 */

var nm = require('node-moog');
var options = {
    'url': 'https://innomoog:8881',
    'secret': 'my_secret',
    certFile: '../ssl/server.crt',
    caFile: '../ssl/client.crt'
};
var moogEvent = new nm.MoogEvent();
var moogRest = new nm.MoogREST(options);

var debug = function () {
    if (!process.env.DEBUG) return;

    var now = new Date(),
        header = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + " [Test.js]" + arguments.callee.caller.name + " -> ",
        args = Array.prototype.slice.call(arguments);
    args.splice(0, 0, header);
    console.log.apply(console, args);
};

moogEvent.description = 'My new description';
debug('Event generated ' + JSON.stringify(moogEvent));

moogRest.sendEvent(moogEvent, function (res, rtn) {
    if (rtn == 200) {
        console.log('moogRest message sent, return code: ' + rtn);
        console.log('moogRest result: ' + res.message);
        process.exit(0);
    } else {
        console.log('moogRest - ' + rtn);
        console.log('moogRest - ' + res);
        process.exit(1);
    }
});
