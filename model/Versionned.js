/* Copyright 2015 Christine MacNeill

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

var uuid = require('uuid');
var immutable = require('seamless-immutable');

function nanoSeconds(hrtime) {
  return hrtime[0] * 1e9 + hrtime[1];
}

var loadHRTime = nanoSeconds(process.hrtime());
var loadDate = Date.now();

function Versionned(id, version, label) {
  this.id = this.generateID(id);
  this.version = this.generateVersion(version);
  this.label = this.generateLabel(label);
  return immutable(this, {prototype: Versionned.prototype});
}

Versionned.prototype.generateID = function (id) {
  if (arguments.length === 0 || id === null || id === undefined)
    return uuid.v4();
  else return id;
}

Versionned.prototype.generateVersion = function (version) {
  if (arguments.length === 0 || version === null || version === undefined) {
    var currentNanos = nanoSeconds(process.hrtime());
    var difference = currentNanos - loadHRTime;
    var microDate = loadDate + Math.floor(difference / 1e6);
    return Math.floor(microDate / 1e3) + ":" + (difference % 1e9);
  }
  else return version;
}

Versionned.prototype.generateLabel = function (label) {
  if (arguments.length === 0 || label === null || label === undefined)
    return '';
  else return label;
}

Versionned.prototype.validID = function (id) {
  if (arguments.length === 0) return this.validID(this.id);
  return id !== null && id !== undefined &&
    (id.constructor === String.prototype.constructor) &&
    (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/) !== null);
}

Versionned.prototype.validVersion = function (version) {
  if (arguments.length === 0) return this.validVersion(this.version);
  return version !== null && version !== undefined &&
    (version.constructor === String.prototype.constructor) &&
    (version.match(/^[0-9]+:[0-9]+$/) !== null);
}

Versionned.prototype.validLabel = function (label) {
  if (arguments.length === 0) return this.validLabel(this.label);
  return label !== null && label !== undefined &&
    (label.constructor === String.prototype.constructor);
}

Versionned.prototype.valid = function() {
  return this.validID(this.id) && this.validVersion(this.version) &&
    this.validLabel(this.label);
}

Versionned.prototype.stringify = function() { return JSON.stringify(this); }

Versionned.prototype.parse = function (json) {
  if (json === null || json === undefined || arguments.length === 0 ||
      json.constructor !== String.prototype.constructor)
    throw "Cannot parse JSON to a Versionned value because it is not a valid input.";
  var parsedJSON = JSON.parse(json);
  return new Versionned(parsedJSON.id, parsedJSON.version, parsedJSON.label);
}

module.exports = Versionned;
