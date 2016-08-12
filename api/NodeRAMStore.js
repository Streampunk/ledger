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

/*
 * Conflict resolution strategy is to check at the UI level if the most
 * recent changes goes backwards for the node involved. If yes, through a
 * conflict.
 */
var immutable = require('seamless-immutable');
var NodeStore = require('./NodeStore.js');
var util = require('./Util.js');
var Node = require('../model/Node.js');
var Device = require('../model/Device.js');
var Source = require('../model/Source.js');
var Receiver = require('../model/Receiver.js');
var Sender = require('../model/Sender.js');
var Flow = require('../model/Flow.js');

var statusError = NodeStore.prototype.statusError;

// Check that the skip parameter is withing range, or set defaults
function checkSkip (skip, keys) {
  if (skip && typeof skip === 'string') skip = +skip;
  if (!skip || Number(skip) !== skip || skip % 1 !== 0 ||
      skip < 0)
    skip = 0;
  if (skip > keys.length) skip = keys.length;
  return skip;
}

// Check that the limit parameter is withing range, or set defaults
function checkLimit (limit, keys) {
  if (limit && typeof limit === 'string') limit = +limit;
  if (!limit || Number(limit) !== limit || limit % 1 !== 0 ||
      limit > keys.length)
    limit = keys.length;
  if (limit < 0) limit = 0;
  return limit;
}

function reIndexOf(a, re) {
  for (var x in a) {
    if (a[x].toString().match(re))
      return x;
  }
  return -1;
}

function remove(a, re) {
  var i = reIndexOf(a, re);
  if (i > -1) a.splice(i, 1);
  return a;
}

// Generic get collection methods that returns an ordered sequence of items
function getCollection(items, query, cb, argsLength) {
  var skip = 0, limit = Number.MAX_SAFE_INTEGER;
  setImmediate(function() {
    if (argsLength === 1) {
      cb = query;
    } else {
      skip = (query.skip) ? query.skip : 0;
      limit = (query.limit) ? query.limit : Number.MAX_SAFE_INTEGER;
    }
    var sortedKeys = Object.keys(items);
    var qKeys = remove(remove(Object.keys(query), /skip/), /limit/);
    qKeys.forEach(function (k) {
      try {
        var re = new RegExp(query[k]);
        sortedKeys = sortedKeys.filter(function (l) {
          return items[l][k].toString().match(re);
        });
      } catch (e) {
        console.error(`Problem filtering collection for parameter ${k}.`,
          e.message);
      }
    });
    skip = checkSkip(skip, sortedKeys);
    limit = checkLimit(limit, sortedKeys);
    if (sortedKeys.length === 0 || limit === 0 || skip >= sortedKeys.length) {
      return cb(null, [], sortedKeys.length, 1, 1, 0);
    }
    var pages = Math.ceil(sortedKeys.length / limit);
    var pageOf = Math.ceil(skip / limit) + 1;
    var itemArray = new Array();
    for ( var x = skip ; x < Math.min(skip + limit, sortedKeys.length) ; x++ ) {
      itemArray.push(items[sortedKeys[x]]);
    }
    cb(null, itemArray, sortedKeys.length, pageOf, pages, itemArray.length);
  });
}

function getItem(items, id, cb, argsLength, name) {
  setImmediate(function () {
    if (argsLength !== 2) {
      cb(statusError(400, "Identifier and callback function must be provided."));
    } else if (!id || typeof id !== 'string'){
      // console.log(id);
      cb(statusError(400, "Identifier must be a string value."));
    } else if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/) == null) {
      cb(statusError(400, "Identifier must be a valid UUID."));
    } else {
      var item = items[id];
      if (item) cb(null, item);
      else cb(statusError(404, "A " + name + " with identifier '" + id +
        "' could not be found."));
    }
  });
}

function deleteItem(items, id, cb, argsLength, name, tidy, node) {
  setImmediate(function () {
    if (argsLength !== 2) {
      cb(statusError(400, "Identifier and callback functions must be provided."));
    } else if (!id || typeof id != 'string') {
      // console.log(id);
      cb(statusError(400, "Identifier must be a string value."));
    } else if ((id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/) == null)) {
      cb(statusError(400, "Identifier must be a valid UUID."));
    } else {
      if (items.hasOwnProperty(id)) {
        var tidied = (node) ? tidy() : tidy;
        cb(null, {
          id : id,
          path : id,
          previous : items[id],
          topic : `/${name}s/`,
          store: tidied.setIn([name + 's'], items.without(id))
        });
      } else {
        cb(statusError(404, "A " + name + " with identifier '" + id +
          "' could not be found on a delete request."));
      }
    }
  }.bind(this));
}

