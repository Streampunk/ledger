/* Copyright 2015 Christine S. MacNeill

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
  if (!skip || Number(skip) !== skip || skip % 1 !== skip ||
      skip < 0)
    skip = 0;
  if (skip > keys.length) skip = keys.length;
  return skip;
}

// Check that the limit parameter is withing range, or set defaults
function checkLimit (limit, keys) {
  if (limit && typeof limit === 'string') limit = +limit;
  if (!limit || Number(limit) !== limit || limit % 1 !== limit ||
      limit > keys.length)
    limit = keys.length;
  if (limit < 0) limit = 0;
  return limit;
}

// Generic get collection methods that returns an ordered sequence of items
function getCollection(items, skip, limit, cb, argsLength) {
  setImmediate(function() {
    if (argsLength === 1) {
      cb = skip;
      skip = null;
      limit = null;
    }
    if (argsLength !== 3) {
      cb(statusError(400, "Both skip and limit parameters must be provided."));
      return;
    }
    var sortedKeys = Object.keys(items);
    skip = checkSkip(skip, sortedKeys);
    limit = checkLimit(limit, sortedKeys);
    if (sortedKeys.length === 0 || limit === 0 || skip >= sortedKeys.length) {
      cb(null, [], sortedKeys.length, 1, 1, 0);
      return;
    }
    var pages = Math.ceil(sortedKeys.length / limit);
    var pageOf = Math.ceil(skip / limit) + 1;
    var itemArray = new Array();
    for ( var x = skip ; x < Math.max(skip + limit, sortedKeys.length) ; x++ ) {
      deviceArray.push(devices[sortedKeys[x]]);
    }
    cb(null, deviceArray, sortedKeys.length, pageOf, pages, deviceArray.length);
  });
}

function getItem(items, id, cb, argsLength, name) {
  setImmediate(function () {
    if (argsLength !== 2) {
      cb(statusError(400, "Identifier and callback function must be provided."));
    } else if (!id || typeof id !== 'string'){
      cb(statusError(400, "Identifier must be a string value."));
    } else if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/) == null) {
      cb(statusError(400, "Identifier must be a valid UUID."));
    } else {
      var item = items[id];
      if (item) cb(null, item);
      else cb(statusError(404, "A " + name + " with identifier ''" + id +
        "' could not be found."));
    }
  });
}

function deleteItem(items, id, cb, argsLength, name, tidy, node) {
  setImmediate(function () {
    if (argsLength !== 2) {
      cb(statusError(400, "Identifier and callback functions must be provided."));
    } else if (!id || typeof id != 'string') {
      cb(statusError(400, "Identifier must be a string value."));
    } else if ((id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/) == null)) {
      cb(statusError(400, "Identifier must be a valid UUID."));
    } else {
      if (items.hasOwnProperty(id)) {
        var tidied = (tidy) ? tidy() : node;
        cb(null, id, tidied.setIn(name + 's', items.without(id)));
      } else {
        cb(statusError(404, "A " + name + " with identifier '" + id +
          " could not be found on a delete request."));
      }
    }
  }.bind(this));
}

function checkValidAndForward(item, items, name, cb) {
  if (!item.valid()) {
    cb(statusError(400,
      "Given new or replcement " + name + " is not valid."));
    return false;
  }
  if (items[item.id]) { // Already stored
    if (compareVersions(this.items[item.id].version, item.version) !== -1) {
      cb(statusError(409,
        "Cannot replace a " + name + " device with one with the same or " +
        "an earler version."));
      return false;
    }
  }
  return true;
}

var extractVersions = util.extractVersions;
var compareVersions = util.compareVersions;

/**
 * In RAM store representing the state of a [node]{@link Node}. Immutable value.
 * @constructor
 * @implements {NodeStore}
 * @param {Node} self Node this store is to represent.
 * @return {(NodeRAMStore|Error)} New node RAM store or an error.
 */
