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

var Flow = require('../model/Flow.js');

var vf = new Flow(null, null, "Techy Video Flow",
  "Video flow with added technical metadata.",
  "urn:x-nmos:format:video",
  {
    encodingName : ['raw'],
    clockRate : ['90000'],
    sampling : ['YCbCr-4:2:2'],
    width : ['1920'],
    height : ['1080'],
    depth : ['10'],
    colorimetry : ['BT709-2'],
    interlace : ['1'] ,
    packing : ['v210'] },
  null, null);

console.log(JSON.stringify(vf, null, 2));

var af = new Flow(null, null, "Techy Audio Flow",
  "Audio flow with added technical metadata.",
  "urn:x-nmos:format:audio",
  {
    encodingName : ['L24'],
    clockRate : ['48000'],
    channels : ['2']
  },
  null, null);

console.log(JSON.stringify(af, null, 2));

var ef = new Flow(null, null, "Encoded video flow",
  "Encoded video flow with added technical metadata.",
  "urn:x-nmos:format:video",
  {
    encodingName : ['H264'],
    clockRate : ['90000'],
    profile : ['42'], // Baseline
    level : ['3'],
    sampling : ['YCbCr-4:2:0'],
    width : ['1920'],
    height : ['1080'],
    depth : ['8'],
    bitrate : ['4000'] // kbps
  },
  vf.source_id, [vf.id]);

  console.log(JSON.stringify(ef, null, 2));
