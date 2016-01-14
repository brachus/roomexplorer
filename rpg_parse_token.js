/*
 * define the tokenizer.
 *
 * Copyright 2015,
 * Kyle Caldbeck
 *
 */


/* types of tokens:
 * integer    float    string    name    sym    reserved_word
 *
 * 'name' may include namespaces:
 * "obj.variable" -> ['name', 'obj', 'variable']
 *
 * tokenizer:
 */
var parse_tokenize = function (in_src, parse_tokens, src_fname)
{	
	
	vm_err.file = src_fname;
	
	/*important*/
    var parse_tmp_token = parse_tokens.length - 1;
    
    
    var parse_tmp_token_item = 0;
    
    var parse_mode = 'open';
    var tmp_idx = 0;
    var hold = 0;
    var char_type = -1;
    
    var tmp_line = 1;
    var tmp_col = 0;
    
    var tmp_char = '';
    
    var parse_fail = false;
    
    var macro_dat = [''];
    
    while (tmp_idx < in_src.length)
    {
        tmp_char = in_src[tmp_idx];
        char_type = char_identify(tmp_char);
        
        hold = 0;
        
        vm_err.line = tmp_line;
		vm_err.col = tmp_col;
        
        if (parse_mode == 'open')
        {
            switch (char_type)
            {
			case NUMERAL:
				
				parse_tokens.push(
					['int', tmp_char, [tmp_line, tmp_col, vm_err.file]]);
				parse_tmp_token ++;
				parse_tmp_token_item = 1;
				
				parse_mode = 'int';
				
				break;
			
			case SYMBOL:
				
				if (tmp_char == '#')
					parse_mode = 'macro';
				else if (tmp_char == '/')
					parse_mode = 'com-get-*';
				else
				{
					parse_tokens.push(
						['sym', tmp_char, [tmp_line, tmp_col, vm_err.file]]);
					parse_tmp_token ++;
					parse_tmp_token_item = 0;
					
					if (tmp_char == '.')
						parse_mode = 'dot';
				}
				
				
				break;
			
			case LETTER:
				parse_tokens.push(
					['name', tmp_char, [tmp_line, tmp_col, vm_err.file]]);
				parse_tmp_token ++;
				parse_tmp_token_item = 1;
				
				parse_mode = 'name';
				
				break;
				
			case QUOTE:
				parse_tokens.push(
					['str' , '', [tmp_line, tmp_col, vm_err.file]]);
				parse_tmp_token ++;
				parse_tmp_token_item = 1;
				
				parse_mode = tmp_char;
				break;
				
			default :
				break;
            }
        }
        
        else if (parse_mode == 'int')
        {
            if (char_type == NUMERAL)
                parse_tokens[parse_tmp_token][parse_tmp_token_item] += tmp_char;
            
            else if (char_type == SYMBOL)
            {
                if (tmp_char === '.')
                {
                    parse_tokens[parse_tmp_token][parse_tmp_token_item] += tmp_char;
                    parse_mode = 'float';
                    parse_tokens[parse_tmp_token][0] = 'float';
                }
                else
                {
                    parse_tokens[parse_tmp_token][parse_tmp_token_item] = 
                        parseInt(parse_tokens[parse_tmp_token][parse_tmp_token_item]);
                    parse_tmp_token_item = 0; /* complete int token */
                    
                    hold = 1; /* hold for symbol to be parsed */
                    
                    parse_mode = 'open'; /* important */
                }
            }
            else if (char_type == LETTER)
            {
                vm_err.log('expected numeral, got "'+tmp_char+'".');
                parse_fail = true;
                break;
            }
            else if (char_type == WHITESPACE)
            {
                parse_tokens[parse_tmp_token][parse_tmp_token_item] = 
                    parseInt(parse_tokens[parse_tmp_token][parse_tmp_token_item]);
                parse_tmp_token_item = 0; /* complete int token */
                
                parse_mode = 'open'; /* important */
            }
        }
        
        else if (parse_mode == 'name')
        {
            if (char_type == LETTER || char_type == NUMERAL)
            {
                parse_tokens[parse_tmp_token][parse_tmp_token_item] +=
                    tmp_char;
            }
            else if (char_type == SYMBOL)
            {
                if (tmp_char == '.')
                {
                    // add new name to namespace being parsed
                    parse_tmp_token_item ++;
                    parse_tokens[parse_tmp_token].splice(parse_tmp_token_item,
                            0,  '' );  // insert empty name after cur (now prev) name.
                    
                    parse_mode = 'name_dot';
                }
                else 
                {
                    parse_tmp_token_item = 0;
                    
                    hold = 1; // hold for symbol
                    
                    parse_mode = 'open';
                }
            }
            
            else if (char_type == WHITESPACE) 
            {
                parse_tmp_token_item = 0;
                parse_mode = 'open';
            }
        }
        
        else if (parse_mode == 'name_dot') 
        {
            if (char_type == LETTER) 
            {
                parse_tokens[parse_tmp_token][parse_tmp_token_item] +=
                    tmp_char;
                parse_mode = 'name'; /*don't forget*/
            }
            else if (char_type == NUMERAL)
            	vm_err.log('unexpected numeral "'+tmp_char+'"');
            else
                vm_err.log('expected name after ".", got \"'+tmp_char+'".');
        }
        
        else if (parse_mode == 'dot')
        {
            if (char_type == LETTER)
            {	/*resolve to name*/
                parse_tokens[parse_tmp_token][0] = 'name';
                parse_tmp_token_item = 1;
                /* if name begins with '.', prefix empty name '' */
                parse_tokens[parse_tmp_token][parse_tmp_token_item] = ''; 
                parse_tmp_token_item ++;
                parse_tokens[parse_tmp_token].splice(parse_tmp_token_item,
                            0,'');
                parse_tokens[parse_tmp_token][parse_tmp_token_item] = tmp_char;
                parse_mode = 'name';
            }
            else if (char_type == NUMERAL)
            { /* resolve to float */
                parse_tokens[parse_tmp_token][0] = 'float';
                parse_tmp_token_item = 1;
                parse_tokens[parse_tmp_token][parse_tmp_token_item] += tmp_char;
                parse_mode = 'float';
            }
            else
            {
                
                hold = 1;
                parse_mode = 'open';
            }
        }
        
        else if (parse_mode == '"' || parse_mode == '\'')
        {
            if (tmp_char == parse_mode)
                parse_mode = 'open';
            else if (tmp_char == '\\')
               /* only quote escapes are supported so far */
                parse_mode = parse_mode+'_esc';
            else 
                /* until matching quote is found,
                 * or an escape character is found,
                 * add anything to the string. */
                parse_tokens[parse_tmp_token][parse_tmp_token_item] += tmp_char;
        }
        
        else if (parse_mode == '"_esc' || parse_mode == '\'_esc')
        {
            
            if (tmp_char == '"' || tmp_char == '\'')
                parse_tokens[parse_tmp_token][parse_tmp_token_item] += tmp_char;
            parse_mode = parse_mode[0];
        }
        
        else if (parse_mode == 'float')
        {
            if (char_type == NUMERAL) 
                parse_tokens[parse_tmp_token][parse_tmp_token_item] += tmp_char;
            
            else if (char_type == WHITESPACE) {
                parse_tokens[parse_tmp_token][parse_tmp_token_item] = 
                    parseFloat(parse_tokens[parse_tmp_token][parse_tmp_token_item]);
                parse_tmp_token_item = 0; /* complete float token */
                
                parse_mode = 'open'; /* important */
            }
            
            else if (char_type == LETTER) {
                vm_err.log('expected numeral, got "'+tmp_char+'".');
                parse_fail = true;
                break;
            }
            
            else if (char_type == SYMBOL) {
                if (tmp_char === '.') {
                    vm_err.log('too many dots for floating point number.');
                    parse_fail = true;
                    break;
                }
                
                else {
                    parse_tokens[parse_tmp_token][parse_tmp_token_item] = 
                        parseFloat(parse_tokens[parse_tmp_token][parse_tmp_token_item]);
                    parse_tmp_token_item = 0; // complete float token
                    
                    hold = 1; /* hold for symbol to be parsed */
                    
                    parse_mode = 'open'; /* important */
                }
            }
        }
        else if (parse_mode == 'macro')
        {
			if (tmp_char == ' ')
				macro_dat.push('');
			else if (tmp_char == '#')
			{
				
				if (macro_dat[0] == 'include' && macro_dat.length == 2)
				{
					tmp_src = document.getElementById( macro_dat[1] );
					
					if (tmp_src == undefined)
						vm_err.warn('"'+macro_dat[1]+'" is an invalid macro'+
							' target.');
					
					parse_tokenize(
						tmp_src.innerHTML,
						parse_tokens,
						macro_dat[1]);
					
					/*very important*/
					parse_tmp_token = parse_tokens.length - 1;
					
					vm_err.file = src_fname;
					
				}
				else
					vm_err.warn('invalid macro');
				
				macro_dat = [''];
				parse_mode = 'open';
			}
			else
				macro_dat[macro_dat.length - 1] += tmp_char;
		}
		else if (parse_mode == 'com-get-*')
		{
			if (tmp_char == '*')
				parse_mode = 'comment';
			else
			{
				vm_err.warn('ignoring unexpected "/"');
				parse_mode = 'open';
			}
		}
		else if (parse_mode == 'comment')
		{
			if (tmp_char == '*')
				parse_mode = 'com-get-/';
		}
		else if (parse_mode == 'com-get-/')
		{
			if (tmp_char == '/')
				parse_mode = 'open';
			else if (tmp_char == '*')
				parse_mode = 'com-get-/'; 
				/*no change*/
			else
				parse_mode = 'comment';
		}
        
        if (hold === 0)
        {
            tmp_idx++;
            tmp_col++;
            
            if (tmp_char == '\n')
            {
                tmp_col = 0;
                tmp_line++;
            }
        }
    }
    
    if (parse_fail)
        return [];
        
    /* if failure hasn't happened, address state of parse_mode at EOF */
    switch (parse_mode)
    {
        case 'int':
            parse_tokens[parse_tmp_token][parse_tmp_token_item] = 
                parseInt(parse_tokens[parse_tmp_token][parse_tmp_token_item]);
            break;
            
        case 'float':
            parse_tokens[parse_tmp_token][parse_tmp_token_item] = 
                parseFloat(parse_tokens[parse_tmp_token][parse_tmp_token_item]);
            break
        
        case 'name_dot':
        case 'dot':
            vm_err.log('unexpected EOF.');
            break;
            
        case '"':
        case '\'':
            vm_err.log('unexpected EOF.');
            break;
            
        default:
            break;
    }
    
    return parse_tokens
}

var parse_tokens_to_string = function(in_tokens)
{
	var ret_str = '[type,  data,  [line,  col]]\n';
	for ( var i=0; i < in_tokens.length;i++)
	{
		if (in_tokens[i][0] == 'str')
			ret_str += '[' + in_tokens[i][0] +',  "'+ in_tokens[i][1] +'",  ['+ in_tokens[i][2][0] +',  '+ in_tokens[i][2][1] + ']]\n';
		else
			ret_str += '[' + in_tokens[i][0] +',  '+ in_tokens[i][1] +',  ['+ in_tokens[i][2][0] +',  '+ in_tokens[i][2][1] + ']]\n';
	}
	return ret_str
}