function checkValidAndForward(item, items, name, cb) {
  if (!item.valid()) {
    cb(statusError(400,
      "Given new or replacement " + name + " is not valid."));
    return false;
  }
  if (items[item.id]) { // Already stored
  //  console.log('***', items[item.id].version, item.version);
    if (compareVersions(items[item.id].version, item.version) === 1) {
      cb(statusError(409,
        "Cannot replace a " + name + " device with one with " +
        "an earler version."));
      return false;
    }
  }
  return true;
}

var extractVersions = util.extractVersions;
var compareVersions = util.compareVersions;

/**
 * In RAM store representing the state of a [node]{@link Node} or regstry.
 * Immutable value.
 * @constructor
 * @implements {NodeStore}
 * @param {Node} self Node this store is to represent.
 * @return {(NodeRAMStore|Error)} New node RAM store or an error.
 */
function NodeRAMStore(self) {
  /**
   * Details of this [node]{@link Node}. For use by the node API, not when in
   * use as a registry.
   * @type {Node}
   * @readonly
   */
  this.self = self;
  /**
   * Map of nodes avaiable at this registry. Keys are UUIDs.
   * @type {Object.<string, Node>}
   * @readonly
   */
  this.nodes = {};
  /**
   * Map of devices available at this [node]{@link Node} or registry. Keys are UUIDs.
   * @type {Object.<string, Device>}
   * @readonly
   */
  this.devices = {};
  /**
   * Map of sources available at this [node]{@link Node} or registry. Keys are UUIDs.
   * @type {Object.<string, Source>}
   * @readonly
   */
  this.sources = {};
  /**
   * Map of flows associated with this [node]{@link Node} or registry. Keys are UUIDs.
   * @type {Object.<string, Flow>}
   * @readonly
   */
  this.flows = {};
  /**
   * Map of senders associated with this [node]{@link Node} or registry. Keys are UUIDs.
   * @type {Object.<string, Sender>}
   * @readonly
   */
  this.senders = {};
  /**
   * Map of receivers associated with this [node]{@link Node} or registry. Keys are UUIDs.
   * @type {Object.<string, Receiver>}
   * @readonly
   */
  this.receivers = {};
  if (arguments.length === 0 || this.self.valid())
    return immutable(this, { prototype : NodeRAMStore.prototype });
  else
    return new Error("Cannot set an invalid node as the node for this store.");
}

NodeRAMStore.prototype.getSelf = function (cb) {
  setImmediate(function() { cb(null, this.self); }.bind(this) );
}

NodeRAMStore.prototype.putSelf = function (node, cb) {
  setImmediate(function () {
    if (!Node.isNode(node)) {
      return cb(statusError(400,
        "Value being used to put a node is not of Node type."));
    }
    if (!node.valid()) {
      return cb(statusError(400,
        "Given replacement node is not a valid value."));
    }
    if (node.id !== this.self.id) {
      return cb(statusError(400,
        "A replacement node value must have the same identifier '" +
        this.self.id + "' as this node this store represents."));
    }
    if (node.version === this.self.version) {
      return cb(statusError(409,
        "The replacement node cannot have the same version number."));
    }
    if (compareVersions(this.self.version, node.version) !== -1) {
      return cb(statusError(409,
        "The replacement node must have a newer version number."));
    }
    // Not sure if services has to be checked.

    cb(null, {
      topic : '/self',
      path : '',
      previous : this.self,
      resource : node,
      store: this.set('self', node) });
  }.bind(this) );
}

NodeRAMStore.prototype.getNodes = function (query, cb) {
  getCollection(this.nodes, query, cb, arguments.length);
}

NodeRAMStore.prototype.getNode = function (id, cb) {
  getItem(this.nodes, id, cb, arguments.length, 'node');
}

NodeRAMStore.prototype.putNode = function (node, cb) {
  setImmediate(function() {
    if (!Node.isNode(node)) {
      return cb(statusError(400,
        "Value being used to put a node is not of Node type."));
    };
    if (!checkValidAndForward(node, this.nodes, 'node', cb)) return;
    cb(null, {
      topic : '/nodes/',
      path : node.id,
      previous : this.nodes[node.id],
      resource : node,
      store: this.setIn(['nodes', node.id], node) });
  }.bind(this));
}

