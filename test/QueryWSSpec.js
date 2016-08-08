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

// Test the websocket capability of the query API

var test = require('tape');
var http = require('http');
var uuid = require('uuid');
var ledger = require('../index.js');
var WebSocket = require('ws');
var Promise = require('promise');

var Node = ledger.Node;
var Device = ledger.Device;
var Source = ledger.Source;
var Flow = ledger.Flow;
var Sender = ledger.Sender;
var Receiver = ledger.Receiver;
var testPort = 3002; //Math.random() * 32768|0 + 32768;

var store = null;
function storeFn() { return store; }

function serverTest(description, fn) {
  test(description, function (t) {
    store = new ledger.NodeRAMStore();
    var regAPI = new ledger.RegistrationAPI(testPort, store, 'none');
    var qAPI = new ledger.QueryAPI(testPort, storeFn, 'none', 0, regAPI);
    qAPI.init().start(function (e) {
      if (e) {
        t.fail('Failed to start server');
        t.end();
      } else {
        fn(t, store, qAPI, regAPI, function () {
          qAPI.stop(function (e) {
            if (e) console.error("Failed to shut down server.");
            t.end();
          });
        });
      }
    });
  });
};

function createSubscription(server, sub, cb) {
  var jsonToPost = JSON.stringify(sub);
  var req = http.request({
      port : testPort,
      path : '/x-nmos/query/v1.0/subscriptions',
      method : 'POST',
      headers : {
        'Content-Type' : 'application/json',
        'Content-Length' : jsonToPost.length
      }
  }, function (res) {
    if (res.statusCode !== 201)
      return cb(`Creating subscription had unexpected error code ${res.statusCode}.`);
    res.setEncoding('utf8');
    var resSub = null;
    res.on('data', function (chunk) {
      resSub = JSON.parse(chunk);
    });
    res.on('error', cb);
    res.on('end', function () { cb(null, resSub); });
  });
  req.on('error', cb);
  req.write(jsonToPost);
  req.end();
};

var createSub = Promise.denodeify(createSubscription);

var uuidRegex = /[0-9a-fA-f]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}/;
var wshrefRegex = /ws:\/\/\S+\/ws\/\?uid=[0-9a-fA-f]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}/;
var tsRegex = /[0-9]+:[0-9]+/;
var defaultRate = { numerator : 0, denominator : 1 };

function checkGrain(t, g, sub, data) {
  t.ok(typeof g === 'object', 'grain is an object.');
  t.equal(g.grain_type, 'event', 'grain is of event type.');
  t.ok(g.source_id.match(uuidRegex), 'grain source ID is a UUID.');
  t.equal(g.flow_id, sub.id, 'grain flow ID matched the subscription ID.');
  t.ok(g.origin_timestamp, 'grain origin timestamp is valid.');
  t.ok(g.sync_timestamp, 'grain sync timestamp is valid.');
  t.ok(g.creation_timestamp, 'grain creation timestamp is valid');
  t.deepEqual(g.rate, defaultRate, 'grain rate is as expected.');
  t.deepEqual(g.duration, defaultRate, 'grain duration is as expected.');
  t.equal(g.grain.type, 'urn:x-nmos:format:data.event', 'has expected grain type.');
  t.equal(g.grain.topic, sub.resource_path + '/',
    'has expected topic matching the subscription.');
  t.ok(g.grain.data && g.grain.data.length > 0, 'has grain data with content.');
  if (!Array.isArray(data)) data = [ data ];
  for ( var x = 0 ; x < g.grain.data.length ; x++ ) {
    var i = g.grain.data[x];
    t.ok(typeof i === 'object', `grain data item ${x} is an object.`);
    var path = (data[x].pre) ? data[x].pre.id : data[x].post.id;
    t.equal(i.path, path, `data item ${x} has expected path.`);
    t.deepEqual(i.pre, data[x].pre, `data item ${x} has expected pre-condition.`);
    t.deepEqual(i.post, data[x].post, `data item ${x} has expected post-condition.`);
  }
}

var node1 = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");
var node2 = new Node(node1.id, null, "Smashing Pumpkins", "http://hopper.local:3000",
  "hopper");

serverTest("Create a node and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/nodes",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return regAPI.putResource(node1);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a node via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { post : node1 });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close(console.log);
    done()
  });
});

