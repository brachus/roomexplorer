

/*
 * load script.
 * create vm_reg, vm_active_sub,
 * add script to active_sub,
 * create html console.
 *
 * Copyright 2015,
 * Kyle Caldbeck
 *
 */

vm_run = true;


/* -------- load script -------- */
var src = document.getElementById(flag_main_script);
var src = src.innerHTML;


/* create vm_script_data and parse it */
var vm_script_data =  
	parse_base_parse
	(
		parse_tokenize
		(
            src, [], flag_main_script
		)
	);


	


/* check for game main in vm_script_data
 * find idx and set vm_main_idx.
 */

var vm_main_idx = undefined;

for (var i = 0;
	 i < vm_script_data.length && vm_main_idx == undefined;
	 i++ )
	if ( vm_script_data[i].type == 'game' &&
		 vm_script_data[i].name == 'main'	)
		vm_main_idx = i;
if (vm_main_idx == undefined)
	vm_err.log('can\'t find required "main" object.');
    
var get_obj_idx = function(str_obj)
{
    for (var k = 0; k < vm_script_data.length; k++ )
        if (vm_script_data[k].name == str_obj)
            return k;
    return -1;
}

/* utility function for obtaining data from var with str obj and name */
var get_dat = function(str_obj, str_varname)
{
	var k = get_obj_idx(str_obj);
    if (vm_script_data[k].vars[str_varname] != undefined)
        return vm_script_data[k].vars[str_varname];
	return undefined;
}


/* define vm_reg & vm_active_sub */
var vm_reg =
[
 	undefined, undefined, undefined, undefined,
 	undefined, undefined, undefined, undefined
];

var vm_active_sub = [];

/* nums for vm_active_sub items */
S_OBJ = 0;	S_MODE = 1; S_PC = 2; S_TIMER = 3; S_DOPP = 4;


/* run specified object script if not running */
var vm_add_sub = function(in_idx)
{
	/* check to see if script isn't 
	 * already active:
	 */
	var tfnd = false;
	for ( var k = 0;
			k < vm_active_sub.length && !tfnd ;
			k++ )
		if (vm_active_sub[k][0] == in_idx)
			tfnd = true;
	
	if (!tfnd && in_idx != -1) /* script is run */
	{
		vm_active_sub.push(
			[in_idx, 0, 0, 0, 0] );
		return true;
	}
	
	return false;
		
			
}

/* game main init is always run at the start */
vm_add_sub(vm_main_idx);



/* display stuff for users */


if (flag_prnt_vm)
{
	vm_console.print('\n\n------ vm components ------\n');
	vm_console.print('\n\nvm_media_lib:\n'+  vm_media_lib);
	vm_console.print('\n\nvm_method_lib:\n'+  vm_method_lib);
	vm_console.print('\n\nvm_obj_lib:\n'+  vm_obj_lib);
	vm_console.print('\n\nvm_script_data:\n'+  vm_script_data);
	vm_console.print('\n\nvm_reg:\n'+  vm_reg);
	vm_console.print('\n\nvm_active_sub:\n'+  vm_active_sub);
}

if (flag_prnt_src)
{
	vm_console.log('----- src -----');
    var tmpstr='';
    var cnt = 1;
    for (var i = 0; i < src.length; i++)
    {
    if (src[i] == '\n')
    {
        vm_console.log(cnt+': '+tmpstr);
        
        cnt++;
        tmpstr = '';
    }
    else
        tmpstr += src[i];
    }
    vm_console.log('\n------------');
}

if (flag_prnt_help)
	vm_console.print('Above is a WORK IN PROGRESS\nTo edit game '+
                    'content, edit \nelement "#inscript".');
