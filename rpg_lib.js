/*
 * Copyright 2015,
 * Kyle Caldbeck
 */

/* enums for code for media lib.
 * these both determine load state and data type. 
 */
IMG_NLOADED = -1;	IMG_LOADED = 0;
SND_NLOADED = -2;	SND_LOADED = 1;

/* img/snd lib */
vm_media_lib = [];


/* enums for methods */
_SET = 0; _PRINTLN = 1;
_OP_ADD = 2; _OP_SUB = 3;  _OP_MUL = 4;
_OP_DIV = 5; _OP_MOD = 6;
_CMP_EQUAL = 7;  _CMP_NEQUAL = 8; _CMP_GREATER = 9;
_CMP_LESSER = 10; _CMP_GREATEQUAL = 11;   _CMP_LESSEQUAL = 12;
_IF_JMP = 13; _JMP = 14;
_TERM = 15;         /* terminate script */
_TERM_VM = 16;      /* terminate vm */
_LOOP = 17;         /* next_frame() */
_SLEEP = 18;        /* sleep() */
_KEY = 19;          /* key(str)  check if key is pressed. */
_KEY_DOWN = 38;
_KEY_UP	 = 39;
_KEY_MOVE = 20; // key_move(int px_per_frame)  takes opperand actor; move actor according to arrow keys.
_FADE_VAR = 21; // fade_var(str obj, str var, dat goal data, int frames)
_START = 22; // *.start(), start init script for object.  if script already running, *do nothing*.
_STOP = 23; // *.stop(), stop script for object
_ACTIVATE = 24; // [tilemap | actor].activate()
_DEACTIVATE = 25;

_RANDINT = 46; /* randint(x,y), returns z: y>=z>=x*/

_CAM_FOCUS = 26; /* actor.cam_focus()  set cam actor idx to actor.*/
_CAM_UNFOCUS = 27;

_CLIP = 28;
    /* actor.clip() clip dpos against clip_tmap and any 'solid' actor. */

_AACTORS_CLEAR = 29;
_ATMAPS_CLEAR  = 30;

_KEYS_DISABLE  = 31;
_KEYS_ENABLE   = 32;

_SPRT_FILL_LAYER = 33; /* fill layer # with color r,g,b, before any sprite
                        * or tmap has been rendered.  alpha is not supported.
                        */
_TMAP_FILL_LAYER = 34;

_MSG_CLEAR = 35;  /* clear messages in opp actor */
/*** actor.msg_clear() */
_MSG_SEND  = 36;  /* send message using: str method, str message. */
/*** actor.msg_send(str 'shoot'|'upclose'|'all', str mesg) */
_MSG_CHECK = 37;  /* check to see if actor recieved a specific message
                   * from specific id.  */
/*** actor.msg_check(str id, str mesg) */

_OPEN = 38; /* open a window */
_CLOSE = 39; /* close */
_SETMODE = 40; /* set window mode */

/* these methods are ONLY useable for actors.  snd objects cannot
 * play audio directly.
 */
_PLAYSND = 43; /* play/pause/stop audio */
_STOPSND = 44;  
_STOPALL = 45;



/* enums for function components: */
F_FUNC = 0; F_OPP = 1; F_RET = 2; F_ARG = 3; 

/* enums for vm_fader mechanism: */
FADTYPE = 0; FADOBJ = 1; FADVAR = 2; FADINCR = 3; FADGOAL = 4; FADCNTR = 5;

/* misc. enums: */
NO_OPP = -1;    NO_RET = -2; REG = -1;   USE_VAL = -2;   LABEL = -1;

