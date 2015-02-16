'use strict';

var parser = require('../../');
var parserAlt = require('../../src/parser-alt');

var msg = 'Hello, world!';

module.exports = {
	name: 'string msg',
	tests: {
		parser: function () {
			parser.parse(msg);
		},
		parserAlt: function() {
			parserAlt.parse(msg);
		}
	}
};
