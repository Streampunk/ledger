/* Copyright 2016 Christine S. MacNeill

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

var express = require('express');
var immutable = require('seamless-immutable');

function RegistrationAPI (port, store) {
  var app = express();
  var server = null;

  /**
   * Returns the port that this Registration API is configured to use.
   * @return {Number} Port for this node API.
   */
  this.getPort = function () {
    return port;
  }

  /**
   * Initialise the Node APIs routing table.
   * @return {NodeAPI} Returns this object with the routing table initialised and
   *                   ready to {@link NodeAPI#start}.
   */
  this.init = function() {

    app.get('/', function (req, res) {
      res.json(['x-ipstudio/']);
    });

    app.get('/x-ipstudio/', function (req, res) {
      res.json(['registration/']);
    });

    app.get('/x-ipstudio/registration/', function (req, res) {
      res.json([ "v1.0/" ]);
    });

    var qapi = express();
    // Mount all other methods at this base path
    app.use('/x-ipstudio/registration/v1.0/', qapi);

    qapi.get('/', function (req, res) {
      res.json([
        "resource/",
        "health/"
      ]);
    });

    return this;
  }

  /**
   * Start the Registration API server. If the port is already in use, the server
   * will be closed.
   * @param  {RegistrationAPI~trackStatus=} cb Optional callback to track API starting
   *                                           or errors.
   * @return {RegistrationAPI}                 This object with an asynchronous request
   *                                           to start the server.
   */
  this.start = function (cb) {
    server = app.listen(port, function (e) {
      var host = server.address().address;
      var port = server.address().port;
      if (e) {
        if (e.code == 'EADDRINUSE') {
          console.log('Address http://%s:%s already in use.', host, port);
          server.close();
        };
        if (cb) cb(e);
      } else {
        console.log('Streampunk media ledger registration service running at http://%s:%s',
          host, port);
        if (cb) cb();
      };
    });

  //  this.startMDNS();

    return this;
  }

  /**
   * Stop the server running the Registration API.
   * @param  {RegistrationAPI~trackStatus=} cb Optional callback that tracks when the
   *                                           server is stopped.
   * @return {RegistrationAPI}                 This object with an asynchronous request
   *                                           to stop the server.
   */
  this.stop = function(cb) {
    if (server) server.close(cb);
    else {
      if (cb) cb(new Error('Server is not set for this Registration API and so cannot be stopped.'));
    }
    server = null;
    return this;
  }

}

/**
 * Function called when server has been started or stopped.
 * @callback {RegistrationAPI~trackStatus}
 * @param {Error=} Set if an error occurred when starting or stopping the server.
 */

module.exports = RegistrationAPI;
