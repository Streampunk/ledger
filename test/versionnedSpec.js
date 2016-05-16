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

var Versionned = require('../model/Versionned.js');
var test = require('tape');
var uuid = require('uuid');

var methods = Versionned.prototype;

test('Validity checking of id values', function (t) {
  for ( var x = 0; x < 10 ; x++) {
    t.ok(methods.validID(uuid.v4()),
      'matches valid UUIDs.');
  }
  t.ok(methods.validID(methods.generateID()),
    'matches a generated ID.');
  t.notOk(methods.validID(null),
    'fails for a null.');
  t.notOk(methods.validID(42),
    'fails for a number.');
  t.notOk(methods.validID(uuid.v4().substring(31)),
    'fails for an invalid string.');
  t.notOk(methods.validID(undefined),
    'fails for undefined.');
  t.notOk(methods.validID(false),
    'fails for false.');
  t.end();
});

test('Validity checking of version values', function (t) {
  t.ok(methods.validVersion('123456789:987654321'),
    'matches a valid version all digits.');
  t.ok(methods.validVersion('123:45'),
    'matches a valid version short digits.');
  t.ok(methods.validVersion(methods.generateVersion()),
    'matches a generated version.');
  t.notOk(methods.validVersion(null),
    'fails for a null.');
  t.notOk(methods.validVersion(42),
    'fails for a number.');
  t.notOk(methods.validVersion('123456789.987654322'),
    'fails for a close but not quite string.');
  t.notOk(methods.validVersion(undefined),
    'fails for an undefined value.');
  t.notOk(methods.validVersion(false),
    'fails for false.');
  t.end();
});

test('Validity checking of label values', function (t) {
  t.ok(methods.validLabel('streampunk'),
    'matches a valid label.');
  t.ok(methods.validLabel(''),
    'matches an empty string.');
  t.ok(methods.validLabel(methods.generateLabel()),
    'matches a generated label.');
  t.notOk(methods.validLabel(null),
    'fails for a null.');
  t.notOk(methods.validLabel(undefined),
    'fails for an undefined value.');
  t.notOk(methods.validLabel(false),
    'fails for false.');
  t.notOk(methods.validLabel(42),
    'fails for a number.');
  t.end();
});

test('ID generation', function (t) {
  var testID = uuid.v4();
  t.equal(methods.generateID(testID), testID,
    'passes through a valid ID.')
  t.equal(methods.generateID('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validation check).');
  t.equal(methods.generateID(42), 42,
    'passes through an arbitrary number (this is not a validation check).');
  t.ok(methods.validID(methods.generateID()),
    'generates a valid ID with no arguments.');
  t.ok(methods.validID(methods.generateID(null)),
    'generates a valid ID with a null argument.');
  t.ok(methods.validID(methods.generateID(undefined)),
    'generates a valid ID with an undefined argument.');
  t.end();
});

test('Version generation', function (t) {
  t.equal(methods.generateVersion('123456789:987654321'), '123456789:987654321',
    'passes through a valid version value.');
  t.equal(methods.generateVersion('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validation check).');
  t.equal(methods.generateVersion(42), 42,
    'passes through an arbitrary number (this is not a validation check).');
  t.ok(methods.validVersion(methods.generateVersion()),
    'generates a valid version with no arguments.');
  t.ok(methods.validVersion(methods.generateVersion(null)),
    'generates a valid version wtih null argument.');
  t.ok(methods.validVersion(methods.generateVersion(undefined)),
    'generateVersion a valid version with an undefined value.');
  var now = Math.floor(Date.now()/1000);
  var version = methods.generateVersion();
  var seconds = +(version.split(':')[0]);
  t.ok((now - 1 <= seconds) && (seconds <= now + 1),
    'Generated date is now, within reasons.');
  t.end();
});

test('Label generation', function (t) {
  t.equal(methods.generateLabel('streampunk'), 'streampunk',
    'creates a label from a valid label');
  t.equal(methods.generateLabel(42), 42,
    'passes through a number as a label (this is not a validation check).');
  t.ok(methods.validLabel(methods.generateLabel()),
    'generates a valid label with no arguments.');
  t.ok(methods.validLabel(methods.generateLabel(null)),
    'generates a valid label with a null argument.');
  t.ok(methods.validLabel(methods.generateLabel(undefined)),
    'generates a valid label with an undefined argument.');
  t.end();
});

test('Versionned objects', function (t) {
  for ( var x = 0 ; x < 10 ; x ++) {
    t.ok(new Versionned().valid(),
      'are valid on default creation ' + x + '.');
  }
  var v = new Versionned(null, null, 'streampunk');
  t.equal(v.label, 'streampunk',
    'label gets set by constructor.');
  t.deepEqual(Versionned.prototype.parse(v.stringify()), v,
    'survive a JSON roundtrip.');
  v.label = 'changed'; // Change does not work - seamless-immutable applied
  t.equal(v.label, 'streampunk',
    'are immutable.');
  var w = JSON.parse(v.stringify());
  t.deepEqual(w, { id: v.id, version: v.version, label: v.label},
    'convert to JSON object as expected.');
  t.deepEqual(Versionned.prototype.parse(
      JSON.stringify({ id: v.id, version: v.version, label: v.label})), w,
    'convert from JSON object as expected.');
  t.notOk(new Versionned('wibble', 'wobble').valid(),
    'can be constructed as invalid.');
  t.deepEqual(Versionned.prototype.parse(w), v, "parse converts JSON object.");
  t.end();
});

test('JSON parsing', function(t) {
  t.throws(function() { Versionned.prototype.parse('wibble'); },
    'fails to parse a JSON syntax error string.');
  t.throws(function() { Versionned.prototype.parse(null); },
    'fails to parse a null value.');
  t.throws(function() { Versionned.prototype.parse(42); },
    'fails to parse a number value.');
  t.throws(function() { Versionned.prototype.parse(undefined); },
    'fails to parse an undefined value.');
  t.doesNotThrow(function() { Versionned.prototype.parse('{}'); },
    'parses an empty object "{}".');
  t.end();
});
