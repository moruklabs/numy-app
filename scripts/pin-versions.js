const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const getVersion = (dep) => {
  try {
    // Look in node_modules in the root
    const p = path.join(__dirname, '..', 'node_modules', dep, 'package.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8')).version;
    }
  } catch (e) { }
  return null;
};

['dependencies', 'devDependencies'].forEach(type => {
  if (!pkg[type]) return;
  for (const dep of Object.keys(pkg[type])) {
    const v = getVersion(dep);
    if (v) pkg[type][dep] = v;
  }
});

console.log(JSON.stringify(pkg, null, 2));
