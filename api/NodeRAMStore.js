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

/**
 * In RAM store representing the state of a node. Immutable value.
 * @constructor
 * @implements {NodeStore}
 * @param {Node} self
 */
function NodeRAMStore(self) {
  this.self = self;
  /**
   * Hashmap of devices known to this node.
   * @type {Object.<string, Device>}
   * @readonly
   */
  this.devices = {};
  this.sources = {};
  this.flows = {};
  this.senders = {};
  this.receivers = {};
  return immutable(this, { prototype : NodeState.prototype });
}

NodeRAMStore.prototype.getSelf = function (cb) {
  cb(self);
}

NodeState.prototype.addDevice = function (device) {
  return this.merge({
    devices : this.devices.concat([device]),
    self : this.self.merge({ services : this.self.services.concat([device.id]) })
  });
}

module.exports = NodeState;
