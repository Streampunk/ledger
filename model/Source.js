/* Copyright 2015 Christine MacNeill

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

function Source(id, version, label, description,
    format, caps, tags, device_id, parents) {

  this.id = id;
  this.version = version;
  this.label = label;
  this.description = description;
  this.format = format;
  this.caps = caps;
  this.tags = tags;
  this.device_id = device_id;
  this.parents = parents;
}

module.exports = Source;
