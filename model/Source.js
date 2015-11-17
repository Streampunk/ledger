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
var Capabilities = require('./Capabilities.js')
var Formats = require('./Formats.js');

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
  this.tags = tags;
  this.device_id = device_id;
  this.parents = parents;
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

Source.prototype.validFormat = Formats.validFormat;
Source.prototype.generateFormat = function (format) {
  if (arguments.length === 0 || format === null || format === undefined)
    return Formats.video;
  else return format;
}

Source.prototype.validCaps = function (caps) {
  if (arguments.length === 0) return this.validCaps(this.caps);
  return caps === Capabilities;
}
Source.prototype.generateCaps = function (caps) {
  if (arguments.length === 0 || caps === null || caps === undefined)
    return Capabilities;
  else return caps;
}

Source.prototype.validTags = function (tags) {
  if (arguments.length === 0) return this.validTags(this.tags);
  if (typeof tags === 'object') {
    // TODO
  }
}

module.exports = Source;
