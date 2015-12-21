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

var immutable = require('seamless-immutable');
var NodeStore = require('./NodeStore');

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
      if (item) cb(null, device);
      else cb(statusError(404, "A " + name + " with identifier ''" + id +
        "' could not be found."));
    }
  });
}

function extractVersions(v) {
  var m = v.match(/^([0-9]+):([0-9]+)$/)
  return [+m[1], +m[2]];
}

function compareVersions(l, r) {
  var lm = extractVersions(l);
  var rm = extractVersions(r);
  if (lm[0] < rm[0]) return -1;
  if (lm[0] > rm[0]) return 1;
  if (lm[1] < rm[1]) return -1;
  if (lm[1] > rm[1]) return 1;
  return 0;
}
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
  if (self.valid())
    return immutable(this, { prototype : NodeState.prototype });
  else
    return new Error("Cannot set an invalid node as the node for this store.");
  }
}

NodeRAMStore.prototype.getSelf = function (cb) {
  // Convention is to use self, but this is confusing in this context.
  var selfy = this;
  setImmediate(function() { cb(null, selfy.self); });
}

NodeRAMStore.prototype.putSelf = function (node, cb) {
  // Convention is to use self, but this is confusing in this context.
  var selfy = this;
  setImmediate(function () {
    if (!node || typeof Node !== 'object' ||
        node.constructor !== Node.prototype.constructor ) {
      cb(statusError(400, "Value being used to put a node is not of Node type."));
      return;
    }
    if (!node.valid()) {
      cb(statusError(400, "Given replacement node is not a valid value."));
      return;
    }
    if (node.id !== selfy.self.id) {
      cb(statusError(400, "A replacement node value must have the same identifier '" +
        selfy.self.id + "' as this node this store represents."));
      return;
    }
    if (node.version === selfy.self.version) {
      cb(statusError(409, "The replacement node cannot have the same version number."));
      return;
    }
    if (compareVersions(selfy.self.version, node.version) !== -1) {
      cb(statusError(409, "The replacement node must have a newer version number."));
      return;
    }
    // Not sure if services has to be checked.

    cb(null, node, selfy.set('self', node));
  }
}

NodeRAMStore.prototype.getDevices = function (skip, limit, cb) {
  getCollection(this.devices, skip, limit, cb, arguments.length);
}

NodeRAMStore.prototype.getDevice = function (id, cb) {
  getItem(this.deivces, id, cb, argsLength, 'device');
}

NodeRAMStore.prototype.putDevice = function (device, cb) {
  var self = this;
  setImmediate(function() {
    if (!device || typeof device !== 'object' ||
        device.constructor !== Device.prototype.constructor) {
      cb(statusError(400, "Value being used to put a device is not of Device type."));
      return;
    };
    if (!device.valid()) {
      cb(statusError(400, "Given new or replacement device is not valid."));
      return;
    };
    if (device.node_id !== self.self.id) {
      cb(statusError(400, "The given device does not have the node API '" +
        self.self.id + "' of this store.'"));
      return;
    }
    if (self.devices[device.id]) { // Already stored
      if (compareVersions(self.devices[device.id].version, device.version) !== -1) {
        cb(statusError(409, "Cannot replace a device with one with the same or " +
          "an earler version."));
        return;
      }
    }
    if (!device.senders.every(function (s) {
      return self.senders.indexOf(s) >= 0;
    })) {
      cb(statusError(400, "Senders referenced from given device are not on this store."));
      return;
    }
    if (!device.receivers.every(function (r) {
      return self.receivers.indexOf(r) >= 0; 
    })) {
      cb(statusError(400, "Receivers referenced from given device are not on this store."));
      return;
    }

    cb(null, device, self.setIn(['devices', device.id], device)));
  });
}

NodeRAMStore.prototype.getSources = function (skip, limit, cb) {
  getCollection(this.sources, skip, limit, cb, arguments.length);
}

NodeRAMStore.prototype.getSource = function (id, cb) {
  getItem(this.sources, id, cb, arguments.length, 'source');
}

NodeRAMStore.prototype.getSenders = function (skip, limit, cb) {
  getCollection(this.senders, skip, limit, cb, arguments.length);
}

NodeRAMStore.prototype.getSender = function (id, cb) {
  getItem(this.senders, id, cb, arguments.length, 'sender');
}

NodeRAMStore.prototype.getReceivers = function (skip, limit, cb) {
  getCollection(this.receivers, skip, limit, cb, arguments.length);
}

NodeRAMStore.prototype.getReceiver = function (id, cb) {
  getItem(this.receivers, id, cb, arguments.length, 'receiver');
}

NodeRAMStore.prototype.getFlows = function (skip, limit, cb) {
  getCollection(this.flows, skip, limit, cb, arguments.length);
}

NodeRAMStore.prototype.getFlow = function (id, cb) {
  getItem(this.flows, id, cb, arguments.length, 'flow');
}

NodeState.prototype.addDevice = function (device) {
  return this.merge({
    devices : this.devices.concat([device]),
    self : this.self.merge({ services : this.self.services.concat([device.id]) })
  });
}

module.exports = NodeState;
