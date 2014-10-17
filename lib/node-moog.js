/**
 * Created by Spike on 14/10/2014.
 * Updated by Stephen on 16/10/2014.
 */

var urlParser = require('url'),
    util = require("util"),
    events = require("events"),
    http = require('http'),
    https = require('http');

http.globalAgent.maxSockets=20;

exports.MoogEvent = function(dEvent) {
    var defEvent = dEvent || {};
    var self = this;
    self.signature = "";
    self.source_id = defEvent.source_id || "NodePID-"+process.pid;
    self.external_id = "";
    self.manager = defEvent.manager || "NodeRESTLam";
    self.source = defEvent.source || "NodePID-"+process.pid;
    self.class = defEvent.class || "NodePlatform-"+process.platform;
    self.agent_location = defEvent.agentLocation || process.argv[1];
    self.type = defEvent.type || "NodeRest";
    self.severity = 0;
    self.description = "";
    self.first_occurred = 0;
    self.agent_time = 0;
    debug('Event defined '+JSON.stringify(self));
};

exports.MoogREST=function(options) {
    var self = this;
    if (!options.url)
        self.emit('error','No URL specified in options object');

    self.options = options || {};
    self.connection = self.options.connection;
    self.secret = options.secret;
    self.url = urlParser.parse(self.options.url);
    debug('MoogRest init '+JSON.stringify(self));

    if (!self.url.host) {
        console.log('WARNING: No Host defined - using localhost');
        self.url.host = 'localhost';
    }
    if (!self.url.port) {
        console.log('WARNING: No port defined - using 8888');
        self.url.port = 8888;
    }
    if (!self.url.protocol){
        console.log('WARNING: No protocol defined - using https:');
        self.url.protocol = 'https:';
    }
    if (self.url.protocol === 'https:'){
        //TODO: Do stuff for https
    }

    this.sendEvent = function (mEvent) {

        // Parse the data we're going to add.

        var myEvent = mEvent;
        var epochDate = Math.round(Date.now() / 1000);
        var num = myEvent.external_id++ || 0;
        var event = {};

        myEvent.signature = mEvent.source + ":" + myEvent.class + ":" + myEvent.type;
        myEvent.external_id = mEvent.external_id || "REST"+num;
        myEvent.source = mEvent.source || "NodeRest-" + num;
        myEvent.severity = mEvent.severity || 2;
        myEvent.description = mEvent.description || "No Description Provided";
        myEvent.first_occurred = mEvent.first_occured || epochDate;
        myEvent.agent_time = mEvent.agent_time || epochDate;

        if (self.secret) {
            event.secret = self.secret;
        }
        event.events = [myEvent];

        try {
            eventString = JSON.stringify(event);
            debug('Event to send '+eventString);
        }
        catch (e) {
            console.log("Error: Could not JSON.stringify the event " + e);
            return;
        }
        var content_length = Buffer.byteLength(eventString, 'utf8');

        var eventHeaders = {
            'Content-Length': content_length,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Connection': 'keep-alive'
        };

        var eventRequestOpts = {
            host: self.url.hostname,
            port: self.url.port,
            method: 'POST',
            headers: eventHeaders,
            rejectUnauthorized: false
        };
        debug('Requesy headers: '+JSON.stringify(eventRequestOpts));
        var eventRequest = http.request(eventRequestOpts, function (res) {
            var returnString = "";
            var returnStatus = 0;

            res.on('data', function (d) {
                debug('Event data '+JSON.stringify(returnString));
                returnString += d;
            });
            res.on('end', function () {
                returnStatus = res.statusCode || 0;
                debug('Event sent '+JSON.stringify(returnStatus));
                if (returnStatus == 200) {
                    self.emit("ok","Sent event successfully " + returnStatus);
                }
                else {
                    self.emit("error","Send event failed with " + returnStatus);
                }
            });
        });
        eventRequest.on('error', function (err) {
            debug("ERROR Can't send "+err);
            self.emit("error","Event send failed: " + err);
        });
        debug('Now send event');
        eventRequest.write(eventString);
        eventRequest.end();

    };
};

util.inherits(exports.MoogREST, events.EventEmitter);

var debug = function(){
    if (!process.env.DEBUG) return;

    var now = new Date(),
        header =now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() +  " [MoogREST]" + arguments.callee.caller.name + " -> ",
        args = Array.prototype.slice.call(arguments);
    args.splice(0,0,header);
    console.log.apply(console,args);
};
