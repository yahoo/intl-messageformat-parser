'use strict';

var parser = require('../../');
var parserAlt = require('../../src/parser-alt');

var msg = '' +
    'Yo, {firstName} {lastName} has ' +
    '{numBooks, number, integer} ' +
    '{numBooks, plural, ' +
        'one {book} ' +
        'other {books}}.';

module.exports = {
	name: 'normal msg',
	tests: {
		parser: function () {
			parser.parse(msg);
		},
		parserAlt: function() {
			parserAlt.parse(msg);
		}
	}
};
