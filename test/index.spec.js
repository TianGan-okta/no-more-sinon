const path = require('path');
const pluginTester = require('babel-plugin-tester/pure').default;
const plugin = require('../src');

pluginTester({
  plugin: plugin,
  fixtures: path.join(__dirname, 'fixtures'),
  snapshot: true,
  formatResult: r => r,
});
