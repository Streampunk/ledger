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
var ledger = require('../index.js');

var Node = ledger.Node;
var Device = ledger.Device;
var testPort = 3210;

function serverTest(description, node, fn) {
  test(description, function (t) {
    var store = new ledger.NodeRAMStore(node);
    var api = new ledger.NodeAPI(testPort, store);
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

serverTest('The server reports its root path (no slash)', new Node(),
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : ''}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['x-nmos/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its api type (slash)', new Node(),
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['node/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its api type (no slash)', new Node(),
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['node/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its version (slash)', new Node(),
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/node/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['v1.0/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its version (no slash)', new Node(),
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/node'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['v1.0/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

var baseResponse = [
    "self/",
    "sources/",
    "flows/",
    "devices/",
    "senders/",
    "receivers/"
];

serverTest('The server reports its resources (slash)', new Node(),
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/node/v1.0/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(baseResponse), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its resources (no slash)', new Node(),
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/node/v1.0'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(baseResponse), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports an error for an incorrect short path', new Node(),
    function (t, node, store, server, done) {
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

serverTest('The server reports an error for an incorrect long path', new Node(),
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/node/v1.0/wibble'}, function (res) {
    t.equal(res.statusCode, 404, 'with status code 404.')
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify({
        code : 404,
        error : "Could not find the requested resource '/x-nmos/node/v1.0/wibble'.",
        debug : "/x-nmos/node/v1.0/wibble"}), 'responding with an error.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

baseResponse.slice(1).forEach(function (r) {
  serverTest(`Where no ${r} are registered (with slash)`, new Node(),
      function (t, node, store, server, done) {
    http.get({ port : testPort, path : `/x-nmos/node/v1.0/${r}`}, function (res) {
      t.equal(res.statusCode, 200, 'has status code 200.');
      res.on("data", function (chunk) {
        t.equal(chunk.toString(), JSON.stringify([]), 'responds with an empty array.');
        done();
      });
    }).on('error', function (e) {
      t.fail(e); done();
    });
  });
});

baseResponse.slice(1).forEach(function (r) {
  serverTest(`Where no ${r.slice(0, -1)} are registered (no slash)`, new Node(),
      function (t, node, store, server, done) {
    http.get({ port : testPort, path : `/x-nmos/node/v1.0/${r.slice(0, -1)}`}, function (res) {
      t.equal(res.statusCode, 200, 'has status code 200.');
      res.on("data", function (chunk) {
        t.equal(chunk.toString(), JSON.stringify([]), 'responds with an empty array.');
        done();
      });
    }).on('error', function (e) {
      t.fail(e); done();
    });
  });
});

baseResponse.slice(1).forEach(function (r) {
  serverTest(`Where no ${r.slice(0, -1)} are registered (no slash)`, new Node(),
      function (t, node, store, server, done) {
    http.get({ port : testPort, path : `/x-nmos/node/v1.0/${r}wibble`}, function (res) {
      t.equal(res.statusCode, 400, 'request for .../wibble has status code 400.');
      res.on("data", function (chunk) {
        var error = JSON.parse(chunk.toString());
        t.equal(error.code, 400, 'error message has status code 400.');
        t.equal(error.error, 'Identifier must be a valid UUID.',
          'error must contain a useful message.');
        t.ok(error.debug.length > 0, 'error debug is not empty.');
        done();
      });
    }).on('error', function (e) {
      t.fail(e); done();
    });
  });
});

baseResponse.slice(1).forEach(function (r) {
  var id = uuid.v4();
  serverTest(`Where no ${r.slice(0, -1)} are registered (no slash)`, new Node(),
      function (t, node, store, server, done) {
    http.get({ port : testPort, path : `/x-nmos/node/v1.0/${r}${id}`}, function (res) {
      t.equal(res.statusCode, 404, `request for .../${id} has status code 404.`);
      res.on("data", function (chunk) {
        var error = JSON.parse(chunk.toString());
        t.equal(error.code, 404, 'error message has status code 404.');
        t.ok(error.error.endsWith(`identifier '${id}' could not be found.`),
          'error must contain a useful message.');
        t.ok(error.debug.length > 0, 'error debug is not empty.');
        done();
      });
    }).on('error', function (e) {
      t.fail(e); done();
    });
  });
});

var node = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");
serverTest('Retrieving self via GET (no slash)', node,
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : `/x-nmos/node/v1.0/self`}, function (res) {
    t.equal(res.statusCode, 200, 'has status code 200.');
    res.on('data', function (chunk) {
      t.deepEqual(JSON.parse(chunk.toString()), node, 'matches the expected value.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('Retrieving self via GET (with slash)', node,
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : `/x-nmos/node/v1.0/self/`}, function (res) {
    t.equal(res.statusCode, 200, 'has status code 200.');
    res.on('data', function (chunk) {
      t.deepEqual(JSON.parse(chunk.toString()), node, 'matches the expected value.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('Checking CORS headers using .../self', node,
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : `/x-nmos/node/v1.0/self`}, function (res) {
    t.equal(res.statusCode, 200, 'has status code 200.');
    console.log(res.headers);
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

var device = new Device(null, null, "Dat Punking Ting", null, node.id);
serverTest('Retrieving devices (with slash)', node,
    function (t, node, store, server, done) {
  store.putDevice(device, function (e, d, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/devices/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "1", 'size header is 1.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "1", 'total header is 1.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), [device], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving devices (no slash)', node,
    function (t, node, store, server, done) {
  store.putDevice(device, function (e, d, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/devices`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "1", 'size header is 1.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "1", 'total header is 1.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), [device], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving a device (with slash)', node,
    function (t, node, store, server, done) {
  store.putDevice(device, function (e, d, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/devices/${device.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), device, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving a device (no slash)', node,
    function (t, node, store, server, done) {
  store.putDevice(device, function (e, d, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/devices/${device.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), device, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});
