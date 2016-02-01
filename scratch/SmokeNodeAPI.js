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

// Run a demonstration node

var NodeAPI = require('../api/NodeAPI.js');
var NodeRAMStore = require('../api/NodeRAMStore.js');
var Node = require('../model/Node.js');
var Device = require('../model/Device.js');
var Source = require('../model/Source.js');
var Flow = require('../model/Flow.js');
var Sender = require('../model/Sender.js');
var Receiver = require('../model/Receiver.js');
var formats = require('../model/Formats.js');
var transports = require('../model/Transports.js');

var node = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");
var store = new NodeRAMStore(node);

var nodeAPI = new NodeAPI(3000, store);

nodeAPI.init().start();

var device = new Device(null, null, "Dat Punking Ting", null, node.id);
function regDev() {
  store.putDevice(device, function (e, d, s) {
    if (e) console.error(e);
    else {
      nodeAPI.setStore(s);
      regVideoSource();
    }
  });
}

var videoSource = new Source(null, null, "Noisy Punk", "Will you turn it down!!",
  formats.video, null, null, device.id);
function regVideoSource() {
  nodeAPI.getStore().putSource(videoSource, function (e, d, s) {
    if (e) console.error(e);
    else nodeAPI.setStore(s);
    regAudioSource();
  });
}

var audioSource = new Source(null, null, "Garish Punk", "What do you look like!!",
  formats.audio, null, null, device.id);
function regAudioSource() {
  nodeAPI.getStore().putSource(audioSource, function (e, d, s) {
    if (e) console.error(e);
    else nodeAPI.setStore(s);
    regAudioFlow();
  });
}

var audioFlow = new Flow(null, null, "Funk Punk", "Blasting at you, punk!",
  formats.audio, null, audioSource.id);
function regAudioFlow() {
  nodeAPI.getStore().putFlow(audioFlow, function (e, d, s) {
    if (e) console.error(e);
    else nodeAPI.setStore(s);
    regVideoFlow();
  });
}

var videoFlow = new Flow(null, null, "Junk Punk", "You looking at me, punk?",
  formats.video, null, videoSource.id);
function regVideoFlow() {
  nodeAPI.getStore().putFlow(videoFlow, function (e, d, s) {
    if (e) console.error(e);
    else nodeAPI.setStore(s);
    regAudioSender();
  });
}

var audioSender = new Sender(null, null, "Listen Up Punk",
  "Should have listened to your Mother!", audioFlow.id,
  transports.rtp_mcast, device.id, "http://tereshkova.local/audio.sdp");
function regAudioSender() {
  nodeAPI.getStore().putSender(audioSender, function (e, d, s) {
    if (e) console.error(e);
    else nodeAPI.setStore(s);
    regVideoSender();
  });
}

var videoSender = new Sender(null, null, "In Ya Face Punk",
  "What do you look like?", videoFlow.id,
  transports.rtp_mcast, device.id, "http://tereshkova.local/video.sdp");
function regVideoSender() {
  nodeAPI.getStore().putSender(videoSender, function (e, d, s) {
    if (e) console.error(e);
    else nodeAPI.setStore(s);
    regAudioReceiver();
  });
}

var audioReceiver = new Receiver(null, null, "Say It Punk?",
  "You talking to me?", formats.audio, null, null, device.id,
  transports.rtp_mcast);
function regAudioReceiver() {
  nodeAPI.getStore().putReceiver(audioReceiver, function (e, d, s) {
    if (e) console.error(e);
    else nodeAPI.setStore(s);
    regVideoReceiver();
  });
}

var videoReceiver = new Receiver(null, null, "Watching da Punks",
  "Looking hot, punk!", formats.video, null, null, device.id,
  transports.rtp_mcast);
function regVideoReceiver() {
  nodeAPI.getStore().putReceiver(videoReceiver, function (e, d, s) {
    if (e) console.error(e);
    else nodeAPI.setStore(s);
    console.log('Demo registration complete.');
  //  console.log(JSON.stringify(s));
  });
}

regDev();
