/*
 * Copyright 2015,
 * Kyle Caldbeck
 */
 
/* (at this point, vm_script_data and vm_main_idx are defined.) */

var clip_tile_point = function(pos)
{
    /* get clip_tile_idx */
    var clip_tmap = vm_script_data[vm_main_idx].vars['clip_tmap'];
    
    if (clip_tmap == -1) /* return undefined on lack of clip tilemap. */
        return undefined;
    
    /* find pos relative to clip_tile pos.*/
    var clip_tpos = vm_script_data[clip_tmap].vars['pos'];
    
        
    var rel_pos =
    [
        pos[0] - clip_tpos[0],
        -(pos[1] - clip_tpos[1]) /* convert from global y coords.*/
    ];
    
    
    /* get tile ref pos within tile. */
    var ref_pos = 
    [
        Math.floor(rel_pos[0]/16),
        Math.floor(rel_pos[1]/16)
    ];
    
    /* get pos relative to top-left of tile pos is found on. */
    var rel_tile_pos =  
    [
        rel_pos[0] - (ref_pos[0]*16),
        rel_pos[1] - (ref_pos[1]*16)
    ];
    
    
    /* clip ref_pos to dimensions of clip tilemap. */
    var clip_height =  vm_script_data[clip_tmap].vars['array'].length; 
    var clip_width  =  vm_script_data[clip_tmap].vars['array'][0].length;
    
    if (ref_pos[0] < 0)
        ref_pos[0] = 0;
    else if (ref_pos[0] >= clip_width )
        ref_pos[0] = clip_width - 1;
    
    if (ref_pos[1] < 0)
        ref_pos[1] = 0;
    else if (ref_pos[1] >= clip_height )
        ref_pos[1] = clip_height - 1;
    
    /* return [ref_pos, rel_tile_pos] */
    return [ref_pos, rel_tile_pos];
}

var clip_get_dat = function(tile_ref_pos)
{
    if (tile_ref_pos == undefined)
        return undefined; /* pass undefined */
    
    /* get clip_tile_idx */
    var clip_tmap = vm_script_data[vm_main_idx].vars['clip_tmap'];
    
    if (clip_tmap == -1)
        return undefined;
    
    /* get tile ref */
    var ref_pos = tile_ref_pos[0];
    var tile_ref =
        vm_script_data[clip_tmap].vars['array'][ref_pos[1]][ref_pos[0]];
    
    
    /* return: [ blocker_list_ref, blocker_bool ]  */
    return [
		vm_script_data[clip_tmap].vars['blockers'][tile_ref],
		vm_script_data[clip_tmap].vars['block_bool'][tile_ref]
    ];
    
    
}


/* takes in rel_tile_pos, blockers list, and blocker bool str.
 * 
 * returns TRUE if rel_tile_pos does NOT intersect with tile blockers.
 * else, returns false.
 */
 
 /*
  * FIXME: using points of actor's bbox for clipping is good for now, but
  * 		a more elegant system which can accuratley a bounding box may be
  *         desired...
  */
