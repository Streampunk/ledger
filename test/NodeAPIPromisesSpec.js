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

var test = require('tape');
var http = require('http');
var uuid = require('uuid');
var async = require('async');
var ledger = require('../index.js');
var Promise = require('promise');

var Node = ledger.Node;
var Device = ledger.Device;
var Source = ledger.Source;
var Flow = ledger.Flow;
var Sender = ledger.Sender;
var Receiver = ledger.Receiver;
var testPort = 3210;

var node = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");
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

var testResources = [device, videoSource, audioSource, audioFlow, videoFlow,
  audioSender, videoSender, audioReceiver, videoReceiver];

function promiseTest(description, fn) {
  test(description, function (t) {
    var store = new ledger.NodeRAMStore(node);
    var api = new ledger.NodeAPI(testPort, store);
    fn(t, api);
  });
}

for ( var i = 0 ; i < testResources.length ; i++) {
  (function () {
    var context = testResources.slice(0, i);
    var r = testResources[i];
    var name = r.constructor.name.toLowerCase();
    promiseTest(`Adding ${name} with a promise`, function (t, api) {
      context.forEach(function (x) { api.putResource(x).catch(t.end); });
      api.putResource(r).then(function (x) {
        t.deepEqual(x, r, 'has created the expected value.');
        t.end();
      }, function (e) {
        t.end(`produces and error: ${e}`);
      });
    });

    promiseTest(`Adding a ${name} with a nodeified callback`, function (t, api) {
      context.forEach(function (x) { api.putResource(x).catch(t.end); });
      api.putResource(r, function (err, result) {
        if (err) return t.end(`produces an error: ${e}`);
        t.deepEqual(result, r, 'has created the expected value.');
        t.end();
      });
    });

    promiseTest(`Retrieving a ${name} via a promise`, function (t, api) {
      context.forEach(function (x) { api.putResource(x).catch(t.end); });
      api.putResource(r).catch(t.end);
      api.getResource(r.id, name).then(function (x) {
        t.deepEqual(x, r, 'has the expected result.');
        t.end();
      }, function (e) {
        t.end(`produces an error: ${e}`);
      });
    });

    promiseTest(`Retrieving a ${name} via a callback`, function (t, api) {
      context.forEach(function (x) { api.putResource(x).catch(t.end); });
      api.putResource(r).catch(t.end);
      api.getResource(r.id, name, function (err, result) {
        if (err) return t.fail(`produces an error: ${e}`);
        t.deepEqual(result, r, 'has the exptected result.');
        t.end();
      });
    });

    promiseTest(`Retrieve a ${name} with no type`, function (t, api) {
      context.forEach(function (x) { api.putResource(x).catch(t.end); });
      api.putResource(r).catch(t.end);
      t.plan(2);
      api.getResource(r.id).then(function (x) {
        t.deepEqual(x, r, 'has the expected result with a known id.');
      }, function (e) {
        t.fail(`produces an error: ${e}`);
      });
      api.getResource(uuid.v4()).then(function (d) {
        t.fail('should fail with a random id and it succeeded.');
      }, function (e) {
        t.equal(e.message, "Could not find a resource with the given identifier.",
          'errors with a random id as expected.');
      });
    });

    promiseTest(`Getting a list of ${name}s`, function (t, api) {
      context.forEach(function (x) { api.putResource(x).catch(t.end); });
      api.putResource(r).catch(t.end);
      Promise.all([
        api.getResources(name).then(function (devs) {
          var expected = context.concat([r]).filter(function (x) {
            return x.constructor.name.toLowerCase() === name;
          });
          t.equal(devs.length, expected.length, 'has the expected length.');
          expected.forEach(function (x) {
            t.ok(devs.some(function (y) { return x.id === y.id }),
              `has ${name} with id ${x.id}.`);
          });
        }, t.fail),
        api.getResources(name + 's').then(function (devs) {
          var expected = context.concat([r]).filter(function (x) {
            return x.constructor.name.toLowerCase() === name;
          });
          t.equal(devs.length, expected.length, 'with plural name has the expected length.');
          expected.forEach(function (x) {
            t.ok(devs.some(function (y) { return x.id === y.id }),
              `with plural name has ${name} with id ${x.id}.`);
          });
        }, t.fail)
      ]).finally(t.end);
    });

    promiseTest(`Deleting a ${name} with promises`, function (t, api) {
      context.forEach(function (x) { api.putResource(x).catch(t.end); });
      api.putResource(r).catch(t.end);
      t.plan(4);
      api.getResource(r.id, name).then(function (x) {
        t.deepEqual(x, r, 'starts with the device stored.')
      }, t.fail);
      api.deleteResource(r.id, name).then(function (xid) {
         t.deepEqual(xid, r.id, 'successful delete and retrieve.');
      }, t.fail);
      api.getResource(r.id, name).then(function (x) {
        t.fail('still remains in the store at the end.')
      }, function (e) {
        t.pass(`is not found after deletion: ${e}`);
      });
      api.deleteResource(uuid.v4(), name).then(function (x) {
        t.fail('with a random id delete should not succeed.');
      }, function (e) {
        t.pass('should fail with a random id.');
      });
    });

    promiseTest(`Deleting a ${name} with callbacks`, function (t, api) {
      context.forEach(function (x) { api.putResource(x).catch(t.end); });
      api.putResource(r).catch(t.end);
      t.plan(4);
      api.getResource(r.id, name, function (e, x) {
        if (e) return t.fail(e);
        t.deepEqual(x, r, 'starts with the device stored.')
      });
      api.deleteResource(r.id, name, function (e, xid) {
        if (e) return t.fail(e);
        t.deepEqual(xid, r.id, 'successful delete and id check.');
      });
      api.getResource(r.id, name, function (e, x) {
        if (e) return t.pass(`is not found after deletion: ${e}`);
        t.fail('still remains in the store at the end.')
      });
      api.deleteResource(uuid.v4(), name, function (e, x) {
        if (e) return t.pass('should fail with a random id.');
        t.fail('with a random id delete should not succeed.');
      });
    });
  })();
} // end testResources loop

