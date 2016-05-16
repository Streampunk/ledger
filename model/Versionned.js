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

var uuid = require('uuid');
var immutable = require('seamless-immutable');
var Capabilities = require('./Capabilities.js')
var Transports = require('./Transports.js');
var Formats = require('./Formats.js');
var DeviceTypes = require('./DeviceTypes.js');

function nanoSeconds(hrtime) {
  return hrtime[0] * 1e9 + hrtime[1];
}

var loadHRTime = nanoSeconds(process.hrtime());
var loadDate = Date.now();

/**
 * Supertype of every class that has UUID identity, version numbers and labels.
 * Methods are designed to be mixed in piecemeal as required.
 * @constructor
 * @param {string} id      Globally unique UUID identifier for the resource.
 * @param {string} version String formatted PTP timestamp
 *                         (&lt;<em>seconds</em>&gt;:&lt;<em>nanoseconds<em>&gt;)
 *                         indicating precisely when an attribute of the resource
 *                         last changed.
 * @param {string} label   Freeform string label for the resource.
 */
function Versionned(id, version, label) {
  /**
   * Globally unique UUID identifier for the resource.
   * @type {string}
   * @readonly
   */
  this.id = this.generateID(id);
  /**
   * String formatted PTP timestamp (&lt;<em>seconds</em>&gt;:&lt;<em>nanoseconds</em>&gt;)
   * indicating precisely when an attribute of the resource last changed.
   * @type {string}
   * @readonly
   */
  this.version = this.generateVersion(version);
  /**
   * Freeform string label for the resource.
   * @type {string}
   * @readonly
   */
  this.label = this.generateLabel(label);
  return immutable(this, {prototype: Versionned.prototype});
}

/**
 * Generate an [identifier]{@link Versionned#id} when one is not provided,
 * otherwise pass this one through. No validation takes place.
 * @param  {string=} id Identifier to pass through.
 * @return {string}     Value passed to the method or a generated pseudo-random
 *                      UUID for no arguments, null or undefined.
 */
Versionned.prototype.generateID = function (id) {
  if (arguments.length === 0 || id === null || id === undefined)
    return uuid.v4();
  else return id;
}

/**
 * Generate a [version number]{@link Versionned#version} when one is not provided,
 * otherwise pass the given one through. No validation takes place.
 * @param  {string=} version Version number to pass through.
 * @return {string}          Value passed to the method or a generated version
 *                           number from the current clock with no arguments,
 *                           null or undefined.
 */
Versionned.prototype.generateVersion = function (version) {
  if (arguments.length === 0 || version === null || version === undefined) {
    var currentNanos = nanoSeconds(process.hrtime());
    var difference = currentNanos - loadHRTime;
    var microDate = loadDate + Math.floor(difference / 1e6);
    return Math.floor(microDate / 1e3) + ":" + (difference % 1e9);
  }
  else return version;
}

/**
 * Generate a [label]{@link Versionned#label} when one is not provided, otherwise
 * pass the given one through. No validation takes place.
 * @param  {string=} label Label to pass through.
 * @return {string}        Value passed to the method or an empty string for
 *                         no arguments, null or undefined.
 */
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

Versionned.prototype.validCaps = function (caps) {
  if (arguments.length === 0) return this.validCaps(this.caps);
  return typeof caps === 'object' && caps !== null &&
    Array.isArray(caps) === false && Object.keys(caps).length === 0;
}

Versionned.prototype.generateCaps = function (caps) {
  if (arguments.length === 0 || caps === null || caps === undefined)
    return Capabilities;
  else return caps;
}

Versionned.prototype.validTags = function (tags) {
  if (arguments.length === 0) return this.validTags(this.tags);
  if (!(tags instanceof Object)) return false;
  if (Array.isArray(tags)) return false;
  return Object.keys(tags).every(function (k) {
    var v = tags[k];
    return Array.isArray(v) && v.every(function (s) {
      return typeof s === 'string';
    });
  });
}

Versionned.prototype.validTransport = function (t) {
  if (arguments.length === 0) return this.validTransport(this.transport);
  else return Transports.validTransport(t);
}
Versionned.prototype.generateTransport = function (t) {
  if (arguments.length === 0 || t === null || t === undefined)
    return Transports.rtp;
  else return t;
}

Versionned.prototype.validFormat = function (f) {
  if (arguments.length === 0) return this.validFormat(this.format);
  else return Formats.validFormat(f);
}
Versionned.prototype.generateFormat = function (format) {
  if (arguments.length === 0 || format === null || format === undefined)
    return Formats.video;
  else return format;
}

Versionned.prototype.validDeviceType = function (d) {
  if (arguments.length === 0) return this.validDeviceType(this.deviceType);
  else return DeviceTypes.validDeviceType(d);
}
Versionned.prototype.generateDeviceType = function (d) {
  if (arguments.length === 0 || d === null || d === undefined)
    return DeviceTypes.generic;
  else return d;
}

Versionned.prototype.generateTags = function (tags) {
  if (arguments.length === 0 || tags === null || tags === undefined)
    return {};
  else return tags;
}

Versionned.prototype.validUUIDArray = function (a) {
  if (!Array.isArray(a)) return false;
  return a.every(Versionned.prototype.validID);
}

Versionned.prototype.generateUUIDArray = function (a) {
  if (arguments.length === 0 || a === null || a === undefined)
    return [];
  else return a;
}

/**
 * Checks that all the properties of this resource are valid. The is a syntactic
 * check and does not check semantics such as references to other objects can be
 * checked. Valid includes:
 * <ul>
 *  <li>Required properties are defined and not null.</li>
 *  <li>Identifiers a valid UUIDs.</li>
 *  <li>Enumerations are known values and/or match expected patterns.</li>
 *  <li>Values are of the expected type.</li>
 * </ul>
 * @return {boolean} Is the resource valid?
 */
Versionned.prototype.valid = function() {
  return this.validID(this.id) && this.validVersion(this.version) &&
    this.validLabel(this.label);
}

Versionned.prototype.stringify = function() { return JSON.stringify(this); }

Versionned.prototype.parse = function (json) {
  if (json === null || json === undefined || arguments.length === 0 ||
      (typeof json !== 'string' && typeof json !== 'object'))
    throw "Cannot parse JSON to a Versionned value because it is not a valid input.";
  var parsedJSON = (typeof json === 'string') ? JSON.parse(json) : json;
  return new Versionned(parsedJSON.id, parsedJSON.version, parsedJSON.label);
}

module.exports = Versionned;
