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

/**
 * A URN describing the data format of a video, audio or event
 * [flow]{@link Flow
 *
 * <p>Sub-classifications of these core URNs may also be encountered within this
 * API version (such as urn:x-ipstudio:format:video.raw), and should still be
 * interpreted correctly by consumers up to the boundaries above.</p>
 * @enum {string}
 * @readonly
 */
var formats = {
  /** Value <code>urn:x-ipstudio:format:video</code>. */
  video: "urn:x-ipstudio:format:video",
  /** Value <code>urn:x-ipstudio:format:audio</code>. */
  audio: "urn:x-ipstudio:format:audio",
  /** Value <code>urn:x-ipstudio:format:event</code>. */
  event: "urn:x-ipstudio:format:event"
};

formats.validFormat =function (f) {
  return typeof f === 'string' &&
    (f.startsWith(formats.video) ||
      f.startsWith(formats.audio) ||
      f.startsWith(formats.event) );
};

module.exports = Object.freeze(formats);
