/*
 * define functions for removing comments,
 * parsing macros, and identifying different
 * characters.
 *
 *
 * Copyright 2015,
 * Kyle Caldbeck
 *
 *
 */

/* parse debug flag */

PARSE_DEBUG = false;




/* define different chars to tokenize with: */
NUMERALS    = '0123456789';     
SYMBOLS     = '{}[]<>().,=;:-#/*\\';
QUOTES      = '\'"';
LETTERS     = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
WHITESPACES = ' \t\n';         /* <space> <tab> <newline> all qualify as whitespace.*/

NUMERAL     = 0;
SYMBOL      = 1;
QUOTE       = 2;
LETTER      = 3;
WHITESPACE  = 4;


var is_numeral = function(in_char)
{
    for (var i = 0; i < NUMERALS.length; i++)
        if (in_char == NUMERALS[i]) return true;
        
    return false;
};

var is_symbol  = function(in_char)
{
    for (var i = 0; i < SYMBOLS.length; i++)
        if (in_char == SYMBOLS[i]) return true;
        
    return false;
};

var is_quote   = function(in_char)
{
    for (var i = 0; i < QUOTES.length; i++)
        if (in_char == QUOTES[i]) return true;
        
    return false;
};

var is_letter  = function(in_char)
{
    for (var i = 0; i < LETTERS.length; i++)
        if (in_char == LETTERS[i]) return true;
        
    return false;
};

var is_whitespace  = function(in_char)
{
    for (var i = 0; i < WHITESPACES.length; i++)
        if (in_char == WHITESPACES[i]) return true;
        
    return false;
};

var char_identify = function(in_char)
{
    if (is_numeral(in_char))
        return NUMERAL;
    if (is_symbol(in_char))
        return SYMBOL;
    if (is_quote(in_char))
        return QUOTE;
    if (is_letter(in_char))
        return LETTER;
    if (is_whitespace(in_char))
        return WHITESPACE;
    return -1;
};

var parse_ret_reg = function( in_str )
{
	if (in_str.length == 2 )
		if ( in_str[0] == 'r' && is_numeral(in_str[1]) )
			return parseInt(in_str[1]);
	return undefined;
};