serverTest("Change a node and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/nodes",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    return regAPI.putResource(node1);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a node via the registration API');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return regAPI.putResource(node2);
  })
  .then(function (changed) {
    t.ok(changed, 'changes a node via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a second websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { pre : node1, post : node2 });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

serverTest("Create and delete a node and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/nodes",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    return regAPI.putResource(node1);
  })
  .then(function (putted) {
    t.pass('creates a node via the registration API');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return regAPI.deleteResource(node1.id, 'node');
  })
  .then(function (deleted) {
    t.ok(deleted, 'deletes a node via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a second websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { pre : node1 });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

var device = new Device(null, null, "Dat Punking Ting", null, node1.id);

serverTest("Create a device and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/devices",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device) ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a device via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { post : device });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

serverTest("Create and delete a device and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/devices",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    t.pass('creates an open a web socket.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device) ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a device via the registration API.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return regAPI.deleteResource(device.id, 'device');
  })
  .then(function (deleted) {
    t.ok(deleted, 'deletes a device via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { pre : device });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

var videoSource = new Source(null, null, "Garish Punk", "Will you turn it down!!",
  ledger.formats.video, null, null, device.id);

serverTest("Create a source and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/sources",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device),
      regAPI.putResource(videoSource)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a source via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { post : videoSource });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

serverTest("Create and delete a source and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/sources",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device),
      regAPI.putResource(videoSource)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a device via the registration API.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return regAPI.deleteResource(videoSource.id, 'source');
  })
  .then(function (deleted) {
    t.ok(deleted, 'deletes a source via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { pre : videoSource });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

var videoFlow = new Flow(null, null, "Junk Punk", "You looking at me, punk?",
  ledger.formats.video, null, videoSource.id);

serverTest("Create a flow and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/flows",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device),
      regAPI.putResource(videoSource),
      regAPI.putResource(videoFlow)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a flow via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { post : videoFlow });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

serverTest("Create and delete a flow and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/flows",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device),
      regAPI.putResource(videoSource),
      regAPI.putResource(videoFlow)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a flow via the registration API.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return regAPI.deleteResource(videoFlow.id, 'flow');
  })
  .then(function (deleted) {
    t.ok(deleted, 'deletes a flow via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { pre : videoFlow });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

var videoSender = new Sender(null, null, "In Ya Face Punk",
  "What do you look like?", videoFlow.id,
  ledger.transports.rtp_mcast, device.id, "http://tereshkova.local/video.sdp");

serverTest("Create a sender and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/senders",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device),
      regAPI.putResource(videoSource),
      regAPI.putResource(videoFlow),
      regAPI.putResource(videoSender)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a sender via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { post : videoSender });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

serverTest("Create and delete a sender and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/senders",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device),
      regAPI.putResource(videoSource),
      regAPI.putResource(videoFlow),
      regAPI.putResource(videoSender)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a sender via the registration API.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return regAPI.deleteResource(videoSender.id, 'sender');
  })
  .then(function (deleted) {
    t.ok(deleted, 'deletes a sender via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { pre : videoSender });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

var videoReceiver = new Receiver(null, null, "Watching da Punks",
  "Looking hot, punk!", ledger.formats.video, null, null, device.id,
  ledger.transports.rtp_mcast);

serverTest("Create a sender and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/receivers",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device),
      regAPI.putResource(videoSource),
      regAPI.putResource(videoFlow),
      regAPI.putResource(videoSender),
      regAPI.putResource(videoReceiver)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a receiver via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { post : videoReceiver });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

serverTest("Create and delete a receiver and get a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/receivers",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(device),
      regAPI.putResource(videoSource),
      regAPI.putResource(videoFlow),
      regAPI.putResource(videoSender),
      regAPI.putResource(videoReceiver)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a receiver via the registration API.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return regAPI.deleteResource(videoReceiver.id, 'receiver');
  })
  .then(function (deleted) {
    t.ok(deleted, 'deletes a receiver via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { pre : videoReceiver });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close();
    done()
  });
});

serverTest("Check rate limit of a websocket message",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  var firstTime = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/nodes",
    params: {},
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return regAPI.putResource(node1);
  })
  .then(function (putted) {
    t.ok(putted, 'creates a node via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    firstTime = Date.now();
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { post : node1 });
  })
  .then(function () {
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(node2)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'resource put and replaced in quick succession.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    t.ok(Date.now() - firstTime >= 100, 'messages are more than 100ms apart.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, [
      { pre : node1, post : node1 },
      { pre : node1, post : node2 }
    ]);
  })
  .catch(t.fail)
  .finally(function () {
    ws.close(console.log);
    done()
  });
});

serverTest("Create a node and filter by params",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/nodes",
    params: {
      "label" : "Smashing Pumpkins"
    },
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(node2)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates and replaces a node via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { pre: node1, post : node2 });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close(console.log);
    done()
  });
});

serverTest("Create a node and filter by two params",
    function (t, store, server, regAPI, done) {
  var ws = null;
  var sub = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/nodes",
    params: {
      "label" : "Smashing Pumpkins",
      "hostname" : "hopper"
    },
    persist: false
  })
  .then(function (subm) {
    sub = subm;
    t.ok(sub, 'creates subscription and gets details.');
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.once('open', resolve);
      ws.once('error', reject);
    });
  })
  .then(function () {
    t.pass('creates an open a web socket.');
    return Promise.all([
      regAPI.putResource(node1),
      regAPI.putResource(node2)
    ]);
  })
  .then(function (putted) {
    t.ok(putted, 'creates and replaces a node via the registration API.');
    return new Promise(function (resolve, reject) {
      ws.once('message', resolve);
      ws.once('error', reject);
    });
  })
  .then(function (message) {
    t.ok(message, 'receives a websocket message.');
    var event = JSON.parse(message);
    checkGrain(t, event, sub, { pre: node1, post : node2 });
  })
  .catch(t.fail)
  .finally(function () {
    ws.close(console.log);
    done()
  });
});
