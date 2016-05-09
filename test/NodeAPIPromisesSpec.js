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
var Promise = require('promise');

var Node = ledger.Node;
var Device = ledger.Device;
var Source = ledger.Source;
var Flow = ledger.Flow;
var Sender = ledger.Sender;
var Receiver = ledger.Receiver;
var testPort = 3210;

var node = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");
var device = new Device(null, null, "Dat Punking Ting", null, node.id);

function promiseTest(description, fn) {
  test(description, function (t) {
    var store = new ledger.NodeRAMStore(node);
    var api = new ledger.NodeAPI(testPort, store);
    fn(t, api);
  });
}

promiseTest('Adding device with a promise', function (t, api) {
  api.putResource(device).then(function (d) {
    t.deepEqual(d, device, 'has created the expected value.');
    t.end();
  }, function (e) {
    t.end(`produces and error: ${e}`);
  });
});

promiseTest('Adding a device with a nodeified callback', function (t, api) {
  api.putResource(device, function (err, result) {
    if (err) return t.end(`produces an error: ${e}`);
    t.deepEqual(result, device, 'has created the expected value.');
    t.end();
  });
});

promiseTest('Retrieving a device via promise', function (t, api) {
  api.putResource(device).catch(t.end);
  api.getResource(device.id, 'device').then(function (d) {
    t.deepEqual(d, device, 'has the expected result.');
    t.end();
  }, function (e) {
    t.end(`produces an error: ${e}`);
  });
});

promiseTest('Retrieving a device via a callback', function (t, api) {
  api.putResource(device).catch(t.end);
  api.getResource(device.id, 'device', function (err, result) {
    if (err) return t.fail(`produces an error: ${e}`);
    t.deepEqual(result, device, 'has the exptected result.');
    t.end();
  });
});

promiseTest('Retrieve a device with no type', function (t, api) {
  api.putResource(device).catch(t.end);
  t.plan(2);
  api.getResource(device.id).then(function (d) {
    t.deepEqual(d, device, 'has the expected result with a known id.');
  }, function (e) {
    t.fail(`produces an error: ${e}`);
  });
  api.getResource(uuid.v4()).then(function (d) {
    t.fail('should fail with a random id and it succeeded.');
  }, function (e) {
    t.deepEqual(e, new Error(""), 'errors with a random id as expected.')
  });
});

promiseTest('Put ten devices and retrieve', function (t, api) {
  var pushy = [];
  for ( var x = 0 ; x < 10 ; x++) {
    pushy.push(api.putResource(new Device(null, null, `Punk numero ${x}`, null, node.id)));
  }
  Promise.all(pushy).catch(t.fail);
  api.getResources('device').then(function (devs) {
    t.equal(devs.length, 10, 'has the expected length.');
    t.end();
  }, t.end);
});

promiseTest('Getting a list of resources for an unknown type', function (t, api) {
  api.getResources('wibble').then(function (onSuccess) {
    t.end(`should have failed. Actually produced: ${success}`);
  }, function (e) {
    t.deepEqual(e, new Error("Type is not a string or a known type."),
      `fails as expected with error: ${e}`);
    t.end();
  });
});

promiseTest('Getting a list of devices', function (t, api) {
  var device2 = new Device(null, null, "Getting devicive!", null, node.id);
  api.putResource(device).catch(t.end);
  api.putResource(device2).catch(t.end);
  api.getResources('device').then(function (devs) {
    t.equal(devs.length, 2, 'has the expected length.');
    t.ok(devs.some(function (x) { return x.id === device.id}),
      'has the first device.');
    t.ok(devs.some(function (x) { return x.id === device2.id}),
      'has the second device.');
    t.end();
  }, t.end);
});
