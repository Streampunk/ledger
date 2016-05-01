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

function Sender(id, version, label, description,
    flow_id, transport, device_id, manifest_href) {
  // Globally unique identifier for the Sender.
  this.id = Sender.prototype.generateID(id);
  // String formatted PTP timestamp (<seconds>:<nanoseconds>) indicating
  // precisely when an attribute of the resource last changed.
  this.version = Sender.prototype.generateVersion(version);
  // Freeform string label for the Sender
  this.label = Sender.prototype.generateLabel(label);
  // Detailed description of the Sender
  this.description = Sender.prototype.generateDescription(description);
  // ID of the Flow currently passing via this Sender
  this.flow_id = Sender.prototype.generateFlowID(flow_id);
  // Transport type used by the Sender in URN format
  this.transport = Sender.prototype.generateTransport(transport);
  // Device ID which this Sender forms part of
  this.device_id = Sender.prototype.generateDeviceID(device_id);
  // HTTP URL to a file describing how to connect to the Sender (SDP for RTP).
  // @FIXME Restore manifest_href validation
  this.manifest_href = manifest_href;
  return immutable(this, { prototype : Sender.prototype });
}

Sender.prototype.validID = Versionned.prototype.validID;
Sender.prototype.generateID = Versionned.prototype.generateID;
Sender.prototype.validVersion = Versionned.prototype.validVersion;
Sender.prototype.generateVersion = Versionned.prototype.generateVersion;
Sender.prototype.validLabel = Versionned.prototype.validLabel;
Sender.prototype.generateLabel = Versionned.prototype.generateLabel;

Sender.prototype.validDescription = Versionned.prototype.validLabel;
Sender.prototype.generateDescription = Versionned.prototype.generateLabel;

Sender.prototype.validFlowID = Versionned.prototype.validID;
Sender.prototype.generateFlowID = Versionned.prototype.generateID;

Sender.prototype.validTransport = Versionned.prototype.validTransport;
Sender.prototype.generateTransport = Versionned.prototype.generateTransport;

Sender.prototype.validDeviceID = Versionned.prototype.validID;
Sender.prototype.generateDeviceID = Versionned.prototype.generateID;

Sender.prototype.validManifestHREF = function (href) {
  if (arguments.length === 0) return this.validManifestHREF(this.manifest_href);
  return typeof href === 'string' &&
    href.startsWith('http://');
}
Sender.prototype.generateManifestHREF = function (href) {
  if (arguments.length === 0 || href === null || href === undefined)
    return 'http://';
  else return href;
}

Sender.prototype.valid = function() {
  return this.validID(this.id) &&
    this.validVersion(this.version) &&
    this.validLabel(this.label) &&
    this.validDescription(this.description) &&
    this.validFlowID(this.flow_id) &&
    this.validTransport(this.transport) &&
    this.validDeviceID(this.device_id) &&
    this.validManifestHREF(this.manifest_href);
}

Sender.prototype.stringify = function() { return JSON.stringify(this); }
Sender.prototype.parse = function(json) {
  if (json === null || json === undefined || arguments.length === 0 ||
      (typeof json !== 'string' && typeof json !== 'object'))
    throw new Error("Cannot parse JSON to a Sender value because it is not a valid input.");
  var parsed = (typeof json === 'string') ? JSON.parse(json) : json;
  return new Sender(parsed.id, parsed.version, parsed.label, parsed.description,
    parsed.flow_id, parsed.transport, parsed.device_id, parsed.manifest_href);
}

Sender.isSender = function (x) {
  return x !== null &&
    typeof x === 'object' &&
    x.constructor === Sender.prototype.constructor;
}

module.exports = Sender;
