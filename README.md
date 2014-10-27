![Moogsoft Logo](http://www.moogsoft.com/themes/moogsoft_2014/images/logo@2.png)

# Incident.MOOG REST Client for Node.js

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

var moogRest = require('node-moog').MoogREST({'url':'http://hostname:8888','secret':'my_secret'});

```
Secret is optional and depends on the REST LAM configuration.

To pass a server crt file pass the parameter options.certFile as a file path to the server crt.

To pass a client crt file use options.caFile as the path, if you want a client cert you must also pass a server cert.

### Submit an event

Very simple to now submit an event to the REST LAM

```javascript

moogRest.sendEvent(moogEvent);

```
The moogEvent can be a single event or an array of events

The submit is an event emitter and will currently provide 2 events, ok and error

***NOTE:*** These may change/expand in the future to give more detail on the event progress

```javascript

moogRest.on('ok', function(res) {
    console.log('moogRest message sent '+res);
    process.exit(0);
});
moogRest.on('error', function(err) {
    console.log('moogRest error '+err);
    process.exit(1);
});

```