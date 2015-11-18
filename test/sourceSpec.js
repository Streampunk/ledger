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
