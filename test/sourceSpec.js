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

var Source = require('../model/Source.js');
var test = require('tape');
var assert = require('assert');
var uuid = require('uuid');
var Formats = require('../model/Formats.js');
var Capabilities = require('../model/Capabilities.js');

var methods = Source.prototype;

var bbcSourceJSON = `{
    "description": "Capture Card Source Video",
    "tags": {
        "host": [
            "ap-z220-0"
        ]
    },
    "format": "urn:x-nmos:format:video",
    "caps": {},
    "version": "1441703336:902850419",
    "parents": [],
    "label": "CaptureCardSourceVideo",
    "id": "4569cea2-ab63-4f97-8dd1-bad4669ea5e4",
    "device_id": "9126cc2f-4c26-4c9b-a6cd-93c4381c9be5"
}`;

var bbcSource = new Source(
  '4569cea2-ab63-4f97-8dd1-bad4669ea5e4',
  '1441703336:902850419',
  'CaptureCardSourceVideo',
  'Capture Card Source Video',
  Formats.video,
  {}, // caps
  { host : [ 'ap-z220-0'] },
  '9126cc2f-4c26-4c9b-a6cd-93c4381c9be5',
  [] );

test('Validity checking of description values', function (t) {
  t.ok(methods.validDescription('streampunk'),
    'matches a valid label.');
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
  t.ok(bbcSource.validFormat(),
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

var realTags = `{
            "SourceDeviceType": [
                "UHD Camera"
            ],
            "host": [
                "ap-z820-1"
            ],
            "location": [
                "MCUK"
            ]
        }`;
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
  t.ok(methods.validTags(JSON.parse(realTags)),
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
  t.ok(bbcSource.validDeviceID(),
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

test('Validity checking of parents', function (t) {
  t.ok(methods.validParents([]),
    'matches an empty array.');
  t.ok(methods.validParents([uuid.v4()]),
    'matches an array with one parent.');
  t.ok(methods.validParents([uuid.v4(), uuid.v4(), uuid.v4()]),
    'matches an array with three parents.');
  t.notOk(methods.validParents([uuid.v4(), uuid.v4().substring(31)]),
    'does not match an invalid UUID.');
  t.notOk(methods.validParents(null),
    'does not match a null value.');
  t.notOk(methods.validParents({}),
    'does not match an empty object.');
  t.notOk(methods.validParents(undefined),
    'does not match an undefined value.');
  t.notOk(methods.validParents(uuid.v4()),
    'does not match a single UUID value with no array.');
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
  t.equals(methods.generateTags(realTags), realTags,
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

test('Generating parents', function (t) {
  var testParents = [ uuid.v4, uuid.v4 ];
  t.equal(methods.generateParents(testParents), testParents,
    'passes through valid parent array.');
  t.equal(methods.generateParents
    (42), 42,
    'passes through an arbitrary number (this is not a validation check).');
  var generatedParents = methods.generateParents();
  t.ok(methods.validParents(generatedParents),
    'generates valid parents with no arguments.');
  t.ok(Array.isArray(generatedParents) && generatedParents.length === 0,
    'generates an empty array.');
  t.ok(methods.validParents(methods.generateParents(null)),
    'generates valid parents with a null argument.');
  t.ok(methods.validParents(methods.generateParents(undefined)),
    'generates a parents with an undefined argument.');
  t.end();
});

test('Source objects', function (t) {
  for ( var x = 0 ; x < 10 ; x++ ) {
    t.ok(new Source().valid(),
      'are valid on default creation ' + x + '.');
  }
  var s = new Source(null, null, 'streampunk', 'junking tedious nonsense',
    null, null, realTags, null, [ uuid.v4(), uuid.v4() ]);
  t.equal(s.description, 'junking tedious nonsense',
    'description gets set by constructor.');
  t.deepEqual(methods.parse(s.stringify()), s,
    'survive a JSON roundtrip.');
  s.description = "media's riotous awakening";
  t.equals(s.description, 'junking tedious nonsense',
    'are immutable.');
  t.notOk(new Source('wibble').valid(),
    'can be constructed as invalid.');
  var w = JSON.parse(s.stringify());
  t.deepEqual(w, { id : s.id, version : s.version, label : s.label,
      description : s.description, format : s.format, caps : s.caps,
      tags : s.tags, device_id: s.device_id, parents : s.parents },
    'convert to a JSON object as expected.');
  t.deepEqual(methods.parse(
      JSON.stringify({id : s.id, version : s.version, label : s.label,
        description : s.description, format : s.format, caps : s.caps,
        tags : s.tags, device_id: s.device_id, parents : s.parents })), w,
    'convert from a JSON object as expected.');
  t.end();
});

test('JSON parsing', function(t) {
  t.throws(function() { methods.parse('wibble'); },
    'fails to parse a JSON syntax error string.');
  t.throws(function() { methods.parse(null); },
    'fails to parse a null value.');
  t.throws(function() { methods.parse(42); },
    'fails to parse a number value.');
  t.throws(function() { methods.parse(undefined); },
    'fails to parse an undefined value.');
  t.doesNotThrow(function() { methods.parse('{}'); },
    'parses an empty object "{}".');
  t.notOk(methods.parse('{ "id" : "wibble" }').valid(),
    'parses invalid JSON.');
  t.end();
});

test('Parsed BBC example', function (t) {
  var parsedSource = methods.parse(bbcSourceJSON);
  t.equal(parsedSource.constructor, methods.constructor,
    'is a Source.');
  t.deepEqual(parsedSource, bbcSource, 'matches local version.');
  t.ok(parsedSource.valid(),
    'is valid.');
  t.end();
});
