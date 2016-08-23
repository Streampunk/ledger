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

// Test the Node API interacting with the Regisration API.

var test = require('tape');
var ledger = require('../../index.js');

var RegistrationAPI = require('../../api/RegistrationAPI.js');
var QueryAPI = require('../../api/QueryAPI.js');
var NodeRAMStore = require('../../api/NodeRAMStore.js');

function generatePort() { return Math.random() * 32768|0 + 32768; };

var properties = {
  queryPort : '' + generatePort(),
  registrationPort : '' + generatePort(),
  queryName : 'ledger_query',
  registrationName : 'ledger_registration',
  queryPri : '100',
  registrationPri : '100'
};

var registrationAPI, queryAPI, nodeAPI;
var node = new ledger.Node(null, null, "Ledger Node", "http://ledger.local:3000",
  "ledger");

test('Starting stores', function (t) {
  var store = new NodeRAMStore();

  registrationAPI = new RegistrationAPI(+properties.registrationPort, store,
    properties.registrationName, +properties.registrationPri);
  queryAPI = new QueryAPI(+properties.queryPort, registrationAPI.getStore,
    properties.queryName, +properties.queryPri);

  registrationAPI.init().start();
  queryAPI.init().start();

  store = new ledger.NodeRAMStore(node);
  nodeAPI = new ledger.NodeAPI(generatePort(), store);
  nodeAPI.init().start();
  t.end();
});

var device = new ledger.Device(null, null, "Dat Punking Ting", null, node.id);
var videoSource = new ledger.Source(null, null, "Garish Punk", "Will you turn it down!!",
  ledger.formats.video, null, null, device.id);
var audioSource = new ledger.Source(null, null, "Noisy Punk", "What do you look like!!",
  ledger.formats.audio, null, null, device.id);
var audioFlow = new ledger.Flow(null, null, "Funk Punk", "Blasting at you, punk!",
  ledger.formats.audio, null, audioSource.id);
var videoFlow = new ledger.Flow(null, null, "Junk Punk", "You looking at me, punk?",
  ledger.formats.video, null, videoSource.id);
var audioSender = new ledger.Sender(null, null, "Listen Up Punk",
  "Should have listened to your Mother!", audioFlow.id,
  ledger.transports.rtp_mcast, device.id, "http://tereshkova.local/audio.sdp");
var videoSender = new ledger.Sender(null, null, "In Ya Face Punk",
  "What do you look like?", videoFlow.id,
  ledger.transports.rtp_mcast, device.id, "http://tereshkova.local/video.sdp");
var audioReceiver = new ledger.Receiver(null, null, "Say It Punk?",
  "You talking to me?", ledger.formats.audio, null, null, device.id,
  ledger.transports.rtp_mcast);
var videoReceiver = new ledger.Receiver(null, null, "Watching da Punks",
  "Looking hot, punk!", ledger.formats.video, null, null, device.id,
  ledger.transports.rtp_mcast);

var testResources = [device, videoSource, audioSource, audioFlow, videoFlow,
  audioSender, videoSender, audioReceiver, videoReceiver];

test('Registering resources', function (t) {
  t.plan(testResources.length);
  testResources.forEach(function (r) {
    nodeAPI.putResource(r).then(t.pass, t.fail)});
});

test('A registration service with an empty node', function (t) {
  setTimeout(function () {
    registrationAPI.getStore().getNode(node.id, function (err, result) {
      if (err) {
        t.fail(`failed to register our node ${err}`);
      } else {
        t.deepEqual(node, result, 'has our node registered.');
      }
      t.end();
    });
  }, 3000);
});

testResources.forEach(function (r) {
  test(`Checking for ${r.constructor.name.toLowerCase()} in registry`, function (t) {
    (registrationAPI.getStore())['get' + r.constructor.name](r.id, function (e, x) {
      if (e) return t.end(`fails to find it: ${e}`);
      if (r.constructor.name !== 'Device') {
        t.deepEqual(x, r, 'finds it as expected.');
      } else {
        t.deepEqual(x.set("senders", []).set("receivers", []), r,
          'finds the updated device.');
        t.equal(x.senders.length, 2, 'device has 2 senders.');
        t.equal(x.receivers.length, 2, 'device has 2 receivers.');
      }
      t.end();
    });
  });
});

test('Reset store by deleting all resources that are not nodes', function (t) {
  var deleteProms = testResources.reverse().forEach(function (r) {
    nodeAPI.deleteResource(r.id, r.constructor.name.toLowerCase()).catch(console.error);
  });
  t.plan(testResources.length);
  setTimeout(function () {
    testResources.forEach(function (r) {
      (registrationAPI.getStore())['get' + r.constructor.name](r.id, function (e, x) {
        if (e) return t.pass(`${r.constructor.name} has been deleted.`);
        t.fail(`${r.constructor.name} has not been deleted.`);
      });
    });
  }, 2000);
});

