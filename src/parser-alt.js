"use strict";

/**
 * Parser
 *
 * Turns this:
 *  `You have { numBananas, plural,
 *       =0 {no bananas}
 *      one {a banana}
 *    other {# bananas}
 *  } for sale`
 *
 * into this:
 *  {
 *    type: "messageFormatPattern",
 *    elements: [
 *      {
 *        type: "messageTextElement",
 *        value: "You have "
 *      },
 *      {
 *        type: "argumentElement",
 *        id: "numBananas",
 *        format: {
 *          type: "pluralFormat",
 *          offset: 0,
 *          options: [
 *            {
 *              type: "optionalFormatPattern",
 *              selector: "=0",
 *              value: {
 *                type: "messageFormatPattern",
 *                elements: [
 *                  {
 *                    type: "messageTextElement",
 *                    value: "no bananas"
 *                  }
 *                ]
 *              }
 *            },
 *            {
 *              type: "optionalFormatPattern",
 *              selector: "one",
 *              value: {
 *                type: "messageFormatPattern",
 *                elements: [
 *                  {
 *                    type: "messageTextElement",
 *                    value: "a banana"
 *                  }
 *                ]
 *              }
 *            },
 *            {
 *              type: "optionalFormatPattern",
 *              selector: "other",
 *              value: {
 *                type: "messageFormatPattern",
 *                elements: [
 *                  {
 *                    type: "pluralNumberElement"
 *                  },
 *                  {
 *                    type: "messageTextElement",
 *                    value: " bananas"
 *                  }
 *                ]
 *              }
 *            }
 *          ]
 *        }
 *      },
 *      {
 *        type: "messageTextElement",
 *        value: " for sale."
 *      }
 *    ]
 *  }
 **/
function Parser(options) {
	this.escape = options && options.escape || "'";
	this.pattern = null;
	this.index = 0;
}

