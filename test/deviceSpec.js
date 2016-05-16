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

var Device = require ('../model/Device.js');
var test = require('tape');
var uuid = require('uuid');
var DeviceTypes = require('../model/DeviceTypes.js');

var methods = Device.prototype;

var bbcDeviceJSON = `{
      "receivers": [
        "863532de-a97d-4597-989a-e79688f2d5f9",
        "632d7e6d-7357-44de-a425-a94fbe94974e",
        "95ef711b-564d-4655-a98b-5b9ccfb419d7",
        "9ee74607-f831-42f5-af08-a614ce0706df"
      ],
      "label": "pipeline 1 default device",
      "version": "1441722334:834709519",
      "senders": [
        "c72cca5b-01db-47aa-bb00-03893defbfae",
        "171d5c80-7fff-4c23-9383-46503eb1c63e",
        "a2655c48-8a46-4c82-b9bc-98760d59d7f8"
      ],
      "id": "e19ef82c-5f0a-48da-a86c-bb2377ab09a4",
      "node_id": "4cf38bb4-d6c4-48d6-a086-6eac45d73ae5",
      "type": "urn:x-nmos:device:pipeline"
  }`;

var bbcDevice = new Device(
  'e19ef82c-5f0a-48da-a86c-bb2377ab09a4',
  '1441722334:834709519',
  'pipeline 1 default device',
  DeviceTypes.pipeline,
  '4cf38bb4-d6c4-48d6-a086-6eac45d73ae5',
  [ "c72cca5b-01db-47aa-bb00-03893defbfae",
    "171d5c80-7fff-4c23-9383-46503eb1c63e",
    "a2655c48-8a46-4c82-b9bc-98760d59d7f8" ],
  [ "863532de-a97d-4597-989a-e79688f2d5f9",
    "632d7e6d-7357-44de-a425-a94fbe94974e",
    "95ef711b-564d-4655-a98b-5b9ccfb419d7",
    "9ee74607-f831-42f5-af08-a614ce0706df" ]
);

test('Validating a device type', function (t) {
  t.ok(methods.validType(DeviceTypes.pipeline),
    'matches DeviceTypes.pipeline.');
  t.ok(methods.validType(DeviceTypes.generic),
    'matches DeviceTypes.generic.');
  t.ok(bbcDevice.validType(),
    'matches an internal value with no arguments.');
  t.notOk(methods.validType('streampunk'),
    'does not match an arbirary string.');
  t.notOk(methods.validType(42),
    'does not match a number.');
  t.notOk(methods.validType(null),
    'does not match a null value.');
  t.notOk(methods.validType(undefined),
    'does not match undefined.');
  t.end();
});

test('Validity checking of node ID', function (t) {
  for ( var x = 0; x < 10 ; x++) {
    t.ok(methods.validNodeID(uuid.v4()),
      'matches valid UUIDs.');
  }
  t.ok(methods.validNodeID(methods.generateID()),
    'matches a generated ID.');
  t.ok(bbcDevice.validNodeID(),
    'validates an internal device ID with no arguments.');
  t.notOk(methods.validNodeID(null),
    'fails for a null.');
  t.notOk(methods.validNodeID(42),
    'fails for a number.');
  t.notOk(methods.validNodeID(uuid.v4().substring(31)),
    'fails for an invalid string.');
  t.notOk(methods.validNodeID(undefined),
    'fails for undefined.');
  t.notOk(methods.validNodeID(false),
    'fails for false.');
  t.end();
});

test('Validity checking of senders', function (t) {
  t.ok(methods.validSenders([]),
    'matches an empty array.');
  t.ok(methods.validSenders([ uuid.v4() ]),
    'matches an array with a single generated UUID.');
  t.ok(bbcDevice.validSenders(),
    'checks an internal value with no arguments.');
  t.notOk(methods.validSenders({}),
    'does not match an empty object.');
  t.notOk(methods.validSenders('streampunk'),
    'does not match an arbitrary string.');
  t.notOk(methods.validSenders(42),
    'does not match a number.');
  t.notOk(methods.validSenders(null),
    'does not match a null value.');
  t.notOk(methods.validSenders(undefined),
    'does not match an undefined value.');
  t.end();
});

test('Validity checking of receivers', function (t) {
  t.ok(methods.validReceivers([]),
    'matches an empty array.');
  t.ok(methods.validReceivers([ uuid.v4() ]),
    'matches an array with a single generated UUID.');
  t.ok(bbcDevice.validReceivers(),
    'matches an internal value with no arguments.');
  t.notOk(methods.validReceivers({}),
    'does not match an empty object.');
  t.notOk(methods.validReceivers('streampunk'),
    'does not match an arbitrary string.');
  t.notOk(methods.validReceivers(42),
    'does not match a number.');
  t.notOk(methods.validReceivers(null),
    'does not match a null value.');
  t.notOk(methods.validReceivers(undefined),
    'does not match an undefined value.');
  t.end();
});

