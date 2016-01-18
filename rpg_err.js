/*
 * Copyright 2015,
 * Kyle Caldbeck
 */

var vm_err = 
{
	file: '',
	col:0,
	line:0,
	
	do_warn: true,
	
	get_prefix:
		function()
		{
			prefix = '';
			
			if (this.file != undefined && this.file.length > 0)
				prefix += this.file + ':';
			if (this.line >= 0)
				prefix += this.line + ':';
			if (this.col >= 0)
				prefix += this.col + ':';
			
			return prefix;
		},
	
	warn:
		function(msg)
		{
			if (this.do_warn)
				vm_console.log(
						this.get_prefix()+
						' warning: ' + msg
						);
		},
	
	log:
		function(msg)
		{
			vm_console.log(
					this.get_prefix()+
					' error: ' + msg
					);
					
			throw 'error';
		}
		
}