var clip_block_test =
function
(
    rel_tile_pos,
    block_list,
    block_bool
)
{
    var noblock = true;
    
    if (block_bool == 'or')
        noblock = false;
    
    var tmpx = rel_tile_pos[0];
    var tmpy = rel_tile_pos[1];
	
    
    for (var l = 0; l < block_list.length; l++)
    {
        var tmp_blk = block_list[l];
        
        
        switch (tmp_blk)
        {
		case "none":
			noblock = true;
			break;
			
		case "full":
			noblock = false;
			break;
		
		case "upleft":
		case "ul":
			/* if rel_pos OUTSIDE blocker zone: */
			if (tmpx > (15-tmpy) &&
				tmpy > (15-tmpx))
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'upright':
		case 'ur':
			if (tmpx < tmpy &&
				tmpy > tmpx)
				noblock = true;
			else
				noblock = false;
			break;
			
		case 'downleft':
		case 'dl':
			if (tmpx > tmpy &&
				tmpy < tmpx)
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'downright':
		case 'dr':
			if (tmpx < (15-tmpy) &&
				tmpy < (15-tmpx))
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'up':
		case 'u':
			if ( tmpy > (8))
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'down':
		case 'd':
			if ( tmpy < (8))
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'left':
		case 'l':
			if ( tmpx > (8))
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'right':
		case 'r':
			if ( tmpx < (8))
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'upleft_corner':
		case 'ul_crnr':
			if (tmpx > (7 - tmpy) &&
				tmpy > (7 - tmpx))
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'upright_corner':
		case 'ur_crnr':
			if (tmpx < (tmpy + 8) &&
				tmpy > (tmpx - 8))
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'downleft_corner':
		case 'dl_crnr':
			if (tmpx > (tmpy - 8) &&
				tmpy < (tmpx + 8))
				noblock = true;
			else
				noblock = false;
			break;
		
		case 'downright_corner':
		case 'dr_crnr':
			if (tmpx < (15 - (tmpy - 8)) &&
				tmpy < (15 - (tmpx - 8)))
				noblock = true;
			else
				noblock = false;
			break;
			
		default:
			return true;
			break;
        }
        
        if (noblock && block_bool == 'or')
			return true;/* if OR, any blocker that doesn't block
						 * lets the whole thing pass through.
						 */
		if (noblock == false && block_bool == 'and')
			return false;
        
    }
    
    
    
    return noblock;

}

/*
 * returns a list of idx's of all sold actors with exception of self_idx. 
 */
var ret_clip_actors = 
function
(
    self_idx
)
{
    var tmp_actors = vm_script_data[vm_main_idx].vars['active_actors'];
    
    var clip_actors = [];
    
    for (var l = 0; l < tmp_actors.length; l++ )
    {
        var tmp_solid = vm_script_data[tmp_actors[l]].vars['solid'];
                
        if (tmp_solid == 1 && tmp_actors[l] != self_idx)
            clip_actors.push(tmp_actors[l]);
    }
    
    return clip_actors;
}

var ret_allother_actors = 
function
(
    self_idx
)
{
    var tmp_actors = vm_script_data[vm_main_idx].vars['active_actors'];
    
    var clip_actors = [];
    
    for (var l = 0; l < tmp_actors.length; l++ )     
        if (tmp_actors[l] != self_idx)
            clip_actors.push(tmp_actors[l]);
    
    return clip_actors;
}

var clip_actor_test = 
function
(
    self_idx,   /* important: get idx of actor-to-be-clipped. */
    in_pos,     /* takes in global coords of a point in a bbox. */
    in_lyr     /* layer of actor-to-be-clipped. */
)
{

    
    var clip_actors = ret_clip_actors( self_idx );
    
    
    /* for each actor in clip_actors: */
    for (var l = 0; l < clip_actors.length; l++ )
    {
        /* get pos, dpos, bbox */
        tmp_pos = vm_script_data[clip_actors[l]].vars['pos'];
        tmp_dpos = vm_script_data[clip_actors[l]].vars['dpos'];
        tmp_bbox = vm_script_data[clip_actors[l]].vars['bbox'];
        
        /* create global coord. bbox for current actor. */
        clip_bbox =
            ret_global_coord_actr_bbox( tmp_pos, tmp_bbox );
        
        /*
         * expand clip_bbox with dpos to allow clipping against
         * moving objects.
         */
        if (tmp_dpos[0] < 0)
            clip_bbox[0] += tmp_dpos[0];
        else if (tmp_dpos[0] > 0)
            clip_bbox[2] += tmp_dpos[0]
        
        if (tmp_dpos[1] < 0)
            clip_bbox[3] += tmp_dpos[1];
        else if (tmp_dpos[1] > 0)
            clip_bbox[1] += tmp_dpos[1];
        
        /*  test to see if in_pos is inside current actor bbox.
         */
        if ( clip_pos_bbox_test(in_pos, clip_bbox) )
            return false;
    }
    return true;
}

var ret_global_coord_actr_bbox =
function
(
    in_pos, /* each arg should be from actor vars. */
    in_bbox
)
{
    return  [
                in_pos[0] + in_bbox[0], /* top-left (-1,1) */
                in_pos[1] + in_bbox[1],
                
                in_pos[0] + in_bbox[2], /* bot-right (1,-1) */
                in_pos[1] + in_bbox[3]
            ];
}


