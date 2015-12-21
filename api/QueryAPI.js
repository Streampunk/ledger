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

// NodeAPI implementation

var express = require('express');
var immutable = require('seamless-immutable');
var Node = require('../model/Node.js');
var Source = require('../model/Source.js');
var Device = require('../model/Device.js');
var Flow = require('../model/Flow.js');
var Sender = require('../model/Sender.js');
var Receiver = require('../model/Receiver.js');

function QueryState () {

}

function QueryAPI(port) {
  var state = new QueryState();
  var app = express();
  var server = null;

  this.init = function() {
    app.get('/', function (req, res) {
      res.json([
        "subscriptions/",
        "flows/",
        "sources/",
        "nodes/",
        "devices/",
        "senders/",
        "receivers/"
      ]);
    });

    app.get('/nodes/', function (req, res) {
      req.json(state.nodes);
    });

    app.get
  }

}