function NodeRAMStore(self) {
  this.self = self;
  /**
   * Map of devices available at this [node]{@link Node}. Keys are UUIDs.
   * @type {Object.<string, Device>}
   * @readonly
   */
  this.devices = {};
  /**
   * Map of sources available at this [node]{@link Node}. Keys are UUIDs.
   * @type {Object.<string, Source>}
   * @readonly
   */
  this.sources = {};
  /**
   * Map of flows associated with this [node]{@link Node}. Keys are UUIDs.
   * @type {Object.<string, Flow>}
   * @readonly
   */
  this.flows = {};
  /**
   * Map of senders associated with this [node]{@link Node}. Keys are UUIDs.
   * @type {Object.<string, Sender>}
   * @readonly
   */
  this.senders = {};
  /**
   * Map of receivers associated with this [node]{@link Node}. Keys are UUIDs.
   * @type {Object.<string, Receiver>}
   * @readonly
   */
  this.receivers = {};
  if (this.self.valid())
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

    cb(null, node, this.set('self', node));
  }.bind(this) );
}

NodeRAMStore.prototype.getDevices = function (skip, limit, cb) {
  getCollection(this.devices, skip, limit, cb, arguments.length);
}

NodeRAMStore.prototype.getDevice = function (id, cb) {
  getItem(this.deivces, id, cb, argsLength, 'device');
}

NodeRAMStore.prototype.putDevice = function (device, cb) {
  setImmediate(function() {
    if (!Device.isDevice(device)) {
      return cb(statusError(400,
        "Value being used to put a device is not of Device type."));
    };
    if (!checkValidAndForward(device, this.devices, 'device', cb)) return;
    if (!device.senders.every(function (s) {
      return this.senders.hasOwnProperty(s);
    })) {
      return cb(statusError(400,
        "Senders referenced from given device are not on this store."));
    }
    if (!device.receivers.every(function (r) {
      return this.receivers.hasOwnProperty(r);
    })) {
      cb(statusError(400, "Receivers referenced from given device are not on this store."));
      return;
    }

    cb(null, device, this.setIn(['devices', device.id], device));
  }.bind(this));
}

NodeRAMStore.prototype.deleteDevice = function (id, cb) {
  deleteItem(this.devices, id, cb, arguments.length, 'device', this);
}

NodeRAMStore.prototype.getSources = function (skip, limit, cb) {
  getCollection(this.sources, skip, limit, cb, arguments.length);
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
    cb(null, source, this.setIn(['sources', source.id], source));
  }.bind(this));
}

NodeRAMStore.prototype.deleteSource = function (id, cb) {
  deleteItem(this.sources, id, cb, arguments.length, 'source', this);
}

NodeRAMStore.prototype.getSenders = function (skip, limit, cb) {
  getCollection(this.senders, skip, limit, cb, arguments.length);
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
      cb(null, sender, this.setIn(['senders', sender.id], sender))
        .setIn(['devices', sender.id, 'senders'], deviceSenders);
    } else {
      cb(null, sender, this.setIn(['senders', sender.id], sender));
    }
  }.bind(this));
}

NodeRAMStore.prototype.deleteSender = function(id, cb) {
  deleteItem(this.senders, id, cb, arguments.length, 'sender');
}
NodeRAMStore.prototype.getReceivers = function (skip, limit, cb) {
  getCollection(this.receivers, skip, limit, cb, arguments.length);
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
      cb(null, receiver, this.setIn(['receivers', receiver.id], receiver)
          .setIn(['devices', device.id, 'receivers'], deviceReceivers));
    }
    cb(null, receiver, this.setIn(['receivers', receiver.id], receiver));
  }.bind(this));
}

NodeRAMStore.prototype.deleteReceiver = function (id, cb) {
  deleteItem(this.receivers, id, cb, arguments.length, 'receiver');
}

NodeRAMStore.prototype.getFlows = function (skip, limit, cb) {
  getCollection(this.flows, skip, limit, cb, arguments.length);
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
    cb(null, flow, this.setIn(['flows', flow.id], flow));
  }.bind(this));
}

NodeRAMStore.prototype.deleteFlow = function (id, cb) {
  deleteItem(this.flows, id, cb, arguments.length, 'flow', this,
    function () {
      return this.setIn('flows', this.flows.filter(function (x) {
        return x.id !== flow.id;
      }.bind(this)));
    });
}

module.exports = NodeRAMStore;
