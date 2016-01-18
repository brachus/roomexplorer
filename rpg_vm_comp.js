/*
 * most of the components of the "outer"
 * part of the engine, responsible for
 * updating actors, tile maps, graphics,
 * sound, input, value fader, and modulator.
 * 
 * Copyright 2015,
 * Kyle Caldbeck
 */

/* update functions */
var vm_update_actors = function()
{
	tmp_actors = vm_script_data[vm_main_idx].vars['active_actors'];
	  
	if (tmp_actors != undefined)
		for(var i = 0; i < tmp_actors.length; i++ )
		{
			var actor_idx = tmp_actors[i];
			
			var actr_v = vm_script_data[actor_idx].vars;
			
			/* increment pos with dpos. */
			var dpos = actr_v['dpos'];
			actr_v['pos'][0] += dpos[0];
			actr_v['pos'][1] += dpos[1];
      
			
			/* reset dpos to 0,0 */
			actr_v['dpos'] = [0,0];
			
			/* handle auto sprite dir fxd/mov. */
			var actr_dir = actr_v['dir'];  /* get vars*/
            var actr_if_mov = actr_v['if_mov'];
            
            /* determine which set of sprites will be used
             * based on if_mov
             */
            if (actr_if_mov == 1)           
                var tmp_sprt_lst =
					actr_v['autodir_sprt_mov'];
            else
                var tmp_sprt_lst =
					actr_v['autodir_sprt_fxd'];
            var tmp_key =
				['u', 'd', 'l', 'r', 'ul', 'ur', 'dl', 'dr'];
            var tmp_sel =
				tmp_key.indexOf(actr_dir);
            if (tmp_sel != -1)
            {   /* set actor sprite to matching dir in autodir.
                 * if a certain dir in autodir set to '-1',
                 * sprite will not change. */
                if (tmp_sprt_lst[tmp_sel] != -1)
                {
                    if (actr_v['sprt'] != tmp_sprt_lst[tmp_sel] )
                    {
						/* if sprt changed to different sprt, reset
                         * curframe/curframetime
                         */
                        actr_v['sprt'] =
							tmp_sprt_lst[tmp_sel]; 
                        actr_v['sprt_curframe'] = 0;
                        actr_v['sprt_curframetime'] = 0;
                    }
                }
            }
            
            
			/* reset if_mov */
			actr_v['if_mov'] = 0;
			
			actr_v['if_diag'] = 0;
			
			
			var sprt_idx = actr_v['sprt'];
						
			/* if sprt_idx points to a sprite. */
			if (sprt_idx >= 0) 
			{
				sprt_v = vm_script_data[sprt_idx].vars;
			
                /* if sprite animation enabled: */
                if (actr_v['sprt_animate'] == 1)
                {
                
                    /* ---- process animation ---- */
                    var sprt_frames = sprt_v['frames'][
                           actr_v['sprt_curframe'] ];
                    var sprt_nframes = sprt_v['gfx'].length;
                    /* if cntr for current sprt frame >= max cnt
                     * for sprite frame, increment.
                     */
                    if ( actr_v['sprt_curframetime'] >= sprt_frames)
                    {
                        actr_v['sprt_curframetime'] = 0;
                        /* if sprt_curframe at last frame: */
                        if (actr_v['sprt_curframe'] >= (sprt_nframes-1))
                        {
                            /*if loop enabled, loop to first frame*/
                            if (sprt_v['loop'] == 1)
                                actr_v['sprt_curframe'] = 0;
                        }
                        else	/* else, incr curframe*/
                            actr_v['sprt_curframe']++;
                    }
                    else /* else, increment cntr */
                        actr_v['sprt_curframetime'] ++;
                }
				
				
				/* prepare data for rendering actor's
                 * sprite to sprt_render_list.
                 */
				sprt_cframe = actr_v['sprt_curframe'];
				actr_layer = actr_v['layer'];
				
				actr_gfx = sprt_v['gfx'][sprt_cframe];
				actr_center = sprt_v['center'][sprt_cframe];
				actr_pos =
                    [   Math.floor(actr_v['pos'][0]),
                        Math.floor(actr_v['pos'][1]) ];

				/* add to sprt_render_list: */
				vm_render.add_sprt( actr_layer,
                    actr_pos, actr_center, actr_gfx);
			}
			
			
			
		}
}

var vm_update_tmaps = function()
{
    tmp_tmaps = vm_script_data[vm_main_idx].vars['active_tmaps'];
    if (tmp_tmaps != undefined)
    {
        for(var i = 0; i < tmp_tmaps.length; i++ )
		{
            var tmap_idx = tmp_tmaps[i];
			var tmap_v = vm_script_data[tmap_idx].vars;
            
            var tmap_layer = tmap_v['layer'];
            tmap_v['pos'][0] += tmap_v['dpos'][0];
            tmap_v['pos'][1] += tmap_v['dpos'][1];
            tmap_v['dpos'] = [0,0];
            var tmap_pos   = tmap_v['pos'];
            var tmap_gfx   = tmap_v['gfx'];
            var tmap_arr   = tmap_v['array'];
            var tmap_rep   = tmap_v['repeat'];
            if (tmap_rep == 1)
				tmap_rep = true;
			else
				tmap_rep = false;
			
			            
            /* add to tmap_render_list: */
            vm_render.add_tmap(tmap_layer, tmap_pos, tmap_gfx, tmap_arr, tmap_rep);
        }
    }
}

