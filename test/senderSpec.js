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

var Sender = require ('../model/Sender.js');
var test = require('tape');

var methods = Sender.prototype;

var bbcSenderJSON = `{
    "description": "LCH Studio Cam 1 UHD",
    "label": "LCH Studio Cam 1 UHD",
    "manifest_href": "http://172.29.176.146:12345/x-ipstudio/node/v1.0/self/pipelinemanager/run/pipeline/1/pipel/ipp_rtptxdfb1/misc/sdp/",
    "version": "1441723958:235623703",
    "flow_id": "b25d445a-20dc-4937-a8a1-5cb3d5c613ee",
    "id": "171d5c80-7fff-4c23-9383-46503eb1c63e",
    "transport": "urn:x-ipstudio:transport:rtp.mcast",
    "device_id": "c501ae64-f525-48b7-9816-c5e8931bc017"
}`;
