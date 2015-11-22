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

var Versionned = require('./Versionned.js');
var immutable = require('seamless-immutable');

// Describes a device
function Device(id, version, label, type, node_id, senders, receivers) {
  // Globally unique identifier for the Device
  this.id = this.generateID(id);
  // String formatted PTP timestamp (<seconds>:<nanoseconds>) indicating
  // precisely when an attribute of the resource last changed.
  this.version = this.generateVersion(version);
  // Freeform string label for the Device.
  this.label = this.generateLabel(label);
  this.type = this.generateType(type);
  // Globally unique identifier for the Node which initially created the Device
  this.node_id = this.generateNodeID(node_id);
  // UUIDs of Senders attached to the Device
  this.senders = this.generateSenders(senders);
  // UUIDs of Receivers attached to the Device
  this.receivers = this.generateReceivers(receivers);
  return immutable(this, { prototype: Device.prototype });
}

Device.prototype.validID = Versionned.prototype.validID;
Device.prototype.generateID = Versionned.prototype.generateID;
Device.prototype.validVersion = Versionned.prototype.validVersion;
Device.prototype.generateVersion = Versionned.prototype.generateVersion;
Device.prototype.validLabel = Versionned.prototype.validLabel;
Device.prototype.generateLabel = Versionned.prototype.generateLabel;


module.exports = Device;
