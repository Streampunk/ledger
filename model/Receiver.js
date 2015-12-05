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

// Describes a receiver

function Receiver(id, version, label, description,
  format, caps, tags, device_id, transport, subscription) {
  //  Globally unique identifier for the Receiver
  this.id = this.generateID(id);
  // String formatted PTP timestamp (<seconds>:<nanoseconds>) indicating
  // precisely when an attribute of the resource last changed.
  this.version = this.generateVersion(version);
  // Freeform string label for the Receiver
  this.label = this.generateLabel(label);
  // Detailed description of the Receiver
  this.description = this.generateDescription(description);
  // Type of Flow accepted by the Receiver as a URN
  this.format = this.generateFormat(format);
  // Capabilities (not yet defined)
  this.caps = this.generateCaps(caps);
  // Key value set of freeform string tags to aid in filtering sources.
  // Values should be represented as an array of strings. Can be empty.
  this.tags = this.generateTags(tags);
  // Device ID which this Receiver forms part of.
  this.device_id = this.generateDeviceID(device_id);
  // Transport type accepted by the Receiver in URN format
  this.transport = this.generateTransport(transport);
  // Object containing the 'sender_id' currently subscribed to. Sender_id
  // should be null on initialisation.",
  this.subscription = this.generateSubscription(subscription);
  return immutable(this, { prototype : Receiver.prototype });
}

Receiver.prototype.validID = Versionned.prototype.validID;
Receiver.prototype.generateID = Versionned.prototype.generateID;
Receiver.prototype.validVersion = Versionned.prototype.validVersion;
Receiver.prototype.generateVersion = Versionned.prototype.generateVersion;
Receiver.prototype.validLabel = Versionned.prototype.validLabel;
Receiver.prototype.generateLabel = Versionned.prototype.generateLabel;

Receiver.prototype.validDescription = Versionned.prototype.validLabel;
Receiver.prototype.generateDescription = Versionned.prototype.generateLabel;

Receiver.prototype.validFormat = Versionned.prototype.validFormat;
Receiver.prototype.generateFormat = Versionned.prototype.generateFormat;

Receiver.prototype.validCaps = Versionned.prototype.validCaps;
Receiver.prototype.generateCaps = Versionned.prototype.generateCaps;

Receiver.prototype.validTags = Versionned.prototype.validTags;
Receiver.prototype.generateTags = Versionned.prototype.generateTags;

Receiver.prototype.validDeviceID = Versionned.prototype.validID;
Receiver.prototype.generateDeviceID = Versionned.prototype.generateID;

Receiver.prototype.validTransport = Versionned.prototype.validTransport;
Receiver.prototype.generateTransport = Versionned.prototype.generateTransport;

Receiver.prototype.validSubscription = function (s) {
  if (arguments.length === 0) return this.validSubscription(this.subscription);
  return typeof s === 'object' &&
    s !== null &&
    s.hasOwnProperty('sender_id') &&
    (s.sender_id === null || this.validID(s.sender_id));
}
Receiver.prototype.generateSubscription = function (s) {
  if (arguments.length === 0 || s === null || s === undefined)
    return { sender_id: null };
  else return s;
}

Receiver.prototype.valid = function() {
  return this.validID(this.id) &&
    this.validVersion(this.version) &&
    this.validLabel(this.label) &&
    this.validDescription(this.description) &&
    this.validFormat(this.format) &&
    this.validCaps(this.caps) &&
    this.validTags(this.tags) &&
    this.validDeviceID(this.device_id) &&
    this.validTransport(this.transport) &&
    this.validSubscription(this.subscription);
}

Receiver.prototype.stringify = function() { return JSON.stringify(this); }
Receiver.prototype.parse = function (json) {
  if (json === null || json === undefined || arguments.length === 0 ||
      typeof json !== 'string')
    throw "Cannot parse JSON to a Receiver value because it is not a valid input.";
  var parsed = JSON.parse(json);
  return new Receiver(parsed.id, parsed.version, parsed.label,
    parsed.description, parsed.format, parsed.caps, parsed.tags,
    parsed.device_id, parsed.transport, parsed.subscription);
}

module.exports = Receiver;
