/* Copyright 2016 Streampunk Media Ltd.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var Receiver = require ('../model/Receiver.js');
var test = require('tape');
var Formats = require('../model/Formats.js');
var Transports = require('../model/Transports.js');
var Capabilities = require('../model/Capabilities.js');
var uuid = require('uuid');

var methods = Receiver.prototype;

var bbcReceiverJSON = `{
    "description": "ap-z800-4 quad rtp receiver 4",
    "tags": {
        "Location": [
            "MCUK"
        ]
    },
    "format": "urn:x-nmos:format:video",
    "caps": {},
    "device_id": "0d0cb97e-b96a-4a39-887f-d491492d9081",
    "version": "1441895693:480000000",
    "label": "MCUK Gallery QuadView Right 4",
    "id": "3350d113-1593-4271-a7f5-f4974415bb8e",
    "transport": "urn:x-nmos:transport:rtp",
    "subscription": {
        "sender_id": "55311762-8003-48fa-a645-0a0c7621ce45"
    }
}`;

var bbcReceiver = new Receiver(
  '3350d113-1593-4271-a7f5-f4974415bb8e',
  '1441895693:480000000',
  'MCUK Gallery QuadView Right 4',
  'ap-z800-4 quad rtp receiver 4',
  'urn:x-nmos:format:video',
  {}, // caps
  { Location : [ 'MCUK' ] },
  '0d0cb97e-b96a-4a39-887f-d491492d9081',
  'urn:x-nmos:transport:rtp',
  { sender_id : '55311762-8003-48fa-a645-0a0c7621ce45' }
);

test('Validity checking of description values', function (t) {
  t.ok(methods.validDescription('streampunk'),
    'matches a valid label.');
  t.ok(bbcReceiver.validDescription(),
    'checks the BBC sender with no arguments.');
  t.ok(methods.validDescription(''),
    'matches an empty string.');
  t.ok(methods.validDescription(methods.generateDescription()),
    'matches a generated description.');
  t.notOk(methods.validDescription(null),
    'fails for a null.');
  t.notOk(methods.validDescription(undefined),
    'fails for an undefined value.');
  t.notOk(methods.validDescription(false),
    'fails for false.');
  t.notOk(methods.validDescription(42),
    'fails for a number.');
  t.end();
});

test('Validity checking of format values', function (t) {
  t.ok(methods.validFormat(Formats.video),
    'matches video.');
  t.ok(methods.validFormat(Formats.audio),
    'matches audio.');
  t.ok(methods.validFormat(Formats.data),
    'matches data.');
  t.ok(bbcReceiver.validFormat(),
    'validates internal value.');
  t.notOk(methods.validFormat('streampunk'),
    'does not match arbitrary string.');
  t.notOk(methods.validFormat(null),
    'does not match null.');
  t.notOk(methods.validFormat(undefined),
    'does not match an undefined value.');
  t.end();
});

test('Validity checking of capabilities', function(t) {
  t.ok(methods.validCaps(Capabilities),
    'matches an empty capabilities value.');
  t.ok(methods.validCaps({}),
    'matches an empty object.');
  t.ok(bbcReceiver.validCaps(),
    'validates internal Capabilities.');
  t.notOk(methods.validCaps({ a: 3 }),
    'does not match an object with properties.');
  t.notOk(methods.validCaps([]),
    'does not match an array.');
  t.notOk(methods.validCaps('streampunk'),
    'does not match an arbitrary string.');
  t.notOk(methods.validCaps(42),
    'does not match a number.');
  t.notOk(methods.validCaps(null),
    'does not match a null value.');
  t.notOk(methods.validCaps(undefined),
    'does not match undefined.');
  t.end();
});

test('Validity checking of tags', function(t) {
  t.ok(methods.validTags({}),
    'matches empty object.');
  t.notOk(methods.validTags([]),
    'does not match empty array.');
  t.ok(methods.validTags({ a: [] }),
    'matches { a : [] }.');
  t.ok(methods.validTags({ a: [ "b" ]}),
    'matches { a : [ "b" ]}.');
  t.ok(methods.validTags({a : [ "b" ], c : [] }),
    'matches { a : [ "b" ], c : [] }.');
  t.ok(bbcReceiver.validTags(),
    'matches some real example tags.')
  t.notOk(methods.validTags({a : {} }),
    'does not match { a : {} }.');
  t.notOk(methods.validTags({a : [ 42 ]}),
    'does not match { a : [ 42 ] }.');
  t.notOk(methods.validTags(null),
    'does not match null.');
  t.notOk(methods.validTags(undefined),
    'does not match an undefined value.');
  t.end();
});

test('Validity checking of device ID', function (t) {
  for ( var x = 0; x < 10 ; x++) {
    t.ok(methods.validDeviceID(uuid.v4()),
      'matches valid UUIDs.');
  }
  t.ok(methods.validDeviceID(methods.generateID()),
    'matches a generated ID.');
  t.ok(bbcReceiver.validDeviceID(),
    'validates an internal device ID with no arguments.');
  t.notOk(methods.validDeviceID(null),
    'fails for a null.');
  t.notOk(methods.validDeviceID(42),
    'fails for a number.');
  t.notOk(methods.validDeviceID(uuid.v4().substring(31)),
    'fails for an invalid string.');
  t.notOk(methods.validDeviceID(undefined),
    'fails for undefined.');
  t.notOk(methods.validDeviceID(false),
    'fails for false.');
  t.end();
});

test('Validity checking of transport values', function (t) {
  t.ok(methods.validTransport(Transports.rtp),
    'matches rtp.');
  t.ok(methods.validTransport(Transports.rtp_ucast),
    'matches rtp_ucast.');
  t.ok(methods.validTransport(Transports.rtp_mcast),
    'matches rtp_mcast.');
  t.ok(methods.validTransport(Transports.dash),
    'matches dash.');
  t.ok(bbcReceiver.validTransport(),
    'checks internal value.');
  t.notOk(methods.validTransport('streampunk'),
    'does not match an arbitrary string.');
  t.notOk(methods.validTransport(null),
    'does not match null.');
  t.notOk(methods.validTransport(undefined),
    'does not match undefined.');
  t.end();
});

test('Validity checking of subscriptions', function (t) {
  t.ok(methods.validSubscription({ sender_id : null }),
    'matches initial null subscription.');
  t.ok(bbcReceiver.validSubscription(),
    'validates an internal subscription with no arguments.');
  t.ok(methods.validSubscription({ sender_id : uuid.v4() }),
    'matches a newly created uuid.');
  t.notOk(methods.validDescription({}),
    'does not match an empty object.');
  t.notOk(methods.validSubscription([]),
    'does not match an empty array.');
  t.notOk(methods.validSubscription(42),
    'does not match number.');
  t.notOk(methods.validSubscription(null),
    'does not match a null value.');
  t.notOk(methods.validSubscription([]),
    'does not match an undefined value.');
  t.notOk(methods.validSubscription('streampunk'),
    'does not match an arbitrary string.');
  t.end();
});

test('Generating a description', function (t) {
  t.equals(methods.generateDescription('streampunk'), 'streampunk',
    'passes through an arbitrary description');
  t.equals(methods.generateDescription(42), 42,
    'passes through a number (this is not a validity check).');
  t.equals(methods.generateDescription(), '',
    'returns an empty string for no arguments.');
  t.equals(methods.generateDescription(null), '',
    'returns an empty string for a null value.');
  t.equals(methods.generateDescription(undefined), '',
    'returns an empty string for an undefined value.');
  t.end();
});

test('Generating a format', function (t) {
  t.equals(methods.generateFormat(Formats.video), Formats.video,
    'passes through Formats.video.');
  t.equals(methods.generateFormat('streampunk'), 'streampunk',
    'passes through an arbitrary format.');
  t.equals(methods.generateFormat(42), 42,
    'passes through a number (this is not a validity check).');
  t.equals(methods.generateFormat(), Formats.video,
    'returns ' + Formats.video + ' for no arguments.');
  t.equals(methods.generateFormat(null), Formats.video,
    'returns ' + Formats.video + ' for a null value.');
  t.equals(methods.generateFormat(undefined), Formats.video,
    'returns ' + Formats.video + ' or an undefined value.');
  t.end();
});

test('Generating capabilities', function (t) {
  t.ok(methods.validCaps(methods.generateCaps(Capabilities)),
    'passes through capabilities.');
  t.equals(methods.generateCaps('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validity test).');
  t.ok(methods.validCaps(methods.generateCaps()),
    'creates valid capabilities with no arguments.');
  t.ok(methods.validCaps(methods.generateCaps(null)),
    'creates valid capabilities for a null value.');
  t.ok(methods.validCaps(methods.generateCaps(undefined)),
    'creates valid capabilities for an undefined value.');
  t.end();
});

test('Generating tags', function (t) {
  t.equals(methods.generateTags(bbcReceiver.tags), bbcReceiver.tags,
    'passes through real tags.');
  t.deepEqual(methods.generateTags({ a : [ "b" ], c : [] }),
    { a : [ "b" ], c : [] },
    'passes through valid tags object.');
  t.equals(methods.generateTags('streampunk tags'), 'streampunk tags',
    'passes through an arbitrary string.');
  t.equals(Object.keys(methods.generateTags()).length, 0,
    'returns an empty object for no arguments.');
  t.equals(Object.keys(methods.generateTags(null)).length, 0,
    'returns an empty object for a null value.');
  t.equals(Object.keys(methods.generateTags(undefined)).length, 0,
    'returns an empty object for an undefined value.');
  t.end();
});

test('Generating device IDs', function (t) {
  var testID = uuid.v4();
  t.equal(methods.generateDeviceID(testID), testID,
    'passes through a valid UUID.')
  t.equal(methods.generateDeviceID('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validation check).');
  t.equal(methods.generateDeviceID(42), 42,
    'passes through an arbitrary number (this is not a validation check).');
  t.ok(methods.validDeviceID(methods.generateDeviceID()),
    'generates a valid UUID with no arguments.');
  t.ok(methods.validDeviceID(methods.generateDeviceID(null)),
    'generates a valid UUID with a null argument.');
  t.ok(methods.validDeviceID(methods.generateDeviceID(undefined)),
    'generates a valid UUID with an undefined argument.');
  t.end();
});

test('Generating a subscription', function (t) {
  t.deepEqual(methods.generateSubscription({ sender_id : null}),
    { sender_id : null}, 'passes through an initial subscription.');
  t.deepEqual(methods.generateSubscription(bbcReceiver.subscription),
    { sender_id : '55311762-8003-48fa-a645-0a0c7621ce45' },
    'passes through the example subscription.');
  t.ok(methods.validSubscription(methods.generateSubscription()),
    'creates valid values.');
  t.equal(methods.generateSubscription('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validity check).');
  t.equal(methods.generateSubscription(42), 42,
    'passes through a number (this is not a validity check).')
  t.deepEqual(methods.generateSubscription(), { sender_id : null },
    'creates an initial subscription for no arguments.');
  t.deepEqual(methods.generateSubscription(null), { sender_id : null},
    'creates an initial subscription for a null value.');
  t.deepEqual(methods.generateSubscription(undefined), { sender_id : null},
    'creaetes an initial subscription for an undefined value.');
  t.end();
});

test('Generating a transport', function (t) {
  t.equals(methods.generateTransport(Transports.rtp), Transports.rtp,
    'passes through Transports.rtp.');
  t.equals(methods.generateTransport('streampunk'), 'streampunk',
    'passes through an arbitrary transport.');
  t.equals(methods.generateTransport(42), 42,
    'passes through a number.');
  t.equals(methods.generateTransport(), Transports.rtp,
    'creates Transports.rtp for no arguments.');
  t.equals(methods.generateTransport(null), Transports.rtp,
    'creates Transports.rtp for a null value.');
  t.equals(methods.generateTransport(undefined), Transports.rtp,
    'creates Transports.rtp for an undefined value.');
  t.end();
});

test('Receiver objects', function (t) {
  for ( var x = 0 ; x < 10 ; x++ ) {
    t.ok(new Receiver().valid(),
      'are valid on default creation ' + x + '.');
  }
  var r = new Receiver(null, null, 'streampunk', 'junking tedious nonsense',
    Formats.audio, {}, {}, null, Transports.dash, null);
  t.ok(r.valid(), 'are valid on mixed construction.');
  t.equal(r.description, 'junking tedious nonsense',
    'description is set by constructor.');
  t.deepEqual(methods.parse(r.stringify()), r,
    'survices JSON roundtrip.');
  r.description = "media's riotous awakening";
  t.equal(r.description, 'junking tedious nonsense',
    'are immutable.');
  t.notOk(new Receiver('wibble').valid(),
    'can be constructed as invalid.');
  var j = JSON.parse(r.stringify());
  t.deepEqual(j, { id : r.id, version : r.version, label : r.label,
      description : r.description, format : r.format, caps : r.caps,
      tags : r.tags, device_id : r.device_id, transport : r.transport,
      subscription : r.subscription },
    'convert to a JSON object as expected.');
  t.deepEquals(methods.parse(
      JSON.stringify({ id : r.id, version : r.version, label : r.label,
        description : r.description, format : r.format, caps : r.caps,
        tags : r.tags, device_id : r.device_id, transport : r.transport,
        subscription : r.subscription })), j,
    'convert from a JSON object as expected.');
  t.deepEquals(Receiver.prototype.parse(j), r, "parse converts an object.");
  t.end();
});

test('Example BBC receiver', function (t) {
  var parsed = methods.parse(bbcReceiverJSON);
  t.equal(parsed.constructor, methods.constructor,
    'is a Receiver.');
  t.deepEquals(parsed, bbcReceiver,
    'parsed and constructed values match.');
  t.ok(bbcReceiver.valid(),
    'is valid.');
  t.ok(bbcReceiver.validTags(),
    'has valid tags.');
  t.ok(bbcReceiver.validSubscription(),
    'has a valid subscription.');
  t.ok(bbcReceiver.validDeviceID(),
    'has a valid device ID.');
  t.end();
});
