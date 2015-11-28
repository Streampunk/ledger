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

// Types of format - v1.0

var deviceTypes = Object.freeze({
  pipeline: "urn:x-ipstudio:device:pipeline",
  generic: "urn:x-ipstudio:device:generic",
  validDeviceType: function (f) {
    return f === deviceTypes.generic || f === deviceTypes.pipeline;
  }
});

module.exports = deviceTypes;
