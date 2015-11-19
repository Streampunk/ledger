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
var Formats = require('../model/Formats.js');
var Capabilities = require('../model/Capabilities.js');

var methods = Source.prototype;

test('Validity checking of description values', function (t) {
  t.ok(methods.validDescription('streampunk'),
    'matches a valid label.');
  t.ok(methods.validDescription(''),
    'matches an empty string.');
  t.ok(methods.validDescription(methods.generateDescription()),
    'matches a generated label.');
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
  t.ok(methods.validDescription(Formats.video),
    'matches video.');
  t.ok(methods.validFormat(Formats.audio),
    'matches audio.');
  t.ok(methods.validFormat(Formats.event),
    'matches event.');
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