/* define renderer */
var vm_render = 
{
	canvas:
		undefined,
	main_surface:
		undefined,
	tmp_surface:
		undefined,
	
	width: flag_width,
	height: flag_height,
	
	loaded: false,
	
	img_total: 0, /* for loading images in vm_media_lib */
	img_ld_cnt: 0,
	
	/* items in each layer in sprt_render_list
     * are sorted from highest to lowest y value.
     */
	sprt_render_list: [[],[],[],[],[],[],[],[]],
	tmap_render_list: [[],[],[],[],[],[],[],[]],
    
    /* takes in 3 item array of integers
     * at range of 0-255;  returns string
     * "rgb(##,##,##)".
     */
    rgb:
        function(in_col)
        {
            return 'rgb('+
                        in_col[0]+','+
                        in_col[1]+','+
                        in_col[2]+')';
        },
    
    
    sprt_fill_lyr: [null,null,null,null,null,null,null,null],
    /* item for each layer represent a request to 
     * prefill layer with a solid color (no alpha)
     * before rendering sprites/tmaps.
     */
    tmap_fill_lyr: [null,null,null,null,null,null,null,null],
	
	init:
		function()
		{
			 /* initialize canvas.  canvas is scaled by flag_scaler.
			  * actual rendering takes place in [main|tmp]_surface. 
			  *	set its id and attrs. */
			this.canvas = document.getElementById(	"vm_canvas" );
			this.canvas.setAttribute
			(
				'style',
				'height: '+(this.height * flag_scaler) +';'+
				'width: '+(this.width * flag_scaler) +';'+
				'display: block'
			);
			this.canvas.width  = this.width * flag_scaler;
			this.canvas.height = this.height * flag_scaler;
			
			/* resize content div width */
			var content =
				document.getElementsByClassName("content")[0];
				
			if (content != undefined)
				content.style.width = (this.width * flag_scaler) +'px';
			
			
			/* define main_surface and tmp_surface
             * (both hidden from view).
             */
			this.main_surface = document.createElement(	"canvas" );
			this.main_surface.setAttribute('hidden','');
			this.main_surface.width  = this.width;
			this.main_surface.height = this.height;
			
			this.tmp_surface = document.createElement(	"canvas" );
			this.tmp_surface.setAttribute('hidden','');
			this.tmp_surface.width  = this.width;
			this.tmp_surface.height = this.height;
			
			
			/* load all images in vm_media_lib: */
			for (var i = 0; i < vm_media_lib.length; i++ )
			{
				if (vm_media_lib[i][0] == IMG_NLOADED)
				{
					
					vm_media_lib[i][2] = document.createElement("img");
					vm_media_lib[i][2].src = vm_media_lib[i][1];
					vm_media_lib[i][2].onload = this.incr_ld_cnt();
					
					this.img_total ++;
				}
			}
						
		},
	clear: /* clear canvas and clear render lists */
		function()
		{
			
			var ctx = this.main_surface.getContext('2d');
			
            ctx.globalAlpha = 1.0;
            ctx.clearRect(0,0,this.width,this.height);
            
			/* get bg_color */
			this.tmp_col = get_dat('main','bg_color');
			ctx.fillStyle=
					'rgb('+
					this.tmp_col[0]+', '+
					this.tmp_col[1]+', '+
					this.tmp_col[2]+')';
			
			ctx.fillRect(0,0,this.width,this.height);
			
			this.sprt_render_list = [[],[],[],[],[],[],[],[]];
			this.tmap_render_list = [[],[],[],[],[],[],[],[]];
		},
    sprt_fill_layer:
        function(fill_lyr, fill_rgb)
        {
            this.sprt_fill_lyr[fill_lyr] =
            [
                fill_rgb[0],
                fill_rgb[1],
                fill_rgb[2],
            ];
        },
    tmap_fill_layer:
        function(fill_lyr, fill_rgb)
        {
            this.tmap_fill_lyr[fill_lyr] =
            [
                fill_rgb[0],
                fill_rgb[1],
                fill_rgb[2],
            ];
        },
	incr_ld_cnt:
		function()
		{
			this.img_ld_cnt ++;
		},
	set_cam:
		function()
		{
            var main_v = vm_script_data[vm_main_idx].vars;
			if ( main_v['cam_actor'] > -1 )
			{
				main_v['cam_pos'] = 
					vm_script_data[
                        main_v['cam_actor']  ].vars['pos'];
				main_v['cam_scale'] = 
					vm_script_data[ 
                        main_v['cam_actor']  ].vars['scale'];
			}
		},
	
	add_sprt:
		function(actr_layer, actr_pos, actr_center, actr_gfx)
		{
			
			if (this.sprt_render_list[actr_layer].length == 0)
			{
				this.sprt_render_list[actr_layer].push(
                            [actr_pos, actr_center, actr_gfx] );
			}
			else
			{
				/* y sort sprite into layer in sprt_render_list.
                 * list goes from highest to lowest y value.
                 */
				var added = false;
				for(  var j = 0;
                      j < this.sprt_render_list[actr_layer].length && !added;
                      j++ )
				{
					tmp_sprt = this.sprt_render_list[actr_layer][j];
					tmp_sprt_y = tmp_sprt[0][1];
					add_sprt_y = actr_pos[1];
					if (add_sprt_y >= tmp_sprt_y)
					{
						this.sprt_render_list[actr_layer].splice(
								j,
								0,
								[actr_pos, actr_center, actr_gfx]  );
						
						added = true;
					}
				}
				/* if no y value in render list was lesser than addition's y
                 * value, insert at end of list.
                 */
				if (!added)
					this.sprt_render_list[actr_layer].push(
							[actr_pos, actr_center, actr_gfx]  );
				
				
			}
		},
    
    add_tmap:
        function(tmap_layer, tmap_pos, tmap_gfx, tmap_array, tmap_rep)
        {
            this.tmap_render_list[tmap_layer].push(
                    [tmap_pos, tmap_gfx, tmap_array, tmap_rep] );
        },
    
	print_render_lists:
		function()
		{
			for (var j = 0; j < this.sprt_render_list.length; j++ )
			{
				if (this.sprt_render_list[j].length > 0)
				{
					for (  var k = 0;
                           k < this.sprt_render_list[j].length;
                           k++ )
					{
						console.log(
								'render layer '+j+': '+
								this.sprt_render_list[j][k] +
								'\n\tcam: '+
								vm_script_data[vm_main_idx].vars['cam_pos']);
					}
				}
			}
		},
        
	render:
		function()
		{
            var main_v = vm_script_data[vm_main_idx];
            
			var tmp_ctx = this.tmp_surface.getContext('2d');
			var main_ctx = this.main_surface.getContext('2d');
			
			var cam_pos = main_v.vars['cam_pos'];
			
			for (var layer = 0; layer < 8; layer++ )
			{
            
                /* if tmap layer renderable: */
                var tmp_opacity = main_v.vars['tmap_layer_opacity'][layer];
                if (tmp_opacity > 0)
                {
                    /* clear tmp_surface */
					tmp_ctx.clearRect(0,0,this.width,this.height);
                    
                    /* if request exists, prefill
                     * layer with solid rgb color. */
                    if (this.tmap_fill_lyr[layer] != null)
                    {
                        var tmp_fill_rgb = this.tmap_fill_lyr[layer];
                        
                        tmp_ctx.fillStyle =
							this.rgb(tmp_fill_rgb);
                            
                        tmp_ctx.fillRect(0,0,this.width,this.height);
                        
                        this.tmap_fill_lyr[layer] = null; /* important */
                    }
                    
                    /*** draw each tilemap to tmp_surface */
					for ( var tmp_tmap = 0;
                          tmp_tmap < this.tmap_render_list[layer].length;
                          tmp_tmap ++ )
                    {
						trep = this.tmap_render_list[layer][tmp_tmap][3];
						
						if (trep)
							this.render_tmap_repeat (
								tmp_ctx,
								cam_pos,
								this.tmap_render_list[layer][tmp_tmap][0],
								this.tmap_render_list[layer][tmp_tmap][1],
								this.tmap_render_list[layer][tmp_tmap][2]
								);
						else
							this.render_tmap (
								tmp_ctx,
								cam_pos,
								this.tmap_render_list[layer][tmp_tmap][0],
								this.tmap_render_list[layer][tmp_tmap][1],
								this.tmap_render_list[layer][tmp_tmap][2]
								);
					}
                        
                    
                    /* draw tmp to main: */
                    main_ctx.globalAlpha  = tmp_opacity/255.0;
                    
					main_ctx.drawImage(this.tmp_surface, 0, 0);
                    main_ctx.globalAlpha = 1.0;
                    
                }
                
				/* if sprite layer renderable: */
				var tmp_opacity = main_v.vars['sprt_layer_opacity'][layer];
				if (tmp_opacity > 0)
				{
					/* clear tmp_surface */
					tmp_ctx.clearRect(0,0,this.width,this.height);
                    
                    /* if request exis
                'rgb('+
                    fad_col[0]+','+
                    fad_col[1]+','+
                    fad_col[2]+')';
            ts, prefill
                     * layer with solid rgb color.
                     */
                    if (this.sprt_fill_lyr[layer] != null)
                    {
                        var tmp_fill_rgb = this.sprt_fill_lyr[layer];
                        
                        tmp_ctx.fillStyle =
							this.rgb(tmp_fill_rgb);
                            
                        tmp_ctx.fillRect(0,0,this.width,this.height);
                        
                        this.sprt_fill_lyr[layer] = null; /* important */
                    }
                    
                    
					/*** draw each sprite to tmp_surface */
					for ( var tmp_sprt = 0;
                          tmp_sprt < this.sprt_render_list[layer].length;
                          tmp_sprt ++ )
                        this.render_sprt(
							tmp_ctx,
							cam_pos,
							this.sprt_render_list[layer][tmp_sprt][0],
							this.sprt_render_list[layer][tmp_sprt][1],
							this.sprt_render_list[layer][tmp_sprt][2]);
							
					
                    /* set blend mode. */
					if (flag_allow_blend_modes)
					{
						if (main_v.vars['sprt_layer_blend'][layer] ==
								'norm')
							main_ctx.globalCompositeOperation = 'source-over';
						else if (main_v.vars['sprt_layer_blend'][layer] ==
								'mult')
							main_ctx.globalCompositeOperation = 'multiply';
						else if (main_v.vars['sprt_layer_blend'][layer] ==
								'ovrly')
							main_ctx.globalCompositeOperation = 'overlay';

					}
                    
                    /* draw to main: */
					main_ctx.globalAlpha  = tmp_opacity/255.0;
					main_ctx.drawImage(this.tmp_surface, 0, 0);
                    main_ctx.globalAlpha = 1.0;
                    main_ctx.globalCompositeOperation = 'source-over';
				}
                
			}
            
            /* render windows */
            vm_win.render(main_ctx);
            
            /* draw fader (~FADER COVERS ALL~)*/
            var fad_col = main_v.vars['fad_color'];
            var fad_opc = main_v.vars['fad_opacity'] / 255.0;
			
			/* kludge */
			if (fad_opc > .9) fad_opc = 1.0; 
                        
            main_ctx.globalAlpha = fad_opc;
            
            
            main_ctx.fillStyle = this.rgb(fad_col);
            
			main_ctx.fillRect(0,0,this.width,this.height);
			
			/* global alpha ALWAYS should be reset. */
            main_ctx.globalAlpha = 1.0; 
            main_ctx.globalCompositeOperation = 'source-over';
            
            
			
			/* render scaled main_surface to canvas. */
			var ctx2 = this.canvas.getContext('2d');
            
            /* scale what is to be drawn to canvas (main_surface) */
			ctx2.scale(flag_scaler, flag_scaler); 
			ctx2.drawImage(this.main_surface,0,0);
            
            /* reset scale for main_surface */
			ctx2.scale(1.0, 1.0);
			/*
			 * experimental, thus not used: ctx2.resetTransform();
			 */
            ctx2.setTransform(1, 0, 0, 1, 0, 0);		
			
			
			
		},
		
	render_sprt:
		function(in_ctx,cam_pos,sprt_pos,sprt_cntr,sprt_gfx)
		{
			var tmpx = sprt_pos[0] - cam_pos[0];
			var tmpy = sprt_pos[1] - cam_pos[1];
			
			tmpy *= -1;
			tmpx += this.width / 2;
			tmpy += this.height / 2;
			
			tmpx -= sprt_cntr[0];
			tmpy -= sprt_cntr[1];
			
			in_ctx.drawImage
			(	vm_media_lib[sprt_gfx][2],
				tmpx,
				tmpy
			);
		},
	
	render_tmap:
		function(in_ctx,cam_pos,tpos,tgfx,tarr)
		{
			var tmpx = tpos[0] - cam_pos[0];
			var tmpy = tpos[1] - cam_pos[1];
			tmpy *= -1;
			tmpx += this.width / 2;
			tmpy += this.height / 2;
			
			var tmprow = 0;
			while (tmprow < tarr.length)
			{
				if (  ((tmpy + (tmprow * 16)) > this.height) )
				{
					/* if row of tiles outside of
					 * camera view, skip row.
					 */
					tmprow++; 
					continue;
				}
				
				tmpcol = 0;
				while (tmpcol < tarr[tmprow].length)
				{
					if ((tmpx + (tmpcol * 16)) > this.width)
						break;
					
					if  ((tmpx + (tmpcol * 16)) < -16)
					{ 
						tmpcol ++;
						continue;
					}
					
					in_ctx.drawImage
					(
						vm_media_lib[ tgfx[tarr[tmprow][tmpcol]]
												][2],
						tmpx + (tmpcol * 16),
						tmpy + (tmprow *16)
					)
					
					tmpcol ++;
				}
				
				tmprow ++;
			}
		},
	
	render_tmap_repeat:
		function(in_ctx,cam_pos,tpos,tgfx,tarr)
		{
			var tmpx = tpos[0] - cam_pos[0];
			var tmpy = tpos[1] - cam_pos[1];
			tmpy *= -1;
			tmpx += this.width / 2;
			tmpy += this.height / 2;
			
			/* "wind-back" tmpx,tmpy to past the top-left corner
			 * of the screen.
			 */
			tlx = tmpx;
			tlcol = 0;
			while (tlx > 0 )
			{
				tlcol--;
				if (tlcol < 0)
					tlcol = tarr[0].length - 1;
				tlx-=16
			}
			
			tly = tmpy;
			tlrow = 0;
			while (tly > 0 )
			{
				tlrow--;
				if (tlrow < 0)
					tlrow = tarr.length - 1;
				tly-=16
			}
			
			var tmprow = tlrow;
			var tmpy = tly;
			while (tmpy < this.height)
			{
				
				
				var tmpcol = tlcol;
				var tmpx = tlx;
				while (tmpx < this.width)
				{
					
					in_ctx.drawImage
					(
						vm_media_lib[ tgfx[tarr[tmprow][tmpcol]]
												][2],
						tmpx,
						tmpy
					)
					
					tmpcol++;
					if (tmpcol >= tarr[0].length)
						tmpcol = 0;
					tmpx += 16;
				}
				
				tmprow++;
				if (tmprow >= tarr.length)
					tmprow = 0;
				tmpy += 16;
			}
		},
		
	draw_right_arrow:
		function(in_ctx, in_pos)
		{
			in_ctx.beginPath();
			in_ctx.moveTo(in_pos[0], in_pos[1]); /* top */
			in_ctx.lineTo(in_pos[0], in_pos[1]+8);
			in_ctx.lineTo(in_pos[0]+4,in_pos[1]+4);
			in_ctx.closePath();
			in_ctx.fill();
		}
}

