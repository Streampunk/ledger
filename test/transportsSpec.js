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

var Transports = require('../model/Transports.js');
var test = require('tape');

test('A valid device type', function(t) {
  t.ok(Transports.validTransport('urn:x-ipstudio:transport:rtp'),
    'is "urn:x-ipstudio:transport:rtp".');
  t.ok(Transports.validTransport('urn:x-ipstudio:transport:rtp.mcast'),
    'is "urn:x-ipstudio:transport:rtp.mcast".');
  t.ok(Transports.validTransport('urn:x-ipstudio:transport:rtp.ucast'),
    'is "urn:x-ipstudio:transport:rtp.ucast".');
  t.ok(Transports.validTransport('urn:x-ipstudio:transport:dash'),
    'is "urn:x-ipstudio:transport:dash".');
  t.ok(Transports.validTransport(Transports.rtp),
    'is Transports.rtp.');
  t.ok(Transports.validTransport(Transports.rtp_ucast),
    'is Transprots.rtp_ucast.');
  t.ok(Transports.validTransport(Transports.rtp_mcast),
    'is Transports.rtp_mcast.');
  t.ok(Transports.validTransport(Transports.dash),
    'is Transports.dash.');
  t.notOk(Transports.validTransport('streampunk'),
    'is not an arbitrary string.');
  t.notOk(Transports.validTransport(),
    'is not no arguments.');
  t.notOk(Transports.validTransport(null),
    'is not a null value.');
  t.notOk(Transports.validTransport(42),
    'is not a number.');
  t.notOk(Transports.validTransport(undefined),
    'is not an undefined value.');
  t.notOk(Transports.validTransport({}),
    'is not an empty object.');
  t.end();
});
