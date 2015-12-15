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

function NodeState(self) {
  this.self = self;
  this.devices = [];
  this.sources = [];
  this.flows = [];
  this.senders = [];
  this.receivers = [];
  return immutable(this, { prototype : NodeState.prototype });
}

NodeState.prototype.addDevice = function (device) {
  return this.merge({
    devices : this.devices.concat([device]),
    self : this.self.merge({ services : this.self.services.concat([device.id]) })
  });
}

function NodeAPI (port, self) {
  var state = new NodeState(self);
  var app = express();
  var server = null;

  this.addDevice = function(device) {
    state = state.addDevice(device);
  }

  this.init = function() {
    app.get('/', function (req, res) {
      res.json([
          "self/",
          "sources/",
          "flows/",
          "devices/",
          "senders/",
          "receivers/"
      ]);
    });

    app.get('/self/', function (req, res) {
      res.json(state.self);
    });

    // List sources
    app.get('/sources/', function (req, res) {
      res.json(state.sources);
    });

    // Get a single source
    app.get('/sources/:id', function (req, res, next) {
      var source = state.sources.find(x => { return x.id === req.param.id });
      if (source) res.json(source);
      else next();
    });

    // List flows
    app.get('/flows/', function (req, res) {
      res.json(state.flows);
    });

    // Get a single flow
    app.get('/flows/:id', function (req, res, next) {
      var flow = state.flows.find(x => { return x.id == req.params.id });
      if (flow) res.json(flow);
      else next();
    });

    // List devices
    app.get('/devices/', function (req, res) {
      res.json(state.devices);
    });

    // Get a single device
    app.get('/devices/:id', function (req, res, next) {
      var device = state.devices.find(x => { return x.id == req.params.id });
      if (device) res.json(device);
      else next();
    });

    // List senders
    app.get('/senders/', function (req, res) {
      res.json(state.senders);
    });

    app.get('/senders/:id', function (req, res, next) {
      var sender = state.senders.find(x => { return x.id == req.params.id });
      if (sender) res.json(sender);
      else next();
    });

    app.get('/receivers/', function (req, res) {
      res.json(state.receivers);
    });

    app.get('/receivers/:id', function (req, res) {
      var receiver = state.receivers.find(x => { return x.id == req.params.id });
      if (receiver) res.json(receiver);
      else next();
    });

    app.use(function (req, res) {
      res.status(404).json({
        status : 404,
        message : 'Could not find the requested resource.',
        path : req.path
      });
    });

    return this;
  }

  this.start = function () {
    server = app.listen(port, function (e) {
      var host = server.address().address;
      var port = server.address().port;
      if (e && e.code == 'EADDRINUSE') {
        console.log('Address  http://%s:%s in use, retrying...', host, port);
        setTimeout(function () {
          server.close();
          app.listen(port);
        }, 1000);
      }
      else console.log('Streampunk media ledger service running at http://%s:%s',
          host, port);
    });
  }

  return immutable(this, { prototype : NodeAPI.prototype });
}

module.exports = NodeAPI;
