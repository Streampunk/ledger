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

var Node = require ('../model/Node.js');
var test = require('tape');
var Capabilities = require('../model/Capabilities.js')

var methods = Node.prototype;

var bbcNodeJSON = `{
    "version": "1441716120:318744030",
    "hostname": "ap-ch-xw8600-2",
    "label": "ap-ch-xw8600-2",
    "href": "http://172.29.176.102:12345/",
    "services": [
        {
            "href": "http://172.29.176.102:12345/x-nmos/node/v1.0/self/status/",
            "type": "urn:x-nmos:service:status"
        },
        {
            "href": "http://172.29.176.102:12345/x-nmos/node/v1.0/self/pipelinemanager/",
            "type": "urn:x-nmos:service:pipelinemanager"
        },
        {
            "href": "http://172.29.176.102:12345/x-nmos/node/v1.0/self/mdnsbridge/",
            "type": "urn:x-nmos:service:mdnsbridge"
        }
    ],
    "caps": {},
    "id": "c8ba20e9-e197-4ec5-8764-4da672128589"
}`;

var bbcNode = new Node(
  'c8ba20e9-e197-4ec5-8764-4da672128589',
  '1441716120:318744030',
  'ap-ch-xw8600-2',
  'http://172.29.176.102:12345/',
  'ap-ch-xw8600-2',
  {}, // caps
  [ { href : 'http://172.29.176.102:12345/x-nmos/node/v1.0/self/status/',
      type : 'urn:x-nmos:service:status' },
    { href : 'http://172.29.176.102:12345/x-nmos/node/v1.0/self/pipelinemanager/',
      type : 'urn:x-nmos:service:pipelinemanager' },
    { href : 'http://172.29.176.102:12345/x-nmos/node/v1.0/self/mdnsbridge/',
      type : 'urn:x-nmos:service:mdnsbridge' } ]
);

test('Valid hrefs', function (t) {
  t.ok(methods.validHref(bbcNode.href),
    'match the example href.');
  t.ok(bbcNode.validHref(),
    'checks the internal value with no argument.');
  t.ok(methods.validHref('http://'),
    'match the bare minimum "http://".');
  t.ok(methods.validHref('http://localhost/'),
    'match the default "http://localhost/".');
  t.notOk(methods.validHref(''),
    'do not match the empty string.');
  t.notOk(methods.validHref(42),
    'do not match a number.');
  t.notOk(methods.validHref(null),
    'do not match a null value.');
  t.notOk(methods.validHref(undefined),
    'do not match an undefined value.');
  t.notOk(methods.validHref(false),
    'do not match false.');
  t.end();
});

test('Valid hostnames', function (t) {
  t.ok(methods.validHostname(bbcNode.hostname),
    'match the example hostname.');
  t.ok(bbcNode.validHostname(),
    'checks the internal hostname with no arguments.');
  t.ok(methods.validHostname(undefined),
    'match undefined as this property is optional.');
  t.notOk(methods.validHostname(''),
    'does not match the empty string.');
  t.notOk(methods.validHostname('stream punk'),
    'does not match a string with a space.');
  t.notOk(methods.validHostname(42),
    'does not match a number.');
  t.notOk(methods.validHostname(null),
    'does not match a null value.');
  t.notOk(methods.validHostname(false),
    'does not match false.');
  t.end();
});

