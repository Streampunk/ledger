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

var Sender = require('../model/Sender.js');
var test = require('tape');
var uuid = require('uuid');
var Transports = require('../model/Transports.js');

var methods = Sender.prototype;

var bbcSenderJSON = `{
    "description": "LCH Studio Cam 1 UHD",
    "label": "LCH Studio Cam 1 UHD",
    "manifest_href": "http://172.29.176.146:12345/x-nmos/node/v1.0/self/pipelinemanager/run/pipeline/1/pipel/ipp_rtptxdfb1/misc/sdp/",
    "version": "1441723958:235623703",
    "flow_id": "b25d445a-20dc-4937-a8a1-5cb3d5c613ee",
    "id": "171d5c80-7fff-4c23-9383-46503eb1c63e",
    "transport": "urn:x-nmos:transport:rtp.mcast",
    "device_id": "c501ae64-f525-48b7-9816-c5e8931bc017"
}`;

var bbcSender = new Sender(
  '171d5c80-7fff-4c23-9383-46503eb1c63e',
  '1441723958:235623703',
  'LCH Studio Cam 1 UHD',
  'LCH Studio Cam 1 UHD',
  'b25d445a-20dc-4937-a8a1-5cb3d5c613ee',
  'urn:x-nmos:transport:rtp.mcast',
  'c501ae64-f525-48b7-9816-c5e8931bc017',
  'http://172.29.176.146:12345/x-nmos/node/v1.0/self/pipelinemanager/run/pipeline/1/pipel/ipp_rtptxdfb1/misc/sdp/'
);

test('Validity checking of description values', function (t) {
  t.ok(methods.validDescription('streampunk'),
    'matches a valid label.');
  t.ok(bbcSender.validDescription(),
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

test('Validity checking of flow ID', function (t) {
  for ( var x = 0; x < 10 ; x++) {
    t.ok(methods.validFlowID(uuid.v4()),
      'matches valid UUIDs.');
  }
  t.ok(bbcSender.validFlowID(),
    'validates the BBC sender with no arguments.');
  t.ok(methods.validFlowID(methods.generateID()),
    'matches a generated ID.');
  t.notOk(methods.validFlowID(null),
    'fails for a null.');
  t.notOk(methods.validFlowID(42),
    'fails for a number.');
  t.notOk(methods.validFlowID(uuid.v4().substring(31)),
    'fails for an invalid string.');
  t.notOk(methods.validFlowID(undefined),
    'fails for undefined.');
  t.notOk(methods.validFlowID(false),
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
  t.ok(bbcSender.validTransport(),
    'checks internal value.');
  t.notOk(methods.validTransport('streampunk'),
    'does not match an arbitrary string.');
  t.notOk(methods.validTransport(null),
    'does not match null.');
  t.notOk(methods.validTransport(undefined),
    'does not match undefined.');
  t.end();
});

test('Validity checking of device ID', function (t) {
  for ( var x = 0; x < 10 ; x++) {
    t.ok(methods.validDeviceID(uuid.v4()),
      'matches valid UUIDs.');
  }
  t.ok(methods.validDeviceID(methods.generateID()),
    'matches a generated ID.');
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

test('Validity checking of manifest HREF', function(t) {
  t.ok(methods.validManifestHREF(bbcSender.manifest_href),
    'matches a realistic value.');
  t.ok(methods.validManifestHREF('http://'),
    'matches the minimal value "http://".');
  t.ok(bbcSender.validManifestHREF(),
    'checks internal value.');
  t.notOk(methods.validManifestHREF(''),
    'does not match an empty string.');
  t.notOk(methods.validManifestHREF(null),
    'does not match null.');
  t.notOk(methods.validManifestHREF(undefined),
    'does not match undefined.');
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

test('Generating flow IDs', function (t) {
  var testID = uuid.v4();
  t.equal(methods.generateFlowID(testID), testID,
    'passes through a valid UUID.')
  t.equal(methods.generateFlowID('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validation check).');
  t.equal(methods.generateFlowID(42), 42,
    'passes through an arbitrary number (this is not a validation check).');
  t.ok(methods.validFlowID(methods.generateFlowID()),
    'generates a valid UUID with no arguments.');
  t.ok(methods.validFlowID(methods.generateFlowID(null)),
    'generates a valid UUID with a null argument.');
  t.ok(methods.validFlowID(methods.generateFlowID(undefined)),
    'generates a valid UUID with an undefined argument.');
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

test('Generating a manifest HREF', function (t) {
  t.equal(methods.generateManifestHREF(bbcSender.manifest_href),
    bbcSender.manifest_href, 'passes through a valid example.');
  t.equal(methods.generateManifestHREF('http://'), 'http://',
    'passes through the minimal "http://".');
  t.equal(methods.generateManifestHREF(42), 42,
    'passes through a number.');
  t.ok(methods.validManifestHREF(methods.generateManifestHREF()),
    'creates a valid value for no arguments.');
  t.ok(methods.validManifestHREF(methods.generateManifestHREF(null)),
    'creates a valid value for a null value.');
  t.ok(methods.validManifestHREF(methods.generateManifestHREF(undefined)),
    'creates a valid value for an undefined value.');
  t.end();
});

test('Sender objects', function (t) {
  for ( var x = 0 ; x < 10 ; x++ ) {
    t.ok(new Sender().valid(),
      'are valid on default creation ' + x + '.');
  }
  var s = new Sender(null, null, 'streampunk', 'junking tedious nonsense',
    null, Transports.dash, null, 'http://localhost/manifest.sdp');
  t.equals(s.description, 'junking tedious nonsense',
    'description gets set by constructor.');
  t.deepEqual(methods.parse(s.stringify()), s,
    'survices a JSON roundtrip.');
  s.description = "media's riotous awakening";
  t.equals(s.description, 'junking tedious nonsense',
    'are immutable.');
  t.notOk(new Sender('wibble').valid(),
    'can be constructed as invlid.');
  var w = JSON.parse(s.stringify());
  t.deepEqual(w, { id : s.id, version : s.version, label : s.label,
      description : s.description, flow_id : s.flow_id,
      transport : s.transport, device_id : s.device_id,
      manifest_href : s.manifest_href},
    'convert to a JSON object as expected.');
  t.deepEqual(methods.parse(
    JSON.stringify({ id : s.id, version : s.version, label : s.label,
        description : s.description, flow_id : s.flow_id,
        transport : s.transport, device_id : s.device_id,
        manifest_href : s.manifest_href})), w,
    'convert from a JSON object as expected.');
  t.deepEqual(Sender.prototype.parse(w), s, "parse converts JSON object.");
  t.end();
});

test('Parsed BBC example', function (t) {
  var parsedSender = methods.parse(bbcSenderJSON);
  t.equal(parsedSender.constructor, methods.constructor,
    'is a Sender.');
  t.deepEqual(parsedSender, bbcSender, 'matches local version.');
  t.ok(parsedSender.valid(), 'is valid.');
  t.end();
});
