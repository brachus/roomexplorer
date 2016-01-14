/*
 * bring it all together in a main loop that calls
 * window.requestAnimationFrame() 
 *
 *
 * Copyright 2015,
 * Kyle Caldbeck
 *
 *
 */
 
/* check to see if script even parsed through
 * correctly.
 */
if (vm_script_data == undefined)
{
	vm_run = false;
	vm_console.log('no script data.');
}


vm_render.init();			
vm_input.init();
vm_audio.init();


if (flag_prnt_help)
	vm_console.print('\n\n------   starting vm   ------');


/* --------- main loop ---------
 *
 * ( changed from while loop to function called by window
 * window.requestAnimationFrame( function ) )
 */
var main_loop_step = function() 	
{	
	vm_modulate();
    vm_fader.update();
	
    
    vm_clock.update();
            
    vm_render.clear();
    
	vm_proc_full();
  
	vm_update_actors();
    vm_update_tmaps();
	
	vm_win.update();
	
	
	vm_render.set_cam();
	vm_render.render();
	
	vm_audio.update();
	
	vm_input.clear();
	vm_console.update();
	
	
	/* request next frame */
	if (vm_run)
		vm_frame = window.requestAnimationFrame( main_loop_step );
	else
		if (flag_prnt_help)
			vm_console.print('-------   killed vm   -------\n\nPlease '+
				'refresh the page if you wish to\nrestart the vm.');
	
	vm_input.clear();
	if (flag_con_delay) vm_console.update();
	
	return;
}

window.onload = main_loop_step;

