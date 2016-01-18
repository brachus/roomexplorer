

/*
 * define processor (vm_proc_step) :
 * 
 * 	 only takes in index for active sub in vm_active_sub.
 * 
 * fetches & executes next call in obj.script;
 * 
 * steps program counter to next call or jmp label.
 * 
 * sets timer if called for by executed call.
 * 
 * automatically increments script type if no more calls are found;
 * sets pc back to 0.
 * 
 * return values:
 * 		'term'			remove sub from vm_active_sub
 * 		'term_vm'		terminate vm
 * 		'step'			continue stepping cur sub.
 * 		'next_sub'		move on to next sub in list.
                        ( loop()/next_frame() has been used )
 *
 * Copyright 2015,
 * Kyle Caldbeck
 */
 
var vm_proc_step = function ( sub_idx )
{
	/* uses previously defined global vm components + enums */
	
	var ret_val = 'step'; /* return value */
	var no_step = false; /* if true, pc isn't incremented.
                          * might mean jmp or sub mode
                          * increment has occured.
                          */
	
	var mode_str = '';		/* get string for current sub mode. */
	switch ( vm_active_sub[sub_idx][S_MODE] )
	{
		case 0: mode_str = 'init'; break;
		case 1: mode_str = 'body'; break;
		case 2: mode_str = 'term'; break;
		default: break;
	}
	
	var tmp_pc = vm_active_sub[sub_idx][S_PC];
	var tmp_obj = vm_active_sub[sub_idx][S_OBJ];
	var tmp_mod = vm_active_sub[sub_idx][S_MODE];
	
	if ( tmp_pc >= /* if pc at EOF in cur sub mode */
			vm_script_data[ tmp_obj ][mode_str].length )
	{
		if (tmp_mod == 2) /* term sub if EOF at term mode */
			return 'term';
		else
		{
			vm_active_sub[sub_idx][S_MODE] ++ ; /* increment sub mode */
			vm_active_sub[sub_idx][S_PC] = 0; /* set pc to beginning */
			return 'step'; /* not finished stepping. */
		}
	}
	
	/* assuming proc_call becomes reference to function call pc points to. */
	var proc_call = vm_script_data[ tmp_obj ][mode_str][ tmp_pc ];
	
	/* important: skip labels */
	if (proc_call.length != 4)
	{
		vm_active_sub[sub_idx][S_PC] ++ ;
		return ret_val;
	}
	
	/* gather data (references) for each arg for proc_args */
	var proc_args = [];
	
	vm_err.line = -1;
	vm_err.col = -1;
	vm_err.file = '';
	
	
	for (var tmp_arg = 0; tmp_arg < proc_call[F_ARG].length; tmp_arg++ )
	{
		var arg_0 = proc_call[F_ARG][tmp_arg][0];
		var arg_1 = proc_call[F_ARG][tmp_arg][1];
		
		
		if (arg_0 == USE_VAL) 	/* ### constant */
		{
			if (arg_1 != undefined)
				proc_args.push( arg_1 ); // very simple
			else
				vm_err.log('undefined constant.');
                /* FIXME undefined is illegal? */
		}
		else if (arg_0 == REG) /* ### register */
		{
			if (vm_reg[arg_1] != undefined)
				proc_args.push( vm_reg[arg_1] ); // very simple
			else
				vm_err.log('undefined register value'); 
		}
		else 											/* ### object var */
		{
			if ( vm_script_data[ arg_0 ].vars[ arg_1 ] != undefined )
				proc_args.push(  vm_script_data[ arg_0 ].vars[ arg_1 ]  ); 
			else
				vm_err.log('undefined obj.variable value.'); 
		}
		
	} 
	
	/* find opp type if !NO_OPP */
	if (proc_call[F_OPP] == NO_OPP)
		var opp_type = 'none';
	else
		var opp_type = vm_script_data[ proc_call[F_OPP] ].type ;
	
	
	if (opp_type != 'none') /* if opp_type counts for any obj opp (*) */
		/* look for function in * section of vm_method_lib.
		  if match found, set opp_type to * to qualify it as a wildcard opp type.
		  if not found, proceed to matching an existing obj type. */
		
		for (var k = 0; k < vm_method_lib['*'].length; k++)
			if (vm_method_lib['*'][k].fenum == proc_call[F_FUNC])
				opp_type = '*';
	
	/* 	---- FIXME check arg count and types against vm_method_lib, etc. */
    
    var main_v = vm_script_data[vm_main_idx].vars;
	
	switch(opp_type)
	{
    case 'none':
        switch (proc_call[F_FUNC])
        {
        case _SET:
            var proc_ret = proc_args[0];
            
            var do_ret_idx = false;
            var idx_list = false;
            
            
            
            if (proc_call[F_RET][0] >= 0)
            {
		
                if (vm_script_data[proc_call[F_RET][0]].type == 'game')
                {
                    if (proc_call[F_RET][1] == 'clip_tmap')
                        if (typeof proc_args[0] == 'string')
                            do_ret_idx = true;
                }
                else if (vm_script_data[proc_call[F_RET][0]].type == 'actor')
                {
					
                    if (proc_call[F_RET][1] == 'sprt')
                        if (typeof proc_args[0] == 'string')
                            do_ret_idx = true;
                    else if (proc_call[F_RET][1] == 'snd')
                        if (typeof proc_args[0] == 'string')
                            do_ret_idx = true;
                }
            }
            
            if (do_ret_idx) /* return idx of obj if assignment is to certain
                             * specific variables.
                             */
            {
                if (!idx_list)
                {
                    proc_ret = get_obj_idx(proc_args[0]);
                    if (proc_ret == -1)
                        vm_err.log
							(
								'object "'+
									proc_args[0]+
									'" does\'t exist.'
							);
                }
            }
                
            
            break;
            
        case _PRINTLN:			
			vm_console.print(proc_args[0]);
			
			break;
            
        
        case _OP_ADD:
            var proc_ret = proc_args[0] + proc_args[1];		break;
            
        case _OP_SUB:
            var proc_ret = proc_args[0] - proc_args[1];		break;
            
        case _OP_MUL:
            var proc_ret = proc_args[0] * proc_args[1];		break;
            
        case _OP_DIV:
            var proc_ret = proc_args[0] / proc_args[1];		break;
            
        case _OP_MOD:
            var proc_ret = proc_args[0] % proc_args[1];		break;
            
        
        case _CMP_EQUAL:
            if (proc_args[0] == proc_args[1])	var proc_ret = 1;
            else							  	var proc_ret = 0;
            break;
            
        case _CMP_NEQUAL:
            if (proc_args[0] != proc_args[1])	var proc_ret = 1;
            else							  	var proc_ret = 0;
            break;
            
        case _CMP_GREATER:
            if (proc_args[0] > proc_args[1])	var proc_ret = 1;
            else							  	var proc_ret = 0;
            break;
            
        case _CMP_LESSER:
            if (proc_args[0] < proc_args[1])	var proc_ret = 1;
            else							  	var proc_ret = 0;
            break;
            
        case _CMP_GREATEQUAL:
            if (proc_args[0] >= proc_args[1])	var proc_ret = 1;
            else							  	var proc_ret = 0;
            break;
            
        case _CMP_LESSEQUAL:
            if (proc_args[0] <= proc_args[1])	var proc_ret = 1;
            else							  	var proc_ret = 0;
            break;
        
            
        case _IF_JMP:
            if (proc_args[0] == 1)
            {
                vm_active_sub[sub_idx][S_PC] = proc_args[1];
                no_step = true;
            }
            break;
        
        case _JMP:
            vm_active_sub[sub_idx][S_PC] = proc_args[0];
            no_step = true;
            break;
            
            
        case _TERM:
			/* change sub mode to term */
            vm_active_sub[sub_idx][S_MODE] = 2 ; 
            vm_active_sub[sub_idx][S_PC] = 0;
            return 'step';
            break;
            
        case _TERM_VM:
            ret_val = 'term_vm';
			break;
        
        case _LOOP:
            vm_active_sub[sub_idx][S_PC] = 0;
            return 'next_sub';
            break;
        
        case _SLEEP:
            vm_active_sub[sub_idx][S_TIMER] = proc_args[0];
            break;
        
        case _KEY:
			var proc_ret = 0;
            if (vm_input.test_key_hold(proc_args[0]) && main_v['key_active'] == 1
                    && main_v['win_grab'] == 0)
				proc_ret = 1;
            break;
		
		case _KEY_DOWN:
			var proc_ret = 0;
			if (vm_input.test_key_down(proc_args[0]) && main_v['key_active'] == 1
                    && main_v['win_grab'] == 0)
				proc_ret = 1;
			break;
		
		case _KEY_UP:
			var proc_ret = 0;
			if (vm_input.test_key_up(proc_args[0]) && main_v['key_active'] == 1
                    && main_v['win_grab'] == 0)
				proc_ret = 1;
			break;
        
        case _FADE_VAR:
            
            var f_objname = proc_args[0];
            var f_varname = proc_args[1];
            var f_goal =    proc_args[2];
            var f_frames =  proc_args[3];
            
            var f_objidx = get_obj_idx(f_objname);
            if (f_objidx > -1) // if obj exists
            {
                var f_type = 'none';
                
                var f_cur = vm_script_data[f_objidx].vars[f_varname];
                
                if (f_cur != undefined) // if var exists
                {
                    
                    if ((typeof f_goal) == (typeof f_cur))
                            // if types of goal and existing var match
                    {
                        if ((typeof f_goal) == 'number')
                        {
                            if (
                                    ( (f_cur - Math.floor(f_cur)) > 0 ) || 
                                    ( (f_goal - Math.floor(f_goal)) > 0 )
                                )       /* if any of two vals decimal, assume
                                         * type 'float'.
                                         */
                                f_type = 'float';
                            else
                                f_type = 'int'
                        }
                        
                        if (f_type == 'float' || f_type == 'int')
                            /* if all looks good, verify type, wrap it up,
                             * and add it to vm_fader.
                             */
                            vm_fader.add (
                                f_type,
                                f_objidx,
                                f_varname,
                                f_cur,
                                f_goal,
                                f_frames);
                            
                    }
                }
            }
            
            break;
        
        case _CAM_UNFOCUS:
            main_v['cam_actor'] = -1;
            break;
        
        case _AACTORS_CLEAR:
            main_v['active_actors'] = [];
            break;
        
        case _ATMAPS_CLEAR:
            main_v['active_tmaps'] = [];
            break;
        
        case _KEYS_DISABLE:
            main_v['key_active'] = 0;
            break;
        
        case _KEYS_ENABLE:
            main_v['key_active'] = 1;
            break;
        
        case _SPRT_FILL_LAYER:
            var fill_lyr = proc_args[0];
            
            var fill_rgb =
            [
                proc_args[1],
                proc_args[2],
                proc_args[3],
            ];
            
            vm_render.sprt_fill_layer(fill_lyr, fill_rgb);
            break;
        
        case _TMAP_FILL_LAYER:
            var fill_lyr = proc_args[0];
            
            var fill_rgb =
            [
                proc_args[1],
                proc_args[2],
                proc_args[3],
            ];
            
            vm_render.tmap_fill_layer(fill_lyr, fill_rgb);
            break;
        
        case _RANDINT:
			x = proc_args[0];
			y = proc_args[1];
			
			proc_ret = Math.floor(Math.random() * (y - x + 1)) + x;
			
			break;
        
        default:
            vm_err.log
            (
                'method "'+
                    proc_call[F_FUNC]+
                    '()" doesn\'t exist for obj type "'+
                    opp_type+
                    '".'
            );
            break;
        }
        break;
    case 'inventory':
		var inv_v = vm_script_data[proc_call[F_OPP]].vars;
		
		switch (proc_call[F_FUNC])
		{
		case _ADDITEM:
			var item_nm = proc_args[0];
			
			var item_idx = get_obj_idx(item_nm);
			
			if (item_idx != -1)
				if (inv_v['dat'].indexOf(item_idx) == -1)
					inv_v['dat'].push(item_idx);
			break;
			
		case _DROPITEM:
			var item_nm = proc_args[0];
			
			var item_idx = get_obj_idx(item_nm);
			
			if (item_idx != -1)
			{
				tmpidx = inv_v['dat'].indexOf(item_idx)
				if (tmpidx != -1)
					inv_v['dat'].splice(tmpidx, 1);
			}
				
			break;
			
		default:
			vm_err.log
            (
                'method "'+
                    proc_call[F_FUNC]+
                    '()" doesn\'t exist for obj type "'+
                    opp_type+
                    '".'
            );
            break;
		}
		break;
		
    case 'actor':
        var actr_v = vm_script_data[proc_call[F_OPP]].vars;
        
        switch (proc_call[F_FUNC])
        {
        case _KEY_MOVE:
            var use_speed = proc_args[0];
            var actr_idx = proc_call[F_OPP];
            
            var tmpl = false;   var tmpr = false;
            var tmpu = false;   var tmpd = false;
			if (main_v['key_active'] == 1 && main_v['win_grab'] == 0)
			{
				for (var k = 0; k < vm_input.key_hold.length; k++)
					switch (vm_input.key_hold[k])
					{
						case 'up':    tmpu = true; break;
						case 'down':  tmpd = true; break;
						case 'left':  tmpl = true; break;
						case 'right': tmpr = true; break;
						default:break;
					}
            }

            var tmpdincr = use_speed;
            if (main_v['mod_4'] == 3)
                tmpdincr = Math.floor(use_speed / 2);
            
            actr_dpos = actr_v['dpos'];
            actr_if_mov = actr_v['if_mov'];
            actr_dir = actr_v['dir'];
            
            actr_if_mov = 1;
            
            var if_diag = 0;
            
            if ((tmpl && tmpr) || (tmpu && tmpd))
                {actr_dpos = [0,0];	actr_if_mov = 0;}
            else if (tmpu && (!tmpl && !tmpr))
                {actr_dpos[1] += use_speed; actr_dir = 'u';}
            else if (tmpd && (!tmpl && !tmpr))
                {actr_dpos[1] -= use_speed; actr_dir = 'd';}
            else if (tmpl && (!tmpu && !tmpd))
                {actr_dpos[0] -= use_speed; actr_dir = 'l';}
            else if (tmpr && (!tmpu && !tmpd))
                {actr_dpos[0] += use_speed; actr_dir = 'r';}
            else if (tmpd && tmpl && !tmpr)
                { actr_dpos[1] -= tmpdincr;
                actr_dpos[0] -= tmpdincr; actr_dir = 'dl';
                if_diag = 1;}
            else if (tmpd && !tmpl && tmpr)
                { actr_dpos[1] -= tmpdincr;
                actr_dpos[0] += tmpdincr; actr_dir = 'dr';
                if_diag = 1;}
            else if (tmpu && !tmpl && tmpr)
                { actr_dpos[1] += tmpdincr;
                actr_dpos[0] += tmpdincr; actr_dir = 'ur';
                if_diag = 1;}
            else if (tmpu && tmpl && !tmpr)
                { actr_dpos[1] += tmpdincr;
                actr_dpos[0] -= tmpdincr; actr_dir = 'ul';
                if_diag = 1;}
            
            if (!tmpu && !tmpd && !tmpl && !tmpr)
                actr_if_mov = 0;
            
            actr_v['if_diag'] = if_diag;
            
            actr_v['dpos'] = actr_dpos;
            actr_v['if_mov'] = actr_if_mov;
            actr_v['dir'] = actr_dir;
            
            break;
            
        case _CAM_FOCUS:
            actr_idx = proc_call[F_OPP];
            if (main_v['cam_actor'] != actr_idx)
                proc_ret = 1;
                /* success if cam_actor was not previously focus on actor. */
            else
                proc_ret = 0;
            main_v['cam_actor'] = actr_idx;
            break;
        
        case _CLIP:
            var actr_idx = proc_call[F_OPP];
            
            var tmap = main_v['clip_tmap'];
            
            var actr_pos = actr_v['pos'];
            var actr_dpos = actr_v['dpos'];
            var actr_lyr = actr_v['layer'];
            
            var tmp_dpos = [0,0]; /* this is stepped to dpos. */
            var old_dpos = [0,0];
            
            /* create bounding box for actor to be clipped. */
            var tmpbbox = actr_v['bbox'];
            var actr_bbox = 
            [
                [tmpbbox[0] + actr_pos[0],
                    tmpbbox[1] + actr_pos[1]], /*top-left corner*/
                [tmpbbox[2] + actr_pos[0],
                    tmpbbox[1] + actr_pos[1]], /*top-right corner*/
                [tmpbbox[0] + actr_pos[0],
                    tmpbbox[3] + actr_pos[1]], /*bot-left corner*/
                [tmpbbox[2] + actr_pos[0],
                    tmpbbox[3] + actr_pos[1]], /*bot-right corner*/
            ];
            
            var clip_mode = 'norm';
            
            var clip_cont = true;
            while (clip_cont)
            {
            
                var actr_tile_pnt = [];
                var actr_tile_dat = [];
                var actr_tile_rel = [];
                
                var bbtmpx = 0;
                var bbtmpy = 0;
                
                /* FIXME: using points of actor's bbox for clipping is
                 *      good for now, but a more elegant system which
                 *      can accuratley a bounding box may be desired...
                 */
                 
                /* for each point out of 4 in bbox: */						
                for (var k=0; k<4; k++) 
                {
                    bbtmpx = actr_bbox[k][0] + tmp_dpos[0];
                    bbtmpy = actr_bbox[k][1] + tmp_dpos[1];
                    
                    actr_tile_pnt.push
                    (
                        clip_tile_point( [bbtmpx,bbtmpy] )
                    );
                    
                    actr_tile_rel.push
                    (
                        actr_tile_pnt[k][1]
                    );
                    
                    actr_tile_dat.push
                    (
                        clip_get_dat(actr_tile_pnt[k])
                    );
                    
                    var noclip = 
                    clip_block_test  /* check to see if actor bbox+tmp_dpos
                                      * gets clipped against clip tmap.
                                      */
                    (
                        actr_tile_rel[k],
                        actr_tile_dat[k][0],
                        actr_tile_dat[k][1]
                    );
                    
                    if (noclip)     /* check to see if actor bbox+tmp_dpos
                                     * gets clipped against any solid actor
                                     * on same layer.
                                     */
                        noclip = clip_actor_test
                                    (
                                    actr_idx,
                                    [bbtmpx,bbtmpy],
                                    actr_lyr
                                    );
                    
                    if (!noclip)
                        /* for now simply clip dpos whenever
                         * collision occurs. */
                    {
                        actr_v['dpos'][0] = old_dpos[0];
                        actr_v['dpos'][1] = old_dpos[1];
                        
                        clip_cont = false;
                        break;
                    }
                }
                
                if (tmp_dpos[0] == actr_dpos[0] &&
                    tmp_dpos[1] == actr_dpos[1])
                    break;
                    /* no clipping was needed */
                
                    
                old_dpos[0] = tmp_dpos[0];
                old_dpos[1] = tmp_dpos[1];
                
                /* step tmp dpos */
                if (tmp_dpos[0] > actr_dpos[0])
                    tmp_dpos[0]--;
                else if (tmp_dpos[0] < actr_dpos[0])
                    tmp_dpos[0]++;
                
                if (tmp_dpos[1] > actr_dpos[1])
                    tmp_dpos[1]--;
                else if (tmp_dpos[1] < actr_dpos[1])
                    tmp_dpos[1]++;
                
            }
            
            if (actr_v['dpos'][0] == 0 &&
                actr_v['dpos'][1] == 0 &&
                actr_v['if_diag'] == 0)
                /*FIXME (kludge): if not moving diagonally... */
                actr_v['if_mov'] = 0;
            
            break;
        
        case _MSG_CLEAR:            
            actr_v['msg_srcs'] = [];
            actr_v['msg_strs'] = [];
            
            break;
        
        case _MSG_SEND:
            var actr_idx = proc_call[F_OPP];
            
            
            var snd_method = proc_args[0];
            var snd_mesg = proc_args[1];
            
            var snd_id = actr_v['msg_id'];
            var snd_dir = actr_v['dir'];
            var snd_pos = actr_v['pos'];
            var snd_dist = actr_v['msg_upclose_dst'];
                        
            proc_ret = false;
            
            switch (snd_method)
            {
            case 'shoot':
                proc_ret =
                    send_method_shoot(
                        actr_idx, snd_id, snd_mesg,
						snd_dir, snd_pos );
                break;
            case 'upclose':
                proc_ret =
                    send_method_upclose(
                        actr_idx, snd_id, snd_mesg,
						snd_dir, snd_pos, snd_dist );
                break;
			case 'all':
				/* sends message to every actor except self. */
				proc_ret = 
					send_method_all( actr_idx, snd_id, snd_mesg );
				break;
            default:
                break;
            }
            
            
            if (proc_ret) proc_ret = 1;
            else proc_ret = 0;
            
            break;
        
        case _MSG_CHECK:
            var actr_idx = proc_call[F_OPP];
            
            var find_id = proc_args[0];
            var find_mesg = proc_args[1];
			
            var msg_srcs = actr_v['msg_srcs'];
            var msg_strs = actr_v['msg_strs'];
			
			proc_ret = 0;
			
			for (var l = 0;  l < msg_srcs.length; l++ )
			{
				if (    msg_srcs[l] == find_id &&
                        msg_strs[l] == find_mesg   )
					proc_ret = 1; /* found match */
					break;
			}
            
            break;
        
        case _PLAYSND:
			var actr_idx = proc_call[F_OPP];
			/* get idx of snd in var "snd" */
			var snd_idx = actr_v['snd'];
			
			if (snd_idx > -1)
			{
				/* get idx of sound dat from snd obj */
				var tmpsnddat = vm_script_data[snd_idx].vars['dat'];
				
				if (tmpsnddat != undefined && tmpsnddat.length > 0)
					vm_audio.play(tmpsnddat[0], snd_idx, actr_idx);
			}
			break;
			
		case _STOPSND:
			var actr_idx = proc_call[F_OPP];
			
			tmp_snd_item = vm_audio.match_obj_idx(actr_idx);
			if (tmp_snd_item > -1)
				vm_audio.stop(tmp_snd_item);
			break;
            
        default:
            vm_err.log
				( 'method "'+
					proc_call[F_FUNC]+
					'()" doesn\'t exist for obj type "'+
					opp_type+
					'".' );
            break;
        }
        break;
		
    case 'window':
        switch (proc_call[F_FUNC])
        {
        case _OPEN:
            var win_idx = proc_call[F_OPP];
            
            proc_ret = 0;
            
            if ( main_v['win_list'].indexOf( win_idx ) == -1 )
				main_v['win_list'].push(win_idx);
				 
			vm_script_data[win_idx].vars['mode'] = 'init';
			
			proc_ret = 1;
			
            
            break;
			
		case _CLOSE:
            var win_idx = proc_call[F_OPP];
			
            vm_script_data[win_idx].vars['mode'] = 'term';
            break;
			
		case _SETMODE:
            var win_idx = proc_call[F_OPP];
			
            vm_script_data[win_idx].vars['mode'] = proc_args[0];
            break;
			
        default:
            vm_err.log
				(
					'method "'+
						proc_call[F_FUNC]+
						'()" doesn\'t exist for obj type "'+
						opp_type+
						'".'
				);
            break;
        }
        break;
    case '*': /* if wildcard-opp method matched: */
        switch (proc_call[F_FUNC])
        {
        case _START:
            var st_opp = proc_call[F_OPP];
            
            /* search through vm_active_sub for st_opp.
             * if no match, add st_opp's subroutine to vm_active_sub.
             */
			 
            var fnd = -1;
            for (var k = 0; k < vm_active_sub.length && fnd == -1 ; k++ )
                if (vm_active_sub[k][0] == st_opp)
                    fnd = k;
            
            if (fnd == -1)
            {	
                vm_active_sub.push( [st_opp, 0, 0, 0, 0] );
                proc_ret = 1; /* success; sub was added to vm_active_sub. */
            }
            else
                proc_ret = 0; /* fail; did not activate sub
                               * ( sub already is running in vm_active_sub )
                               */
            
            break;
        
        case _STOP: /*
					 * set opperand obj script mode to term and pc to 0. 
                     * may be applied to self.
                     */
            var st_opp = proc_call[F_OPP];
            
            /* search through vm_active_sub for a match.  if found, remove
             * from vm_active_sub.
             */
            var fnd = -1;
            for (var k = 0; k < vm_active_sub.length && fnd == -1 ; k++ )
                if (vm_active_sub[k][0] == st_opp)
                    fnd = k;
            
            if (fnd > -1)
            {
                vm_active_sub[fnd][S_MODE] = 2 ;
                        /* change sub mode to term */
                vm_active_sub[fnd][S_PC] = 0;
                if (fnd == sub_idx)
                    return 'step';
                    /* if .stop() is being used on THIS sub currently
                     * being stepped, return 'step'.
                     */
                /* DOT NOT remove sub from vm_active_sub.  it may have
                unpredictable effects on current vm_active_sub processing. */
                proc_ret = 1;
            }
            else
                proc_ret = 0;
            
            break;
        case _ACTIVATE:
            /* add opperand obj idx to appropriate list in game main. */
            var st_opp = proc_call[F_OPP];
            
            proc_ret = 0;
            
            if (vm_script_data[ st_opp ].type == 'actor' )
            {
                if (main_v
                        ['active_actors'].indexOf( st_opp ) == -1)
                {
					
                    main_v
                        ['active_actors'].push(st_opp);
                    proc_ret = 1;
                }
            }
            else if (vm_script_data[ st_opp ].type == 'tilemap' )
            {
                if (main_v
                        ['active_tmaps'].indexOf( st_opp ) == -1)
                {
                    main_v
                        ['active_tmaps'].push(st_opp);
                    proc_ret = 1;
                }
            }
            else if (vm_script_data[ st_opp ].type == 'window')
            {
                if ( main_v['win_list'].indexOf( st_opp ) == -1 )
                {
                    main_v['win_list'].push(st_opp);
                    /* last index in win_list is the "focused" window,
                     * so a window activated here becomes focused.
                     */
                    proc_ret = 1;
                }
            }
        
            break;
        case _DEACTIVATE:
            var de_opp = proc_call[F_OPP];
            
            proc_ret = 0;
            
            if (vm_script_data[ de_opp ].type == 'actor' )
            {
                tmp_idx = main_v['active_actors'].indexOf( de_opp );
                if (tmp_idx != -1)
				{
                    main_v['active_actors'].splice(tmp_idx, 1);
					
				}
            }
            else if  (vm_script_data[ de_opp ].type == 'tilemap' )
            {
                tmp_idx = main_v['active_tmaps'].indexOf( de_opp );
                if (tmp_idx != -1)
                    main_v['active_tmaps'].splice(tmp_idx, 1);
            }
            
            break;
        
        default:
            break;
        }
        break;
    default:
        break;
	}
	
	/* handle return value from call */
	var ret_0 = proc_call[F_RET][0];
	var ret_1 = proc_call[F_RET][1];
	
	if (ret_0 != NO_RET)
	{
		if (ret_0 == REG)
			vm_reg[ ret_1 ] = clone(proc_ret); /* requires deep copy. */
		else
			/* no need to check for existent variable */
			vm_script_data[ ret_0 ].vars[ ret_1 ] = clone(proc_ret);            
	}
	
	
	/* step program counter */
	if (!no_step)
		vm_active_sub[sub_idx][S_PC] ++ ;
	
	return ret_val;
}


/*
 * vm_proc_full 
 *
 * fully process through vm_active_sub for ONE frame.
 */
var vm_proc_full = function()
{	
	/* process each sub in vm_active_sub for this frame. */
	var i = 0;
	while (i < vm_active_sub.length && vm_run)
	{
		/* keep stepping sub until something special happens. */
		var step = true;
		while (step && vm_run)
		{
			if (vm_active_sub[i][S_TIMER] > 0)
                /* if timer > 0, sleep, while decrementing timer */
			{
				vm_active_sub[i][S_TIMER]--; /* decrement timer */
				step = false;	/* move on */
			}
			else
			{
				/* ----- step sub ----- */
				var ret_val = vm_proc_step(i); 
				
				switch (ret_val)
				{
					case 'term':
						vm_active_sub.splice(i,1);
						i --  ;
                        /* "i" doesn't change at end of loop. */
						step = false;
						break;
					case 'term_vm':
						vm_run = false
						break;
					case 'next_sub':
						step = false;
						break;
				}
			}
		}
		i++;
	}
    
	/* FIXME: for now, if there's no active sub, kill vm */
	if (vm_active_sub.length == 0) 		
		vm_run = false;
}
