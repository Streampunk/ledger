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
            "href": "http://172.29.176.102:12345/x-ipstudio/node/v1.0/self/status/",
            "type": "urn:x-ipstudio:service:status"
        },
        {
            "href": "http://172.29.176.102:12345/x-ipstudio/node/v1.0/self/pipelinemanager/",
            "type": "urn:x-ipstudio:service:pipelinemanager"
        },
        {
            "href": "http://172.29.176.102:12345/x-ipstudio/node/v1.0/self/mdnsbridge/",
            "type": "urn:x-ipstudio:service:mdnsbridge"
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
  [ { href : 'http://172.29.176.102:12345/x-ipstudio/node/v1.0/self/status/',
      type : 'urn:x-ipstudio:service:status' },
    { href : 'http://172.29.176.102:12345/x-ipstudio/node/v1.0/self/pipelinemanager/',
      type : 'urn:x-ipstudio:service:pipelinemanager' },
    { href : 'http://172.29.176.102:12345/x-ipstudio/node/v1.0/self/mdnsbridge/',
      type : 'urn:x-ipstudio:service:mdnsbridge' } ]
);

test('Valid hrefs', function (t) {
  t.ok(methods.validHref(bbcNode.href),
    'match the example href.');
  t.ok(methods.validHref('http://'),
    'match the bare minimum "http://".');
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

test('Validi hostnames', function (t) {
  t.ok(methods.validHostname(bbcNode.hostname),
    'match the example hostname.');
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