test('Generating a device type', function (t) {
  t.equal(methods.generateType(DeviceTypes.pipeline), DeviceTypes.pipeline,
    'passes through DeviceTypes.pipeline.');
  t.equal(methods.generateType(DeviceTypes.generic), DeviceTypes.generic,
    'passes through DeviceTypes.generic.');
  t.equal(methods.generateType('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validity check).');
  t.ok(methods.validType(methods.generateType()),
    'generates a valid device type with no arguments.');
  t.ok(methods.validType(methods.generateType(null)),
    'generates a valid device type for a null value.');
  t.ok(methods.validType(methods.generateType(undefined)),
    'generates a valid device type for an undefined value.');
  t.end();
});

test('Generating node IDs', function (t) {
  var testID = uuid.v4();
  t.equal(methods.generateNodeID(testID), testID,
    'passes through a valid UUID.')
  t.equal(methods.generateNodeID('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validation check).');
  t.equal(methods.generateNodeID(42), 42,
    'passes through an arbitrary number (this is not a validation check).');
  t.ok(methods.validNodeID(methods.generateNodeID()),
    'generates a valid UUID with no arguments.');
  t.ok(methods.validNodeID(methods.generateNodeID(null)),
    'generates a valid UUID with a null argument.');
  t.ok(methods.validNodeID(methods.generateNodeID(undefined)),
    'generates a valid UUID with an undefined argument.');
  t.end();
});

test('Generating senders', function (t) {
  t.deepEqual(methods.generateSenders([]), [],
    'passes through an empty array.');
  t.deepEqual(methods.generateSenders(bbcDevice.senders), bbcDevice.senders,
    'passes through an example array.');
  t.equal(methods.generateSenders('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validity check).');
  t.equal(methods.generateSenders(42), 42,
    'passes through a number (this is not a validity check).');
  t.ok(methods.validSenders(methods.generateSenders()),
    'creates valid senders for no arguments.');
  t.ok(methods.validSenders(methods.generateSenders(null)),
    'creates valid senders for a null value.');
  t.ok(methods.validSenders(methods.generateSenders(undefined)),
    'creates valid senders for an undefined value.');
  t.end();
});

test('Generating receivers', function (t) {
  t.deepEqual(methods.generateReceivers([]), [],
    'passes through an empty array.');
  t.deepEqual(methods.generateReceivers(bbcDevice.receivers), bbcDevice.receivers,
    'passes through an example array.');
  t.equal(methods.generateReceivers('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validity check).');
  t.equal(methods.generateReceivers(42), 42,
    'passes through a number (this is not a validity check).');
  t.ok(methods.validReceivers(methods.generateReceivers()),
    'creates valid Receivers for no arguments.');
  t.ok(methods.validReceivers(methods.generateReceivers(null)),
    'creates valid Receivers for a null value.');
  t.ok(methods.validReceivers(methods.generateReceivers(undefined)),
    'creates valid Receivers for an undefined value.');
  t.end();
});

test('Device objects', function (t) {
  for ( var x = 0 ; x < 10 ; x++ ) {
    t.ok(new Device().valid(),
      'are valid on default creation ' + x + '.');
  }
  var d = new Device(null, null, null, DeviceTypes.pipeline,
    null, [ uuid.v4(), uuid.v4() ], [ uuid.v4() ]);
  t.ok(d.valid(), 'constructs a valid object with arguments.');
  t.equal(d.type, DeviceTypes.pipeline, 'sets type on construction.');
  d.type = DeviceTypes.generic;
  t.equal(d.type, DeviceTypes.pipeline, 'are immutable.');
  t.deepEqual(methods.parse(d.stringify()), d, 'survives a JSON roundtrip.');
  t.notOk(new Device('wibble').valid(),
    'can be constructed as invalid.');
  var w = JSON.parse(d.stringify());
  t.deepEqual(w, { id : d.id, version : d.version, label : d.label,
      type : d.type, node_id : d.node_id, senders : d.senders,
      receivers : d.receivers }, 'converts to JSON as expected.');
  t.deepEqual(methods.parse(
    JSON.stringify({ id : d.id, version : d.version, label : d.label,
        type : d.type, node_id : d.node_id, senders : d.senders,
        receivers : d.receivers })), d, 'converts from JSON as expected.');
  t.deepEqual(Device.prototype.parse(w), d, "parse converts JSON object.");
  t.end();
});

test('Parsed BBC example', function (t) {
  var parsed = methods.parse(bbcDeviceJSON);
  t.equal(parsed.constructor, methods.constructor,
    'is a Device.');
  t.deepEqual(parsed, bbcDevice, 'matches local version.');
  t.ok(parsed.valid(), 'is valid.');
  t.end();
});
