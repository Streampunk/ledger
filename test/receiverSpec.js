/* Copyright 2015 Christine S. MacNeill

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by appli cable law or agreed to in writing, software
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
    "format": "urn:x-ipstudio:format:video",
    "caps": {},
    "device_id": "0d0cb97e-b96a-4a39-887f-d491492d9081",
    "version": "1441895693:480000000",
    "label": "MCUK Gallery QuadView Right 4",
    "id": "3350d113-1593-4271-a7f5-f4974415bb8e",
    "transport": "urn:x-ipstudio:transport:rtp",
    "subscription": {
        "sender_id": "55311762-8003-48fa-a645-0a0c7621ce45"
    }
}`;

var bbcReceiver = new Receiver(
  '3350d113-1593-4271-a7f5-f4974415bb8e',
  '1441895693:480000000',
  'MCUK Gallery QuadView Right 4',
  'ap-z800-4 quad rtp receiver 4',
  'urn:x-ipstudio:format:video',
  {}, // caps
  { Location : [ 'MCUK' ] },
  '0d0cb97e-b96a-4a39-887f-d491492d9081',
  'urn:x-ipstudio:transport:rtp',
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
  t.ok(methods.validFormat(Formats.event),
    'matches event.');
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
