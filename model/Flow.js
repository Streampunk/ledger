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
var Formats = require('./Formats.js');

// Describes a Flow

function Flow(id, version, label, description, format, source_id, parents) {
  // Globally unique identifier for the Flow
  this.id = this.generateID(id);
  // String formatted PTP timestamp (<seconds>:<nanoseconds>) indicating
  // precisely when an attribute of the resource last changed",
  this.version = this.generateVersion(version);
  // Freeform string label for the Flow
  this.label = this.generateLabel(label);
  // Detailed description of the Flow
  this.description = this.generateDescription(description);
  // Format of the data coming from the Flow as a URN
  this.format = this.generateFormat(format);
  // Globally unique identifier for the Flow which initially created the Flow
  this.source_id = this.generateSourceID(source_id);
  // Array of UUIDs representing the Flow IDs of Grains which came together to
  // generate this Flow (may change over the lifetime of this Flow
  this.parents = this.generateParents(parents);
  return immutable(this, { prototype: Flow.prototype });
}

Flow.prototype.validID = Versionned.prototype.validID;
Flow.prototype.generateID = Versionned.prototype.generateID;
Flow.prototype.validVersion = Versionned.prototype.validVersion;
Flow.prototype.generateVersion = Versionned.prototype.generateVersion;
Flow.prototype.validLabel = Versionned.prototype.validLabel;
Flow.prototype.generateLabel = Versionned.prototype.generateLabel;

Flow.prototype.validDescription = Versionned.prototype.validLabel;
Flow.prototype.generateDescription = Versionned.prototype.generateLabel;

Flow.prototype.validSourceID = Versionned.prototype.validID;
Flow.prototype.generateSourceID = Versionned.prototype.generateID;

Flow.prototype.stringify = function () { return JSON.stringify(this) };
Flow.prototype.parse = function (json) {
  if (json === null || json === undefined || arguments.length === 0 ||
      typeof json !== 'string')
    throw "Cannot parse JSON to a Flow value because it is not a valid input.";
  var parsed = JSON.parse(json);

}

module.exports = Flow;
