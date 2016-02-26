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

// Test the registration API.

var test = require('tape');
var http = require('http');
var uuid = require('uuid');
var async = require('async');
var ledger = require('../index.js');
var getResourceName = require('../api/Util.js').getResourceName;

var Node = ledger.Node;
var Device = ledger.Device;
var Source = ledger.Source;
var Flow = ledger.Flow;
var Sender = ledger.Sender;
var Receiver = ledger.Receiver;
var testPort = 3211;

function serverTest(description, fn) {
  test(description, function (t) {
    var store = new ledger.NodeRAMStore();
    var api = new ledger.RegistrationAPI(testPort, store, 'none');
    api.init().start(function (e) {
      if (e) {
        t.fail('Failed to start server');
        t.end();
      } else {
        fn(t, store, api, function () {
          api.stop(function (e) {
            if (e) console.error("Failed to shut down server.");
            t.end();
          });
        });
      }
    });
  });
}

serverTest('The server reports its root path (slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['x-nmos/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its root path (no slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : ''}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['x-nmos/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its api type (slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['registration/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its api type (no slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['registration/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its version (slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/registration/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['v1.0/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its version (no slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/registration'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['v1.0/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

var baseResponse = [
  'resource/',
  'health/'
];

serverTest('The server reports its resources (slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/registration/v1.0/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(baseResponse), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its resources (no slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/registration/v1.0'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(baseResponse), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports an error for an incorrect short path',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/wibble'}, function (res) {
    t.equal(res.statusCode, 404, 'with status code 404.')
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify({
        code : 404,
        error : "Could not find the requested resource '/x-nmos/wibble'.",
        debug : "/x-nmos/wibble"}), 'responding with an error.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports an error for an incorrect long path',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/registration/v1.0/wibble'}, function (res) {
    t.equal(res.statusCode, 404, 'with status code 404.')
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify({
        code : 404,
        error : "Could not find the requested resource '/x-nmos/registration/v1.0/wibble'.",
        debug : "/x-nmos/registration/v1.0/wibble"}), 'responding with an error.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('Checking CORS headers using base response',
    function (t, store, server, done) {
  http.get({ port : testPort, path : `/x-nmos/registration/v1.0/`}, function (res) {
    t.equal(res.statusCode, 200, 'has status code 200.');
    t.equal(res.headers['access-control-allow-origin'], '*',
      'has Access-Control-Allow-Origin header.');
    t.equal(res.headers['access-control-allow-methods'],
      'GET, PUT, POST, HEAD, OPTIONS, DELETE',
      'has Access-Control-Allow-Methods header.');
    t.equal(res.headers['access-control-allow-headers'], 'Content-Type, Accept',
      'has Access-Control-Allow-Headers header.');
    t.equal(res.headers['access-control-max-age'], '3600',
      'has Access-Control-Max-Age header.');
    done();
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server allows a health status to be posted',
    function (t, store, server, done) {
  var nodeID = uuid.v4();
  var req = http.request({
      port : testPort,
      path : `/x-nmos/registration/v1.0/health/nodes/${nodeID}`,
      method : 'POST',
      headers : {
        'Content-Length' : 0
      }
    }, function (res) {
    t.equal(res.statusCode, 200, 'has an OK response.');
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      var body = JSON.parse(chunk.toString());
      console.log(body);
      t.ok(body.hasOwnProperty('health'), 'result has health property.');
      t.ok(typeof body.health === 'number', 'health result is a number,');
      t.ok(body.health > (Date.now() / 1000|0 - 10), 'health is in the last 10s.');
    });
    res.on('end', done);
  });
  req.end();
});

function postResource(item, t, store, server, status, done) {
  var jsonToPost = JSON.stringify({
    type: getResourceName(item),
    data : item
  });
  var req = http.request({
      port : testPort,
      path : '/x-nmos/registration/v1.0/resource/',
      method : 'POST',
      headers : {
        'Content-Type' : 'application/json',
        'Content-Length' : jsonToPost.length
      }
  }, function (res) {
    t.equal(res.statusCode, status, `with ${status} Created response.`);
    res.setEncoding('utf8');
    t.equal(res.headers.location,
      `/x-nmos/registration/v1.0/resource/${getResourceName(item)}s/${item.id}`,
      'with the expected Location header.');
    res.on('data', function (chunk) {
      // console.log(chunk.toString());
      t.deepEqual(item.parse(chunk.toString()), item,
        "with a response equal to the data that was posted.");
    });
    res.on('end', done);
  });
  req.write(jsonToPost);
  req.end();
}

var node = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");
serverTest('The server allows a node to be created',
    function (t, store, server, done) {
  postResource(node, t, store, server, 201, done);
});

serverTest('The server allows a node to be updated with new version',
    function (t, store, server, done) {
  postResource(node, t, store, server, 201, function () {
    var node2 = node.merge({version : Node.prototype.generateVersion() });
    postResource(node2, t, server.getStore(), server, 200, done);
  });
});

serverTest('The server allows a node to be updated with the same version',
    function (t, store, server, done) {
  async.waterfall([
    function (cb) { postResource(node, t, store, server, 201, cb); },
    function (cb) { postResource(node, t, server.getStore(), server, 200, cb); }
  ], function (err) { if (err) return t.fail(err); done(); });
});

var device = new Device(null, null, "Dat Punking Ting", null, node.id);
serverTest('The server allows a device to be created',
    function (t, store, server, done) {
  async.waterfall([
    function (cb) { postResource(node, t, store, server, 201, cb); },
    function (cb) { postResource(device, t, server.getStore(), server, 201, cb)}
  ], function (err) { if (err) return t.fail(err); done(); });
});

var videoSource = new Source(null, null, "Garish Punk", "Will you turn it down!!",
  ledger.formats.video, null, null, device.id);
serverTest('The server allows a source to be created',
    function (t, store, server, done) {
  async.waterfall([
    function (cb) { postResource(node, t, store, server, 201, cb); },
    function (cb) { postResource(device, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoSource, t, server.getStore(), server, 201, cb)}
  ], function (err) { if (err) return t.fail(err); done(); });
});

var videoFlow = new Flow(null, null, "Junk Punk", "You looking at me, punk?",
  ledger.formats.video, null, videoSource.id);
serverTest('The server allows a flow to be created',
    function (t, store, server, done) {
  async.waterfall([
    function (cb) { postResource(node, t, store, server, 201, cb); },
    function (cb) { postResource(device, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoSource, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoFlow, t, server.getStore(), server, 201, cb)}
  ], function (err) { if (err) return t.fail(err); done(); });
});

var videoSender = new Sender(null, null, "In Ya Face Punk",
  "What do you look like?", videoFlow.id,
  ledger.transports.rtp_mcast, device.id, "http://tereshkova.local/video.sdp");
serverTest('The server allows a sender to be created',
    function (t, store, server, done) {
  async.waterfall([
    function (cb) { postResource(node, t, store, server, 201, cb); },
    function (cb) { postResource(device, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoSource, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoFlow, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoSender, t, server.getStore(), server, 201, cb)}
  ], function (err) { if (err) return t.fail(err); done(); });
});

var videoReceiver = new Receiver(null, null, "Watching da Punks",
  "Looking hot, punk!", ledger.formats.video, null, null, device.id,
  ledger.transports.rtp_mcast);
serverTest('The server allows a receiver to be created',
    function (t, store, server, done) {
  async.waterfall([
    function (cb) { postResource(node, t, store, server, 201, cb); },
    function (cb) { postResource(device, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoSource, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoFlow, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoSender, t, server.getStore(), server, 201, cb)},
    function (cb) { postResource(videoReceiver, t, server.getStore(), server, 201, cb)}
  ], function (err) { if (err) return t.fail(err); done(); });
});

serverTest('The server allows a node to be deleted',
    function (t, store, server, done) {
  postResource(node, t, store, server, 201, function () {
    var req = http.request({
      port : testPort,
      path : `/x-nmos/registration/v1.0/resource/nodes/${node.id}`,
      method : 'DELETE'
    }, function (res) {
      t.equal(res.statusCode, 204, 'with response status code 204 No Content.');
      res.on('data', function (chunky) { t.fail('should not receive a body.'); });
      res.on('end', done);
    });
    req.end();
  });
});

serverTest('The server can retrieve debug details about a node',
    function (t, store, server, done) {
  postResource(node, t, store, server, 201, function () {
    var req = http.get(`/x-nmos/registration/v1.0/resource/nodes/${node.id}`,
        function (res) {
      t.equal(res.statusCode, 200, 'with response status code 200 OK.');
      res.on('data', function (chunky) { console.log(chunky.toString()); });
      res.on('end', done);
    });
  });
});
