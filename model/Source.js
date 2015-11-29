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
var Capabilities = require('./Capabilities.js');

// Describes a source
function Source(id, version, label, description,
    format, caps, tags, device_id, parents) {

  // Globally unique identifier for the Source
  this.id = this.generateID(id);
  // String formatted PTP timestamp (<seconds>:<nanoseconds>) indicating
  // precisely when an attribute of the resource last changed
  this.version = this.generateVersion(version);
  // Freeform string label for the Source
  this.label = this.generateLabel(label);
  // Detailed description of the Source
  this.description = this.generateDescription(description);
  // Format of the data coming from the Source as a URN
  this.format = this.generateFormat(format);
  // Capabilities (not yet defined)
  this.caps = this.generateCaps(caps);
  // Key value set of freeform string tags to aid in filtering Sources. Values
  // should be represented as an array of strings. Can be empty.
  this.tags = this.generateTags(tags);
  // Globally unique identifier for the Device which initially created the Source
  this.device_id = this.generateDeviceID(device_id);
  // Array of UUIDs representing the Source IDs of Grains which came together at
  // the input to this Source (may change over the lifetime of this Source)
  this.parents = this.generateParents(parents);
  return immutable(this, { prototype: Source.prototype });
}

Source.prototype.validID = Versionned.prototype.validID;
Source.prototype.validVersion = Versionned.prototype.validVersion;
Source.prototype.validLabel = Versionned.prototype.validLabel;
Source.prototype.generateID = Versionned.prototype.generateID;
Source.prototype.generateVersion = Versionned.prototype.generateVersion;
Source.prototype.generateLabel = Versionned.prototype.generateLabel;

Source.prototype.validDescription = Versionned.prototype.validLabel;
Source.prototype.generateDescription = Versionned.prototype.generateLabel;

Source.prototype.validFormat = Versionned.prototype.validFormat;
Source.prototype.generateFormat = Versionned.prototype.generateFormat;

Source.prototype.validCaps = Versionned.prototype.validCaps;
Source.prototype.generateCaps = Versionned.prototype.generateCaps;

Source.prototype.validDeviceID = Versionned.prototype.validID;
Source.prototype.generateDeviceID = Versionned.prototype.generateID;

Source.prototype.validParents = function (parents) {
  if (arguments.length === 0)
    return Versionned.prototype.validUUIDArray(this.parents);
  return Versionned.prototype.validUUIDArray(parents);
}
Source.prototype.generateParents = Versionned.prototype.generateUUIDArray;

Source.prototype.validTags = Versionned.prototype.validTags;
Source.prototype.generateTags = Versionned.prototype.generateTags;

Source.prototype.valid = function () {
  return this.validID(this.id) &&
    this.validVersion(this.version) &&
    this.validLabel(this.label) &&
    this.validDescription(this.description) &&
    this.validFormat(this.format) &&
    this.validCaps(this.caps) &&
    this.validTags(this.tags) &&
    this.validDeviceID(this.device_id) &&
    this.validParents(this.parents);
}

Source.prototype.stringify = function() { return JSON.stringify(this); }
Source.prototype.parse = function (json) {
  if (json === null || json === undefined || arguments.length === 0 ||
      typeof json !== 'string')
    throw "Cannot parse JSON to a Source value because it is not a valid input.";
  var parsed = JSON.parse(json);
  return new Source(parsed.id, parsed.version, parsed.label, parsed.description,
    parsed.format, parsed.caps, parsed.tags, parsed.device_id, parsed.parents);
};

module.exports = Source;
