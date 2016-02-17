/* Copyright 2016 Christine S. MacNeill

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

// Test the node API.

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
var testPort = 3211;

function serverTest(description, node, fn) {
  test(description, function (t) {
    var store = new ledger.NodeRAMStore(node);
    var api = new ledger.RegistrationAPI(testPort, store);
    api.init().start(function (e) {
      if (e) {
        t.fail('Failed to start server');
        t.end();
      } else {
        fn(t, node, store, api, function () {
          api.stop(function (e) {
            if (e) console.error("Failed to shut down server.");
            t.end();
          });
        });
      }
    });
  });
}

serverTest('The server reports its root path (slash)', new Node(),
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['x-nmos/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});