NodeRAMStore.prototype.deleteNode = function (id, cb) {
  deleteItem(this.nodes, id, cb, arguments.length, 'node', this);
}

NodeRAMStore.prototype.getDevices = function (query, cb) {
  getCollection(this.devices, query, cb, arguments.length);
}

NodeRAMStore.prototype.getDevice = function (id, cb) {
  getItem(this.devices, id, cb, arguments.length, 'device');
}

NodeRAMStore.prototype.putDevice = function (device, cb) {
  setImmediate(function() {
    if (!Device.isDevice(device)) {
      return cb(statusError(400,
        "Value being used to put a device is not of Device type."));
    };
    if (!checkValidAndForward(device, this.devices, 'device', cb)) return;
    if (this.self) {
      if (device.node_id !== this.self.id) {
      return cb(statusError(400,
        "Device node_id property must reference this node."));
      }
    } else {
      if (Object.keys(this.nodes).indexOf(device.node_id) < 0) {
        return cb(statusError(400,
          "Device node_id property must reference an existing node."));
      }
    }

    if (!device.senders.every(function (s) {
      return this.senders.hasOwnProperty(s);
    }.bind(this))) {
      return cb(statusError(400,
        "Senders referenced from given device are not on this store."));
    }
    if (!device.receivers.every(function (r) {
      return this.receivers.hasOwnProperty(r);
    }.bind(this))) {
      cb(statusError(400, "Receivers referenced from given device are not on this store."));
      return;
    }

    Object.keys(this.senders).filter(function (x) {
      return this.senders[x].device_id === device.id;
    }.bind(this)).forEach(function (x) {
      var deviceSenders = device.senders.asMutable();
      if (deviceSenders.indexOf(x) < 0) deviceSenders.push(x);
      device = device.set("senders", deviceSenders);
    });
    Object.keys(this.receivers).filter(function (x) {
      return this.receivers[x].device_id === device.id;
    }.bind(this)).forEach(function (x) {
      var deviceReceivers = device.receivers.asMutable();
      if (deviceReceivers.indexOf(x) < 0) deviceReceivers.push(x);
      device = device.set("receivers", deviceReceivers);
    });

    cb(null, {
      topic : '/devices/',
      path : device.id,
      previous : this.devices[device.id],
      resource : device,
      store: this.setIn(['devices', device.id], device)
    });
  }.bind(this));
}

NodeRAMStore.prototype.deleteDevice = function (id, cb) {
  deleteItem(this.devices, id, cb, arguments.length, 'device', this);
}

NodeRAMStore.prototype.getSources = function (query, cb) {
  getCollection(this.sources, query, cb, arguments.length);
}

NodeRAMStore.prototype.getSource = function (id, cb) {
  getItem(this.sources, id, cb, arguments.length, 'source');
}

NodeRAMStore.prototype.putSource = function (source, cb) {
  setImmediate(function() {
    if (!Source.isSource(source)) {
      return cb(statusError(400,
        "Value being used to put a source is not of Source type."));
    }
    if (!checkValidAndForward(source, this.sources, 'source', cb)) return;
    if (!this.devices.hasOwnProperty(source.device_id)) {
      return cb(statusError(400,
        "Referenced device '" + source.device_id + "' is not known on this node."));
    }
    cb(null, {
      topic : '/sources/',
      path : source.id,
      previous : this.sources[source.id],
      resource: source,
      store: this.setIn(['sources', source.id], source)
    });
  }.bind(this));
}

NodeRAMStore.prototype.deleteSource = function (id, cb) {
  deleteItem(this.sources, id, cb, arguments.length, 'source', this);
}

NodeRAMStore.prototype.getSenders = function (query, cb) {
  getCollection(this.senders, query, cb, arguments.length);
}

NodeRAMStore.prototype.getSender = function (id, cb) {
  getItem(this.senders, id, cb, arguments.length, 'sender');
}

