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

var Receiver = require ('../model/Receiver.js');
var test = require('tape');
var Formats = require('../model/Formats.js');
var Transports = require('../model/Transports.js');

var methods = Receiver.prototype;

var bbcReceiverJSON = `{
    "description": "ap-z800-4 quad rtp receiver 4",
    "tags": {
        "Location": [
            "MCUK"
        ]
    },
    "format": "urn:x-ipstudio:format:video",
    "caps": {},
    "device_id": "0d0cb97e-b96a-4a39-887f-d491492d9081",
    "version": "1441895693:480000000",
    "label": "MCUK Gallery QuadView Right 4",
    "id": "3350d113-1593-4271-a7f5-f4974415bb8e",
    "transport": "urn:x-ipstudio:transport:rtp",
    "subscription": {
        "sender_id": "55311762-8003-48fa-a645-0a0c7621ce45"
    }
}`;

var bbcReceiver = new Receiver(
  '3350d113-1593-4271-a7f5-f4974415bb8e',
  '1441895693:480000000',
  'MCUK Gallery QuadView Right 4',
  'ap-z800-4 quad rtp receiver 4',
  'urn:x-ipstudio:format:video',
  {}, // caps
  { Location : [ 'MCUK' ]},
  '0d0cb97e-b96a-4a39-887f-d491492d9081',
  'urn:x-ipstudio:transport:rtp',
  { sender_id : 'urn:x-ipstudio:transport:rtp' }
);
