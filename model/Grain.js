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

var Versionned = require('./Versionned.js');
var immutable = require('seamless-immutable');

function Grain(payload) {
  this.payload = payload;
  return immutable(this, { prototype : Grain.prototype });
}

Grain.prototype.validPaylaod = function (payload) {
  if (arguments.length === 0) return this.validPaylaod(this.payload);
  return Buffer.isBuffer(payload);
}

module.exports = Grain;
