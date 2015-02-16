'use strict';

var parser = require('../../');
var parserAlt = require('../../src/parser-alt');

var msg = 'Hello, {name}!';

module.exports = {
	name: 'simple msg',
	tests: {
		parser: function () {
			parser.parse(msg);
		},
		parserAlt: function() {
			parserAlt.parse(msg);
		}
	}
};
