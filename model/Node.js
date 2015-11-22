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

// Describes the Node and the services which run on it

var Versionned = require('./Versionned.js');
var immutable = require('seamless-immutable');
var Capabilities = require('./Capabilities.js');

function Node(id, version, label, href, hostname, caps, services) {
  // Globally unique identifier for the Node
  this.id = this.generateID(id);
  // String formatted PTP timestamp (<seconds>:<nanoseconds>) indicating
  // precisely when an attribute of the resource last changed
  this.version = this.generateVersion(version);
  // Freeform string label for the Node
  this.label = this.generateLabel(label);
  // HTTP access href for the Node's API
  this.href = this.generateHref(href);
  // Node hostname (optional)
  this.hostname = this.generateHostname(hostname);
  // Capabilities (not yet defined)
  this.caps = this.generateCaps(caps);
  // Array of objects containing a URN format type and href
  this.services = this.generateServices(services);
  return immutable(this, { prototype : Node.prototype });
}

Node.prototype.validID = Versionned.prototype.validID;
Node.prototype.generateID = Versionned.prototype.generateID;
Node.prototype.validVersion = Versionned.prototype.validVersion;
Node.prototype.generateVersion = Versionne.prototype.generateVersion;
Node.prototype.validLabel = Versionned.prototype.validLabel;
Node.prototype.generateLabel = Versionned.prototype.generateLabel;

Node.prototype.validHostname = function (hostname) { }
Node.prototype.generateHostname = function (hostname) {
  if (arguments.length === 0 || hostname === null || hostname === undefined)
    return undefined;
  else return label;
}

Node.prototype.validCaps = Versionned.prototype.validCaps;
Node.prototype.generateCaps = Versionned.prototype.generateCaps;

module.exports = Node;
