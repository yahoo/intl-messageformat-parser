'use strict';

var parser = require('../../');
var parserAlt = require('../../src/parser-alt');

var msg = '' +
    '{gender_of_host, select, ' +
      'female {' +
        '{num_guests, plural, offset:1 ' +
          '=0 {{host} does not give a party.}' +
          '=1 {{host} invites {guest} to her party.}' +
          '=2 {{host} invites {guest} and one other person to her party.}' +
          'other {{host} invites {guest} and # other people to her party.}}}' +
      'male {' +
        '{num_guests, plural, offset:1 ' +
          '=0 {{host} does not give a party.}' +
          '=1 {{host} invites {guest} to his party.}' +
          '=2 {{host} invites {guest} and one other person to his party.}' +
          'other {{host} invites {guest} and # other people to his party.}}}' +
      'other {' +
        '{num_guests, plural, offset:1 ' +
          '=0 {{host} does not give a party.}' +
          '=1 {{host} invites {guest} to their party.}' +
          '=2 {{host} invites {guest} and one other person to their party.}' +
          'other {{host} invites {guest} and # other people to their party.}}}}';

module.exports = {
	name: 'complex msg',
	tests: {
		parser: function () {
			parser.parse(msg);
		},
		parserAlt: function() {
			parserAlt.parse(msg);
		}
	}
};
