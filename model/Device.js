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

var Versionned = require('./Versionned.js');
var immutable = require('seamless-immutable');
var DeviceTypes = require('./DeviceTypes.js');

/**
 * Describes a Device. Immutable value.
 * @constructor
 * @augments Versionned
 * @param {String}   id        Globally unique UUID identifier for the Device.
 * @param {string}   version   String formatted PTP timestamp
 *                             (&lt;<em>seconds</em>&gt;:&lt;<em>nanoseconds</em>&gt;)
 *                             indicating precisely when an attribute of the resource
 *                             last changed.
 * @param {string}   label     Freeform string label for the Device.
 * @param {string}   type      [Device type]{@link deviceTypes} URN.
 * @param {string}   node_id   Globally unique UUID identifier for the {@link Node}
 *                             which initially created the Device.
 * @param {string[]} senders   UUIDs of {@link Senders} attached to the Device.
 * @param {string[]} receivers UUIDs of Receivers attached to the Device
 */
function Device(id, version, label, type, node_id, senders, receivers) {
  this.id = this.generateID(id);
  this.version = this.generateVersion(version);
  this.label = this.generateLabel(label);
  /**
   * [Device type]{@link deviceTypes} URN.
   * @type {string}
   * @readonly
   */
  this.type = this.generateType(type);
  /**
   * Globally unique UUID identifier for the {@link Node} which initially created
   * the Device.
   * @type {string}
   * @readonly
   */
  this.node_id = this.generateNodeID(node_id);
  /**
   * UUIDs of [Senders]{@link Sender} attached to the Device.
   * @type {string[]}
   * @readonly
   */
  this.senders = this.generateSenders(senders);
  /**
   * UUIDs of [Receivers]{@link Receiver} attached to the Device.
   * @type {string[]}
   * @readonly
   */
  this.receivers = this.generateReceivers(receivers);
  return immutable(this, { prototype: Device.prototype });
}

Device.prototype.validID = Versionned.prototype.validID;
Device.prototype.generateID = Versionned.prototype.generateID;
Device.prototype.validVersion = Versionned.prototype.validVersion;
Device.prototype.generateVersion = Versionned.prototype.generateVersion;
Device.prototype.validLabel = Versionned.prototype.validLabel;
Device.prototype.generateLabel = Versionned.prototype.generateLabel;

Device.prototype.validType = function (t) {
  if (arguments.length === 0) return this.validType(this.type);
  else return Versionned.prototype.validDeviceType(t);
}
Device.prototype.generateType = Versionned.prototype.generateDeviceType;

Device.prototype.validNodeID = Versionned.prototype.validID;
Device.prototype.generateNodeID = Versionned.prototype.generateID;

Device.prototype.validSenders = function(s) {
  if (arguments.length === 0) return this.validSenders(this.senders);
  else return Versionned.prototype.validUUIDArray(s);
}
Device.prototype.generateSenders = Versionned.prototype.generateUUIDArray;

Device.prototype.validReceivers = function (r) {
  if (arguments.length === 0) return this.validReceivers(this.receivers);
  else return Versionned.prototype.validUUIDArray(r);
}
Device.prototype.generateReceivers = Versionned.prototype.generateUUIDArray;

Device.prototype.valid = function () {
  return this.validID(this.id) &&
    this.validVersion(this.version) &&
    this.validLabel(this.label) &&
    this.validType(this.type) &&
    this.validNodeID(this.node_id) &&
    this.validSenders(this.senders) &&
    this.validReceivers(this.receivers);
};

Device.prototype.stringify = function() { return JSON.stringify(this); }
Device.prototype.parse = function(json) {
  if (json === null || json === undefined || arguments.length === 0 ||
      (typeof json !== 'string' && typeof json !== 'object'))
    throw "Cannot parse JSON to a Device value because it is not a valid input.";
  var parsed = (typeof json === 'string') ? JSON.parse(json) : json;
  return new Device(parsed.id, parsed.version, parsed.label, parsed.type,
    parsed.node_id, parsed.senders, parsed.receivers);
};

Device.isDevice = function (x) {
  return x !== null &&
    typeof x === 'object' &&
    x.constructor === Device.prototype.constructor;
}

module.exports = Device;