/* define web-audio-api-handler*/
var vm_audio = 
{
	ok:
		true,
		
	ctx:
		undefined,
	
	node_passthrough:
		undefined,
		
	node_postrev_passthrough:
		undefined,
	
	node_reverb:
		undefined,
	node_rev_wet:
		undefined,
	node_rev_dry:
		undefined,
	
	node_compressor:
		undefined,
	node_comp_wet:
		undefined,
	node_comp_dry:
		undefined,
	
	node_master_gain:
		undefined,
	
	
		
	snd_list:
		[], /* 
			 * {
			 * 		dat_idx : 0  >=,
			 * 		obj_idx : -1 >=,
			 * 		source 	: undefined
			 * }
		     */
	
	play:
		function(datidx, sndidx, objidx)
		{
			if (vm_audio.ok)
			{
				vm_audio.snd_list.push
				(
					{
						dat_idx: /*index to and data in vm_media_lib*/
							datidx,
						snd_idx: /*index to sound object in script*/
							sndidx,
						obj_idx: /*potential index to actor object*/
							objidx,
						source:
							vm_audio.ctx.createBufferSource()
					}
				);
				
				var lstlen = vm_audio.snd_list.length - 1;
				var justadded = vm_audio.snd_list[lstlen];
				
				justadded.source.buffer = vm_media_lib[justadded.dat_idx][2];
				justadded.source.connect( vm_audio.node_passthrough );
				if (vm_script_data[sndidx].vars['loop'] == 1)
					justadded.source.loop = true;
				justadded.source.start(0);

			}
		},
	
	stop:
		function(snd_list_idx)
		{
			if (vm_audio.ok)
			{
				
				vm_audio.snd_list[snd_list_idx].source.stop();
				vm_audio.snd_list.splice(snd_list_idx,1);
			}
		},
		
	match_obj_idx:
		function(objidx)
		{
			for (var match = 0; match < this.snd_list.length; match ++)
				if (this.snd_list[match].obj_idx == objidx)
					return match;
			
			return -1;
		},
	
	loader:
		{
			xhr_request: undefined,
			snd_idx: -1
		},
	
	all_loaded:
		false,
	
	snd_load_decode_onerror:
		/* FIXME: for now, all audio must be loaded without error. */
		function()
		{
			vm_console.log
				(
				'audio decode error: couldn\'t load "'+
				vm_media_lib[vm_audio.loader.snd_idx][1]+
				'"'
				);
			vm_audio.ok = false;
		},
		
	snd_load_decode:
		function(req_dat)
		{
			vm_audio.ctx.decodeAudioData(
				req_dat,
				function(buf)
				{ vm_media_lib[vm_audio.loader.snd_idx][2] = buf;
				  vm_media_lib[vm_audio.loader.snd_idx][0] = SND_LOADED;
				  
				  /* continue load chain: */
				  vm_audio.snd_load_next();
				  },
				vm_audio.snd_load_decode_onerror
				);
		},
	
	snd_load_onerror:
		function()
		{
			/* apparrently, "this" cannot be relied upon in callbacks.
			 */
			vm_console.log(
				'XHR error: couldn\'t load "'+
				vm_media_lib[vm_audio.loader.snd_idx][1]+
				'"');
			vm_audio.ok = false;
		},
	
	
	snd_load_next:
		function()
		{
			/* keep stepping vm_audio.loader.snd_idx until the next
			 * sound bite is struck in vm_media_lib.
			 * 
			 */
			vm_audio.loader.snd_idx ++;
			
			/* stop the load chain */
			if (vm_audio.loader.snd_idx >= vm_media_lib.length)
			{
				vm_audio.all_loaded = true;
				
				return;
			}
				
			
			if (vm_media_lib[vm_audio.loader.snd_idx][0] == SND_NLOADED)
			{
				
				/* KLUDGE: if "filename" is more than 256 characters long,
				 * assume it's a base64 string.
				 */
				if (vm_media_lib[vm_audio.loader.snd_idx][1].length <= 256 )
				{
					vm_audio.loader.xhr_request = new XMLHttpRequest();
					vm_audio.loader.xhr_request.open(
						'GET',
						vm_media_lib[vm_audio.loader.snd_idx][1],
						true);
					vm_audio.loader.xhr_request.responseType = 'arraybuffer';
					vm_audio.loader.xhr_request.onload = vm_audio.snd_load_decode;
					vm_audio.loader.xhr_request.onerror = vm_audio.snd_load_onerror;
					vm_audio.loader.xhr_request.send();
				}
				else
				{	/* assume base64 string: */
					vm_audio.snd_load_decode
						(
						Base64Binary.decodeArrayBuffer
							(
							vm_media_lib[vm_audio.loader.snd_idx][1]
							)
						);
				}
				
			}
			else /* keep stepping */
				vm_audio.snd_load_next();
			
			
		},
	
		
	init:
		function()
		{
			/* set up audio context */
			try
			{
				window.AudioContext =
					window.AudioContext || window.webkitAudioContext;
				this.ctx = new AudioContext();
				
			}
			catch(e)
			{
				vm_console.log('Web Audio API is not supported.  \n'+
								'get a better browser.'	);
				this.ok = false;
			}
			
			/* create nodes and hook them all up: */
			this.node_passthrough = this.ctx.createGain();
			
			
			this.node_postrev_passthrough = this.ctx.createGain();
			
			this.node_reverb = this.ctx.createConvolver();
			this.node_compressor = this.ctx.createDynamicsCompressor();
			this.node_rev_dry = this.ctx.createGain();
			this.node_rev_wet = this.ctx.createGain();
			this.node_comp_dry = this.ctx.createGain();
			this.node_comp_wet = this.ctx.createGain();
			this.node_lowpass = this.ctx.createBiquadFilter();
			this.node_lowpass_dry = this.ctx.createGain();
			this.node_lowpass_wet = this.ctx.createGain();
			this.node_postlow_passthrough = this.ctx.createGain();
			this.node_master_gain = this.ctx.createGain();
			
			this.node_passthrough.connect(this.node_reverb);
			this.node_passthrough.connect(this.node_rev_dry);
			
			this.node_reverb.connect(this.node_rev_wet);
			
			this.node_rev_dry.connect(this.node_postrev_passthrough);
			this.node_rev_wet.connect(this.node_postrev_passthrough);
			
			this.node_postrev_passthrough.connect(this.node_lowpass);
			this.node_postrev_passthrough.connect(this.node_lowpass_dry);
			this.node_lowpass.connect(this.node_lowpass_wet);
			
			this.node_lowpass_wet.connect(this.node_postlow_passthrough);
			this.node_lowpass_dry.connect(this.node_postlow_passthrough);
			
			this.node_postlow_passthrough.connect(this.node_compressor);
			this.node_postlow_passthrough.connect(this.node_comp_dry);
			
			this.node_compressor.connect(this.node_comp_wet);
			
			this.node_comp_dry.connect(this.node_master_gain);
			this.node_comp_wet.connect(this.node_master_gain);
			
			this.node_master_gain.connect(this.ctx.destination);
			
			/* preset reverb/compressor/lowpass gains: */
			this.node_comp_wet.gain.value = 0.0;
			this.node_rev_wet.gain.value = 0.0;
			this.node_lowpass_wet.gain.value = 0.5;
			
			this.node_comp_dry.gain.value = 1.0;
			this.node_rev_dry.gain.value = 1.0;
			this.node_lowpass_dry.gain.value = 0.5;
			
			
			/* start loading all sound in vm_media_lib
			 * in a load callback chain
			 */
			
			/* audio is loaded one-at-a-time.  */
			this.snd_load_next();
			
			for (var i = 0; i < vm_media_lib.length; i++ )
				if (vm_media_lib[i][0] == SND_NLOADED)
				{
					vm_media_lib[i][2] = undefined;
					this.snd_total ++;
				}
			
		},
	
	update:
		function()
		{
			if (vm_audio.ok)
			{
				/* look over vm_audio settings in main object.
				 * 
				 * set node values accordingly:
				 */
				 
				var master_gain =
					vm_script_data[vm_main_idx].vars['audio_master_gain'];
				
				var rev_gain =
					vm_script_data[vm_main_idx].vars['audio_reverb_gain'];
				
				var lowpass_gain =
					vm_script_data[vm_main_idx].vars['audio_lowpass_gain'];
					
				var dyncomp_gain =
					vm_script_data[vm_main_idx].vars['audio_compressor_gain'];
				
					
				if (master_gain >= 0.0 && master_gain <= 1.0)
					this.node_master_gain.gain.value = master_gain;
					
				if (lowpass_gain >= 0.0 && lowpass_gain <= 1.0)
				{
					tmpdry = 1.0 - lowpass_gain;
					this.node_lowpass_dry.gain.value = tmpdry;
					this.node_lowpass_wet.gain.value = lowpass_gain;
				}
				
				if (rev_gain >= 0.0 && rev_gain <= 1.0)
				{
					tmpdry = 1.0 - rev_gain;
					this.node_rev_dry.gain.value = tmpdry;
					this.node_rev_wet.gain.value = rev_gain;
				}
				
				if (dyncomp_gain >= 0.0 && dyncomp_gain <= 1.0)
				{
					tmpdry = 1.0 - dyncomp_gain;
					this.node_comp_dry.gain.value = tmpdry;
					this.node_comp_wet.gain.value = dyncomp_gain;
				}
			}
		}
}

