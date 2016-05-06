/* Copyright 2016 Christine S. MacNeill

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

// Test the Node API interacting with the Regisration API.

var test = require('tape');
var ledger = require('../index.js');

var RegistrationAPI = require('../api/RegistrationAPI.js');
var QueryAPI = require('../api/QueryAPI.js');
var NodeRAMStore = require('../api/NodeRAMStore.js');

var properties = {
  queryPort : '3002',
  registrationPort : '3001',
  queryName : 'ledger_query',
  registrationName : 'ledger_registration',
  queryPri : '100',
  registrationPri : '100'
};

var store = new NodeRAMStore();

var registrationAPI = new RegistrationAPI(+properties.registrationPort, store,
  properties.registrationName, +properties.registrationPri);
var queryAPI = new QueryAPI(+properties.queryPort, registrationAPI.getStore,
  properties.queryName, +properties.queryPri);

registrationAPI.init().start();
queryAPI.init().start();


var node = new ledger.Node(null, null, "Ledger Node", "http://192.168.0.1:3000",
  "ledger");
var store = new ledger.NodeRAMStore(node);
var nodeAPI = new ledger.NodeAPI(3000, store);
nodeAPI.init().start();

setTimeout(() => { nodeAPI.stop() }, 60000);
