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

/**
 * List of media types that are defined by the current version of the spec,
 * currently v1.1.
 * @enum {string}
 * @readonly
 */
var mediaTypes = {
  video_raw: "video/raw",
  video_h264: "video/h264",
  video_vc2: "video/vc2",
  audio_l24: "audio/L24",
  audio_l16: "audio/L16",
  video_smpte291: "video/smpte291",
  video_ST2022_6: "video/SMPTE_ST2022_6"
};

mediaTypes.knownTypes = function (f, v) {
  return typeof f === 'string' &&
    Object.keys(mediaTypes).some(function (t) { return f === t });
};

mediaTypes.match = function (s) {
  return s.match(/^([^\s\/]+)\/([^\s\/]+)$/);
}

module.exports = Object.freeze(mediaTypes);
