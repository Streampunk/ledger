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

var Flow = require ('../model/Flow.js');
var test = require('tape');
var Formats = require('../model/Formats.js');
var uuid = require('uuid');

var methods = Flow.prototype;

var bbcFlowJSON = `{
    "description": "LCH Lab Capture Audio Proxy",
    "format": "urn:x-nmos:format:audio",
    "tags": {
        "host": [
            "ap-ch-z820-4.rd.bbc.co.uk"
        ]
    },
    "label": "LCH Lab Capture Audio Proxy",
    "version": "1441812152:154331951",
    "parents": [],
    "source_id": "2aa143ac-0ab7-4d75-bc32-5c00c13d186f",
    "id": "b3bb5be7-9fe9-4324-a5bb-4c70e1084449"
}`;

var bbcFlow = new Flow(
  'b3bb5be7-9fe9-4324-a5bb-4c70e1084449',
  '1441812152:154331951',
  'LCH Lab Capture Audio Proxy',
  'LCH Lab Capture Audio Proxy',
  'urn:x-nmos:format:audio',
  { host : [ 'ap-ch-z820-4.rd.bbc.co.uk' ] },
  '2aa143ac-0ab7-4d75-bc32-5c00c13d186f',
  []
);

test('Validity checking of description values', function (t) {
  t.ok(methods.validDescription('streampunk'),
    'matches a valid label.');
  t.ok(bbcFlow.validDescription(),
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
  t.ok(bbcFlow.validFormat(),
    'validates internal value.');
  t.notOk(methods.validFormat('streampunk'),
    'does not match arbitrary string.');
  t.notOk(methods.validFormat(null),
    'does not match null.');
  t.notOk(methods.validFormat(undefined),
    'does not match an undefined value.');
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
  t.ok(bbcFlow.validTags(),
    'matches example tags with no arguments.')
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

test('Validity checking of source IDs', function (t) {
  for ( var x = 0; x < 10 ; x++) {
    t.ok(methods.validSourceID(uuid.v4()),
      'matches valid UUIDs.');
  }
  t.ok(methods.validSourceID(methods.generateID()),
    'matches a generated ID.');
  t.ok(bbcFlow.validSourceID(),
    'validates an internal source ID with no arguments.');
  t.notOk(methods.validSourceID(null),
    'fails for a null.');
  t.notOk(methods.validSourceID(42),
    'fails for a number.');
  t.notOk(methods.validSourceID(uuid.v4().substring(31)),
    'fails for an invalid string.');
  t.notOk(methods.validSourceID(undefined),
    'fails for undefined.');
  t.notOk(methods.validSourceID(false),
    'fails for false.');
  t.end();
});

test('Validity checking of parents', function (t) {
  t.ok(methods.validParents([]),
    'matches an empty array, the default value.');
  t.ok(methods.validParents([ uuid.v4(), uuid.v4() ]),
    'matches an array with a couple of parents.');
  t.ok(bbcFlow.validParents(),
    'matches the example array with no arguments.');
  t.notOk(methods.validParents({}),
    'does not match an empty object.');
  t.notOk(methods.validParents('streampunk'),
    'does not match an arbitrary string.');
  t.notOk(methods.validParents(42),
    'does not match a number.');
  t.notOk(methods.validParents(null),
    'does not match a null value.');
  t.notOk(methods.validParents(undefined),
    'does not match an undeined value.');
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

test('Generating tags', function (t) {
  t.equal(methods.generateTags(bbcFlow.tags), bbcFlow.tags,
    'passes through example tags.');
  t.deepEqual(methods.generateTags({ a : [ "b" ], c : [] }),
    { a : [ "b" ], c : [] },
    'passes through valid tags object.');
  t.equal(methods.generateTags('streampunk tags'), 'streampunk tags',
    'passes through an arbitrary string.');
  t.equal(Object.keys(methods.generateTags()).length, 0,
    'returns an empty object for no arguments.');
  t.equal(Object.keys(methods.generateTags(null)).length, 0,
    'returns an empty object for a null value.');
  t.equal(Object.keys(methods.generateTags(undefined)).length, 0,
    'returns an empty object for an undefined value.');
  t.end();
});

test('Generating source IDs', function (t) {
  var testID = uuid.v4();
  t.equal(methods.generateSourceID(testID), testID,
    'passes through a valid UUID.')
  t.equal(methods.generateSourceID('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validation check).');
  t.equal(methods.generateSourceID(42), 42,
    'passes through an arbitrary number (this is not a validation check).');
  t.ok(methods.validSourceID(methods.generateSourceID()),
    'generates a valid UUID with no arguments.');
  t.ok(methods.validSourceID(methods.generateSourceID(null)),
    'generates a valid UUID with a null argument.');
  t.ok(methods.validSourceID(methods.generateSourceID(undefined)),
    'generates a valid UUID with an undefined argument.');
  t.end();
});

test('Generating parents', function (t) {
  var testParents = [ uuid.v4, uuid.v4 ];
  t.equal(methods.generateParents(testParents), testParents,
    'passes through valid parent array.');
  t.equal(methods.generateParents(42), 42,
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

test('Flow objects', function(t) {
  for ( var x = 0 ; x < 10 ; x++) {
    t.ok(new Flow().valid(),
      'are valid on default creation ' + x + '.');
  };
  var f = new Flow(null, null, 'streampunk', 'junking tedious nonsense',
    null, { a : [ "b" ]}, null, [ uuid.v4(), uuid.v4()]);
  t.equal('junking tedious nonsense', f.description,
    'have descriptions set by the constructor.');
  t.deepEqual(f, methods.parse(f.stringify()),
    'survive a JSON roundtrip.');
  f.description = "media's riotous awakening";
  t.equal('junking tedious nonsense', f.description,
    'are immutable.');
  t.notOk(new Flow('wibble').valid(),
    'can be constructed as invalid.');
  var g = JSON.parse(f.stringify());
  t.deepEqual(g, { id : f.id, version : f.version, label : f.label,
      description : f.description, format : f.format, tags: f.tags,
      source_id : f.source_id, parents : f.parents},
    'converts to JSON as expected.');
  t.deepEqual(methods.parse(
    JSON.stringify({ id : f.id, version : f.version, label : f.label,
        description : f.description, format : f.format, tags: f.tags,
        source_id : f.source_id, parents : f.parents})), g,
    'converts from a JSON object as expected.');
  t.deepEqual(Flow.prototype.parse(g), f, "parse converts JSON object.");
  t.end();
});

test('Parsed BBC example', function (t) {
  var parsed = methods.parse(bbcFlowJSON);
  t.equal(parsed.constructor, methods.constructor,
    'is a Flow');
  t.deepEqual(parsed, bbcFlow,
    'matches the local copy.');
  t.ok(parsed.valid(), 'is valid.');
  t.end();
});