/*
 * returns boolean.  takes in bbox in format
 * of ret_global_coord_actr_bbox().
 */
var clip_pos_bbox_test =  
function
(
    in_pos,
    in_bbox
)
{
    if (
            ( in_pos[0] >= in_bbox[0] && in_pos[0] <= in_bbox[2] ) &&
            ( in_pos[1] <= in_bbox[1] && in_pos[1] >= in_bbox[3] )
        )
        return true;
    
    return false;
}

/*
 * returns boolean dependent on success.
 *
 * FIXME FIXME: will need to take in to accout clip_tmap.  for now, will return FALSE always.
 */
var send_method_shoot = 
function
(
    self_idx,
    snd_id,
    snd_mesg,
    snd_dir,
    snd_start_pos
)
{
    return false;
    
    
    var other_actors = ret_allother_actors( self_idx );
    
    /* this may be expensive: */
    var other_actor_bbox = [];
    for (var l = 0; l < other_actors.length; l++)
        other_actor_bbox.push
        (
            ret_global_coord_actr_bbox
            (
                vm_script_data[other_actors[l]].vars['pos'],
                vm_script_data[other_actors[l]].vars['bbox']
            )
        );
    
    switch(snd_dir)
    {
    case 'u':
        break;
    case 'd':
        break;
    case 'l':
        break;
    case 'r':
        break;
    case 'ul':
        break;
    case 'ur':
        break;
    case 'dl':
        break;
    case 'dr':
        break;
    default:
        return false;
    }
    
    return false;
}

var send_method_upclose = 
function
(
    self_idx,
    snd_id,
    snd_mesg,
    snd_dir,
    snd_start_pos,
    snd_dst
)
{
    var other_actors = ret_allother_actors( self_idx );
    
    /* this may be expensive: */
    var other_actor_bbox = [];
    for (var l = 0; l < other_actors.length; l++)
        other_actor_bbox.push (
            ret_global_coord_actr_bbox (
                vm_script_data[other_actors[l]].vars['pos'],
                vm_script_data[other_actors[l]].vars['bbox']
            )
        );
    
    switch(snd_dir)
    {
    case 'u':
        var tst_incr = [0,1]; break;
    case 'd':
        var tst_incr = [0,-1]; break;
    case 'l':
        var tst_incr = [-1,0]; break;
    case 'r':
        var tst_incr = [1,0]; break;
    case 'ul':
        var tst_incr = [-1,1]; break;
    case 'ur':
        var tst_incr = [1,1]; break;
    case 'dl':
        var tst_incr = [1,-1]; break;
    case 'dr':
        var tst_incr = [1,-1]; break;
    default:
        return false;
    }
    
    
    
    
    var tst_pos = [snd_start_pos[0], snd_start_pos[1]];
    
    var tst_cntr = snd_dst;
    
    var tst_do = true;
    
    
    
    while (tst_cntr > 0 && tst_do)
    {
        for (var l = 0; l < other_actors.length; l++)
        {
            /* if tst_pos inside any bbox in other_actors_bbox,
             * send message to actor hit; break.
             */
            if (clip_pos_bbox_test(tst_pos, other_actor_bbox[l]) &&
					vm_script_data[other_actors[l]].vars['get_msg'] == 1 )
            {
                
                vm_script_data[other_actors[l]].vars
                    ['msg_strs'].push(snd_mesg);
                vm_script_data[other_actors[l]].vars
                    ['msg_srcs'].push(snd_id);
                
                tst_do = false;
                break;
            }
        }
        
        tst_pos[0] += tst_incr[0];
        tst_pos[1] += tst_incr[1];
        tst_cntr--;
    }
    
    
    
    return false;
}

var send_method_all =
function
(
	self_idx,
	snd_id,
	snd_mesg
)
{
	var other_actors = ret_allother_actors( self_idx );
	
	
	for (var l = 0; l < other_actors.length; l++)
	{
		vm_script_data[other_actors[l]].vars['msg_strs'].push(snd_mesg);
		vm_script_data[other_actors[l]].vars['msg_srcs'].push(snd_id);
	}
	
	return true;
}