/* input object */
var vm_input =
{
	/* contains list of keys currently *held down*. */
	key_hold:
		[],
	
	/* contains list of keys that have just been pressed down. */
	key_down:
		[],
	
	/* contains list of keys that have just been released. */
	key_up:
		[],
			
	
	key_map:
		[['backspace', 8],	['tab', 9],	['enter', 13], ['shift', 16],
		 ['ctrl', 17], ['alt', 18], ['escape',	27],	['space', 32],
		 ['left',	37], ['up',	38], ['right',	39], ['down', 40],
         ['0',48],['1',49],['2',50],['3',51],['4',52],
         ['5',53],['6',54],['7',55],['8',56],['9',57],
         
         ['a',65],['b',66],['c',67],['d',68],['e',69],
         ['f',70],['g',71],['h',72],['i',73],['j',74],
         ['k',75],['l',76],['m',77],['n',78],['o',79],
         ['p',80],['q',81],['r',82],['s',83],['t',84],
         ['u',85],['v',86],['w',87],['x',88],['y',89],
         ['z',90],
         
         [',',188],['.',190],['/',191],['`',192],['[',219],
         ['\\',220],[']',221]  ], 
		 
	/*
	 * maintaining input state is a concurrent,
	 * even-driven process.
	 */	
	init:
		function()
		{
			document.addEventListener(
				'keydown', vm_input.do_key_down, false );
			document.addEventListener(
				'keyup', vm_input.do_key_up, false );
				

		},
	
	clear:
		function()
		{
			vm_input.key_down = [];
			vm_input.key_up = [];
			/* this function clears key_down/ key_up (as they only 
			 * contain key strs on press-down/release events).
			 */
			return true;
		},
	
	do_key_down:
		function(e)
		{	
			/* disable backspace navigate back. */
			if (e.which === 8)
				e.preventDefault();
			
			
			/* search for string association with keycode in key_map */
			var tmpstr = '';
			
			for (var i = 0; i < vm_input.key_map.length && tmpstr == ''; i++)
				if (e.keyCode == vm_input.key_map[i][1])
					tmpstr = vm_input.key_map[i][0];
					
			/* unrecognized keycode. */
			if (tmpstr == '') return; 
			
			/* avoid adding duplicates*/
			if (vm_input.key_hold.indexOf(tmpstr) == -1)
				vm_input.key_hold.push(tmpstr);
			
			/* add to key_down (also avoiding duplicates,
			 * if possible.
			 */
			if (vm_input.key_down.indexOf(tmpstr) == -1)
				vm_input.key_down.push(tmpstr);
			
		},
	do_key_up:
		function(e)
		{	
			/* search for string association with keycode in key_map*/
			var tmpstr = ''; 
				
			for (var i = 0; i < vm_input.key_map.length && tmpstr == ''; i++)
				if (e.keyCode == vm_input.key_map[i][1])
					tmpstr = vm_input.key_map[i][0];
					
			/* unrecognized keycode. */
			if (tmpstr == '') return; 
			
			/* remove key from key_hold, as
			 * it is now raised up and no longer held.
			 */
			var i = vm_input.key_hold.indexOf(tmpstr);
			if (i != -1)
				vm_input.key_hold.splice(i, 1);
			
			/* add to key_up (avoiding duplicates,
			 * if possible.
			 */
			if (vm_input.key_up.indexOf(tmpstr) == -1)
				vm_input.key_up.push(tmpstr);
			
			
		},
	print_key_down:
		function()
		{
			console.log('keys down: '+vm_input.key_hold);
		},
	test_key_hold:
		function(key_str)
		{
			if (    vm_input.key_hold.indexOf(key_str) != -1 )
				return true;
			return false;
		},
	test_key_down:
		function(key_str)
		{
			if (    vm_input.key_down.indexOf(key_str) != -1 )
				return true;
			return false;
		},
	test_key_up:
		function(key_str)
		{
			if (    vm_input.key_up.indexOf(key_str) != -1 )
				return true;
			return false;
		},
	
	/* from what keys are currently held down, 
	 * return string consisting of numbers and letters.
	 */
	get_str_input:
		function()
		{
			var retstr = '';
			
			var all = LETTERS+NUMERALS;
			
			var tshift = false;
			if (vm_input.key_down.indexOf('shift') != -1)
				tshift = true;
			
			if (vm_input.key_down.indexOf('space') != -1)
				retstr += ' ';
			
			if (vm_input.key_down.indexOf(',') != -1)
			{
				if (tshift)
					retstr += '<';
				else
					retstr += ',';
			}
			
			if (vm_input.key_down.indexOf('.') != -1)
			{
				if (tshift)
					retstr += '>';
				else
					retstr += '.';
			}
			
			
			if (vm_input.key_down.indexOf('/') != -1)
			{
				if (tshift)
					retstr += '?';
				else
					retstr += '/';
			}
			
			
			
			var tchr = 0;
			while (tchr < all.length)
			{
				if (vm_input.key_up.indexOf(all[tchr]) != -1)
				{
					if (tshift)
						retstr += all[tchr].toUpperCase();
					else
						retstr += all[tchr].toLowerCase();
				}
				tchr ++;
			}
			
			return retstr;
			
		}
}

