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

// Types of transport - v1.0

/**
 * A URN describing the protocol used to send data (video, audio, events etc.)
 * over a network.
 *
 * <p>For example, an RTP Transmitter sending to a multicast group should use the
 * transport 'urn:x-nmos:transport:rtp.mcast', but a receiver supporting
 * both unicast and multicast should present the transport
 * 'urn:x-nmos:transport:rtp' to indicate its less restrictive state.</p>
 * @readonly
 * @enum {string}
 */
var transports = {
  /** Value <code>urn:x-nmos:transport:rtp</code>. */
  rtp: "urn:x-nmos:transport:rtp",
  /** Value <code>urn:x-nmos:transport:rtp.ucast</code>. */
  rtp_ucast: "urn:x-nmos:transport:rtp.ucast",
  /** Value <code>urn:x-nmos:transport:rtp.mcast</code>. */
  rtp_mcast: "urn:x-nmos:transport:rtp.mcast",
  /** Value <code>urn:x-nmos:transport:dash</code>. */
  dash: "urn:x-nmos:transport:dash"
};

transports.validTransport = function (t) {
  return t === transports.rtp || t === transports.rtp_ucast ||
    t === transports.rtp_mcast || t === transports.dash;
};

module.exports = Object.freeze(transports);
