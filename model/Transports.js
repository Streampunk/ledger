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

// Types of transport - v1.0

// A URN describing the protocol used to send data (video, audio, events etc.)
// over a network.

var transports = Object.freeze({
  rtp: "urn:x-ipstudio:transport:rtp",
  rtp_ucast: "urn:x-ipstudio:transport:rtp.ucast",
  rtp_mcast: "urn:x-ipstudio:transport:rtp.mcast",
  dash: "urn:x-ipstudio:transport:dash",
  validTransport: function (t) {
    return t === transports.rtp || t === transports.rtp_ucast ||
      t === transports.rtp_mcast || t === transports.dash;
  }
});

module.exports = transports;
