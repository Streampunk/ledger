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

// Types of device - v1.0

/**
 * Types of [device]{@link Device}.
 * @readonly
 * @enum {string}
 */
var deviceTypes = {
  /** Value <code>urn:x-nmos:device:pipeline</code>. */
  pipeline: "urn:x-nmos:device:pipeline",
  /** Value <code>urn:x-nmos:device:generic</code>. */
  generic: "urn:x-nmos:device:generic"
};

/** Check if a value is a valid device type. */
deviceTypes.validDeviceType = function (f) {
  return f === deviceTypes.generic || f === deviceTypes.pipeline;
};

module.exports = Object.freeze(deviceTypes);
