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

var Flow = require ('../model/Flow.js');
var test = require('tape');

var methods = Flow.prototype;

var bbcFlowJSON = `{
    "description": "LCH Lab Capture Audio Proxy",
    "format": "urn:x-ipstudio:format:audio",
    "tags": {
        "host": [
            "ap-ch-z820-4.rd.bbc.co.uk"
        ]
    },
    "label": "LCH Lab Capture Audio Proxy",
    "version": "1441812152:154331951",
    "source_id": "2aa143ac-0ab7-4d75-bc32-5c00c13d186f",
    "id": "b3bb5be7-9fe9-4324-a5bb-4c70e1084449"
}`;

var bbcFlow = new Flow(
  'b3bb5be7-9fe9-4324-a5bb-4c70e1084449',
  '1441812152:154331951',
  'LCH Lab Capture Audio Proxy',
  'LCH Lab Capture Audio Proxy',
  'urn:x-ipstudio:format:audio',
  '2aa143ac-0ab7-4d75-bc32-5c00c13d186f',
  []
);
