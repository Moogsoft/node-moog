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
    debug('Default event defined '+JSON.stringify(self));
};

exports.MoogREST=function(options) {
    var self = this;
    if (!options.url)
        self.emit('error','No URL specified in options object');

    self.options = options || {};
    self.connection = self.options.connection;
    self.auth_token = options.auth_token || 'my_secret';
    self.certFile = options.certFile || './ssl/server.crt';
    self.caFile = options.caFile || './ssl/client.crt';
    self.secure = options.rejectUnauthorized || false;
    self.url = urlParser.parse(self.options.url);
    self.eventHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
    };
    self.eventRequestOpts = {
        host: self.url.hostname,
        port: self.url.port,
        method: 'POST'
    };
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
        proto = https;
        if (self.certFile) {
            if (!fs.existsSync(self.certFile)) {
                console.log("ERROR: Can't read :"+self.certFile);
                return;
            }
            try {
                debug('Loading '+self.certFile);
                self.eventRequestOpts.cert = fs.readFileSync(self.certFile);
            }
            catch (e) {
                console.log("Error: Could not read file "+self.certFile+" : " + e);
                return;
            }
        }
        if (self.caFile) {
            if (!fs.existsSync(self.caFile)) {
                console.log("ERROR: Can't read :"+self.caFile);
                self.emit("error","Can't read file.");
                return;
            }
            try {
                debug('Loading '+self.caFile);
                self.eventRequestOpts.ca = fs.readFileSync(self.caFile);
            }
            catch (e) {
                console.log("Error: Could not read file "+self.caFile+" : " + e);
                return;
            }
        }
        self.eventRequestOpts.rejectUnauthorized = self.secure;
        // Need an agent as globalAgent will silently ignore the options
        self.eventRequestOpts.agent = new https.Agent(self.eventRequestOpts);
    } else {
        proto = http;
    }

    this.sendEvent = function (mEvent,callback) {

        // Parse the data we're going to add.

        var myEvent = mEvent;
        var epochDate = Math.round(Date.now() / 1000);
        var num = myEvent.external_id++ || 0;
        var event = {};
        var reqOpts = {};
        var eventRequest = {};
        var contentLength;

        myEvent.signature = mEvent.source + ":" + myEvent.class + ":" + myEvent.type;
        myEvent.external_id = mEvent.external_id || "REST"+num;
        myEvent.source = mEvent.source || "NodeRest-" + num;
        myEvent.severity = mEvent.severity || 2;
        myEvent.description = mEvent.description || "No Description Provided";
        myEvent.first_occurred = mEvent.first_occured || epochDate;
        myEvent.agent_time = mEvent.agent_time || epochDate;

        if (myEvent instanceof Array) {
            event.events = myEvent;
        } else {
            event.events = [myEvent];
        }
        event.auth_token = self.auth_token;
        try {
            eventString = JSON.stringify(event);
            debug('Event to send '+eventString);
        }
        catch (e) {
            console.log("Error: Could not JSON.stringify the event " + e);
            return;
        }
        contentLength = Buffer.byteLength(eventString, 'utf8');
        self.eventHeaders['Content-Length'] = contentLength;
        self.eventRequestOpts.headers= self.eventHeaders;
        reqOpts = self.eventRequestOpts;

        debug('Request headers: '+JSON.stringify(reqOpts.headers));
        eventRequest = proto.request(reqOpts, function (res) {
            var returnString = "";
            var returnStatus = 0;

            res.on('data', function (d) {
                debug('sendEvent returned '+JSON.stringify(returnString));
                returnString += d;
            });
            res.on('end', function () {
                returnStatus = res.statusCode || 0;
                debug('sendEvent end '+JSON.stringify(returnStatus));
                callback(returnString,returnStatus);
            });
        });
        eventRequest.on('error', function (err) {
            debug("ERROR Can't send "+err);
            debug("Connection: "+self.url.protocol+"://"+reqOpts.host+":"+reqOpts.port);
            callback('Connection Error. '+self.url.protocol+"://"+reqOpts.host+':'+reqOpts.port,err);
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

    var now = new Date(),
        header =now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() +  " [MoogREST]" + arguments.callee.caller.name + " -> ",
        args = Array.prototype.slice.call(arguments);
    args.splice(0,0,header);
    console.log.apply(console,args);
};
