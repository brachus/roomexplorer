/*
 * Copyright 2015,
 * Kyle Caldbeck
 */

MOPEN  = '{';
MCLOSE = '}';
	
/* only parses literals for pre-runtime assignments. 
 * returns DATA, NOT var format.
 */

var parse_literal_expr = function(in_tokens)
{
	
	if (PARSE_DEBUG)
	{
		console.log('parse_literal_expr <debug>: ');
		console.log(in_tokens);
	}
    
    if (in_tokens == undefined)
        return undefined;

    in_tokens.push (['EOF',[-1,-1]]);
    
    var data = undefined;
    
    var parse_mode = 'open';
    var array_map = [];  /* keeps track of position within a
                            possibly multi-dimensional array. 
                            index on the right represents the
                            latest item added to array, regard-
                            less of depth.  */
    var tk_type = '';
    var tk_dat = undefined;
    
    var tk_minus = false; /* '-' flag for array parsing */
    
    var parse_fail = false;
    
    
    
    for (var tmp = 0; tmp < in_tokens.length; tmp++ )
    {
        tk_type = in_tokens[tmp][0];
        tk_dat  = in_tokens[tmp][1];
		
		vm_err.line = in_tokens[tmp][in_tokens[tmp].length - 1][0];
		vm_err.col  = in_tokens[tmp][in_tokens[tmp].length - 1][1];
		vm_err.file = in_tokens[tmp][in_tokens[tmp].length - 1][2];
        
        if (parse_mode == 'open')
        {
            switch (tk_type)
            {
			case 'name':
				console.log('uh-oh: '+in_tokens[tmp]);
				vm_err('names are not allowed for data for\npre-runtime assignments.');
				return undefined;
				break;
			
			case 'int':
			case 'float':
			case 'str': 
				data = tk_dat;
				parse_mode = 'EOF';
				break;
			
			case 'sym':
				if (tk_dat == '[')
				{
					data = []; /* open an array */
					parse_mode = 'array_get_item';

					array_map = [-1];
					/* using this to create
					 * up to a four dimensional array. */
				}
				else if (tk_dat == '-')
					parse_mode = 'neg_get_int_float';
				else if (tk_dat == MOPEN)
				{
					data = []; /* open <[get name] "url/path"> */
					
					parse_mode = 'open_media';
				}
				break;
			
			case 'EOF':
				return undefined;
				break;
				
			
			default: break;
            }
            if (parse_fail)
                break;
            
        }
        
        else if (parse_mode == 'EOF') {
            if (tk_type != 'EOF')
                vm_err.log('expected end of literal.');
            else
                break;
        }
        
        else if (parse_mode == 'neg_get_int_float')
        {
        	if (tk_type == 'int' || tk_type == 'float')
        	{
        		data = tk_dat * -1;
        		parse_mode = 'EOF';
        	}
        	else
	        	vm_err.log('expected numeral.');
        }
        
        else if (parse_mode == 'array_get_item')
        {

            switch (tk_type) {
			case 'int':
			case 'float':
			case 'str':
				if (tk_minus)
				{
					if (tk_type == 'str')
						vm_err.log('expected numeral after "-".  got string. ');
					else
						tk_dat *= -1;
					tk_minus = false;
				}
				

				 /* currently, arrays can only have up to 4 dimensions.
						   arrays needn't be rectangular.   */
				
				switch  (array_map.length) {
					case 1:
						data.push( tk_dat );
						array_map[0] ++;

						break;
					case 2:
						data[ array_map[0] ].push( tk_dat );
						array_map[1] ++;
						break;
					case 3:
						data[ array_map[0] ][ array_map[1] ].push( tk_dat );
						array_map[2] ++;
						break;
					case 4:
						data[ array_map[0] ][ array_map[1] ][
								array_map[2] ].push( tk_dat );
						array_map[3] ++;
						break
						
					default:  
						vm_err.log('currently, arrays can only have up to FOUR dimensions.');
						return undefined;
						break;
				}
				parse_mode = 'array_sym';
				break;
			case 'name':
				vm_err.log('names aren\'t supported in pre-runtime assignments and are\n'+
							'especially unsupported when used in arrays.');
				break;
			case 'sym':
				if (tk_minus)
					vm_err.log('expected numeral after "-".  got sym.');
				
				if (tk_dat == ']') // if '[]'
				{ 
					if (array_map[array_map.length-1] == -1)
					{
						array_map.pop();
						
						
						if (array_map.length == 0)
							parse_mode = 'EOF';
						else
							parse_mode = 'array_sym';
						
						
					}
					else
						vm_err.log('unexpected "]"');  
				}
				else if (tk_dat == '[') 
				{
					if (array_map.length >= 4)
						vm_err.log('currently, arrays can only have up to FOUR dimensions.');
					else
					{
						switch (array_map.length) {
							case 1:
								array_map[array_map.length-1] ++;
								array_map.push(-1);
								data.push([]);
								break;
							case 2:
								array_map[array_map.length-1] ++;
								array_map.push(-1);
								data[ array_map[0] ].push([]);
								break;
							case 3:
								array_map[array_map.length-1] ++;
								array_map.push(-1);
								data[ array_map[0] ][ array_map[1] ].push([]);
								break;
								
							   
							default:break;
						}
						
					}
					parse_mode = 'array_get_item';
				}
				else if (tk_dat == '-')
					tk_minus = true;
				break;
			default:
				break;
            }
            
        }
        
        else if (parse_mode == 'array_sym')  // expects ']' or ','
        { 
            if (tk_type == 'sym' && tk_dat == ']')
            {
                array_map.pop();
                
                if (array_map.length == 0)
                    parse_mode = 'EOF';
                else
                	parse_mode = 'array_sym';
            }
            else if (tk_type == 'sym' && tk_dat == ',')
                parse_mode = 'array_get_item';
            
            else
            {
            	if (tk_type == 'EOF')
            		vm_err.log('unexpected EOF.');
            	else
	                vm_err.log('unexpected "'+tk_dat+'"');
            }
        }
        
        else if (parse_mode == 'open_media')
        {
        	/*  may be a problem: this mainly expects XXX
        	 *  names, but allows XXX.XXX names as well. */
        	if      (tk_type == 'name' && tk_dat == 'img')
        		parse_mode = 'img_getstr';
        	else if (tk_type == 'name' && tk_dat == 'snd')
        		parse_mode = 'snd_getstr';
        	else
        		vm_err.log('expected name "img" or "snd". got "'+tk_dat+'"');
        }
        
        else if (parse_mode == 'img_getstr')
        {
        	if (tk_type == 'str')
        	{
        		/* add new img item to vm_media_lib. */
        		vm_media_lib.push
        				(
        					[IMG_NLOADED, tk_dat, undefined]
        				);
        		/* have data of variable be index to newly added item
        		 * in vm_media_lib. */
        		data.push(vm_media_lib.length - 1);
        		
        		parse_mode = 'img_getstr_'+MCLOSE ; // now expect either
        								// another string OR closing bracket.
        	}
        	else
        		vm_err.log('expected str for "img". got "'+tk_dat+'"');
        }
        else if (parse_mode == 'img_getstr_'+MCLOSE )
        {
        	if (tk_type == 'str')
        	{
        		/* same */
        		vm_media_lib.push( [IMG_NLOADED, tk_dat, undefined] );
        		data.push(vm_media_lib.length - 1);
        		/* parse_mode is unchanged.*/
        	}
        	else if (tk_type == 'sym' && tk_dat == MCLOSE)
        		/* close media literal. */
        		parse_mode = 'EOF';
			else
        		vm_err.log('expected str or closing bracket for "img".\
        				got "'+tk_dat+'"');
        }
        else if (parse_mode == 'snd_getstr')
        {
        	if (tk_type == 'str')
        	{	/* same, but with snd instead. */
        		vm_media_lib.push( [SND_NLOADED, tk_dat, undefined]);
				data.push(vm_media_lib.length - 1);
				
				parse_mode = 'snd_getstr_'+MCLOSE ;
        	}
        	else
        		vm_err.log('expected str for "snd". got "'+tk_dat+'"');
        }
        else if (parse_mode == 'snd_getstr_'+MCLOSE )
        {
        	if (tk_type == 'str')
        	{
        		/* same, but with snd instead. */
        		vm_media_lib.push( [SND_NLOADED, tk_dat, undefined] );
        		data.push(vm_media_lib.length - 1);
        	}
        	else if (tk_type == 'sym' && tk_dat == MCLOSE)
        		/* close media literal. */
        		parse_mode = 'EOF';
			else
        		vm_err.log('expected str or closing bracket for "snd".\
        				got "'+tk_dat+'"');
        }
    }
    
    if (parse_fail)
        return undefined;
    
    return data;
}
