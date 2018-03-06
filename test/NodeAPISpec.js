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

// Test the node API.

// TODO tests of pagination features.

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
var testPort = Math.random() * 32768|0 + 32768;
var node = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "none");
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

serverTest('The server reports its root path (slash)', node,
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

serverTest('The server reports its root path (no slash)', node,
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

serverTest('The server reports its api type (slash)', node,
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

serverTest('The server reports its api type (no slash)', node,
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

serverTest('The server reports its version (slash)', node,
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/node/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['v1.0/', 'v1.1/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its version (no slash)', node,
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/node'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['v1.0/', 'v1.1/']), 'and it is as expected.');
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

serverTest('The server reports its resources (slash)', node,
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

serverTest('The server reports its resources (no slash)', node,
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

serverTest('The server reports an error for an incorrect short path', node,
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

serverTest('The server reports an error for an incorrect long path', node,
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
  serverTest(`Where no ${r} are registered (with slash)`, node,
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
  serverTest(`Where no ${r.slice(0, -1)} are registered (no slash)`, node,
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
  serverTest(`Where no ${r.slice(0, -1)} are registered (no slash)`, node,
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
  serverTest(`Where no ${r.slice(0, -1)} are registered (no slash)`, node,
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
    // console.log(res.headers);
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
var videoSource = new Source(null, null, "Garish Punk", "Will you turn it down!!",
  ledger.formats.video, null, null, device.id);
var audioSource = new Source(null, null, "Noisy Punk", "What do you look like!!",
  ledger.formats.audio, null, null, device.id);
var audioFlow = new Flow(null, null, "Funk Punk", "Blasting at you, punk!",
  ledger.formats.audio, null, audioSource.id);
var videoFlow = new Flow(null, null, "Junk Punk", "You looking at me, punk?",
  ledger.formats.video, null, videoSource.id);
var audioSender = new Sender(null, null, "Listen Up Punk",
  "Should have listened to your Mother!", audioFlow.id,
  ledger.transports.rtp_mcast, device.id, "http://tereshkova.local/audio.sdp");
var videoSender = new Sender(null, null, "In Ya Face Punk",
  "What do you look like?", videoFlow.id,
  ledger.transports.rtp_mcast, device.id, "http://tereshkova.local/video.sdp");
var audioReceiver = new Receiver(null, null, "Say It Punk?",
  "You talking to me?", ledger.formats.audio, null, null, device.id,
  ledger.transports.rtp_mcast);
var videoReceiver = new Receiver(null, null, "Watching da Punks",
  "Looking hot, punk!", ledger.formats.video, null, null, device.id,
  ledger.transports.rtp_mcast);

function fillStore(store, filled) {
  async.waterfall([
      function (cb) { store.putDevice(device, cb); },
      function (x, cb) { x.store.putSource(videoSource, cb); },
      function (x, cb) { x.store.putSource(audioSource, cb); },
      function (x, cb) { x.store.putFlow(videoFlow, cb); },
      function (x, cb) { x.store.putFlow(audioFlow, cb); },
      function (x, cb) { x.store.putSender(videoSender, cb); },
      function (x, cb) { x.store.putSender(audioSender, cb); },
      function (x, cb) { x.store.putReceiver(videoReceiver, cb); },
      function (x, cb) { x.store.putReceiver(audioReceiver, cb); }
    ], function (e, result) { return filled(e, result.store); });
}

serverTest('Retrieving devices (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var d = s.devices[Object.keys(s.devices)[0]]
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/devices/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "1", 'size header is 1.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "1", 'total header is 1.');
        res.on('data', function (chunk) {
          // console.log(s.devices);
          t.deepEqual(JSON.parse(chunk.toString()), [d], 'matches the expected value.');
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
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var d = s.devices[Object.keys(s.devices)[0]]
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/devices`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "1", 'size header is 1.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "1", 'total header is 1.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), [d], 'matches the expected value.');
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
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var d = s.devices[Object.keys(s.devices)[0]]
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/devices/${device.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), d, 'matches the expected value.');
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
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var d = s.devices[Object.keys(s.devices)[0]]
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/devices/${device.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), d, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving sources (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var srcs = Object.keys(s.sources).map(function (x) { return s.sources[x]; });
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/sources/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "2", 'size header is 2.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "2", 'total header is 2.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), srcs, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving sources (no slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var srcs = Object.keys(s.sources).map(function (x) { return s.sources[x]; });
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/sources`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), srcs, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the video source (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/sources/${videoSource.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.sources[videoSource.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the video source (no slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/sources/${videoSource.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.sources[videoSource.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving flows (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var flws = Object.keys(s.flows).map(function (x) { return s.flows[x]; });
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/flows/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), flws, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving flows (no slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var flws = Object.keys(s.flows).map(function (x) { return s.flows[x]; });
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/flows`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), flws, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio flow (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/flows/${audioFlow.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.flows[audioFlow.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio flow (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/flows/${audioFlow.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.flows[audioFlow.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving senders (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var snds = Object.keys(s.senders).map(function (x) { return s.senders[x]; });
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/senders/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), snds, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving senders (no slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var snds = Object.keys(s.senders).map(function (x) { return s.senders[x]; });
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/senders`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), snds, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the video sender (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/senders/${videoSender.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.senders[videoSender.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the video sender (no slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/senders/${videoSender.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.senders[videoSender.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving receivers (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var rcvs = Object.keys(s.receivers).map(function (x) { return s.receivers[x]; });
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/receivers/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), rcvs, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving receivers (no slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var rcvs = Object.keys(s.receivers).map(function (x) { return s.receivers[x]; });
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/receivers`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), rcvs, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio receiver (with slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/receivers/${audioReceiver.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.receivers[audioReceiver.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio receiver (no slash)', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      http.get({ port : testPort, path : `/x-nmos/node/v1.0/receivers/${audioReceiver.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.receivers[audioReceiver.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

var subscribeToSender = `{
    "description": "LCH Studio GoPro HD",
    "label": "LCH Studio GoPro HD",
    "manifest_href": "http://172.29.176.142:12345/x-nmos/node/v1.0/self/pipelinemanager/run/pipeline/1/pipel/ipp_rtptx0c6d/misc/sdp/",
    "flow_id": "84f1a535-748b-457c-a25f-49d6691bab30",
    "id": "72af8f63-15ad-4ec2-8a22-363b4a094fee",
    "version": "1455646074:437653635",
    "transport": "urn:x-nmos:transport:rtp.mcast",
    "device_id": "2b9ad611-da45-4175-b091-41577f09f15f"
}`;

serverTest('Subscribing receiver to sender', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var subscribeReq = http.request({
        port : testPort,
        path : `/x-nmos/node/v1.0/receivers/${videoReceiver.id}/target`,
        method : 'PUT',
        headers : {
          'Content-Type' : 'application/json',
          'Content-Length' : subscribeToSender.length
        }
      }, function (res) {
        t.equals(res.statusCode, 202, 'produces a 202 Accepted error code.');
        res.setEncoding('utf8');
        res.on('data', function (result) {
          t.deepEqual(Sender.prototype.parse(result.toString()),
            Sender.prototype.parse(subscribeToSender), 'returns what is sent.');
        });
        res.on('end', function () {
          http.get({
              port : testPort,
              path : `/x-nmos/node/v1.0/receivers/${videoReceiver.id}`
          }, function (res) {
            t.equal(res.statusCode, 200, 'subsequent retrieve has status code 200.');
            res.on('data', function (chunk) {
              t.equal(JSON.parse(chunk.toString()).subscription.sender_id,
                '72af8f63-15ad-4ec2-8a22-363b4a094fee',
                'updates the "subscription.sender_id".');
              done();
            });
          }).on('error', function (e) {
            t.fail(e); done();
          });
        });
      });
      subscribeReq.write(subscribeToSender);
      subscribeReq.end();
    }
  });
});

serverTest('Unsubscribing receiver from sender', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var subscribeReq = http.request({
        port : testPort,
        path : `/x-nmos/node/v1.0/receivers/${videoReceiver.id}/target`,
        method : 'PUT',
        headers : {
          'Content-Type' : 'application/json',
          'Content-Length' : subscribeToSender.length
        }
      }, function (res) {
        t.equals(res.statusCode, 202, 'produces a 202 Accepted error code.');
        res.setEncoding('utf8');
        res.on('data', function (result) {
          t.deepEqual(Sender.prototype.parse(result.toString()),
            Sender.prototype.parse(subscribeToSender), 'returns what is sent.');
        });
        res.on('end', function () {
          var unsubscribeBody = JSON.stringify({});
          var unsubscribeReq = http.request({
            port : testPort,
            path : `/x-nmos/node/v1.0/receivers/${videoReceiver.id}/target`,
            method : 'PUT',
            headers : {
              'Content-Type' : 'application/json',
              'Content-Length' : unsubscribeBody.length
            }
          }, function (res) {
            t.equals(res.statusCode, 202, 'produces a 202 Accepted error code.');
            res.setEncoding('utf8');
            res.on('data', function (result) {
              t.deepEqual(JSON.parse(result), {}, 'returns what is sent.');
            });
            res.on('end', function () {
              http.get({
                  port : testPort,
                  path : `/x-nmos/node/v1.0/receivers/${videoReceiver.id}`
              }, function (res) {
                t.equal(res.statusCode, 200, 'subsequent retrieve has status code 200.');
                res.on('data', function (chunk) {
                  t.equal(JSON.parse(chunk.toString()).subscription.sender_id,
                    null, 'sets the "subscription.sender_id" to null.');
                  done();
                });
              }).on('error', function (e) {
                t.fail(e); done();
              });
            });
          });
          unsubscribeReq.write(unsubscribeBody);
          unsubscribeReq.end();
        });
      });
      subscribeReq.write(subscribeToSender);
      subscribeReq.end();
    }
  });
});

serverTest('Subscribing receiver to sender with wrong transport', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    var brokenSender = subscribeToSender.replace(
      /urn:x-nmos:transport:rtp\.mcast/,
      "urn:x-nmos:transport:rtp");
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var subscribeReq = http.request({
        port : testPort,
        path : `/x-nmos/node/v1.0/receivers/${videoReceiver.id}/target`,
        method : 'PUT',
        headers : {
          'Content-Type' : 'application/json',
          'Content-Length' : brokenSender.length
        }
      }, function (res) {
        t.equals(res.statusCode, 400, 'produces a 400 Bad Request error code.');
        res.setEncoding('utf8');
        res.on('data', function (result) {
          var error = JSON.parse(result.toString())
          t.equal(error.code, 400, 'error message has correct code.');
          t.equal(error.error,
            'Cannot subscribe a receiver to a sender with different transport types.',
            'error message is as expected.');
        });
        res.on('end', done);
      });

      subscribeReq.write(brokenSender);
      subscribeReq.end();
    }
  });
});

serverTest('Subscribing receiver to sender with bad sender', node,
    function (t, node, store, server, done) {
  fillStore(store, function (e, s) {
    var brokenSender = subscribeToSender.substring(13);
    if (e) { t.fail(e); }
    else {
      server.setStore(s);
      var subscribeReq = http.request({
        port : testPort,
        path : `/x-nmos/node/v1.0/receivers/${videoReceiver.id}/target`,
        method : 'PUT',
        headers : {
          'Content-Type' : 'application/json',
          'Content-Length' : brokenSender.length
        }
      }, function (res) {
        t.equals(res.statusCode, 400, 'produces a 400 Bad Request error code.');
        res.setEncoding('utf8');
        res.on('data', function (result) {
          var error = JSON.parse(result.toString())
          t.equal(error.code, 400, 'error message has correct code.');
          t.equal(error.error,
            'Unexpected token p in JSON at position 0',
            'error message is as expected.');
        });
        res.on('end', done);
      });

      subscribeReq.write(brokenSender);
      subscribeReq.end();
    }
  });
});

serverTest('Serving an SDP file', node,
    function (t, node, store, server, done) {
  var senderID = uuid.v4();
  server.putSDP(senderID, 'Test SDP');
  http.get({ port : testPort, path : `/sdp/${senderID}.sdp`}, function (res) {
    t.equal(res.statusCode, 200, 'has the expected status code.');
    t.equal(res.headers['content-type'], 'application/sdp',
      'has the SDP MIME type.');
    t.equal(+res.headers['content-length'], 8,
      'has the expected length.');
    res.setEncoding('utf8');
    res.on('data', function (result) {
      t.equal(result, 'Test SDP', 'has the expected body.');
    });
    res.on('error', t.fail);
    res.on('end', done);
  });
});

serverTest('Accessing an SDP file that does not exist', node,
    function (t, node, store, server, done) {
  http.get({ port : testPort, path : `/sdp/${uuid.v4()}.sdp`}, function (res) {
    t.equal(res.statusCode, 404, 'has the expected status code.');
    res.on('error', t.fail);
    done();
  });
});

serverTest('Deleting an SDP file', node,
    function (t, node, store, server, done) {
  var senderID = uuid.v4();
  server.putSDP(senderID, 'Test SDP');
  t.notOk(server.deleteSDP(uuid.v4()), 'fails to delete unknown ID.');
  t.ok(server.deleteSDP(senderID), 'reports successful delete.');
  http.get({ port : testPort, path : `/sdp/${senderID}.sdp`}, function (res) {
    t.equal(res.statusCode, 404, 'has the expected status code.');
    res.on('error', t.fail);
    done();
  });
});

// More detailed tests of event generation with the registration API.
serverTest('Checking event on post', node,
    function (t, node, store, server, done) {
  var event = null;
  server.on('modify', function (ev) { event = ev; });
  server.putResource(device).then(function () {
    t.ok(event, 'event has been received.');
    t.equal(event.topic, '/devices/', 'event has expected topic.');
    var data = event.data[0];
    t.equal(data.path, device.id, 'event data has expected path.');
    t.ok(typeof data.pre === 'undefined', 'event has no previous.');
    t.deepEqual(data.post, device, 'event carried the posted device.');
    done();
  })
  .catch(function (e) {
    t.fail(e);
    done();
  });
});

serverTest('Checking event on delete', node,
    function (t, node, store, server, done) {
  var event = null;
  server.on('modify', function (ev) { event = ev; });
  server.putResource(device)
  .then(function () {
    return server.deleteResource(device.id, 'device');
  }).then(function () {
    t.ok(event, 'event has been received.');
    t.equal(event.topic, '/devices/', 'event has expected topic.');
    var data = event.data[0];
    t.equal(data.path, device.id, 'event data has expected path.');
    t.deepEqual(data.pre, device, 'event has expected previous.');
    t.ok(typeof data.post === 'undefined', 'event has no post value.');
    done();
  })
  .catch(function (e) {
    t.fail(e);
    done();
  });
});
