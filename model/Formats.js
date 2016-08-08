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

// Types of format - v1.0

/**
 * A URN describing the data format of a video, audio or event
 * [flow]{@link Flow
 *
 * <p>Sub-classifications of these core URNs may also be encountered within this
 * API version (such as urn:x-nmos:format:video.raw), and should still be
 * interpreted correctly by consumers up to the boundaries above.</p>
 * @enum {string}
 * @readonly
 */
var formats = {
  /** Value <code>urn:x-nmos:format:video</code>. */
  video: "urn:x-nmos:format:video",
  /** Value <code>urn:x-nmos:format:audio</code>. */
  audio: "urn:x-nmos:format:audio",
  /** Value <code>urn:x-nmos:format:event</code>. */
  event: "urn:x-nmos:format:event",
  /** Value <code>urn:x-nmos:format:mux:sdi</code>/ */
  mux_sdi: "urn:x-nmos:format:mux:sdi"
};

formats.validFormat = function (f) {
  return typeof f === 'string' &&
    (f.startsWith(formats.video) ||
      f.startsWith(formats.audio) ||
      f.startsWith(formats.event) ||
      f.startsWith(formats.mux_sdi));
};

module.exports = Object.freeze(formats);