NodeRAMStore.prototype.putSender = function (sender, cb) {
  setImmediate(function () {
    if (!Sender.isSender(sender)) {
      return cb(statusError(400,
        "Value being used to put a sender is not of Sender type."));
    }
    if (!checkValidAndForward(sender, this.senders, 'sender', cb));
    if (!this.flows.hasOwnProperty(sender.flow_id)) {
      return cb(statusError(400,
        "Referenced flow '" + sender.flow_id + "' is not known on this node."));
    }
    if (!this.devices.hasOwnProperty(sender.device_id)) {
      return cb(statusError(400,
        "Referenced device '" + sender.device_id + "' is not known to this node."));
    }
    if (this.devices[sender.device_id].senders.indexOf(sender.id) < 0) {
      var deviceSenders = this.devices[sender.device_id].senders.asMutable();
      deviceSenders.push(sender.id);
      // console.log(this.setIn(['senders', sender.id], sender));
      cb(null, {
        topic : '/senders/',
        path : sender.id,
        previous : this.senders[sender.id],
        resource : sender,
        store: this.setIn(['senders', sender.id], sender)
          .setIn(['devices', sender.device_id, 'senders'], deviceSenders)
      });
    } else {
      cb(null, {
        topic : '/senders/',
        path : sender.id,
        previous : this.senders[sender.id],
        resource : sender,
        store : this.setIn(['senders', sender.id], sender)
      });
    }
  }.bind(this));
}

NodeRAMStore.prototype.deleteSender = function(id, cb) {
  deleteItem(this.senders, id, cb, arguments.length, 'sender', this);
}
NodeRAMStore.prototype.getReceivers = function (query, cb) {
  getCollection(this.receivers, query, cb, arguments.length);
}

NodeRAMStore.prototype.getReceiver = function (id, cb) {
  getItem(this.receivers, id, cb, arguments.length, 'receiver', this);
}

NodeRAMStore.prototype.putReceiver = function (receiver, cb) {
  setImmediate(function () {
    if (!Receiver.isReceiver(receiver)) {
      return cb(statusError(400,
        "Value being used to put a receiver is not of Receiver type."));
    }
    if (!checkValidAndForward(receiver, this.receivers, 'receiver', cb)) return;
    if (!this.devices.hasOwnProperty(receiver.device_id)) {
      return cb(statusError(400,
        "Referenced device '" + receiver.device_id + "' is not known to this node."));
    }
    if (this.devices[receiver.device_id].receivers.indexOf(receiver.id) < 0) {
      var deviceReceivers = this.devices[receiver.device_id].receivers.asMutable();
      deviceReceivers.push(receiver.id);
      // console.log(deviceReceivers);
      cb(null, {
        topic : '/receivers/',
        path : receiver.id,
        previous : this.receivers[receiver.id],
        resource : receiver,
        store : this.setIn(['receivers', receiver.id], receiver)
          .setIn(['devices', receiver.device_id, 'receivers'], deviceReceivers)
      });
    } else {
      cb(null, {
        topic : '/receivers/',
        path : receiver.id,
        previous : this.receivers[receiver.id],
        resource : receiver,
        store : this.setIn(['receivers', receiver.id], receiver)
      });
    }
  }.bind(this));
}

NodeRAMStore.prototype.deleteReceiver = function (id, cb) {
  deleteItem(this.receivers, id, cb, arguments.length, 'receiver', this);
}

NodeRAMStore.prototype.getFlows = function (query, cb) {
  getCollection(this.flows, query, cb, arguments.length);
}

NodeRAMStore.prototype.getFlow = function (id, cb) {
  getItem(this.flows, id, cb, arguments.length, 'flow', this);
}

NodeRAMStore.prototype.putFlow = function (flow, cb) {
  setImmediate(function (x) {
    if (!Flow.isFlow(flow)) {
      return cb(statusError(400,
        "Value being used to put a flow is not of Flow type."));
    }
    if (!checkValidAndForward(flow, this.flows, 'flow', cb)) return;
    if (!this.sources.hasOwnProperty(flow.source_id)) {
      return cb(statusError(400,
        "Referenced source '" + flow.source_id + "' is not known to this node.'"));
    }
    cb(null, {
      topic : '/flows/',
      path : flow.id,
      previous : this.flows[flow.id],
      resource : flow,
      store : this.setIn(['flows', flow.id], flow) });
  }.bind(this));
}

NodeRAMStore.prototype.deleteFlow = function (id, cb) {
  deleteItem(this.flows, id, cb, arguments.length, 'flow', this);
}

module.exports = NodeRAMStore;