/* method library */
vm_method_lib = 
{
    /* methods which require no opperand: */
	'none':								
		[
		 	{
		 		fname: 		'set',		/* name used in script 'set' */
		 		fenum: 		_SET,		/* integer to represent function */
		 		returns:	['*'],		/* can return any type */
		 		args:		[['*']]		/* 1 arg;  takes any type. */
		 	},
		 	{
		 		fname:		'println',
		 		fenum:		_PRINTLN,
		 		returns:	['none'],
		 		args:		[['str']]
		 	},
		 	{
		 		fname:		'op_add',
		 		fenum:		_OP_ADD,
                                /* return can be either of these types */
		 		returns:	['int','float','str'], 
                                /* each arg can be either of these types */
		 		args:		[['int', 'float', 'str'], 
		 		     		 ['int','float','str']	]
		 	},
		 	{
		 		fname:		'op_sub',
		 		fenum:		_OP_SUB,
		 		returns:	['int','float'],
		 		args:		[['int', 'float'],
		 		     		 ['int','float']	]
		 	},
		 	{
		 		fname:		'op_mul',
		 		fenum:		_OP_MUL,
		 		returns:	['int','float'],
		 		args:		[['int', 'float'],
		 		     		 ['int','float']	]
		 	},
		 	{
		 		fname:		'op_div',
		 		fenum:		_OP_DIV,
		 		returns:	['int','float'],
		 		args:		[['int', 'float'],
		 		     		 ['int','float']	]
		 	},
		 	{
		 		fname:		'op_mod',
		 		fenum:		_OP_MOD,
		 		returns:	['int','float'],
		 		args:		[['int', 'float'],
		 		     		 ['int','float']	]
		 	},
		 	{
		 		fname:		'cmp_equal',
		 		fenum:		_CMP_EQUAL,
		 		returns:	['int'],
		 		args:		[['int', 'float','str'],
		 		     		 ['int','float','str']	]
		 	},
		 	{
		 		fname:		'cmp_nequal',
		 		fenum:		_CMP_NEQUAL,
		 		returns:	['int'],
		 		args:		[['int', 'float','str'],
		 		     		 ['int','float','str']	]
		 	},
		 	{
		 		fname:		'cmp_greater',
		 		fenum:		_CMP_GREATER,
		 		returns:	['int'],
		 		args:		[['int', 'float'],
		 		     		 ['int','float']	]
		 	},
		 	{
		 		fname:		'cmp_lesser',
		 		fenum:		_CMP_LESSER,
		 		returns:	['int'],
		 		args:		[['int', 'float'],
		 		     		 ['int','float']	]
		 	},
		 	{
		 		fname:		'cmp_greatequal',
		 		fenum:		_CMP_GREATEQUAL,
		 		returns:	['int'],
		 		args:		[['int', 'float'],
		 		     		 ['int','float']	]
		 	},
		 	{
		 		fname:		'cmp_lessequal',
		 		fenum:		_CMP_LESSEQUAL,
		 		returns:	['int'],
		 		args:		[['int', 'float'],
		 		     		 ['int','float']	]
		 	},
		 	{
		 		fname:		'if_jmp',
		 		fenum:		_IF_JMP,
		 		returns:	['none'],
		 		args:		[['int'],
		 		     		 ['int']]
		 	},
		 	{
		 		fname:		'jmp',
		 		fenum:		_JMP,
		 		returns:	['none'],
		 		args:		[['int']]
		 	},
		 	{
		 		fname:		'term',
		 		fenum:		_TERM,
		 		returns:	['none'],
		 		args:		[]
		 	},
		 	{
		 		fname:		'term_vm',
		 		fenum:		_TERM_VM,
		 		returns:	['none'],
		 		args:		[]
		 	},
		 	{
		 		fname:		'next_frame',
		 		fenum:		_LOOP,
		 		returns:	['none'],
		 		args:		[]
		 	},
		 	{
		 		fname:		'sleep',
		 		fenum:		_SLEEP,
		 		returns:	['none'],
		 		args:		[['int']]
		 	},
		 	{
		 		fname:		'key',
		 		fenum:		_KEY,
		 		returns:	['int'],
		 		args:		[['str']]
		 	},
			{
		 		fname:		'key_down',
		 		fenum:		_KEY_DOWN,
		 		returns:	['int'],
		 		args:		[['str']]
		 	},
			{
		 		fname:		'key_up',
		 		fenum:		_KEY_UP,
		 		returns:	['int'],
		 		args:		[['str']]
		 	},
			{
				fname:		'fade_var',
				fenum:		_FADE_VAR,
				returns:	['int'],
				args:		[
								['str'],
								['str'],
								['int', 'float', 'array'],
								['int']
							]
			},
			{
		 		fname:		'cam_unfocus',
		 		fenum:		_CAM_UNFOCUS,
		 		returns:	['none'],
		 		args:		[]
		 	},
			{
		 		fname:		'active_actors_clear',
		 		fenum:		_AACTORS_CLEAR,
		 		returns:	['none'],
		 		args:		[]
		 	},
			{
		 		fname:		'active_tmaps_clear',
		 		fenum:		_ATMAPS_CLEAR,
		 		returns:	['none'],
		 		args:		[]
		 	},
			{
		 		fname:		'keys_disable',
		 		fenum:		_KEYS_DISABLE,
		 		returns:	['none'],
		 		args:		[]
		 	},
			{
		 		fname:		'keys_enable',
		 		fenum:		_KEYS_ENABLE,
		 		returns:	['none'],
		 		args:		[]
		 	},
            {
                fname:      'sprt_fill_layer',
                fenum:      _SPRT_FILL_LAYER,
                returns:    ['none'],
                args:       [['int'],['int'],['int'],['int']]
            },
            {
                fname:      'tmap_fill_layer',
                fenum:      _TMAP_FILL_LAYER,
                returns:    ['none'],
                args:       [['int'],['int'],['int'],['int']]
            },
            {
				fname:		'randint',
				fenum:		_RANDINT,
				returns:	['int'],
				args:		[]
			}
		 	
		],
	'game':
		[
		],
	'tilemap':
		[
		],
	'actor':
		[
		 	{
		 		fname:		'key_move',
		 		fenum:		_KEY_MOVE,
		 		returns:	['none'],
		 		args:		[['int']]
		 	},
			{
		 		fname:		'cam_focus',
		 		fenum:		_CAM_FOCUS,
		 		returns:	['int'],
		 		args:		[]
		 	},
            {
		 		fname:		'clip',
		 		fenum:		_CLIP,
		 		returns:	['int'],
		 		args:		[]
		 	},
            {
                fname:      'msg_clear',
                fenum:      _MSG_CLEAR,
                returns:    ['int'],
                args:       []
            },
            {
                fname:      'msg_send',
                fenum:      _MSG_SEND,
                returns:    ['int'],
                args:       [['str'], ['str']]
            },
            {
                fname:      'msg_check',
                fenum:      _MSG_CHECK,
                returns:    ['int'],
                args:       [['str'], ['str']]
            },
            {
                fname:      'playsnd',
                fenum:      _PLAYSND,
                returns:    ['int'],
                args:       []
            },
            {
                fname:      'stopsnd',
                fenum:      _STOPSND,
                returns:    ['int'],
                args:       []
            }
			
		],
    'window':
        [
            {
            	fname:		'open',
		 		fenum:		_OPEN,
		 		returns:	['int'],
		 		args:		[]
            },
			{
            	fname:		'close',
		 		fenum:		_CLOSE,
		 		returns:	['none'],
		 		args:		[]
            },
			{
				fname:		'setmode',
		 		fenum:		_SETMODE,
		 		returns:	['none'],
		 		args:		[['str']]
			}
        ],
    /* wild card section.  these methods allow any opp type,
     * but are described separatley from other opp_types.
     */
	'*':			
		[
			{
				fname:		'init', /* renamed to "init" */
				fenum:		_START,
				returns:	['int'],
				args:		[]
			},
			{
				fname:		'term', /* renamed to "term" */
				fenum:		_STOP,
				returns:	['int'],
				args:		[]
			},
			{
				fname:		'activate',
				fenum:		_ACTIVATE,
				returns:	['int'],
				args:		[]
			},
			{
				fname:		'deactivate',
				fenum:		_DEACTIVATE,
				returns:	['int'],
				args:		[]
			},
		]
};

