/*
 * Copyright 2015,
 * Kyle Caldbeck
 */

var parse_base_parse = function(in_tokens)
{
	var script_data = [];
        // create what will become the almighty vm_script data structure
	
	var parse_mode = 'open'; 	// start 'outside'
	var parse_err = '';			// error message
	var parse_linecol = [-1,-1];// line+col values for throwing errors
	var parse_tok_file = '';
	
	var parse_literal_bucket = []; // for parsing literals
	var parse_bracket_level = 0;
        // keep track of bracket ( [] ) level in parsing arguments.
	
	var parse_tmp_name = ['name','',[-1,-1]];
	
	var parse_cur_varname = '';
	var parse_cur_func = -1;
	
	var parse_script_type = '';
	
	var parse_done_obj_names = [];
        /* keeps track of previously defined object names. */
	
	var parse_obj_done_script_types = [];
        /* keeps track of what types of scripts have already been defined
         * in current obj.
         */
         
	var parse_obj_done_predefs = [];
        /* keeps track of previous predefs already defined. */
	
	var parse_tmp_obj = -1;
        // holds obj currently parsed
	var parse_tmp_space_idx = -1;   
        // index within selected space being parsed.
        // i.e. current var or function
    
    
    var ifcntr = 0;
    
    /*[mode, branchcntr ]*/
    var ifstate = [];
    var iflevel = -1;
	
	var holdloop = false;
	
	var tmp_token = undefined;
	
	in_tokens.push(['EOF','',[-1,-1]]); // append EOF token for sanity.
	
	var i = 0;
	while (i < in_tokens.length)
	{
		/* assuming tmp_token will become a
		 * reference to in_tokens[i]
		 */
		tmp_token = in_tokens[i];
		
		vm_err.line = tmp_token[tmp_token.length - 1][0];
		vm_err.col = tmp_token[tmp_token.length - 1][1]; 
		vm_err.file = tmp_token[tmp_token.length - 1][2];
		
		switch (parse_mode)
		{
		case 'open':
			if (tmp_token[0] == 'name')
			{
				if (tmp_token.length == 3)
				{
					/* create object in script_data */
					script_data.push		
					(
						{
							type: '',
							name: '',
							vars: [],
							init: [],
							body: [],
							term: []
						}
					)
					
					/* step object we're currently modifying
					 * (newly added one)
					 */
					parse_tmp_obj++;
					
					/* have type be tmp_token (name) */
					script_data[parse_tmp_obj].type = tmp_token[1];
					
					/* clear duplicate catchers*/
					parse_obj_done_script_types = [];
					parse_obj_done_predefs = [];
					
					parse_mode = 'get_obj_name';
				}
				else
					vm_err.log('obj type may only consist of a '+
						'single name identfier.');
			}
			else if (tmp_token[0] == 'EOF')
				break;
			else
				vm_err.log('expected name for obj type.  got '+tmp_token[0]+
					' "'+tmp_token[1]+'" instead.');
			break;
		
		
		case 'get_obj_name':
			if (tmp_token[0] == 'name')
			{
				if (tmp_token.length == 3)
				{
					/* FIXME search for name in parse_done_obj_names.  if match found, throw duplicate obj name error. */
					if (parse_done_obj_names.indexOf(tmp_token[1]) == -1)
					{
						script_data[parse_tmp_obj].name = tmp_token[1];
					
						parse_mode = 'get_obj_open_brace';
						
						parse_done_obj_names.push(tmp_token[1]);
					}
					else
						vm_err.log('obj with name "'+tmp_token[1]+
							'" has already been defined');
					
				}
				else
					vm_err.log('obj name may only consist of a '+
						'single name identfier.');
			}
			else
				vm_err.log('expected name for obj name.  got '+tmp_token[0]+
					' "'+tmp_token[1]+'" instead.');
			
			break;
		
		case 'get_obj_open_brace':
			if (tmp_token[0] == 'sym' && tmp_token[1] == '{')
				parse_mode = 'open_predef';
			else
				vm_err.log('expected opening brace for obj.  got '+
					tmp_token[0]+' "'+tmp_token[1]+'" instead.');
		
			break;
		
		case 'open_predef':
			if (tmp_token[0] == 'sym')
			{
				if (tmp_token[1] == '}')
					parse_mode = 'open'; 	/* obj is now closed */
				else
					vm_err.log('expected closing brace, name for script, '+
						'OR predef.  got '+tmp_token[0]+' "'+
						tmp_token[1]+'" instead.');
			} 
			else if (tmp_token[0] == 'name')
			{
				if (tmp_token.length == 4) // this would mean a predef varname (".XXX")
				{
					/* FIXME check other vars in obj.  if match, throw duplicate error. */
					if (parse_obj_done_predefs.indexOf(tmp_token[2]) == -1)
					{
						parse_cur_varname = tmp_token[2];
						script_data[parse_tmp_obj].vars[parse_cur_varname] = -1;
						parse_mode = 'get_predef_equals';
						
						parse_obj_done_predefs.push(tmp_token[2]);
					}
					else
						vm_err.log('var ".'+
							tmp_token[2]+
							'" in object "'+
							script_data[parse_tmp_obj].name+
							'" already defined.');
					
					
				}
				else if (tmp_token.length == 3)
				{
					if (tmp_token[1]=='init' || tmp_token[1] =='body' || tmp_token[1] =='term')
					{
						/* FIXME check parse_done_script_types. if match, throw duplicate error. */
						if (parse_obj_done_script_types.indexOf(tmp_token[1]))
						{
							parse_mode = 'get_script_open_brace';
							parse_script_type = tmp_token[1]; // important.
							parse_obj_done_script_types.push(tmp_token[1]);
						}
						else
							vm_err.log('script "'+
									tmp_token[1]+
									'" within obj "'+
									script_data[parse_tmp_obj].name +
									'" has already been defined.');
						
					}
					else
						vm_err.log('only "init", "body", and "term" script'+
							' may be defined within an object.');
				}
				else
					vm_err.log('only single or double names are '+
						'recognized within predef block.');
			}
			else
				vm_err.log
					('expected "." for predef, closing brace , '+
					'OR name for script.  got '+tmp_token[0]+
					' "'+tmp_token[1]+'" instead.');
			
			break;
		
		case 'get_predef_equals':
			if (tmp_token[0] == 'sym' && tmp_token[1] == '=')
			{
				parse_literal_bucket = [];
				parse_mode = 'get_predef_literal';
			}
			else
				vm_err.log (
					'expected "=" for predef.  got '+
					tmp_token[0]+
					' "'+
					tmp_token[1]+
					'" instead.');
			break;
		
		case 'get_predef_literal':
			if (tmp_token[0]=='sym' && tmp_token[1] == ';')
			{
				/* parse literal expression;   use data for last var in .vars */
				script_data[parse_tmp_obj].vars[parse_cur_varname] =
					parse_literal_expr(parse_literal_bucket);
				
				/* end predef line */
				parse_mode = 'open_predef';
			}
			else if (tmp_token[0] == 'EOF')
				vm_err.log('expected literal.  got EOF instead.');
				
			else
				parse_literal_bucket.push(tmp_token);
			
			break;
		
		case 'get_script_open_brace':
			if (tmp_token[0]=='sym' && tmp_token[1] == '{')
			{
				parse_mode = 'script_open'; /* start parsing lines of function calls and labels */
				parse_cur_func = -1;  		/*  keep track of current func (none right now)  */
			}
			else
				vm_err.log('expected opening brace for script.  got '+
					tmp_token[0]+' "'+tmp_token[1]+'" instead.');
			
			break;
		
		case 'script_open':
			/* expect:
			 *    <name X> 			-> (":" or "(")
			 * 	| <name XX.XX> 		-> ("(" or "=")
			 *  | <name='reg.0-7'> 	-> expect_equals
			 *  | "}" 				-> get_predef_open
			 *  
			 */
			begin_stmnt = false;
			if (tmp_token[0] == 'name')
			{
				if (tmp_token.length == 4)		/* if format XXX.XXX */
				{
					parse_tmp_name = tmp_token; 
					/* hold on to name until its place is determined. */
					
					/* if name begins with ".", replace first
					 * name (empy) with name of cur obj
					 */
					if (parse_tmp_name[1] == '')
						parse_tmp_name[1] = script_data[parse_tmp_obj].name;
					
					parse_mode = 'script_get_para_equals';
					begin_stmnt = true;
				}
				else if (tmp_token.length == 3) /* if single name */
				{
					/* is register ? */
					if (parse_ret_reg(tmp_token[1]) != undefined)
					{
						/* keep name */
						parse_tmp_name = tmp_token;
						
						parse_mode = 'script_get_equals';
						begin_stmnt = true;
					}
					else
					{
						parse_tmp_name = tmp_token; /* hold on to name. */
						parse_mode = 'script_get_para_colon';
						begin_stmnt = true;
						
						if (tmp_token[1] == 'if')
						{
							if ( iflevel == -1 || 
								ifstate[iflevel].mode == 'inbranch' ||
								ifstate[iflevel].mode == 'inelsebranch')
							{
								ifcntr ++;
								ifstate.push(
										{
											mode:		'get_reg',
											branchcntr:	0,
											id:			ifcntr
										}
									);
								iflevel++;
									
								parse_mode = 'script_get_if_reg';
								begin_stmnt = false;
							}
							else if (ifstate[iflevel].mode == 'open')
							{
								/* mark end of conditional block at top of
								 * stack, and start a new conditional block
								 */
								parse_cur_func++;  /* insert only a label */
								script_data[parse_tmp_obj]
									[parse_script_type].push(
										[
											LABEL,				
											'if'+ifstate[iflevel].id+'_end'	
										]
										);
								ifcntr++;
								ifstate[iflevel].mode = 'get_reg';
								ifstate[iflevel].branchcntr = 0;
								ifstate[iflevel].id = ifcntr;
								parse_mode = 'script_get_if_reg';
								begin_stmnt = false;
							}
							
						}
						else if (tmp_token[1] == 'else')
						{
							if (iflevel == -1 || 
								ifstate[iflevel].mode == 'inbranch' ||
								ifstate[iflevel].mode == 'inelsebranch' )
								vm_err.log(
									"unexpected conditional \"else\" branch.");
							else if (ifstate[iflevel].mode == 'open')
							{
								ifstate[iflevel].mode = 'get_else_if';
								ifstate[iflevel].branchcntr ++;
								parse_mode = 'script_get_else_if';
							}
						}
					}
					
				}
				else
					vm_err.log('only single or double names are '+
							'recognized within script block');
			}
			
			else if (tmp_token[0] == 'sym' && tmp_token[1] == '}')
			{
				if (iflevel == -1)
					parse_mode = 'open_predef';
					
				else if (ifstate[iflevel].mode == 'inbranch' || 
							ifstate[iflevel].mode == 'inelsebranch')
				{
					/* jump out of branch to end of conditional block. */
					parse_cur_func++;
					script_data[parse_tmp_obj][parse_script_type].push(
						[
							_JMP,				
							NO_OPP,				
							[NO_RET, -1],					
							[ [USE_VAL,'if'+ifstate[iflevel].id+'_end']
								]								
						]
						);
						
					/* mark end of branch. */
					parse_cur_func++;
					script_data[parse_tmp_obj][parse_script_type].push(
						[
							LABEL,				
							'if'+ifstate[iflevel].id+'_'+
								ifstate[iflevel].branchcntr+'_end'	
						]
						);
							
					ifstate[iflevel].mode = 'open';
					
					if (ifstate[iflevel].mode == 'inelsebranch')
					{
						/* close conditional block, if end of else branch. */
						parse_cur_func++;  
						script_data[parse_tmp_obj][parse_script_type].push(
								[
									LABEL,				
									'if'+ifstate[iflevel].id+'_end'	
								]
							);
								
						iflevel --;
						ifstate.pop();
					}
					
					parse_mode = 'script_open';
				}
				else if (ifstate[iflevel].mode == 'open')
				{
					/* close conditional block, and a branch underneath if it
					 * exists.
					 */
					parse_cur_func++;  
					script_data[parse_tmp_obj][parse_script_type].push(
							[
								LABEL,				
								'if'+ifstate[iflevel].id+'_end'	
							]
						);
							
					iflevel --;
					ifstate.pop();
					
					if (iflevel >= 0)
					{
						/* jump out of branch to end of conditional block. */
						parse_cur_func++;
						script_data[parse_tmp_obj][parse_script_type].push(
								[
									_JMP,				
									NO_OPP,				
									[NO_RET, -1],				
									[ [USE_VAL,'if'+ifstate[iflevel].id+'_end']
										]								
								]
							);
							
						/* mark end of branch. */
						parse_cur_func++;
						script_data[parse_tmp_obj][parse_script_type].push(
								[
									LABEL,				
									'if'+ifstate[iflevel].id+'_'+
										ifstate[iflevel].branchcntr+'_end'
								]
							);
						
						ifstate[iflevel].mode = 'open';
						parse_mode = 'script_open';
						
					}
					else
						parse_mode = 'open_predef';
					
				}
				
			}	
				
			else
				vm_err.log(
					'expected script content OR ending brace.  got '+
					tmp_token[0]+' "'+tmp_token[1]+'" instead.');
			
			/* if we're parsing a conditional block, we're ouside of
			 * a branch, and we come across anything other than the
			 * start of a new conditional block:
			 */
			if (iflevel >= 0)
			{
				/* check to see if conditional block was broken.*/
				if (ifstate[iflevel].mode == 'open' && begin_stmnt)
				{
					/* close conditional block
					 */
					parse_cur_func++;
					script_data[parse_tmp_obj][parse_script_type].push(
							[
								LABEL,				
								'if'+ifstate[iflevel].id+'_end'
							]
							);
							
					iflevel --;
					ifstate.pop();
				}
			}
			
			
			break;
		
		case 'script_get_if_reg':
			if (tmp_token[0] == 'name' && tmp_token.length == 3)
			{
				tmpregnum = parse_ret_reg(tmp_token[1])
				if (tmpregnum != undefined)
				{
					/* setup IF_JMP func */
					parse_cur_func++;
					script_data[parse_tmp_obj][parse_script_type].push(
						[
							_IF_JMP,
							NO_OPP,
							[NO_RET, -1],
							[
								[REG, tmpregnum],
								[ USE_VAL,'if'+ifstate[iflevel].id+'_'+
									ifstate[iflevel].branchcntr  ]
							]
						]
						);
						
					/* setup JMP func (else case) */
					parse_cur_func++;
					script_data[parse_tmp_obj][parse_script_type].push(
							[
								_JMP,
								NO_OPP,
								[NO_RET, -1],
								[
									[ USE_VAL,'if'+ifstate[iflevel].id+'_'+
										ifstate[iflevel].branchcntr+'_end' ]
								]
							]
						);
						
					/* open branch */
					parse_cur_func++;
					script_data[parse_tmp_obj][parse_script_type].push(
								[
									LABEL,
									'if'+ifstate[iflevel].id+'_'+
										ifstate[iflevel].branchcntr
								]
							);
					
					ifstate[iflevel].mode = 'inbranch';
					
					parse_mode = 'script_get_if_branch_open';
					
				}
				else
					vm_err.log('expected register.');
			}
			else
				vm_err.log('expected register.');
			break;
		
		case 'script_get_else_if':
			if ( 	tmp_token[0] == 'name' &&
					tmp_token.length == 3 &&
					tmp_token[1] == 'if')
				parse_mode = 'script_get_if_reg';
			
			else if (tmp_token[0] == 'sym' && tmp_token[1] == '{')
			{
				ifstate[iflevel].mode = 'inelsebranch';
				parse_mode = 'script_open';
			}
			else
			{
				holdloop = true;
				ifstate[iflevel].mode = 'inelsebranch_oneline';
				parse_mode = 'script_open';
			}
			break;
			
		case 'script_get_if_branch_open':
			if (tmp_token[0] == 'sym' && tmp_token[1] == '{')
				parse_mode = 'script_open';
			else
			{
				holdloop = true;
				ifstate[iflevel].mode = 'inbranch_oneline';
				parse_mode = 'script_open';
			}
			break;
		
		case 'script_get_para_colon':
			if (tmp_token[0] == 'sym' && tmp_token[1] == '(')
			{
				parse_cur_func++;			/* setup func */
				script_data[parse_tmp_obj][parse_script_type].push(
					[
						parse_tmp_name[1],		/* func (str for now) */
						NO_OPP,					/* opperand (null) */ 
						[NO_RET, -1],			/* return (null) */
						[]						/* no args. */
					]
					);
				
				parse_literal_bucket = []; /* prepare for arg parse */
				parse_bracket_level = 0;
				parse_mode = 'script_get_arg';
			}
			else if (tmp_token[0] == 'sym' && tmp_token[1] == ':')
			{
				parse_cur_func++;  /* insert only a label */
				script_data[parse_tmp_obj][parse_script_type].push(
						[
							LABEL,				/* func (LABEL) */
							parse_tmp_name[1]	/* label name */
						]
						);
			
				parse_mode = 'script_open';
			}
			else
				vm_err.log('expected ":" or "(".  got '+
					tmp_token[0]+
					' "'+
					tmp_token[1]+
					'" instead.');
			
			break;
		
		case 'script_get_para_equals':  /* parse_tmp_name -> XXX.XXX */
			if (tmp_token[0] == 'sym' && tmp_token[1] == '(')
			{
				parse_cur_func++;			/* setup func */
				script_data[parse_tmp_obj][parse_script_type].push(
					[
						parse_tmp_name[2],		/* func (str for now) */
						parse_tmp_name[1],		/* opperand (str for now) */
						[NO_RET, -1],			/* return (null) */
						[]						/* no args. */
					]
					);
				
				parse_literal_bucket = []; /* prepare for arg parse */
				parse_bracket_level = 0;
				parse_mode = 'script_get_arg';
			}
			else if (tmp_token[0] == 'sym' && tmp_token[1] == '=')
			{
				parse_cur_func++;			/* setup func */
				script_data[parse_tmp_obj][parse_script_type].push(
					[
						-1,					/* func (str for now) */
						NO_OPP,				/* opperand (str for now) */
						[ parse_tmp_name[1],
						  parse_tmp_name[2]], /* return  */
						[]					/* no args. */
					]
					);
				
				parse_mode = 'script_get_fname';
			}
			else
				vm_err.log('expected "=" or "(".  got '+
					tmp_token[0]+
					' "'+
					tmp_token[1]+
					'" instead.');
			break;
		
		case 'script_get_equals':
			/* <register> = */
			if (tmp_token[0] == 'sym' && tmp_token[1] == '=')
			{
				parse_cur_func++;			/* setup func */
				script_data[parse_tmp_obj][parse_script_type].push(
					[
						-1,								/* func (null) */
						NO_OPP,							/* opperand (null) */
						[REG,							/* return (register) */
							parse_ret_reg(parse_tmp_name[1]) ],	
						[]								/* no args. */
					]
					);
				parse_mode = 'script_get_fname';
			}
				
			else
				vm_err.log('expected "=".  got '+
					tmp_token[0]+
					' "'+
					tmp_token[1]+
					'" instead.');
			break;
		
		case 'script_get_fname':
			if (tmp_token[0] == 'name')
			{
				tcur_func_ref = 
					script_data[parse_tmp_obj][parse_script_type]
					[parse_cur_func];
					
				/* single name */
				if (tmp_token.length == 3)
				{
					tcur_func_ref[0] = tmp_token[1];
					parse_mode = 'script_get_open_para';
				}
				
				/* double name */
				else if (tmp_token.length == 4)
				{
					/* look out for ".XXX" self notation. */
					if (tmp_token[1] == '')
						tcur_func_ref[1] = script_data[parse_tmp_obj].name
					else
						tcur_func_ref[1] = tmp_token[1];
						/*opp*/
					
					tcur_func_ref[0] = tmp_token[2]; //func
					
					parse_mode = 'script_get_open_para';
				}
				else
					vm_err.log('only single or double '+
						'names are recognized in script block.');
			}
			else
				vm_err.log('expected function name OR opperand'+
					' and function name.  got '+
					tmp_token[0]+
					' "'+
					tmp_token[1]+
					'" instead.') ;
			break;
		
		case 'script_get_open_para':
			if (tmp_token[0] == 'sym' && tmp_token[1] == '(')
			{
				/* prepare for arg parse */
				parse_literal_bucket = []; 
				parse_bracket_level = 0;
				parse_mode = 'script_get_arg';
			}
			else
				vm_err.log('expected "(".  got '+
						tmp_token[0]+
						' "'+
						tmp_token[1]+
						'" instead.') ;
			break;
		
		case 'script_get_arg':
			if (tmp_token[0] == 'EOF')
				vm_err.log('unexpected EOF.');
				
			else if (parse_bracket_level == 0)
			{
				if (tmp_token[0] == 'sym' &&
						(tmp_token[1] == ',' || tmp_token[1] == ')'))
				{
					f_arg_ref =
						script_data[parse_tmp_obj][parse_script_type]
						  [parse_cur_func][F_ARG];
						  
					if (parse_literal_bucket.length > 0)
					{	
									/* if name */
						if (		parse_literal_bucket.length == 1 &&
									parse_literal_bucket[0][0] == 'name' )
						{
									/* must be  XXX.XXX */
							if (parse_literal_bucket[0].length == 4)
							{
								/* if given ".XXX", insert
								 * parent object name as obj
								 */
								if (parse_literal_bucket[0][1] == '') 
									parse_literal_bucket[0][1] =
										script_data[parse_tmp_obj].name;
								
								f_arg_ref.push( 
										[
											parse_literal_bucket[0][1],
											parse_literal_bucket[0][2]
										]); /*  add argument */
								
							}
							else
							{
								treg_int =
								 parse_ret_reg(parse_literal_bucket[0][1]);
								
								if (treg_int != undefined)
									f_arg_ref.push( 
											[
												REG,
												treg_int
											]); /*  add reg argument */
								else
									f_arg_ref.push( 
										[
											USE_VAL,
											parse_literal_bucket[0][1]
										]);
									/* FIXME for now, parse single name
									 * within arg list as a string.
									 */
							}
							
						}
						else 		/*   finally, if literal */
							f_arg_ref.push( 
								[
									USE_VAL,
									parse_literal_expr(parse_literal_bucket)
								]);
					}
					
					parse_literal_bucket = [];
					
					if (tmp_token[1] == ')')
						parse_mode = 'script_get_semicolon';  
				}
				else if (tmp_token[0] == 'sym' && tmp_token[1] == '[')
				{
					parse_bracket_level ++;
					parse_literal_bucket.push(tmp_token);
				}
				else
					parse_literal_bucket.push(tmp_token);
			}
			else
			{
				if (tmp_token[0] == 'sym' && tmp_token[1] == ']')
					parse_bracket_level --;
				parse_literal_bucket.push(tmp_token);
			}
			break;
		
		case 'script_get_semicolon':
			if (tmp_token[0] == 'sym' && tmp_token[1] == ';')
			{
				if (	iflevel >= 0 &&
						ifstate[iflevel].mode == 'inbranch_oneline')
				{
					/* close branch, set mode to open */
					/* jump out of branch to end of conditional block. */
					parse_cur_func++;
					script_data[parse_tmp_obj][parse_script_type].push(
						[
							_JMP,				
							NO_OPP,				
							[NO_RET, -1],					
							[ [USE_VAL,'if'+ifstate[iflevel].id+'_end']
								]								
						]
						);
						
					/* mark end of branch. */
					parse_cur_func++;
					script_data[parse_tmp_obj][parse_script_type].push(
						[
							LABEL,				
							'if'+ifstate[iflevel].id+'_'+
								ifstate[iflevel].branchcntr+'_end'	
						]
						);
						
					ifstate[iflevel].mode = 'open';
				}
				else if (iflevel >= 0 &&
						ifstate[iflevel].mode == 'inelsebranch_oneline')
				{
					/* close conditional block */
					parse_cur_func++;
					script_data[parse_tmp_obj][parse_script_type].push(
							[
								LABEL,				
								'if'+ifstate[iflevel].id+'_end'
							]
							);
							
					iflevel --;
					ifstate.pop();
				}
				parse_mode = 'script_open';
			}
				
				
			else
				vm_err.log(
					'expected ";".  got '+
					tmp_token[0]+
					' "'+tmp_token[1]+
					'" instead.');
			
			break;
		
		case 'error':
			vm_err.log(parse_err);
			break;
		
		
		
			
		default:
			break;
		}
		
		if (holdloop == false)
			i ++;
		else
			holdloop = false;
	}
	
	if (parse_mode == 'error')
		vm_err.log(parse_err);
		
	
	/* pick up any stray parse_mode (if parse_mode not 'open') */
	
	vm_err.line = -1;
	vm_err.col = -1;
	vm_err.file = '';
	
	/* replace opperand/arg/return object strings with int
	 * indexes to objects for opperands/args/returns, while
	 * checking if they all match
	 */
	/* use parse_done_obj_names */
	for (var i = 0; i < script_data.length ; i++ )
	{
		/* for every object */
		
		var tmp_script_type = 'init';
		
		while (tmp_script_type != 'none')
		{
			if (script_data[i][tmp_script_type].length != 0)
			{
				for (
					var j = 0;
					j < script_data[i][tmp_script_type].length; 
					j++ )
				{
					tmp_func = script_data[i][tmp_script_type][j];
					/* FIXME assuming tmp_func becomes 
					 * a reference to script_data[...].
					 */
					 
					/* skip labels */
					if (tmp_func.length < 4 )	
						continue; 
					
					/* replace opperand string in function with index. */
					if ( (typeof tmp_func[F_OPP]) == 'string')
					{
						/* try to match with obj name: */
						if (parse_done_obj_names.indexOf(
									tmp_func[F_OPP]) != -1)
							tmp_func[F_OPP] =
								parse_done_obj_names.indexOf(
									tmp_func[F_OPP]);
						
						else		/* if fail, throw mismatch */
							vm_err.log(
								'object "'+
								script_data[i].name+
								'": could not match opperand "'+
								tmp_func[F_OPP]+
								'" for '+
								tmp_func[F_FUNC]+
								'() . ');
					}
					
					/* replace any string in return with index. */
					if ( (typeof tmp_func[F_RET][0]) == 'string')
					{
						
						if (parse_done_obj_names.indexOf(
								tmp_func[F_RET][0]) != -1)
							tmp_func[F_RET][0] =
								parse_done_obj_names.indexOf(
									tmp_func[F_RET][0]);
						
						else		/* if fail, throw mismatch */
							vm_err.log(
								'object "'+
								script_data[i].name+
								'": could not match return obj "'+
								tmp_func[F_RET][0]+
								'" for '+
								tmp_func[F_FUNC]+
								'() . ');
					}
					
					/* replace opperand strings in args with indexes */
					for (var k = 0; k < tmp_func[F_ARG].length ; k++)
					{
						if ( (typeof tmp_func[F_ARG][k][0]) == 'string')
						{
							if (parse_done_obj_names.indexOf(
									tmp_func[F_ARG][k][0]) != -1)
								tmp_func[F_ARG][k][0] =
									parse_done_obj_names.indexOf(
										tmp_func[F_ARG][k][0]);
							
							else		/* if fail, throw mismatch */
								vm_err.log(
									'object "'+
									script_data[i].name+
									'": could not match return obj "'+
									tmp_func[F_ARG][k][0]+
									'" for '+
									tmp_func[F_FUNC]+
									'() . ');
						}
					}
					
					/* at this stage, all opperand string placers
					 * have been successfully converted to indexes
					 */
					
					/* replace function string with an enumeration. */
					/* throw error in the case of a mismatch. */
					if ( (typeof tmp_func[F_FUNC]) == 'string')
					{
						/* get opperand type */
						if (tmp_func[F_OPP] == -1)
							var opp_type = 'none';
						else
							var opp_type = script_data[ tmp_func[F_OPP] ].type;
						
						var fnd = false;
						
						if (vm_method_lib[opp_type] != undefined)
						{
							/* find method in matched object */
							/* if matched, replace string for F_FUNC with matched enum */
							fnd = false
							for (var l = 0; l < vm_method_lib[opp_type].length; l++)
							{
								if (vm_method_lib[opp_type][l].fname == tmp_func[F_FUNC])
								{
									tmp_func[F_FUNC] = vm_method_lib[opp_type][l].fenum;
									fnd = true;
									break;
								}
							}
						}
						
						/* if no method matched through opp_type, look
						 * for method match in wildcard section of vm_method_lib.
						 */
						if (!fnd) 
						{
							/* none isn't a real opp type. */
							if (opp_type != 'none') 
							{
								for (var l = 0; l < vm_method_lib['*'].length; l++)
								{
									if (vm_method_lib['*'][l].fname == tmp_func[F_FUNC])
									{
										tmp_func[F_FUNC] = vm_method_lib['*'][l].fenum;
										fnd = true;
										break;
									}
								}
								if (!fnd)
									vm_err.log(
										'method '+
										tmp_func[F_FUNC]+
										'() doesn\'t exist.');
							}
							else
								vm_err.log(
									'method '+
									tmp_func[F_FUNC]+
									'() doesn\'t exist.');
						}
						
						
					}
					
					/* replace str args in jmp and if_jmp with index to label */
					if (tmp_func[F_FUNC] == _JMP || tmp_func[F_FUNC] == _IF_JMP)
					{
						var tmpargc = 1;
						if (tmp_func[F_FUNC] == _IF_JMP)
							tmpargc = 2
							
						/* test for valid arg count*/
						if (	tmp_func[F_ARG].length == tmpargc  )
						{
							/* if arg is str constant */
							if ( 	(typeof tmp_func[F_ARG][tmpargc - 1][1]) == 'string' &&
									tmp_func[F_ARG][tmpargc - 1][0] == USE_VAL )
							{
								/* search through script_data[i][tmp_script_type] for label matching constant. */
								var search_str =
									tmp_func[F_ARG][tmpargc - 1][1];
								
								var tmp_fnd = false;
								for (var k = 0; k < script_data[i][tmp_script_type].length; k++)
									if (script_data[i][tmp_script_type][k].length == 2 &&
										search_str == script_data[i][tmp_script_type][k][1])
									{
										tmp_func[F_ARG][tmpargc - 1][1] = k;
										tmp_fnd = true;
										break;
									}
										
								if (!tmp_fnd)
									vm_err.log(
										'mismatching label "'+
										search_str+'".');
								
							}
							else
								vm_err.log('jmp() and if_jmp() '+
									'require a string constant.');
						}
						else
							vm_err.log('jmp() and if_jmp() '+
								'require a string constant.');
						
					}
					
					
				}
			}
			
			switch (tmp_script_type)
			{
			case 'init':
				tmp_script_type = 'body';
				break;
			case 'body':
				tmp_script_type = 'term';
				break;
			case 'term':
				tmp_script_type = 'none';
				break;
			default:
				break;
			}
		}

		/* add default predefs to obj (depending on type) if any are missing */
		if (vm_obj_lib[ script_data[i].type ] != undefined)
		{
			/* if obj type matches in vm_obj_lib: */
			tmp_keys = Object.keys(  vm_obj_lib[ script_data[i].type ]  );
			for (var j = 0; j < tmp_keys.length; j++ )
				
				if (script_data[i].vars[ tmp_keys[j] ] == undefined)
					/* for each predef cur obj doesn't
					 * have matched against vm_obj_lib:
					 */
					script_data[i].vars[ tmp_keys[j] ] =
						parse_literal_expr
						(
						parse_tokenize
								(
								vm_obj_lib[ script_data[i].type ][ tmp_keys[j] ],
								 [], 'vm_obj_lib'
								)
						);
				
					
			
		}
		
		
		
		/*	FIXME, kludge:
		 *		this replaces string values for certain variables with obj idx's.
		 */
		if (script_data[i].type == 'game')
		{
			if (typeof script_data[i].vars['clip_tmap'] == 'string')
			{
				var tobj_str = script_data[i].vars['clip_tmap'];
				var match = parse_done_obj_names.indexOf( tobj_str );
				
				if ( match != -1)
					script_data[i].vars['clip_tmap'] = match;
				else
					vm_err.log('obj "'+tobj_str+'" doesn\'t exist.' );
			}
			
		}
		else if (script_data[i].type == 'actor')
		{
			if (typeof script_data[i].vars['sprt'] == 'string')
			{
				var tobj_str = script_data[i].vars['sprt'];
				var match = parse_done_obj_names.indexOf( tobj_str );
				
				if ( match != -1)
					script_data[i].vars['sprt'] = match;
				else
					vm_err.log('obj "' + tobj_str + '" doesn\'t exist.' );
			}
			
			if (typeof script_data[i].vars['snd'] == 'string')
			{
				var tobj_str = script_data[i].vars['snd'];
				var match = parse_done_obj_names.indexOf( tobj_str );
				
				if ( match != -1)
					script_data[i].vars['snd'] = match;
				else
					vm_err.log('obj "' + tobj_str + '" doesn\'t exist.' );
			}
			
			
			
			for (var j = 0; j < script_data[i].vars['autodir_sprt_fxd'].length; j++)
			{
				if (typeof script_data[i].vars['autodir_sprt_fxd'][j] == 'string')
				{
					tobj_str = script_data[i].vars['autodir_sprt_fxd'][j];
					
					if ( parse_done_obj_names.indexOf( tobj_str ) != -1)
						script_data[i].vars['autodir_sprt_fxd'][j] = 
							parse_done_obj_names.indexOf( tobj_str );
					else
						vm_err.log(
							'obj "'+
							tobj_str+
							'" doesn\'t exist.'
							);
				}
			}
			
			for (var j = 0; j < script_data[i].vars['autodir_sprt_mov'].length; j++)
			{
				if (typeof script_data[i].vars['autodir_sprt_mov'][j] == 'string')
				{
					tobj_str = script_data[i].vars['autodir_sprt_mov'][j];
					if ( parse_done_obj_names.indexOf( tobj_str ) != -1)
						script_data[i].vars['autodir_sprt_mov'][j] = 
							parse_done_obj_names.indexOf( tobj_str );
					else
						vm_err.log(
							'obj "'+
							tobj_str+
							'" doesn\'t exist.'
							);
				}
			}
			
		}
	}
	
	return script_data;
}

/*
vm_script_data =
[
    {
        type:   'game',
        name:   'main',
        vars:   {
                    'my_int':  1,
                    'my_str':  'hello, world'
				},
        init:   [
                    [SET,       NO_OPP, [REG,0],    [[USE_VAL,10]]  ],				// reg.0 = set(10);
                    [LABEL,     'loop'],											// loop:
                    [PRINTLN,   NO_OPP, [NO_RET,-1],[[REG,0]]  ],					// println(reg.0);
                    [OP_SUB,    NO_OPP, [REG,0],	[[REG,0], [USE_VAL,1]]],		// reg.0 = op_sub(reg.0, 1);
					[CMP_GREATER,NO_OPP,[REG,1], 	[[REG,0], [USE_VAL,0]]],		// reg.1 = cmp_greater(reg.0,0);
					[IF_JMP,	NO_OPP, [NO_RET,-1],[[REG,1], [USE_VAL,'loop']]],	// if_jmp(reg.1, 'loop');
					[TERM, 		NO_OPP, [NO_RET,-1],[]]								// term();
                ],
        body:   [],
        term:   []
    }
    
]; */
