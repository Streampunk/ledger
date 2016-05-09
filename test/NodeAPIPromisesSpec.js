/* Copyright 2016 Christine S. MacNeill

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

var test = require('tape');
var http = require('http');
var uuid = require('uuid');
var async = require('async');
var ledger = require('../index.js');

var Node = ledger.Node;
var Device = ledger.Device;
var Source = ledger.Source;
var Flow = ledger.Flow;
var Sender = ledger.Sender;
var Receiver = ledger.Receiver;
var testPort = 3210;

var node = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");

var store = new ledger.NodeRAMStore(node);
var api = new ledger.NodeAPI(testPort, store);

var device = new Device(null, null, "Dat Punking Ting", null, node.id);

test('Adding device with a promise', function (t) {
  var sp = api.putResource(device);
  sp.then(function (d) {
    t.deepEqual(d, device, 'has created the expected value.');
    t.end();
  }, function (e) {
    t.end(`produces and error: ${e}`);
  });
});

test('Adding a device with a nodeified callback', function (t) {
  api.putResource(device, function (err, result) {
    if (err) return t.end(`produces an error: ${e}`);
    t.deepEqual(result, device, 'has created the expected value.');
    t.end();
  });
});

test('Retrieving a device via promise', function (t) {
  var sp = api.getResource(device.id, 'device');
  sp.then(function (d) {
    t.deepEqual(d, device, 'has the expected result.');
    t.end();
  }, function (e) {
    t.end(`produces an error: ${e}`);
  });
});

test('Retrieving a device via a callback', function (t) {
  api.getResource(device.id, 'device', function (err, result) {
    if (err) return t.fail(`produces an error: ${e}`);
    t.deepEqual(result, device, 'has the exptected result.');
    t.end();
  });
});

test('Getting a list of resources for an unknown type', function (t) {
  api.getResources('wibble').then(function (onSuccess) {
    t.end(`should have failed. Actually produced: ${success}`);
  }, function (e) {
    t.deepEqual(e, new Error("Type is not a string or a known type."),
      `fails as expected with error: ${e}`);
    t.end();
  });
});

test('Getting a list of devices', function (t) {
  api.getResources('device').then(function (onSuccess) {
    t.deepEqual(onSuccess, [ device ], 'is the expected array.');
    t.end();
  }, function (e) {
    t.end(`fails with error: ${e}`);
  });
});

test('Setting and getting is serialized', function (t) {
  var dev2 = new Device(null, null, "LOUD device", null, node.id);
  api.putResource(dev2).catch(t.end);
  t.plan(2);
  api.getResource(dev2.id, 'device').then(function (d) {
    t.deepEqual(d, dev2, 'and the result is as expected.');
  }, function (e) {
    t.fail(`but it produces an error on single get: ${e}`);
  });
  api.getResources('device').then(function (ds) {
    t.ok((ds.length === 2) && ((ds[0].id === device.id && ds[1].id === dev2.id) || (
      ds[0].id === dev2.id && ds[1].id === device.id)), 'array has expected elements.');
  }, function (e) {
    t.fail(`but it produces an error on multiple get: ${e}`);
  });
});