/* contains a list of default vars of each available obj type . */
vm_obj_lib =
{
    'game' :
    {
        'bg_color'			: '[0,0,0]',  /* base colors for when nothing is rendered*/
        'fg_color'			: '[255,255,255]',

        'fad_color'			: '[0,0,0]', /* used for fade effect */
        'fad_opacity'		: '0',
        
        'cam_pos' 			: '[0,0]',   /* camera vars */
        'cam_scale' 		: '1.0',
        
        /* if not -1, camera focuses on actor,
         * keeping it at the center of screen.
         */
        'cam_actor' 		: '-1',		 	
                                            
        'cam_bounds' 		: '[-1,-1,-1,-1]',
        
        /*  any tilemaps or actors in these lists are rendered.*/
        'active_tmaps'		: '[]',
        /* no "renderable" vars necessary. */
        'active_actors'		: '[]',
        
        /*
         * if win_grab == 1, all user input
         * is grabbed by active windows
         */
        'win_grab'			: '0',	
        /* list of active windows.
         * last index in list is the focused window.
         */
        'win_list'			: '[]', 
        
        
        /* modulators: */
        /* for each frame, mod *= -1.  **only touched by vm.** */
        'mod'				: '1', 
        
        /* counts up to 3 and loops back to 0.
         * increments by 1 every frame.
         */
        'mod_4'				: '0', 
        
        /* compare to mod_4 */
        'mod_8'				: '0',
        'mod_16'				: '0',
        'mod_32'				: '0', 
        
        /* per frame delay for text-type effect
         * for message windows
         */
        'win_text_delay'	: '1',
        
        /* idx to tilemap which performs movement
         * clipping against objects.
         */
        'clip_tmap'			: '-1', 
        
        /* tilemap / sprite layer opacities. */
        'tmap_layer_opacity': '[255,255,255,255,255,255,255,255]',
        'sprt_layer_opacity': '[255,255,255,255,255,255,255,255]',
        
        /* blend modes per layer */
        'tmap_layer_blend'	:
            '["norm","norm","norm","norm","norm","norm","norm","norm"]',
        
        /* available modes: norm, mult, ovrly */    
        'sprt_layer_blend'	:
            '["norm","norm","norm","norm","norm","norm","norm","norm"]',
        
        
        'tmap_layer_maskmode':
            '["none","none","none","none","none","none","none","none"]',
                    /*  ("none") | ( ("t"|"s")*/
                    
        'sprt_layer_maskmode':
            '["none","none","none","none","none","none","none","none"]',
            /*	+ ("rgba_mul" | "per sprite") ) */
            
        
        'tmap_layer_mask_layer': '[-1,-1,-1,-1,-1,-1,-1,-1]',
        'sprt_layer_mask_layer': '[-1,-1,-1,-1,-1,-1,-1,-1]',
        
        'key_active'		: '1', /* input is enabled */	
        
        /*audio settings: */
        'audio_reverb_gain'					: '0.0', 
        /* reverb gain (0.0 - 1.0)).  wet/dry are controlled by vm_audio 
         * automagically.
         */
        
        'audio_compressor_gain'				: '0.0',
        /* dynamics compressor gain (0.0 - 1.0). like reverb, web/dry is han-
         * deled automatically.
         */
         
         'audio_master_gain'				: '1.0'
         
    },
    'sprite' :
    {
        'gfx'				: '[]',
        'center'			: '[]',
        'frames'			: '[]',
        
        'loop'				: '0'
    },
    
    'snd':
    {
		'dat'				: '[]',
		'loop'				: '0',
		'ambient'			: '0'  
			/* if 1, audio is not "positioned" to actor pos. */
	},
    
    'actor' :
    {
        'pos'				: '[0, 0]',		/* pos in global coords. */
        'scale'				: '[1.0, 1.0]',
        'dpos'				: '[0,0]',
        'dir'				: '"d"',	/* u d l r ul dl ur dr */
        'bbox'				: '[-10,10, 10,-10]', /* coords relative to pos. [x0,y0,x1,y1].  xy0=top-left, xy1=bot_right */
        
        'sprt'				: '-1',		/* sprite to use */
        'sprt_curframe'		: '0',
        'sprt_curframetime' : '0', 
        'sprt_animate'		: '1',
        
        'snd'				:'-1',		/* audio attached to obj */
        
        'solid'				: '1', /* other actors may be clipped against self. */
        
        'get_msg'			: '1',
        
        'layer'				: '0', /* layer actor is rendered on. */
        
        'if_mov'			: '0', /* conditional var for movement */
        'if_diag'			: '0', /* ** only touched by vm ** */
        
        'msg_srcs'		: '[]', /* list if id's to message sources. */
        'msg_strs'		: '[]', /* list of messages. */
        'msg_id'		: '""', /* actor's identifier (may not be unique) in sending/recieving messages. */
        'msg_upclose_dst' : '10', /* general distance in pixels "upclose" message may be sent. */
        
        'autodir_sprt_fxd'	: '[-1,-1,-1,-1,-1,-1,-1,-1]', /* list of sprites in order: u d l r ul ur dl dr */
        'autodir_sprt_mov'	: '[-1,-1,-1,-1,-1,-1,-1,-1]',
    },
    
    'tilemap' :
    {
        'layer'   : '0',
        'pos'     : '[0,0]',
        'dpos'	  : '[0,0]',
  
        'gfx'			: '[]',
		/* e.g.: [['NOBLOCK'], ['BLOCK_LEFT', 'BLOCK UP']]*/
        'blockers'		: '[]',
		/* e.g,: ['or', 'and'] */
        'block_bool'	: '[]',
  
        'array'			: '[]',
		/* 2-d array of rows.  must be rectangular. e.g.: [[0,0,0],[1,1,1],[0,0,0]]
		 * each item contains idx to gfx/blockers/block_bool ( a tile ).
		 */
		 
		'repeat'		: '0'
    },
    
    'window' :
    {
        'pos'           : '[0,0]',
        'width'         : '100',
        'height'        : '100',
        
        'type'          : '"message"',
		
		'grab_keys'		: '1',
		
		'auto_wait_dur'	: '50',
        
        'margin_top'    : '0',
        'margin_bottom' : '0',
        'margin_left'    : '0',
        'margin_right' : '0',
        
        'bg_color'      :   '[0,0,0]',
        'fg_color'      :   '[255,255,255]',
        'bullet_col'    :   '[200,100,0]',
        
        'font'          :
				'"10px monaco, consolas, inconsolata, monospace"',
				
        'ln_height'   : '10',
        'nlines'        : '4',
        
        'lines'     :   '[]',
        
        'text'      :
            '"#bHello,#w#n#bthis is an #nexample text#n for purposes #nof'+
            'exemplification,#w#n#bbrought to you by#nthe redundancy dept.'+
            '#n of redundancy.#w"',
        
        'maxchar'	:	'20',
        
		'menu_pos'	:	'[0,0]',
        
        'next_ch'   :   '0',
        'parsed'	:  '[]',
		'mode'		: '"null"',
		'text_raise': '0',
		'cntr'		: '0'
    }
		
		
}

