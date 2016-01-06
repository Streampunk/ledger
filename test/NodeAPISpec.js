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

var test = require('tape');
var NodeAPI = require('../api/NodeAPI.js');
var Node = require('../model/Node.js');
var NodeRAMStore = require('../api/NodeRAMStore.js');
var http = require('http');

function serverTest(description, node, fn) {
  test(description, function (t) {
    var store = new NodeRAMStore(node);
    var api = new NodeAPI(3000, store);
    api.init().start(function (e) {
      if (e) {
        t.fail('Failed to start server');
        t.end();
      } else {
        fn(t, node, store, api, function () {
          api.stop(function (e) {
            t.ok(!e, 'shut down server.');
          });
        });
      }
    });
  });
}

serverTest('The server reports its version', new Node(),
    function (t, node, store, server, done) {
  t.plan(2);
  http.get({ port : 3000, path : '/x-ipstudio/node/'}, function (res) {
    test.equal(res.read().toString(), 'v1.0', 'and it is as expected.');
    done();
  });
});
serverTest('The server reports its wibble', new Node(), function (t) {
  t.equal(3, 3, 'wibble!');
});
