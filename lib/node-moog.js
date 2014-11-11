/**
 * Created by Spike on 14/10/2014.
 * Updated by Stephen on 16/10/2014.
 *
 * Updated for 3.1.2 with Client SSL
 */

var urlParser = require('url'),
    util = require("util"),
    events = require("events"),
    http = require('http'),
    https = require('https'),
    fs = require('fs');
    proto = {};

http.globalAgent.maxSockets=20;

exports.MoogEvent = function(dEvent) {
    'use strict';
    var defEvent = dEvent || {};
    var that = this;
    that.signature = "";
    that.source_id = defEvent.source_id || "NodePID-"+process.pid;
    that.external_id = "";
    that.manager = defEvent.manager || "NodeRESTLam";
    that.source = defEvent.source || "NodePID-"+process.pid;
    that.class = defEvent.class || "NodePlatform-"+process.platform;
    that.agent_location = defEvent.agentLocation || process.argv[1];
    that.type = defEvent.type || "NodeRest";
    that.severity = 0;
    that.description = "";
    that.first_occurred = 0;
    that.agent_time = 0;
    debug('Default event defined '+JSON.stringify(that));
};

exports.MoogREST = function(options) {
    'use strict';
    var that = this;
    if (!options.url) {
        that.emit('error','No URL specified in options object');
        return;
    }

    that.options = options || {};
    that.connection = options.connection;
    that.auth_token = options.auth_token || 'my_secret';
    that.certFile = options.certFile || './ssl/server.crt';
    that.caFile = options.caFile || './ssl/client.crt';
    that.secure = options.rejectUnauthorized || false;
    that.url = urlParser.parse(options.url);
    that.eventHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
    };
    that.eventRequestOpts = {
        host: that.url.hostname,
        port: that.url.port,
        method: 'POST'
    };
    debug('MoogRest init '+JSON.stringify(that));

    if (!that.url.host) {
        console.log('WARNING: No Host defined - using localhost');
        that.url.host = 'localhost';
    }
    if (!that.url.port) {
        console.log('WARNING: No port defined - using 8888');
        that.url.port = 8888;
    }
    if (!that.url.protocol){
        console.log('WARNING: No protocol defined - using https:');
        that.url.protocol = 'https:';
    }
    if (that.url.protocol === 'https:'){
        proto = https;
        if (that.certFile) {
            if (!fs.existsSync(that.certFile)) {
                console.log("ERROR: https specified but can't read :"+that.certFile);
                return;
            }
            try {
                debug('Loading '+that.certFile);
                that.eventRequestOpts.cert = fs.readFileSync(that.certFile);
            }
            catch (e) {
                console.log("ERROR: Could not read file "+that.certFile+" : " + e);
                return;
            }
        }
        if (that.caFile) {
            if (!fs.existsSync(that.caFile)) {
                console.log("ERROR: https specified but can't read :"+that.caFile);
                that.emit("error","Can't read file.");
                return;
            }
            try {
                debug('Loading '+that.caFile);
                that.eventRequestOpts.ca = fs.readFileSync(that.caFile);
            }
            catch (e) {
                console.log("ERROR: Could not read file "+that.caFile+" : " + e);
                return;
            }
        }
        that.eventRequestOpts.rejectUnauthorized = that.secure;
        // Need an agent as globalAgent will silently ignore the options
        that.eventRequestOpts.agent = new https.Agent(that.eventRequestOpts);
    } else {
        proto = http;
        debug('Connect using http');
        that.eventRequestOpts.rejectUnauthorized = false;
        // Need an agent as globalAgent will silently ignore the options
        that.eventRequestOpts.agent = new http.Agent(that.eventRequestOpts);
    }

    that.sendEvent = function (mEvent,callback) {

        // Parse the data we're going to add.

        var myEvent = mEvent;
        var epochDate = Math.round(Date.now() / 1000);
        var num = myEvent.external_id++ || 0;
        var event = {};
        var reqOpts = {};
        var eventRequest = {};
        var eventString = '';
        var contentLength;

        if (myEvent instanceof Array) {
            event.events = myEvent;
        } else {
            myEvent.signature = mEvent.signature || mEvent.source + ":" + mEvent.class + ":" + mEvent.type;
            myEvent.external_id = mEvent.external_id || "REST"+num;
            myEvent.source = mEvent.source || "NodeRest-" + num;
            myEvent.severity = mEvent.severity || 2;
            myEvent.description = mEvent.description || "No Description Provided";
            myEvent.first_occurred = mEvent.first_occured || epochDate;
            myEvent.agent_time = mEvent.agent_time || epochDate;
            event.events = [myEvent];
        }
        event.auth_token = that.auth_token;
        try {
            eventString = JSON.stringify(event);
            debug('Event to send '+eventString);
        }
        catch (e) {
            console.log("Error: Could not JSON.stringify the event - " + e);
            return;
        }
        contentLength = Buffer.byteLength(eventString, 'utf8');
        that.eventHeaders['Content-Length'] = contentLength;
        that.eventRequestOpts.headers= that.eventHeaders;
        reqOpts = that.eventRequestOpts;
        debug('Request Options: '+util.inspect(reqOpts));
        //debug('Request headers: '+util.inspect(reqOpts.headers));
        eventRequest = proto.request(reqOpts, function (res) {
            var returnString = "";
            var returnStatus = 0;

            res.on('data', function (d) {
                //debug('sendEvent returned '+util.inspect(returnString));
                returnString += d;
            });
            res.on('end', function () {
                returnStatus = res.statusCode || 0;
                debug('sendEvent end '+util.inspect(returnStatus));
                callback(returnString,returnStatus);
            });
        });
        eventRequest.on('error', function (err) {
            debug("ERROR Can't send "+err.stack);
            debug("Connection: "+that.url.protocol+"://"+reqOpts.host+":"+reqOpts.port);
            callback('Connection Error. '+that.url.protocol+"://"+reqOpts.host+':'+reqOpts.port,err);
            eventRequest.end();
        });
        debug('Now send event');
        eventRequest.write(eventString);
        eventRequest.end();
    };
};

util.inherits(exports.MoogREST, events.EventEmitter);

var debug = function(){
    if (!process.env.DEBUG) return;
    var stack = new Error().stack;
    var args = Array.prototype.slice.call(arguments);
    var lines = stack.split('\n');
    var callee = lines[2].match(/at .* /i);
    util.debug('[node-moog.js] '+callee+' -> '+args);
};
