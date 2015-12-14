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

function NodeAPI (port, self, device, sources, flows,
    senders, receivers, app, server) {
  this.port = port;
  this.self = self;
  this.devices = [ device ];
  this.sources = [];
  this.flows = [];
  this.senders = [];
  this.receivers = [];
  this.app = express();
  this.server = null;
  return this;
  // return immutable(this, { prototype : NodeAPI.prototype });
}

NodeAPI.prototype.addFlow = function (f) {
  return this.merge({flows : [ f ]});
}

NodeAPI.prototype.init = function () {
  this.app.get('/', function (req, res) {
    res.send(`[
        "self/",
        "sources/",
        "flows/",
        "devices/",
        "senders/",
        "receivers/"
    ]`);
  });

  this.app.get('/self/', function (req, res) {
    res.json(this.self);
  }.bind(this));

  // List sources
  this.app.get('/sources/', function (req, res) {
    res.json(this.sources);
  }.bind(this));

  // Get a single source
  this.app.get('/sources/:id', function (req, res, next) {
    var source = this.sources.find(x => { return x.id === req.param.id });
    if (source) res.json(source);
    else next();
  }.bind(this));

  this.app.get('/flows/', function (req, res) {
    res.json(this.flows);
  }.bind(this));

  // List devices
  this.app.get('/devices/', function (req, res) {
    res.json(this.devices);
  }.bind(this));

  this.app.get('/devices/:id', function (req, res, next) {
    var device = this.devices.find(x => { return x.id == req.params.id });
    if (device) res.json(device);
    else next();
  }.bind(this));

  this.app.get('/senders/', function (req, res) {
    res.json(this.senders);
  }.bind(this));

  this.app.get('/receivers/', function (req, res) {
    res.json(this.receivers);
  }.bind(this));

  return this;
};

NodeAPI.prototype.start = function(e) {
  this.server = this.app.listen(this.port, function (e) {
    var host = this.server.address().address;
    var port = this.server.address().port;
    if (e && e.code == 'EADDRINUSE') {
      console.log('Address  http://%s:%s in use, retrying...', host, port);
      setTimeout(function () {
        this.server.close();
        this.app.listen(port);
      }.bnextind(this), 1000);
    }
    console.log('Streampunk media ledger service running at http://%s:%s', host, port);
  }.bind(this));
};

module.exports = NodeAPI;