/* initialize clock */
var vm_clock =
{
	now		: 0.0,
	then	: 0.0,
	delta	: 1.0,
	fps		: 0.0,
	update :
		function()
		{
			vm_clock.now = Date.now();
			vm_clock.delta = (vm_clock.now - vm_clock.then) / 1000;
            /* seconds since last frame
		     * (last time update has been called)
             */
             
			vm_clock.then = vm_clock.now;
			vm_clock.fps = 1.0/vm_clock.delta;
		    if (PARSE_DEBUG)
		    	console.log('delta: ' + vm_clock.delta);
		    /* using clock for animations:
		     * 		int dist	=  pixels_per_sec  *  delta
		     */
		}
}

/*
 * initialize var fade mechanism 
 *
 * what this does is allow a script to take a var and increment
 * it to a goal value in a certain # of frames.
 * this is done outside of script, with the exception of adding
 * a var fade item. only supports int/float and 1-dimensional
 * int arrays for now.
 * 
 * FIXME: only single int values are supported right now.
 */
var vm_fader =
{
    /* item:
     * [        'int'|'float'|'intarray',
     *          obj_idx,
     *          str_varname,
     *          incr_dat,
     *          goal_dat,
     *          frame_cntr
     *  ]
     * 
     * enums for item:
     * 
     * FADTYPE FADOBJ FADVAR FADINCR FADGOAL FADCNTR
     */
	list : [], 
    
    update:
        function()
        {
            var i = 0;
            
            while( i < vm_fader.list.length)
            {
                var tmp_fad = vm_fader.list[i]
                var tfad_v = vm_script_data[tmp_fad[FADOBJ]].vars;
                
                if (	tmp_fad[FADTYPE] == 'int' &&
						tfad_v != undefined &&
						tfad_v[tmp_fad[FADVAR]] != undefined  )
                {
					tfad_v[tmp_fad[FADVAR]] += tmp_fad[FADINCR];
					
					/* depending on increment, if val steps 
					 * over goal val, remove fader and set
					 * val to goal val.
					 */
					
					if (tmp_fad[FADINCR] > 0) 
					{
						if (tfad_v[tmp_fad[FADVAR]] > tmp_fad[FADGOAL])
						{
							tfad_v[tmp_fad[FADVAR]] = tmp_fad[FADGOAL];
							vm_fader.list.splice(i,1);
							/* remove from list if goal is met.*/
							continue;
						}
					}
					else if (tmp_fad[FADINCR] < 0) 
					{
						if (tfad_v[tmp_fad[FADVAR]] < tmp_fad[FADGOAL])
						{
							tfad_v[tmp_fad[FADVAR]] = tmp_fad[FADGOAL];
							vm_fader.list.splice(i,1);
							continue;
						}
					}
					
					tmp_fad[FADCNTR]--;
					
					if (tmp_fad[FADCNTR]==0)
					{
						tfad_v[tmp_fad[FADVAR]] = tmp_fad[FADGOAL];
						vm_fader.list.splice(i,1);
						continue;
					}
                    
                }
                
                i++;
            }
        },
    
    add:
        function(type, obj_idx, str_varname, cur_dat, goal_dat, frames)
        {
            var incr_dat = undefined;
            if (type == 'int')  /* this only evals to INT. */
                incr_dat = Math.floor((goal_dat - cur_dat) / frames);
            else if (type == 'float')
                incr_dat = (goal_dat - cur_dat) / frames;
            
            if (incr_dat != undefined)
                vm_fader.list.push( [type, obj_idx, 
                                str_varname, incr_dat, goal_dat, frames]);
            
        }
	
}

var vm_modulate = function()
{
    var main_v = vm_script_data[vm_main_idx].vars;
    main_v['mod'] *= -1;
    
    if (main_v['mod_4'] == 3)
        main_v['mod_4'] = 0;
    else
        main_v['mod_4'] ++ ;
    
    if (main_v['mod_8'] == 7)
        main_v['mod_8'] = 0;
    else
        main_v['mod_8'] ++ ;
    
    if (main_v['mod_16'] == 15)
        main_v['mod_16'] = 0;
    else
        main_v['mod_16'] ++ ;
    
    if (main_v['mod_32'] == 31)
        main_v['mod_32'] = 0;
    else
        main_v['mod_32'] ++ ;
}
