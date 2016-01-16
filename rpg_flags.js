/*
 * Copyright 2015,
 * Kyle Caldbeck
 */

var flag_main_script = 'main';

var flag_width = 320;
var flag_height = 240;
var flag_scaler = 1;

//flag_width = 480;
//flag_height = 320;


var flag_allow_blend_modes = true;

var flag_prnt_vm = false;
var flag_prnt_src = false;
var flag_prnt_help = false;

var flag_console = true;
var flag_con_disp_lines = 16;
var flag_con_len = 50;
var flag_con_delay = false; /* if true,
each line printed to console will take
1 frame to show up.  hence "delay". */

var flag_clip_try_drag = true;

/* enable scroll animation for message windows */
var flag_win_msg_scroll = true;
/* per-frame increment for scroll animation */
var flag_win_msg_scroll_speed = 1;
/* delay in frames after window has been
 * terminated.
 */
var flag_win_kill_delay = 5;
/* character to display at bottom left 
 * corner of the window when waiting
 * for user input.
 */
var flag_win_msg_wait_sym = '\u25bc'; 
flag_win_msg_wait_sym = ''; 

var flag_win_menu_wrap = false;

var flag_lowpass = false;
