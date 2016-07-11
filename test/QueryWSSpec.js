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

var node1 = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");
var node2 = new Node(null, null, "Smashing Punkins'", "http://hopper.local:3000",
  "hopper");

serverTest("Smoking", function (t, store, server, regAPI, done) {
  var lastMessage = null;
  var ws = null;
  createSub(server, {
    max_update_rate_ms : 100,
    resource_path: "/nodes",
    params: {},
    persist: false
  })
  .then(function (sub) {
    ws = new WebSocket(sub.ws_href);
    return new Promise(function (resolve, reject) {
      ws.on('open', resolve);
      ws.on('error', reject);
    });
  })
  .then(function () {
    return regAPI.putResource(node1);
  })
  .then(function (putted) {
    return new Promise(function (resolve, reject) {
      ws.on('message', resolve);
      ws.on('error', reject);
    });
  })
  .then(function (message) {
    var event = JSON.parse(message);
    t.equal(event.grain.topic, '/nodes/', 'smokey!');
  })
  .catch(t.fail)
  .finally(done);
});
