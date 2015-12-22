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
 * Add a status code to an error object.
 * @param  {Number} status  Status code for the error.
 * @param  {string} message Error message describing the error.
 * @return {Error}          The newly created error with status set.
 */
NodeStore.prototype.statusError = statusError;

/**
 * Generic store providing access to the current state of a [node]{@link Node}.
 * @interface
 */
function NodeStore() {}

/**
 * Retrieve details of the node as the result of the callback.
 * @param  {NodeStore~nodeCallback} cb Callback with the node result.
 */
NodeStore.prototype.getSelf = function(cb) {
  cb(this.statusError(500, 'Method getSelf must be implemented by extending NodeStore.'));
}

/**
 * Update the defails of the [node]{@link Node} represented by this store. The
 * following conditions are checked:
 * <ul>
 *  <li>The [version number]{@link Node#version} is more up-to-date than the
 *   stored self.</li>
 *  <li>The identifier of the passed node is the same as the one that is stored.</li>
 *  <li>The node is [valid]{@link Node#valid}.</li>
 * </ul>
 * @param  {Node}     node Node value to replace the current one.
 * @param  {NodeStore~nodeCallback} cb   Callback with the updated node or details
 *                                       of update issues.
 */
NodeStore.prototype.putSelf = function (node, cb) {
  cb(this.statusError(500, 'Method putSelf must be implemented by extending NodeStore.'));
}
/**
 * Callback containing a single node result.
 * @callback NodeStore~nodeCallback
 * @param {Error}      err    Error retrieving the node's details.
 * @param {Node}       result Node details.
 * @param {NodeStore=} store  New state of the node store if it has changed.
 */

/**
 * Get all the devices available at this [node]{@link Node}.
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
 * @param {number=}  pageOf  Current page number, starting from 1.
 * @param {number=}  pages   Total number of pages.
 * @param {number=}  size    Number of items on this page. Up to the provided limit.
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
 * @param {Error}      err    Error retrieving the device's details.
 * @param {Device}     result Single requested device.
 * @param {NodeStore=} store  New state of the node store if it has changed.
 */

/**
 * Add or update a [device]{@link Device} on this [node]{@link Node}. The
 * following conditions are checked:
 * <ul>
 *  <li>If the device already exists, the [version number]{@link Device#version}
 *   must be more up-to-date.</li>
 *  <li>The [node_id]{@linkplain Device#node_id} property is set to the identifier
 *   of this node.</li>
 *  <li>All referenced [senders]{@link Sender} must exist in this store.</li>
 *  <li>All referenced [receivers]{@link Receiver} must exist in this store.</li>
 *  <li>The device is [valid]{@link Device#valid}.</li>
 * </ul>
 * @param  {Device}   device Device to add or replace.
 * @param  {NodeStore~deviceCallback} cb Callback containing the device and
 *                                       updated store, or an error.
 */
NodeStore.prototype.putDevice = function (device, cb) {
  cb(statusError(500, 'Method putDevice must be implemented by extending NodeStore.'));
}

NodeStore.prototype.deleteDevice = function (id, cb) {
  cb(statusError(500, 'Method deleteDevice must be implemented by extending NodeStore.'));
}

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

NodeStore.prototype.putSender = function (sender, cb) {
  cb(statusError(500, 'Method putSender must be implemented by extending NodeStore.'));
}

NodeStore.prototype.deleteSender = function (id, cb) {
  cb(statusError(500, 'Method deleteSender must be implemented by extending NodeStore.'));
}

NodeStore.prototype.putReceiver = function (receiver, cb) {
  cb(statusError(500, 'Method putReceiver must be implemented by extending NodeStore.'));
}

NodeStore.prototype.deleteReceiver = function (id, cb) {
  cb(statusError(500, 'Method deleteReceiver must be implemented by extending NodeStore.'));
}

NodeStore.prototype.putSource = function (source, cb) {
  cb(statusError(500, 'Method putSource must be implemented by extending NodeStore.'));
}

NodeStore.prototype.deleteSource = function (id, cb) {
  cb(statusError(500, 'Method deleteSource must be implemented by extending NodeStore.'));
}

NodeStore.prototype.putFlow = function (flow, cb) {
  cb(statusError(500, 'Method putFlow must be implemented by extending NodeStore.'));
}

NodeStore.prototype.deleteFlow = function (id, cb) {
  cb(statusError(500, 'Method deleteFlow must be implemented by extending NodeStore.'));
}

module.exports = NodeStore;
