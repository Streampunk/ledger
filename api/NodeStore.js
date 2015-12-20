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

/**
 * Add a status code to an error object.
 * @param  {Number} status  Status code for the error.
 * @param  {string} message Error message describing the error.
 * @return {Error}          The newly created error with status set.
 */
function statusError(status, message) {
  var e = new Error(message);
  e.status = status;
  return e;
}

/**
 * Generic store providing access to the current state of a node.
 * @interface
 */
function NodeStore() {}

/**
 * Retrieve details of the node as the result of the callback.
 * @param  {NodeStore~nodeCallback} cb Callback with the node result.
 */
NodeStore.prototype.getSelf = function(cb) {
  cb(statusError(500, 'Method getSelf must be implemented by extending NodeStore.'));
}

/**
 * Callback containing a single node result.
 * @callback NodeStore~nodeCallback
 * @param {Error} err    Error retrieving the node's details.
 * @param {Node}  result Node details.
 */

/**
 * Get all the devices available at this node.
 * @param  {number=}   skip  Number of devices to skip before starting the listing.
 * @param  {number=}   limit Limit the number of values returned.
 * @param  {NodeStore~devicesCallback} cb    Callback providing the list of devlices.
 */
NodeStore.prototype.getDevices = function (skip, limit, cb) {
  cb(statusError(500, 'Method getDevices must be implemented by extending NodeStore.'));
}

/**
 * Callback to contain a list of devices.
 * @callback NodeStore~devicesCallback
 * @param {Error}    err     Error retrieving the list of devices.
 * @param {Device[]} result  List of devices.
 * @param {number=}  total   Total number of devices.
 * @param {number=}  pageOf  Current page number.
 * @param {number=}  pages   Total number of pages.
 * @param {number=}  size    Number of items per page. Up to the provided limit.
 */

/**
 * Get the details of a specific device.
 * @param  {String}   id Identity of the device being queried. String as UUID.
 * @param  {NodeStore~deviceCallback} cb Callback with the device result.
 */
NodeStore.prototype.getDevice = function (id, cb) {
  cb(statusError(500, 'Method getDevice must be implemented by extending NodeStore.'));
}

/**
 * Callback with the single requested device.
 * @callback NodeStore~deviceCallback
 * @param {Error}   err    Error retrieving the device's details.
 * @param {Device}  result Single requested device.
 */

NodeStore.prototype.getSources = function (skip, limit, cb) {
  cb(statusError(500, 'Method getSources must be implemented by extending NodeStore.'));
}

NodeStore.prototype.getSource = function (id, cb) {
  cb(statusEroor(500, 'Method getSource must be implemented by extending NodeStore.'));
}

NodeStore.prototype.getSenders = function (skip, limit, cb) {
  cb(statusError(500, 'Method getSenders must be implemented by extending NodeStore.'));
}

NodeStore.prototype.getSender = function (id, cb) {
  cb(statusError(500, 'Method getSender must be implemented by extending NodeStore.'));
}

NodeStore.prototype.getReceivers = function (skip, limit, cb) {
  cb(statusError(500, 'Method getReceivers must be implemented by extending NodeStore.'));
}

NodeStore.prototype.getReceiver = function (id, cb) {
  cb(statusError(500, 'Method getReceiver must be implemented by extending NodeStore.'));
}

NodeStore.prototype.getFlows = function (skip, limit, cb) {
  cb(statusError(500, 'Method getFlows must be implemented by extending NodeStore.'));
}

NodeStore.prototype.getFlow = function (id, cb) {
  cb(statusError(500, 'Method getFlow must be implemented by extending NodeStore.'));
}

module.exports = NodeStore;
