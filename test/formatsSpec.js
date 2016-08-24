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

var Formats = require('../model/Formats.js');
var test = require('tape');

test('A valid format', function(t) {
  t.ok(Formats.validFormat('urn:x-nmos:format:video'),
    'is "urn:x-nmos:format:video".');
  t.ok(Formats.validFormat('urn:x-nmos:format:audio'),
    'is "urn:x-nmos:format:audio".');
  t.ok(Formats.validFormat('urn:x-nmos:format:data'),
    'is "urn:x-nmos:format:data".');
  t.ok(Formats.validFormat('urn:x-nmos:format:video.raw'),
    'is a format with a sub-type such as "urn:x-nmos:format:video.raw".');
  t.ok(Formats.validFormat(Formats.video),
    'is Formats.video.');
  t.ok(Formats.validFormat(Formats.audio),
    'is Formats.audio.');
  t.ok(Formats.validFormat(Formats.data),
    'is Formats.data.');
  t.notOk(Formats.validFormat('streampunk'),
    'is not an arbitrary string.');
  t.notOk(Formats.validFormat(),
    'is not no arguments.');
  t.notOk(Formats.validFormat(null),
    'is not a null value.');
  t.notOk(Formats.validFormat(42),
    'is not a number.');
  t.notOk(Formats.validFormat(undefined),
    'is not an undefined value.');
  t.notOk(Formats.validFormat({}),
    'is not an empty object.');
  t.end();
});
