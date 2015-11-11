var Source = require('./model/source.js');

console.log(Source);

var s = new Source("1234", "zyz:zyz", "sourcy",
  "testing sources", "LP", {}, ["onety", "twoty"], "devid", []);

console.log(JSON.stringify(s));