promiseTest('Put ten devices and retrieve', function (t, api) {
  var pushy = [];
  for ( var x = 0 ; x < 10 ; x++) {
    pushy.push(api.putResource(new Device(null, null, `Punk numero ${x}`, null, node.id)));
  }
  Promise.all(pushy).catch(t.fail);
  api.getResources('device').then(function (devs) {
    t.equal(devs.length, 10, 'has the expected length.');
    t.end();
  }, t.end);
});

promiseTest('Getting a list of resources for an unknown type', function (t, api) {
  api.getResources('wibble').then(function (onSuccess) {
    t.end(`should have failed. Actually produced: ${success}`);
  }, function (e) {
    t.deepEqual(e, new Error("Type is not a string or a known type."),
      `fails as expected with error: ${e}`);
    t.end();
  });
});

promiseTest('Putting a bad device', function (t, api) {
  api.putResource(new Device()).then(function (d) {
    t.end('should not have succeeded');
  }, function (e) {
    t.equal(e.message, 'Device node_id property must reference this node.',
      `produces eexpected error: ${e.message}`);
    t.end();
  });
});

promiseTest('Deleting with a bad type name', function (t, api) {
  api.putResource(device).catch(t.end);
  api.deleteResource(device.id, 'wibble').then(function (x) {
    t.end('should not succeed.');
  }, function (e) {
    t.pass(`fails as expected with error: ${e}`);
    t.end();
  });
});

promiseTest('Can retrieve details of self', function (t, api) {
  t.plan(2);
  api.getSelf().then(function (x) {
    t.deepEqual(x, node, 'and value is as expected via promise.')
  }, function (e) {
    t.fail('failed via promise.');
  });
  api.getSelf(function (err, result) {
    if (err) return t.fail('failed via callback request.')
    t.deepEqual(result, node, 'and value is as expected via callback.');
  });
});

promiseTest('Can alter details of self via promise', function (t, api) {
  t.plan(2);
  var replacementNode = new Node(node.id, null, "Replacement!",
    "http://tereshkova.local:3000", "tereshkova");
  api.putSelf(replacementNode).then(function (x) {
    t.deepEqual(x, replacementNode, 'returns with matching result.');
  }, function (onRejection) {
    t.fail(`fails with error: ${onRejection}`);
  });
  api.getSelf().then(function (x) {
    t.deepEqual(x, replacementNode, 'and value is as expected via promise.')
  }, function (e) {
    t.fail('failed via promise.');
  });
});

promiseTest('Can alter details of self via callback', function (t, api) {
  t.plan(2);
  var replacementNode = new Node(node.id, null, "Replacement!",
    "http://tereshkova.local:3000", "tereshkova");
  api.putSelf(replacementNode, function (err, x) {
    if (err) return t.fail(`fails with error: ${err}`);
    t.deepEqual(x, replacementNode, 'returns with matching result.');
  });
  api.getSelf(function (err, x) {
    if (err) return t.fail(`failed via callback: {e}`);
    t.deepEqual(x, replacementNode, 'and value is as expected via promise.')
  });
});

promiseTest('Can update a device and senders/receivers get set', function (t, api) {
  testResources.forEach(function (x) { api.putResource(x).catch(t.end); });
  var deltaDevice = new Device(device.id, null, 'Switched up PUNK!',
    null, node.id);
  t.ok(deltaDevice.senders.length === 0, 'replacement candidate does not have senders.');
  t.ok(deltaDevice.receivers.length === 0, 'repalcement candidate does not have receivers.');
  api.putResource(deltaDevice).then(function (x) {
    t.notDeepEqual(x, deltaDevice, 'devices are not equal.');
    t.ok(x.senders.length === 2, 'returned replacement device has senders.');
    t.ok(x.receivers.length === 2, 'returned replacement device has receivers.');
    t.end()
  }, t.end);
});
