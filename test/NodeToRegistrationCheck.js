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

// Test the Node API interacting with the Regisration API.

var test = require('tape');
var ledger = require('../index.js');

var RegistrationAPI = require('../api/RegistrationAPI.js');
var QueryAPI = require('../api/QueryAPI.js');
var NodeRAMStore = require('../api/NodeRAMStore.js');

var properties = {
  queryPort : '3002',
  registrationPort : '3001',
  queryName : 'ledger_query',
  registrationName : 'ledger_registration',
  queryPri : '100',
  registrationPri : '100'
};

var store = new NodeRAMStore();

var registrationAPI = new RegistrationAPI(+properties.registrationPort, store,
  properties.registrationName, +properties.registrationPri);
var queryAPI = new QueryAPI(+properties.queryPort, registrationAPI.getStore,
  properties.queryName, +properties.queryPri);

registrationAPI.init().start();
queryAPI.init().start();


var node = new ledger.Node(null, null, "Ledger Node", "http://ledger.local:3000",
  "ledger");
var store = new ledger.NodeRAMStore(node);
var nodeAPI = new ledger.NodeAPI(3000, store);
nodeAPI.init().start();

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

test('On a new device registration at a node, eventaully the registry', function (t) {
  nodeAPI.putResource(device, function (e, x) {
    if (e) return t.end(`failed to add a device to the node: {$e}`);
    setTimeout(function() {
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
  nodeAPI.putResource(videoSender, function (e, x) {
    if (e) return t.end(`failed to add a sender to the node: ${e}`);
    setTimeout(function() {
      registrationAPI.getStore().getSender(videoSender.id, function (err, result) {
        if (err) return t.fail('does not have our sender.');
        t.deepEqual(result, videoSender, 'has our sender registered.');
        t.end();
      });
    }, 1000);
  });
});

test('On a new receiver registration at a node, eventaully the registry', function (t) {
  nodeAPI.putResource(videoReceiver, function (e, x) {
    if (e) return t.end(`failed to add a receiver to the node: ${e}`);
    setTimeout(function() {
      registrationAPI.getStore().getReceiver(videoReceiver.id, function (err, result) {
        if (err) return t.end('does not have our receiver.');
        t.deepEqual(result, videoReceiver, 'has our receiver registered.');
        t.end();
      });
    }, 1000);
  });
});

test('Deleting a flow at the node, eventually at the registry', function (t) {
  t.end();
}

test('Updating a flow at the node, eventually at the registry', function (t) {
  t.end();
});

test('Shutting down', function (t) {
  console.log('Node to Registration API integration spec tests ended. Waitng 2s.');
  registrationAPI.stop();
  queryAPI.stop();
  nodeAPI.stop();
  setTimeout(t.end, 2000);
});
