![Moogsoft Logo](http://www.moogsoft.com/themes/moogsoft_2014/images/logo@2.png)

## Incident.MOOG REST Client for Node.js


[![NPM](http://img.shields.io/npm/v/node-moog.svg?style=flat)](https://www.npmjs.org/package/node-moog)[![Code Climate](https://codeclimate.com/github/Moogsoft/node-moog/badges/gpa.svg)](https://codeclimate.com/github/Moogsoft/node-moog)

[![NPM](https://nodei.co/npm/node-moog.png?downloads=true)](https://nodei.co/npm/node-moog/)


Allows connecting to the Incident.MOOG REST LAM and sending events.

- Provides a formatted event object with reasonable defaults
- Provides for passing the shared secret
- Provides specific port designation

## Installation

$ npm install node-moog

## Usage

### Simple Event Generation

Populate a pre configured event object
 MoogEvent(mEvent)

mEvent is a optional default event template, if none is supplied then reasonable defaults are used for many fields

```javascript
var MoogEvent = require('node-moog').MoogEvent;

myEvent = new MoogEvent();

myEvent.description = 'My new description';

```

Elements available in an event.

- myEvent.signature //String
- myEvent.source_id //String
- myEvent.external_id //String
- myEvent.manager //String
- myEvent.source //String
- myEvent.class //String
- myEvent.agent_location //String
- myEvent.type //String
- myEvent.severity //Int
- myEvent.description //String
- myEvent.first_occurred // Epoch Int
- myEvent.agent_time // Epoch Int

### Create a connection

Create a connection to the REST LAM
 MoogREST(options)

 options is an object containing connection specific settings

```javascript

var moogRest = require('node-moog').MoogREST({'url':'http://hostname:8888','auth_token':'my_secret'});

```
auth_token is optional and depends on the REST LAM configuration.

To pass a server crt file pass the parameter options.certFile as a file path to the server crt.

To pass a client crt file use options.caFile as the path, if you want a client cert you must also pass a server cert.

````javascript

var moog = require('node-moog');

// Set the options to your specific configuration.
var options = {'url':'https://innomoog:8881',
    'auth_token':'my_secret',
    certFile : '../ssl/server.crt',
    caFile : '../ssl/client.crt'
    };

// Create a proforma event
var moogEvent = new moog.MoogEvent();
// Init a connection object
var moogRest = moog.moogREST(options);

````
When creating the Proforma you can pass a partial MoogEvent as a default, if not default values will be provided for you.

### Submit an event

Very simple to now submit an event to the REST LAM

```javascript

moogEvent.description = 'My new description';
// Many defaults are set for you.
moogRest.sendEvent(moogEvent,callback());

```
The moogEvent can be a single event or an array of events

The submit is an event emitter and will currently provide 2 events, ok and error

***NOTE:*** These may change/expand in the future to give more detail on the event progress

```javascript

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

```