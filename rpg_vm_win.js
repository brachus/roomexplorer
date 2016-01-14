/*
 * Copyright 2015,
 * Kyle Caldbeck
 */
 
var vm_win =
{
	update:
		function()
		{
			var main_v = vm_script_data[vm_main_idx].vars;
            
            var w_lst = main_v['win_list'];
            
			main_v['win_grab'] = 0;
            
			i = 0;
            while(  i < w_lst.length )
            {
				var win_v = vm_script_data[ w_lst[i] ].vars;
                var focus_win = (i == w_lst.length - 1);
				
				/* if w_lst has ANY windows WITH grab_keys
				 * set to 1, enable win_grab. */
				if (win_v['grab_keys'] == 1)
					main_v['win_grab'] = 1;
				
				if (win_v['type'] == 'input')
				{
					switch (win_v['mode'])
					{
					case 'null':
						break;
					case 'init':
						/* 
						 * input window uses .text for
						 * storing user input string.
						 */
						win_v['text'] = '';
						
						win_v['margin_left'] = 0;
						win_v['margin_top'] = 0;
						win_v['width'] = 3;
						win_v['height'] = win_v['ln_height'];
						
						win_v['mode'] = 'run';
						
						win_v['cntr'] = 10;
						
						break;
					case 'run':
						if (win_v['cntr'] > 0 )
							win_v['cntr']--;
						else
						{
							/* backspace*/
							if (vm_input.test_key_down('backspace'))
							{
								win_v['text'] =
									win_v['text'].substring(
											0,  win_v['text'].length - 1);
							}
							
							/* take input */
							win_v['text'] += vm_input.get_str_input();
							
							/* truncate to maxchar */
							if (win_v['text'].length > win_v['maxchar'])
								win_v['text'] =
									win_v['text'].substring(0,win_v['maxchar']);
							
							if (vm_input.test_key_down('enter'))
							{
								win_v['mode'] = 'term';
								win_v['cntr'] = 5;
							}
							
							win_v['margin_left'] = 0;
							win_v['margin_top'] = 0;
							win_v['height'] = win_v['ln_height'];

						}
						
						break;
						
					case 'term':
						if (win_v['cntr'] > 0)
							win_v['cntr']--;
						else
						{
							var tmp_idx = main_v['win_list'].indexOf( w_lst[i] );
							if (tmp_idx != -1)
							{
								i--;
								main_v['win_list'].splice(tmp_idx, 1);
								win_v['mode'] = 'null';
							}
							

						}
						break;
						
					default:break;
					}
				}
				
				else if (win_v['type'] == 'menu')
				{
					switch (win_v['mode'])
					{
					case 'null':
						break;
						
					case 'init':
						
						/* parse menu text. */
						win_v['parsed'] =
                            this.parse_msg_text(win_v['text'],'menu');
                        
                        /* set menu pos to top-left menu selector. */
                        win_v['menu_pos'] =
							this.get_topleft_item(win_v['parsed']);
						
						win_v['term'] =
							this.find_term_script(win_v['parsed']);
						
							
							
						if (win_v['menu_pos'] == undefined)
							win_v['mode'] = 'noitems';
                        else
							win_v['mode'] = 'run'; 
						break;
					
					case 'noitems':
						if (focus_win) /* && vm_input.test_key_down('enter')*/
							win_v['mode'] = 'term';
						break;
						
					case 'run':
						if (focus_win)
						{
							if (vm_input.test_key_down('left'))
								win_v['menu_pos'] = 
									this.get_left_item(
										win_v['parsed'],
										win_v['menu_pos']);
							if (vm_input.test_key_down('right'))
								win_v['menu_pos'] = 
									this.get_right_item(
										win_v['parsed'],
										win_v['menu_pos'] );
							if (vm_input.test_key_down('up'))
								win_v['menu_pos'] = 
									this.get_up_item(
										win_v['parsed'],
										win_v['menu_pos'] );
							if (vm_input.test_key_down('down'))
								win_v['menu_pos'] = 
									this.get_down_item(
										win_v['parsed'],
										win_v['menu_pos'] );
							
							if (vm_input.test_key_down('enter'))
							{
								/* get script of currently selected item. */
								var tmpx = win_v['menu_pos'][0];
								var tmpy = win_v['menu_pos'][1];
								var scr_name = win_v['parsed'][tmpy][tmpx][2];
								
								var tidx = get_obj_idx( scr_name );
								
								/* attempt to run script, and set mode to 
								 * null if successful.
								 */
								if ( vm_add_sub(tidx) )
									win_v['mode'] = 'null';
									
							}
						}
						
						break;
						
					case 'term':
						if (win_v['cntr'] > 0)
							win_v['cntr']--;
						else
						{
							var tmp_idx = main_v['win_list'].indexOf( w_lst[i] );
							if (tmp_idx != -1)
							{
								i--;
								main_v['win_list'].splice(tmp_idx, 1);
								win_v['mode'] = 'null';
							}
							
							/* run window term script
							 * (an external generic script)
							 */
							if (win_v['term'] != undefined)
								vm_add_sub(get_obj_idx(win_v['term']));
							
						}
						break;
						
					default:break;
					}
				}
				
				else if (win_v['type'] == 'message')
				{
					switch (win_v['mode'])
					{
					case 'null':
						break;
                        
					case 'init':
						/* parse text  */
						win_v['parsed'] =
                            this.parse_msg_text(win_v['text'],'message');
						
						/* clear lines. */
						win_v['lines'] = [''];
						
						/* set to beginning of parsed text. */
						win_v['next_ch'] = 0;
                        
						/* move on to next mode as
                         * msg window has initialized.
                         */
						win_v['mode'] = 'run'; 
						
						break;
                        
					case 'run':
						if (  win_v['next_ch'] >=
                              win_v['parsed'].length  )
						{
							win_v['mode'] = 'term';
							win_v['cntr'] = flag_win_kill_delay;
							
						}
						else
                        {   
                            var next_ch = win_v['parsed'][
                                win_v['next_ch'] ];
                            
                            switch (next_ch[0])
                            {
                            case '#b':
                                win_v['lines'][
                                    win_v['lines'].length - 1 ] +=
                                        '\u2022';
                                break;
                            case '#n':
                                if (flag_win_msg_scroll)
                                    win_v['mode'] = 'scroll';
                                else
                                    win_v['lines'].push('');
                                break;
                            case '#w':
                                win_v['mode'] = 'wait';
								/* if window doesn't have 
								 * key grab enabled, use
								 * auto-wait.
								 */
								if (win_v['grab_keys'] == 0)
									win_v['cntr'] = win_v['auto_wait_dur'];
                                break;
                            case '#p':
                                win_v['cntr'] = next_ch[1];
                                win_v['mode'] = 'pause';
                                break;
							case '#s':
								var tidx = get_obj_idx(next_ch[1]);
								
								
								/* attempt to run script, and set mode to 
								 * null if successful.
								 */
								if ( vm_add_sub(tidx) )
									win_v['mode'] = 'null';
									
								break;
								
                            default:
                                win_v['lines'][
                                    win_v['lines'].length - 1 ] += 
                                        next_ch;
                                break;
                            }
							/* always increment current
							 * char no matter what.
							 */
                            win_v['next_ch']++;
                        }
						break;
                        
					case 'scroll':
					
						/* increment by frame msg_scroll_tmp
						 * until its at line_height.  add new line.
						 */
						if (  win_v['text_raise'] >=
                                    (win_v['ln_height'] - 1)  ||  
							  win_v['lines'].length <
                                    win_v['nlines']  )
                                    /* scroll effect won't work
                                     * until all lines are used */
						{
							win_v['mode'] = 'run';
                            /* add new line to msg_lines */
							win_v['lines'].push('');
							win_v['text_raise'] = 0 ;
						}
                        
						else
                            win_v['text_raise'] +=
                                flag_win_msg_scroll_speed ;
                        
						break;
					case 'pause': /* wait for cntr == 0 */
                        if (win_v['cntr'] > 0)
							win_v['cntr']--;
						else
                            win_v['mode'] = 'run';
                        break;
                        
					case 'wait':
                        /* wait for space to be pressed by user */
                        
                        /* only the focused window (at end of list)
                         * can accept user input
                         */
						if (win_v['grab_keys'] == 1)
						{
							if (focus_win &&
									(vm_input.test_key_down('space') ||
									vm_input.test_key_down('enter'))
									)
									win_v['mode'] = 'run';
						}
						else
						{
							if (win_v['cntr'] > 0)
								win_v['cntr']--;
							else
								win_v['mode'] = 'run';
						}
                                
						break;
						
					case 'term':
						
						/* use cntr as win kill delay. */
						if (win_v['cntr'] > 0)
							win_v['cntr']--;
						else
						{
							var tmp_idx = main_v['win_list'].indexOf( w_lst[i] );
							if (tmp_idx != -1)
							{
								i--;
								main_v['win_list'].splice(tmp_idx, 1);
								win_v['mode'] = 'null';
							}
							

						}
						
						break;
						
					default: break;
					}
				}
				
				i++;
			}
		},
	
	find_term_script:
		function(in_parsed)
		{
			var trow = 0;
			while (trow < in_parsed.length)
			{
				var tcol = 0;
				while (tcol < in_parsed[trow].length)
				{
					if (in_parsed[trow][tcol][0] == '#s')
						return in_parsed[trow][tcol][1];
					tcol ++;
				}
				
				trow ++;
			}
			return undefined;
		},
    
    get_topleft_item:
		function(in_parsed)
		{
			var trow = 0
			while (trow < in_parsed.length)
			{
				var tcol = 0;
				while (tcol < in_parsed[trow].length)
				{
					if (in_parsed[trow][tcol][0] == '#e')
						return [tcol,trow];
					tcol ++;
				}
				trow ++;
			}
			
			return undefined;
		},
	
	get_right_item:
		function(in_parsed, in_pos)
		{
			var wrap = flag_win_menu_wrap;
			
			var tcol = in_pos[0];
			var trow = in_pos[1];
			
			var ttcol = tcol+1;
			if (wrap && ttcol >= in_parsed[trow].length)
				ttcol = 0;
			while (ttcol < in_parsed[trow].length)
			{
				if (in_parsed[trow][ttcol][0] == '#e')
				{
					
					tcol = ttcol;
					break;
				}
				
				if (wrap && ttcol == in_parsed[trow].length-1)
					ttcol = 0;
				else
					ttcol ++;
			}
			
			return [tcol, trow];
		},
	
	get_left_item:
		function(in_parsed, in_pos)
		{
			var wrap = flag_win_menu_wrap;
			
			var tcol = in_pos[0];
			var trow = in_pos[1];
			
			var ttcol = tcol-1;
			if (wrap && ttcol < 0)
				ttcol = in_parsed[trow].length-1;
			while (ttcol >= 0)
			{
				if (in_parsed[trow][ttcol][0] == '#e')
				{
					tcol = ttcol;
					break;
				}
					
				if (wrap && ttcol == 0)
					ttcol = in_parsed[trow].length-1;
				else
					ttcol --;
			}
			
			return [tcol, trow];
		},
	
	get_down_item:
		function(in_parsed, in_pos)
		{
			var wrap = flag_win_menu_wrap;
			
			var tcol = in_pos[0];
			var trow = in_pos[1];
			
			/* see how many menu items,
			 * (including this one) exist from the left.
			 */
			var nitems = 0;
			var ttcol = 0;
			while (ttcol < tcol+1 )
			{
				if (in_parsed[trow][ttcol][0] == '#e')
					nitems ++;
				ttcol ++;
			}
			
			var maybe = -1;
			var ttcol = 0;
			var tcnt  = 0;
			
			
			ttrow = trow+1;
			if (ttrow >= in_parsed.length && wrap)
				ttrow = 0;
			
			while (ttrow < in_parsed.length)
			{
				ttcol = 0;
				tcnt = 0;
				while (ttcol < in_parsed[ttrow].length && tcnt != nitems)
				{
					if (in_parsed[ttrow][ttcol][0] == '#e')
					{
						maybe = ttcol;
						tcnt ++;
					}
						
					ttcol ++;
				}
				
				if (maybe > -1)
					return [maybe, ttrow];
				
				ttrow ++;
				if (ttrow >= in_parsed.length && wrap)
					ttrow = 0;
			}
			
			return [tcol, trow];
		},
	
	get_up_item:
		function(in_parsed, in_pos)
		{
			var wrap = flag_win_menu_wrap;
			
			var tcol = in_pos[0];
			var trow = in_pos[1];
			
			/* see how many menu items,
			 * (including this one) exist from the left.
			 */
			var nitems = 0;
			var ttcol = 0;
			while (ttcol < tcol+1 )
			{
				if (in_parsed[trow][ttcol][0] == '#e')
					nitems ++;
				ttcol ++;
			}
			
			var maybe =-1;
			var ttcol = 0;
			var tcnt  = 0;
			
			
			ttrow = trow - 1;
			if (ttrow < 0 && wrap)
				ttrow = in_parsed.length-1;
			
			while (ttrow >= 0)
			{
				ttcol = 0;
				ttcnt = 0;
				while (ttcol < in_parsed[ttrow].length && tcnt != nitems)
				{
					if (in_parsed[ttrow][ttcol][0] == '#e')
					{
						maybe = ttcol;
						tcnt ++;
					}
					ttcol ++;
				}
				
				if (maybe > -1)
					return [maybe,ttrow];
					
				ttrow --;
				if (ttrow < 0 && wrap)
					ttrow = in_parsed.length-1;
			}
			
			
			return [tcol, trow];
		},
    
	parse_msg_text:  /*implement: #e:<label>:<obj_name># */
		function(in_str, in_type)
			/* type = 'message' || 'menu' */
		
			/* small parser for win text format.
             * 
             * no error messages are thrown by this
             * parser;  if user uses improper syntax,
             * strange behavior may ensue.
             *
             * syntax:
             *   ##					"#"
             * 	 #b					bullet symbol
			 *   #w					prompt user to press
			 * 							space to continue message.
			 *   #n					newline
			 *   #p:<int>#			pause for <int> frames.
			 *   #s:<name>#			run <name> (obj name)
			 * 							(for menu windows, this
			 * 								script is run at termination
			 * 								of the window. )
			 *   #e:<label>:<name>#	menu item; <name> is the script
			 * 							item is tied to.
			 * 
			 * 
			 * 
			 */
		{
			var out = [];
			
			var parse_add = out;
			/* assuming parse_add becomes
			 * a reference to out (OR out[x]) 
			 */
			
			if (in_type == 'menu')
			{
				out = [[]];
				parse_add = out[0];
			}
			
			var md = 'open'
            
            var tdat = '';
			
			for (var j = 0; j < in_str.length; j++ )
			{
                switch (md)
                {
                case 'open':
                    if (in_str[j] == '#')
						md = '#';
					else
					{
						/* important: remove all newline symbols.
						 * "#n" is to be used for newlines in msg
						 * msg text. */
						if (in_str[j] != '\n')
							parse_add.push([in_str[j]]);
					}
                    break;
                case '#':
                    md = 'open';
                    
                    switch (in_str[j])
                    {
                    case '#':
                        parse_add.push(['#']);
                        break;
                    case 'b': /* bullet */
                        parse_add.push(['#b']);
                        break; 
                    case 'n': /* new line */
						if (in_type == 'message')
							parse_add.push(['#n']);
						
						else if (in_type == 'menu')
						{
							/* if menu type, output is made up
							 * of a list of lists, rather than 
							 * a single 1 dimensional list.
							 */
							out.push([]);
							parse_add = out[out.length - 1];
							
						}
						
                        break; 
                    case 'w':
                        parse_add.push(['#w']);
                        break;
                    case 'p':
                        /* syntax: #p:<int>#
                         */
                        md = 'p:';
                        break;
					case 's': /* run script & set mode to "script wait" */
						md = 's:';
						break;
					case 'e':
						/*
						 * syntax:
						 *   e:<label>:<script>#
						 */
						md = 'e:';
						break;
                    default:
                        break;
                    }
                    break;
                
				case 's:':
                    md = 'open';
                    if (in_str[j] == ':')
                        md = 's'
                    break;
				case 's':
					if (in_str[j] == '#')
					{
						parse_add.push( ['#s', tdat ]);
						tdat = '';
						md = 'open';
					}
					else
						tdat += in_str[j];
					break;
				case 'e:':
					md = 'open';
					if (in_str[j] == ':')
					{
						md = 'e_label';
						tdat = ['',''];
					}
					break;
				case 'e_label':
					if (in_str[j] == ':')
						md = 'e_script';
					else
						tdat[0] += in_str[j];
					break;
				case 'e_script':
					if (in_str[j] == '#')
					{
						md = 'open';
						parse_add.push( ['#e', tdat[0], tdat[1] ]  );
					}
					else
						tdat[1] += in_str[j];
					break;
				case 'p:':
                    md = 'open';
                    if (in_str[j] == ':')
                        md = 'p'
                    break;	
                case 'p':
                    if (is_numeral(in_str[j]))
                        tdat += in_str[j]
                    else if (in_str[j] == '#')
                    {
                        /* read tdat as integer */
                        parse_add.push( ['#p', parseInt(tdat)] );
						tdat = '';
                        md = 'open';
                    }
                    else
                    {
                        parse_add.push( ['#p', parseInt(tdat)] );
						tdat = '';
                        md = 'open';
                    }
                    break;
                }
			}
			return out;
		},
		
    render:
        function(in_ctx) /* takes in canvas (context) */
        {
            /* for each window in win_list (activated),
             *      render borders,
             *      render bg
             *      render text
             */
             
            var main_v = vm_script_data[vm_main_idx].vars;
            
            var w_lst = main_v['win_list'];

            for (var i = 0;  i < w_lst.length; i++ )
            {
                var win_v = vm_script_data[ w_lst[i] ].vars;
                
                var w_pos = win_v['pos'];
                var w_bg_col = win_v['bg_color'];
                var w_fg_col = win_v['fg_color'];
                var w_bullet_col = win_v['bullet_col'];
                var w_type = win_v['type'];
                var w_left = win_v['margin_left'];
                var w_top  = win_v['margin_top'];
                
                
                
                /* right now, border is NOT considered at all. */
                var w_wh = [win_v['width'], win_v['height']];
                
                /* render borders */
                
                /* render bg */
                in_ctx.fillStyle = vm_render.rgb(w_bg_col);
            
                in_ctx.fillRect( 
                            w_pos[0], w_pos[1],
                            w_wh[0],  w_wh[1] );
                            
                if (w_type == 'input')
                {
					in_ctx.font = win_v['font'];
					in_ctx.fillStyle = vm_render.rgb(w_fg_col);
					
					win_v['width'] =
						in_ctx.measureText(win_v['text']).width + 3;
					
					in_ctx.fillText( win_v['text'],
									 w_pos[0],
									 win_v['ln_height'] + w_pos[1]  );
					
				}
				
                else if (w_type == 'menu')
                {
					var w_parsed = win_v['parsed'];
					
					var w_nlines = win_v['nlines'];
					
					in_ctx.font = win_v['font'];
					in_ctx.fillStyle = vm_render.rgb(w_fg_col);
					
					var tmpy = w_top;
					var text_w = w_wh[0] - (w_left + w_left);
                    var text_h = win_v['ln_height'];
                    
                    var mpos = win_v['menu_pos'];
                                        
                    for (var j = 0; j < w_parsed.length; j++)
					{
						tlen = 0;
						tch = 0;
						tlabel_ch = 0;
						while (tch < w_parsed[j].length && tlen < text_w)
						{
							if (w_parsed[j][tch][0] == '#e')
							{
								render_ch =
									w_parsed[j][tch][1][tlabel_ch];
									
									
								/* if item at current menu selection. */
								if (mpos != undefined)
								{
									if (
											mpos[0] == tch &&
											mpos[1] == j   &&
											tlabel_ch == 0		)
									{
										/* render selector icon before item */
										ttmpx = w_left+tlen+w_pos[0] - 5;
										ttmpy = tmpy+w_pos[1] + 2;
										if (ttmpx > w_pos[0])
											vm_render.draw_right_arrow (
													in_ctx, [ttmpx,ttmpy]);
											
											

									}
								}
								
								tlabel_ch ++;
								
								if (tlabel_ch >= w_parsed[j][tch][1].length)
								{
									tlabel_ch = 0;
									tch++;
								}
								
							}
							else if (w_parsed[j][tch][0] == '#s')
							{
								render_ch = '';
								tch ++;
							}
							else
							{
								render_ch = w_parsed[j][tch][0];
								tch ++;
							}
								
								
							newlen = tlen +
									in_ctx.measureText(render_ch).width
							
							if (newlen > text_w)
								break;
								
							in_ctx.fillText( render_ch,
											 w_left + tlen + w_pos[0],
											 tmpy + text_h  + w_pos[1]
										);
										
							tlen = newlen;
						}
						tmpy += text_h;
					}
				}
				
                else if (w_type == 'message')
                {
                    var w_lines = win_v['lines'];
                    
                    /* create tmp lines of text which
                     * will actually be displayed.
                     */
                    var w_nlines = win_v['nlines'];
                    var render_lines = [];
                    
                    var j = w_lines.length - w_nlines;
                    j = j < 0 ? 0 : j;
                    while (j < w_lines.length)
                    {
                        render_lines.push(w_lines[j]);
                        j++;
                    }
                    
					/* render each line of text out of render_lines */
                    in_ctx.font = win_v['font'];
                    in_ctx.fillStyle = vm_render.rgb(w_fg_col);
                    
                    var tmpy = w_top;
                    var text_w = w_wh[0] - (w_left + w_left);
                    var text_h = win_v['ln_height'];
                    
                    
                    for (var j = 0; j < render_lines.length; j++ )
                    {
                        ttext = render_lines[j];
                        
						/* truncate text to text width */
                        while (in_ctx.measureText(ttext).width >= text_w )
                        {
                            ttext = ttext.substring(0,ttext.length-1);
                            if (ttext.length == 0)
                                break;
                        }
                        
						/* text height is added to tmpy,
						 * (as fillText() draws text ABOVE xy)
						 */
						ttmpy = ((tmpy + text_h) - win_v['text_raise'] )
						
						/* if there is no space for entire height
						 * of text line at the top, don't render
						 * line of text.
                         */
                        if (ttmpy >= text_h-1 && ttext.length > 0)
                        {
							in_ctx.fillText(	ttext,
												w_left + w_pos[0],
												ttmpy  + w_pos[1] );
												
                            /* if bullet is first char in line,
                             * have it colored bullet_col.
                             */
							if (ttext[0] == '\u2022')
							{
                                in_ctx.fillStyle =
									vm_render.rgb(w_bullet_col);
                                    
								in_ctx.fillText(	ttext[0],
													w_left + w_pos[0],
													ttmpy  + w_pos[1] );
                                                    
								in_ctx.fillStyle =
									vm_render.rgb(w_fg_col);
							}
                        }
						
                        tmpy += text_h;
                    }
                    
                    /* if wait mode, render a wait symbol at
                     * the bottom right corner.  use main.mod_16
                     * as a cntr for animation.
                     */
                    if (win_v['mode'] == 'wait' && win_v['grab_keys'] == 1)
							/* key grabbing must also be enabled, as
							 * the point of drawing this icon is to 
							 * prompt the user into pressing a key.
							 */
                    {
                        w_mod32 = main_v['mod_32'];
                        wait_sym = flag_win_msg_wait_sym;
                        wait_tmpy = 0;
                        
                        if (w_mod32 > 15)
                            wait_tmpy = 2;
                        
                        /* fill style should already be fg_col. */
                        
                        ttmpx = w_wh[0]+w_pos[0] - 12;
                        ttmpy = w_wh[1]+w_pos[1] - 2 + wait_tmpy;
                        
                        if (wait_sym != '')
                            in_ctx.fillText( wait_sym, ttmpx, ttmpy  );
                        else
                        {
                            /* if wait symbol left empty, draw an
                             * arrow pointing down instead.
                             */
                            ttmpy -=4
							
                            in_ctx.beginPath();
                            in_ctx.moveTo(ttmpx, ttmpy); /* top-left */
                            in_ctx.lineTo(ttmpx+8, ttmpy);
                            in_ctx.lineTo(ttmpx+4, ttmpy+4);
                            in_ctx.closePath();
                            in_ctx.fill();
                        }
                    }
                }
            }
        }
}
