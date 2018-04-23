[![CircleCI](https://circleci.com/gh/Streampunk/ledger.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/Streampunk/ledger)
# Ledger

Ledger is a [Node.js](http://nodejs.org/) Javascript implementation of the [Advanced Media Workflow Association's](http://www.amwa.tv/) [Networked Media Open Specifications](http://www.nmos.tv/) [discovery and registration APIs](https://github.com/AMWA-TV/nmos-discovery-registration) version 1.0.

Currently, this is a fairly complete implementation of the node, registration and query APIs. (Work on the support of the v1.1 changes and the peer-to-peer API is still in progress.)

## Installation

Install [Node.js](http://nodejs.org/) for your platform. This software has been developed against the long term stable (LTS) release.

Make sure `git` is installed for your system. This is because the current version of ledger depends on a fork of the [mdns-js](https://github.com/mdns-js/node-mdns-js) library, created by the authors of ledger to fix a bug, rather than the version published to NPM. A pull request is in progress.

Ledger can be run as a standalone registration application and query API or `require`d to use from your own application, such as to create an instance of a Node API to represent local devices.

### Standalone registration

To install the standalone registration application as a global application:

    npm install -g nmos-ledger

Once installed, to run a combined registration and query API over the same memory-resident store:

    nmos-ledger

The following is a example of configuring properties such as port numbers, DNS-SD service names and service priority:

    nmos-ledger queryPort=4000 registrationPort=4001 queryName=qi queryPri=10

It is also possible to bind the HTTP interfaces to a specific interface:

    nmos-ledger iface=192.168.42.42

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

During the lifetime of the node represented by the Node API, devices, sources, senders, receivers and flows - known as the _resources_ - will need to be added and removed from the node. Do not try to interact with the underlying store directly. The Node API provides methods for non-blocking, safe, serialized access for updating of the store via the `getResource`, `getResources`, `putResource` and `deleteResource` methods. For example:


```javascript
var device = new Device(null, null, "My Device", null, node.id);
nodeAPI.putResource(device).catch(console.error);
nodeAPI.getResource(device.id, 'device', function (err, result) {
  if (err) return console.error(err);
  assert.deepEqual(result, device);
  // ...
});
```

These four resource-related methods work in one of two ways:

1. If provided with a callback function as the last argument, then the methods follow the standard pattern of the callback functions first argument being an error and the second argument being the successful result.
2. With no callback function, the methods return a [promise](https://www.promisejs.org/) and the result returned can be processed with `.then`, `.done`, `.catch` and `.finally`.

The order of adding resources is important as referential integrity checks are carried out. For example, the `device_id` property of a source must reference a device that is already stored.

Updates and reads via the resource methods are sequential in the order in which requests are made to the Node API. For reasons of efficiency, reads via the HTTP REST API rather than the Javascript API do not block and wait for the update. A put request for a resource followed in time with a get request for the same resource should safely retrieve that resource. Other requests to change the store may be interleaved. Here are some further examples:

```javascript
nodeAPI.putResource(device).catch(console.error);
nodeAPI.putResource(videSource).then(console.log, console.error);
nodeAPI.putResource(videoFlow).catch(console.error);
nodeAPI.getResources('source').then(function (srcs) {
  console.log('Current sources are:');
  srcs.map(function (s) { return s.label; }).forEach(console.log);
});
nodeAPI.deleteResource(videoSource.id, 'source');
nodeAPI.getResource(videoSource.id, 'source').then(function (onResolved) {
  console.error('Video source was not removed as expected.');
}, function (onRejection) {
  console.log('Video source deleted as expected.');
});
```

Reading and updating the _self_ node is achieved using the `getSelf` and `putSelf` methods respectively.

The previously recommended methods of `getStore` and `setStore` have been deprecated.

### Modify events

The node NodeAPI, QueryAPI and RegistrationAPI are Node.js event emitters that
create `modify` events whenever a resource on the underlying store is modified.
The events that are sent are similar to the grain sub-objects documented for the
[QueryAPI websockets](https://github.com/AMWA-TV/nmos-discovery-registration/blob/master/docs/4.2.%20Behaviour%20-%20Querying.md). For example, Javascript:

```javascript
nodeAPI.on('modify', console.log);
nodeAPI.putResource(device).catch(console.error);
```

... will produce the following output on the console if the device is successfully
created:

```javascript
{ topic: '/devices/',
  data: [ { path: 'cfe6803a-70df-44f1-b3b0-9b78b94b2f02', pre: [Object] } ] }
```

## Websocket notifications

[Websocket](https://tools.ietf.org/html/rfc6455) notifications are now supported
by ledger as described in the [QueryAPI websocket](https://github.com/AMWA-TV/nmos-discovery-registration/blob/master/docs/4.2.%20Behaviour%20-%20Querying.md) documentation. The implementation has been tested with
the Node.js [ws](https://www.npmjs.com/package/ws) package.

## Extra features

The API has some features that are not specified in the NMOS documentation. These include:

* Filter collection results by property-scoped regular expressions as query parameters, e.g. `.../receivers?format=audio` finds all receivers with a `format` property containing (matching regular expression) `audio`.
* Paginate the listing of collections using `limit` and `skip` query parameters, where `limit` is the number of results per page and `skip` is how many elements to skip before starting to list.

## Documentation

JsDoc API documentation can be found in the `docs` folder. Details of the APIs are available via the [AMWA NMOS discovery and registration github repository](https://github.com/AMWA-TV/nmos-discovery-registration).

## Status, support and further development

Registered information is stored in memory and is lost when the application fails. The software has been designed to so that it will be possible to add extra stores, such as those backed by files or a database, in the future.

Although the architecture of ledger is such that it could be used at scale in production environments, development is not yet complete. In its current state, it is recommended that this software is used in development environments and for building prototypes. Future development will make this more appropriate for production use.

Contributions can be made via pull requests and will be considered by the author on their merits. Enhancement requests and bug reports should be raised as github issues. For support, please contact [Streampunk Media](http://www.streampunk.media/). For updates follow (@StrmPunkd)[https://twitter.com/StrmPunkd] on Twitter.

## License

This software is released under the Apache 2.0 license. Copyright 2016 Streampunk Media Ltd.
