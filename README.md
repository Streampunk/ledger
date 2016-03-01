# Ledger

Ledger is a [Node.js](http://nodejs.org/) Javascript implementation of the [Advanced Media Workflow Association's](http://www.amwa.tv/) [Networked Media Open Specifications](http://github.com/AMWA-TV/nmos) discovery and registration APIs.

Currently, this is a fairly complete implementation of the node, registration and query APIs. (Work on the support of the peer-to-peer API is still in progress.)

## Installation

Install [Node.js](http://nodejs.org/) for your platform. This software has been developed against the long term stable (LTS) release.

Ledger can be run as a standalone registration application and query API or `require`d to use from your own application, such as to create an instance of a Node API to represent local devices.

### Standalone registration

To install the standalone registration application as a global application:

    npm install -g nmos-ledger

Once installed, to run a combined registration and query API over the same memory-resident store:

    nmos-ledger

The following is a example of configuring properties such as port numbers, DNS-SD service names and service priority:

    nmos-ledger queryPort=4000 registrationPort=4001 queryName=qi queryPri=10

### Install as a local dependency

To install ledger for use in you own application, such as when implementing a node, use npm as follows:

    npm install --save nmos-ledger

## Using ledger

To use ledger as the Node API for your own application, `require` the module, create a store, create a server and start the API.

```javascript
var ledger = require('nmos-ledger');
var node = new ledger.Node(null, null, "Ledger Node", "http://ledger.local:3000",
  "ledger");
var store = new ledger.NodeRAMStore(node);
var nodeAPI = new ledger.NodeAPI(3000, store);
nodeAPI.init().start();
```

This starts a node API on port `3000` and starts the process of finding and registering the node with registration services discovered via mDNS (zeroconf). The parameters to the node constructor are:

* First `null` results in the generation of a pseudo-random UUID to identify the node.
* Second `null` causes the store to generate a version timestamp representing now.
* `"Ledger Node"` is the node's `label`.
* `"http://ledger.local:3000"` is the `href` that can be used to access the node.
* `"ledger"` is the `hostname` property of the node.

Ledger comes with one store implementation (for now), the `NodeRAMStore`. To create one for the NodeAPI, pass in a node that will be the `.../self` description of the node.

The API is created with a given port number and store. The API can be stopped with `.stop()`:

```javascript
nodeAPI.stop();
```

### Node API lifecycle

During the lifetime of the node represented by the Node API, devices, sources, senders, receivers and flows - known as the _resources_ - will need to be added and removed from the node. The store is an immutable value and so to do this, it is necessary to read the current value for the store and then replace the currently represented store. Here is an example of adding a device:

```javascript
var device = new Device(null, null, "My Device", null, node.id);
nodeAPI.getStore().putDevice(device, function (e, d, s) {
  if (e) return console.error(e);
  nodeAPI.setStore(s);
});
```

To simplify working with the asynchronous store, you can work with the [async module](https://www.npmjs.com/package/async), e.g.:

```javascript
var async = require('async');
function fillStore(store, filled) {
  async.waterfall([
    function (cb) { s.putDevice(device, cb); },
    function (d, s, cb) { s.putSource(videoSource, cb); },
    function (v, s, cb) { s.putSource(audioSource, cb); },
    function (a, s, cb) { s.putFlow(videoFlow, cb); },
    function (v, s, cb) { s.putFlow(audioFlow, cb); },
    function (a, s, cb) { s.putSender(videoSender, cb); },
    function (v, s, cb) { s.putSender(audioSender, cb); },
    function (a, s, cb) { s.putReceiver(videoReceiver, cb); },
    function (v, s, cb) { s.putReceiver(audioReceiver, cb); }
  ], function (e, x, result) { return filled(e, result); });
}
fillStore(nodeAPI.getStore(), function (e, s) {
  if (!e) nodeAPI.setStore(s);
});
```

The order of adding resources is important as referential integrity checks are carried out. For example, the `device_id` property of a source must reference a device that is already stored.

The store supports get_resource_, get_resource_s (listing collections), put_resource_ and delete_resource_ methods for each resource type. For example, for senders the store has methods `getSender`, `getSenders`, `putSender` and `deleteSender`.

## Extra features

The API has some features that are not specified in the NMOS documentation. These include:

* Filter collection results by property-scoped regular expressions as query parameters, e.g. `.../receivers?format=audio` finds all receivers with a `format` property containing (matching regular expression) `audio`.
* Paginate the listing of collections using `limit` and `skip` query parameters, where `limit` is the number of results per page and `skip` is how many elements to skip before starting to list.

## Documentation

JsDoc API documentation can be found in the `docs` folder. Details of the APIs are available via the [AMWA NMOS github repository](http://github.com/AMWA-TV/nmos).

## Status, support and further development

Registered information is stored in memory and is lost when the application fails. The software has been designed to so that it will be possible to add extra stores, such as those backed by files or a database, in the future.

Although the architecture of ledger is such that it could be used at scale in production environments, development is not yet complete. In its current state, it is recommended that this software is used in development environments and for building prototypes. Future development will make this more appropriate for production use.

Contributions can be made via pull requests and will be considered by the author on their merits. Enhancement requests and bug reports should be raised as github issues. For support, please contact [Streampunk Media](http://www.streampunk.media/).

## License

This software is released under the Apache 2.0 license. Copyright 2016 Christine S MacNeill.