test('On a new device registration at a node, eventaully the registry', function (t) {
  nodeAPI.putResource(device, function (e, x) {
    if (e) return t.end(`failed to add a device to the node: {$e}`);
    setTimeout(function () {
      registrationAPI.getStore().getDevice(device.id, function (err, result) {
        if (err) return t.end('does not have our device.');
        t.deepEqual(result, device, 'has our device registered.');
        t.end();
      });
    }, 1000);
  });
});

test('On a new source registration at a node, eventaully the registry', function (t) {
  nodeAPI.putResource(videoSource, function (e, x) {
  if (e) return t.end(`failed to add a source to the node: ${e}`);
    setTimeout(function () {
      registrationAPI.getStore().getSource(videoSource.id, function (err, result) {
        if (err) return t.end('does not have our source.');
        t.deepEqual(result, videoSource, 'has our source registered.');
        t.end();
      });
    }, 1000);
  });
});

test('On a new flow registration at a node, eventaully the registry', function (t) {
  nodeAPI.putResource(videoFlow, function (e, x) {
    if (e) return t.end(`failed to add a flow to the node: ${e}`);
    setTimeout(function () {
      registrationAPI.getStore().getFlow(videoFlow.id, function (err, result) {
        if (err) return t.end('does not have our flow.');
        t.deepEqual(result, videoFlow, 'has our flow registered.');
        t.end();
      });
    }, 1000);
  });
});

test('On a new sender registration at a node, eventaully the registry', function (t) {
  t.ok(registrationAPI.getStore().devices[videoSender.device_id].senders.length === 0,
    'current sender-referenced device has no senders registered')
  nodeAPI.putResource(videoSender, function (e, x) {
    if (e) return t.end(`failed to add a sender to the node: ${e}`);
    setTimeout(function () {
      registrationAPI.getStore().getSender(videoSender.id, function (err, result) {
        if (err) return t.fail('does not have our sender.');
        t.deepEqual(result, videoSender, 'has our sender registered.');
        registrationAPI.getStore().getDevice(videoSender.device_id, function (err, dev) {
          if (err) return t.end('could not get related device for sender.');
          t.ok(dev.senders.indexOf(videoSender.id) >= 0,
            'device has been updated with sender identifier added.');
          t.end();
        });
      });
    }, 1000);
  });
});

test('On a new receiver registration at a node, eventaully the registry', function (t) {
  t.ok(registrationAPI.getStore().devices[videoReceiver.device_id].receivers.length === 0,
    'current receiver-referenced device has no receivers registered.');
  nodeAPI.putResource(videoReceiver, function (e, x) {
    if (e) return t.end(`failed to add a receiver to the node: ${e}`);
    setTimeout(function () {
      registrationAPI.getStore().getReceiver(videoReceiver.id, function (err, result) {
        if (err) return t.end('does not have our receiver.');
        t.deepEqual(result, videoReceiver, 'has our receiver registered.');
        registrationAPI.getStore().getDevice(videoReceiver.device_id, function (err, dev) {
          if (err) return t.end('could not get related device for receiver.');
          t.ok(dev.receivers.indexOf(videoReceiver.id) >= 0,
            'device has been updated with receiver identifier added.');
          t.end();
        });
      });
    }, 1000);
  });
});

test('Deleting a flow at the node', function (t) {
  t.plan(3);
  registrationAPI.getStore().getFlow(videoFlow.id, function (err, result) {
    if (err) return t.fail('cannot be tested as the flow does not exist.');
    t.deepEqual(result, videoFlow, 'starts with our flow registered.');
  });
  nodeAPI.deleteResource(videoFlow.id, 'flow', function (e, x) {
    if (e) return t.fail('does not get deleted from node API store.');
    t.equal(x, videoFlow.id, 'reports successfully deleted from node store.');
  });
  setTimeout(function () {
    registrationAPI.getStore().getFlow(videoFlow.id, function (err, result) {
      if (err) return t.pass('cannot retrieve the flow from the registry after delete.');
      t.fail('has not worked as flow is still in the registry.');
    });
  }, 1000);
});

test('Updating a device at the node', function (t) {
  t.plan(3);
  registrationAPI.getStore().getDevice(device.id, function (err, result) {
    if (err) return t.end('cannot be tested as the device does not exist.');
    t.equal(result.id, device.id, 'has our device registered.');
    var deltaDevice = new ledger.Device(device.id, null, 'Switched up PUNK!',
      null, node.id, result.senders, result.receivers);
    nodeAPI.putResource(deltaDevice, function (e, x) {
      if (e) return t.fail('failed to update device in node store.');
      t.deepEqual(x, deltaDevice, 'device successfully updated on node store.');
    });
    setTimeout(function() {
      registrationAPI.getStore().getDevice(deltaDevice.id, function (e, x) {
        if (e) return t.fail('could not subsequently retrieve from the registry.');
        t.deepEqual(x, deltaDevice, 'is stored as the delta device on the registry.');
      });
    }, 1000);
  });
});

test('Shutting down', function (t) {
  console.log('Node to Registration API integration spec tests ended. Waitng 2s.');
  registrationAPI.stop();
  queryAPI.stop();
  nodeAPI.stop();
  setTimeout(t.end, 2000);
});