test('Validity checking of capabilities', function(t) {
  t.ok(methods.validCaps(Capabilities),
    'matches an empty capabilities value.');
  t.ok(bbcNode.validCaps(),
    'checks the internal capabilities with no arguments.');
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

test('Valid services', function (t) {
  t.ok(methods.validServices(bbcNode.services),
    'match the example.');
  t.ok(bbcNode.validServices(),
    'checks the internal value with no arguments.');
  t.ok(methods.validServices([]),
    'match an empty array.');
  t.ok(methods.validServices([{ href : 'http://', type : '' }]),
    'match the minimal object.');
  t.notOk(methods.validServices([{ href : '', type : '' }]),
    'do not match an empty href.');
  t.notOk(methods.validServices({}),
    'do not match an empty object.');
  t.notOk(methods.validServices('streampunk'),
    'do not match an arbitrary string.');
  t.notOk(methods.validServices(42),
    'do not match a number.');
  t.notOk(methods.validServices(null),
    'do not match a null value.');
  t.notOk(methods.validServices(undefined),
    'do not match an undefined value.');
  t.notOk(methods.validServices(false),
    'do not match false.');
  t.end();
});

test('Generating an href', function (t) {
  t.equal(methods.generateHref('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validity check).');
  t.equal(methods.generateHref(42), 42,
    'passes through a number.');
  t.equal(methods.generateHref(), 'http://localhost/',
    'generates an empty URL for no arguments.');
  t.equal(methods.generateHref(null), 'http://localhost/',
    'generates an empty URL for a null value.');
  t.equal(methods.generateHref(undefined), 'http://localhost/',
    'generates an empty URL for an undefined value.');
  t.end();
});

test('Generating a hostname', function (t) {
  t.equal(methods.generateHostname('streampunk media'), 'streampunk media',
    'passes through an arbitrary string (this is not a validity check).');
  t.equal(methods.generateHostname(undefined), undefined,
    'passes through undefined.');
  t.equals(methods.generateHostname(42), 42,
    'passes through a number.');
  t.equals(methods.generateHostname(), undefined,
    'generates undefined for no arguments.');
  t.equals(methods.generateHostname(null), undefined,
    'generates null for a null value.');
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

test('Generating services', function (t) {
  t.deepEqual(methods.generateServices([]), [],
    'passes through an empty array.');
  t.equal(methods.generateServices('streampunk'), 'streampunk',
    'passes through an arbitrary string (this is not a validity check).');
  t.equal(methods.generateServices(42), 42,
    'passes through a number.');
  t.deepEqual(methods.generateServices(), [],
    'generates an empty array for no arguments.');
  t.deepEqual(methods.generateServices(null), [],
    'generates an empty array for a null value.');
  t.deepEqual(methods.generateServices(undefined), [],
    'generates an empty array for an undefined argument.');
  t.end();
});

test('Node objects', function (t) {
  for ( var x = 0 ; x < 10 ; x ++ ) {
    t.ok(new Node().valid(),
      'are valid on default creation ' + x + '.');
  }
  var n = new Node(null, null, 'streampunk', 'http://www.streampunk.media/',
    'wibble', {}, [ { href : "http://streampunk.media/riotous",
      type : "urn:x-punk:service:riot" }]);
  t.ok(n.valid(), 'constructed with arguments are valid.');
  t.deepEqual(methods.parse(n.stringify()), n,
    'survive a JSON roundtrip.');
  n.hostname = 'jelly';
  t.equal(n.hostname, 'wibble', 'are shallow immutable.');
  n.services[0].href = "http://streampunk.media/awakening";
  t.equal(n.services[0].href, "http://streampunk.media/riotous",
    'are deep immutable.');
  t.notOk(new Node('wibble').valid(),
    'can be constructed as invalid.');
  var m = JSON.parse(n.stringify());
  t.deepEqual(m, { id : n.id, version : n.version, label : n.label,
    href : n.href, hostname : n.hostname, caps : n.caps,
    services : n.services }, 'convert to JSON as expected.');
  t.deepEqual(methods.parse(
    JSON.stringify({id : n.id, version : n.version, label : n.label,
      href : n.href, hostname : n.hostname, caps : n.caps,
      services : n.services
    })), n, 'convert from a JSON object as expected.');
  t.deepEqual(Node.prototype.parse(m), n, "parse converts JSON object.");
  t.end();
});

test('Parsed BBC example', function (t) {
  var parsedNode = methods.parse(bbcNodeJSON);
  t.equal(parsedNode.constructor, methods.constructor,
    'is a Node.');
  t.deepEqual(parsedNode, bbcNode, 'matches local version.');
  t.ok(parsedNode.valid(),
    'is valid.')
  t.end();
});