Parser.prototype = {

	parse: function parse(pattern) {
		this.pattern = pattern;
		this.index = 0;
		return this.parseMessage("message");
	},


	isDigit: function isDigit(char) {
		return (
			"0" === char ||
			"1" === char ||
			"2" === char ||
			"3" === char ||
			"4" === char ||
			"5" === char ||
			"6" === char ||
			"7" === char ||
			"8" === char ||
			"9" === char
		);
	},


	isWhitespace: function isWhitespace(char) {
		return (
			" " === char ||
			"\t" === char ||
			"\n" === char ||
			"\r" === char ||
			"\f" === char ||
			"\v" === char ||
			"\u00A0" === char ||
			"\u2028" === char ||
			"\u2029" === char
		);
	},


	skipWhitespace: function skipWhitespace() {
		var
			pattern = this.pattern,
			length = pattern.length;
		while (
			this.index < length &&
			this.isWhitespace(pattern.charAt(this.index))
		) {
			++this.index;
		}
	},


	parseText: function parseText(parentType) {
		var
			text = "",
			char,
			pattern = this.pattern,
			length = pattern.length,
			isHashSpecial = "plural" === parentType || "selectordinal" === parentType,
			isArgStyle = "style" === parentType,
			escape = this.escape;

		while (this.index < length) {
			char = pattern.charAt(this.index);
			if (
				"{" === char ||
				"}" === char ||
				isHashSpecial && "#" === char ||
				isArgStyle && this.isWhitespace(char)
			) {
				break; // reached end of string
			} else if ("'" === escape && "'" === char) {
				// handle ' escaping
				char = pattern.charAt(++this.index);
				if ("'" === char) {
					// double is always 1 '
					text += char;
					++this.index;
				} else if ( // only when necessary
					"{" === char ||
					"}" === char ||
					isHashSpecial && "#" === char ||
					isArgStyle && this.isWhitespace(char)
				) {
					text += char;
					while (++this.index < length) {
						char = pattern.charAt(this.index);
						if ("''" === pattern.slice(this.index, this.index + 2)) {
							// double is always 1 '
							text += char;
							++this.index;
						} else if ("'" === char) {
							// end of quoted
							++this.index;
							break;
						} else {
							text += char;
						}
					}
				} else { // lone ' is just a '
					text += "'";
					// already incremented
				}
			} else if (escape && escape === char) {
				char = pattern.charAt(++this.index);
				text += char;
				++this.index;
			} else {
				text += char;
				++this.index;
			}
		}

		return text;
	},


	parseArgument: function parseArgument() {
		var pattern = this.pattern;
		if ("#" === pattern.charAt(this.index)) {
			++this.index; // move passed #
			return {
				type: "pluralNumberElement"
			};
		}

		++this.index; // move passed {
		var
			id = this.parseArgId(),
			char = pattern.charAt(this.index);
		if ("}" === char) { // end argument
			++this.index; // move passed }
			return {
				type: "argumentElement",
				id: id,
				format: null
			};
		}
		if ("," !== char) {
			this.throwExpected(",");
		}
		++this.index; // move passed ,

		var type = this.parseArgType();
		char = pattern.charAt(this.index);
		if ("}" === char) { // end argument
			if (
				"plural" === type ||
				"selectordinal" === type ||
				"select" === type
			) {
				this.throwExpected(type + " message options");
			}
			++this.index; // move passed }
			return {
				type: "argumentElement",
				id: id,
				format: {
					type: type,
					style: null
				}
			};
		}
		if ("," !== char) {
			this.throwExpected(",");
		}
		++this.index; // move passed ,

		var format;
		if ("plural" === type || "selectordinal" === type) {
			format = {
				type: type + "Format",
				offset: this.parsePluralOffset(),
				options: this.parseSubMessages(type)
			};
		} else if ("select" === type) {
			format = {
				type: "selectFormat",
				options: this.parseSubMessages(type)
			};
		} else {
			format = {
				type: type + "Format",
				style: this.parseStyleName()
			};
		}
		char = pattern.charAt(this.index);
		if ("}" !== char) { // not ended argument
			this.throwExpected("}");
		}
		++this.index; // move passed

		return {
			type: "argumentElement",
			id: id,
			format: format
		};
	},

	parseArgId: function parseArgId() {
		this.skipWhitespace();
		var
			pattern = this.pattern,
			length = pattern.length,
			id = "";
		while (this.index < length) {
			var char = pattern.charAt(this.index);
			if ("{" === char || "#" === char) {
				this.throwExpected("argument id");
			}
			if ("}" === char || "," === char || this.isWhitespace(char)) {
				break;
			}
			id += char;
			++this.index;
		}
		if (!id) {
			this.throwExpected("argument id");
		}
		this.skipWhitespace();
		return id;
	},


	parseArgType: function parseArgType() {
		this.skipWhitespace();
		var
			pattern = this.pattern,
			argType,
			types = [ "number", "date", "time", "ordinal", "duration", "spellout", "plural", "selectordinal", "select" ];
		for (var t = 0, tt = types.length; t < tt; ++t) {
			var type = types[t];
			if (pattern.slice(this.index, this.index + type.length) === type) {
				argType = type;
				this.index += type.length;
				break;
			}
		}
		if (!argType) {
			this.throwExpected(types.join(", "));
		}
		this.skipWhitespace();
		return argType;
	},


	parseStyleName: function parseStyleName() {
		this.skipWhitespace();
		var style = this.parseText("style");
		if (!style) {
			this.throwExpected("argument style name");
		}
		this.skipWhitespace();
		return style;
	},


	parsePluralOffset: function parsePluralOffset() {
		this.skipWhitespace();
		var
			offset = 0,
			pattern = this.pattern,
			length = pattern.length,
			token = "offset:";
		if (token === pattern.slice(this.index, this.index + token.length)) {
			this.index += token.length; // move passed offset:
			this.skipWhitespace();
			var start = this.index;
			while (this.index < length && this.isDigit(pattern.charAt(this.index))) {
				++this.index;
			}
			if (start === this.index) {
				this.throwExpected("offset number");
			}
			offset = +pattern.slice(start, this.index);
			this.skipWhitespace();
		}
		return offset;
	},


	parseSubMessages: function parseSubMessages(parentType) {
		this.skipWhitespace();
		var
			pattern = this.pattern,
			length = pattern.length,
			options = [],
			hasSubs = false,
			hasOther = false;
		while (this.index < length && "}" !== pattern.charAt(this.index)) {
			var selector = this.parseSelector();
			this.skipWhitespace();
			options.push({
				type: "optionalFormatPattern",
				selector: selector,
				value: this.parseSubMessage(parentType)
			});
			hasSubs = true;
			if ("other" === selector) {
				hasOther = true;
			}
			this.skipWhitespace();
		}
		if (!hasSubs) {
			this.throwExpected(parentType + "Format message options");
		}
		if (!hasOther) {
			// does not have an other selector
			this.throwExpected(null, null, "\"other\" option must be specified in " + parentType + "Format");
		}
		return options;
	},


	parseSelector: function parseSelector() {
		var
			selector = "",
			pattern = this.pattern,
			length = pattern.length;
		while (this.index < length) {
			var char = pattern.charAt(this.index);
			if ("}" === char || "," === char) {
				this.throwExpected("{", char);
			}
			if ("{" === char || this.isWhitespace(char)) {
				break;
			}
			selector += char;
			++this.index;
		}
		if (!selector) {
			this.throwExpected("selector");
		}
		this.skipWhitespace();
		return selector;
	},


	parseSubMessage: function parseSubMessage(parentType) {
		var char = this.pattern.charAt(this.index);
		if ("{" !== char) {
			this.throwExpected("{", char);
		}
		++this.index; // move passed {
		var message = this.parseMessage(parentType);
		char = this.pattern.charAt(this.index);
		if ("}" !== char) {
			this.throwExpected("}", char);
		}
		++this.index; // move passed }
		return message;
	},


	parseMessage: function parseMessage(parentType) {
		var
			pattern = this.pattern,
			length = pattern.length,
			value,
			elements = [];
		if (value = this.parseText(parentType)) {
			elements.push({
				type: "messageTextElement",
				value: value
			});
		}
		while (this.index < length) {
			if ("}" === pattern.charAt(this.index)) {
				if ("message" === parentType) {
					this.throwExpected();
				}
				break;
			}
			elements.push(this.parseArgument(parentType));
			if (value = this.parseText(parentType)) {
				elements.push({
					type: "messageTextElement",
					value: value
				});
			}
		}
		return {
			type: "messageFormatPattern",
			elements: elements
		};
	},


	throwExpected: function throwExpected(expected, found, message) {
		var
			pattern = this.pattern,
			lines = pattern.slice(0, this.index).split(/\r?\n/),
			offset = this.index,
			line = lines.length,
			column = lines.slice(-1)[0].length;
		if (!message) {
			message = this.errorMessage(expected, found);
		}
		message += " in " + pattern.replace(/\r?\n/g, "\n");

		throw new SyntaxError(message, expected, found, offset, line, column);
	},


	errorMessage: function errorMessage(expected, found) {
		if (!found) {
			found = this.pattern.charAt(this.index) || "end of input";
		}
		if (!expected) {
			return "Unexpected " + found + " found";
		}
		return "Expected " + expected + " but " + found + " found";
	}

};


Parser.parse = function parse(pattern, options) {
	return new Parser(options).parse(pattern);
};


/**
 * SyntaxError
 **/
function SyntaxError(message, expected, found, offset, line, column) {
	this.name = "SyntaxError";
	this.message = message;
	this.expected = expected;
	this.found = found;
	this.offset = offset;
	this.line = line;
	this.column = column;
}

SyntaxError.prototype = new Error();
SyntaxError.__proto__ = Error;


exports.parse = Parser.parse;
exports.SyntaxError = SyntaxError;

