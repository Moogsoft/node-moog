/**
 * Created by stephen on 16/10/2014.
 */

var nm = require('node-moog');
var options = {'url':'https://innomoog:8881','secret':'my_secret'};
var moogEvent = new nm.MoogEvent();
var moogRest = new nm.MoogREST(options);

var debug = function(){
    if (!process.env.DEBUG) return;

    var now = new Date(),
        header =now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() +  " [Test.js]" + arguments.callee.caller.name + " -> ",
        args = Array.prototype.slice.call(arguments);
    args.splice(0,0,header);
    console.log.apply(console,args);
};

moogEvent.description = 'My new description';
debug('Event generated '+JSON.stringify(moogEvent));

try {
    moogRest.sendEvent(moogEvent);
}
catch(e){
    console.log('Connection or send error '+e);
}

moogRest.on('ok', function(res) {
    console.log('moogRest message sent '+res);
    process.exit(0);
});
moogRest.on('error', function(err) {
    console.log('moogRest error '+err);
    process.exit(1);
});
