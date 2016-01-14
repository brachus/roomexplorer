/*
 * Copyright 2015,
 * Kyle Caldbeck
 */

/*
 * object for console_view div.
 * everything put out by println() (in vm)
 * will be printed here and in 
 * the javascript console.
 */
 
var vm_console = 
{
	lines:
		[],
		
	delay_buf:
		[],
		
	buf_pop:
		function()
		{
			if (this.delay_buf.length > 0)
			{
				this.lines.push(this.delay_buf[0]);
				this.delay_buf.splice(0,1);
			}
		},
		
	element:
		document.getElementById('console_view'),
		
	out: 
		function(in_str)
		{
			if (!flag_console) return;
			
			/* truncate in_str to flag_con_len */
			if (in_str.length > flag_con_len)
				in_str = in_str.substring(0, flag_con_len);
			
			if (flag_con_delay)
				this.delay_buf.push(in_str);
			else
				this.lines.push(in_str);
		
		},
		
	print:
		function (in_str)
		{	
			if (!flag_console)
				return;
			
			var tmp_buf = '';
			var tmp = 0;
			while (tmp < in_str.length)
			{
				if (in_str[tmp] != '\n')
					tmp_buf += in_str[tmp];
				
				if (in_str[tmp] == '\n' || tmp == in_str.length - 1)
				{
					this.out(tmp_buf);
					console.log(tmp_buf);
					
					tmp_buf = '';
				}
					
				tmp++;
			}
			
			if (!flag_con_delay)
				this.update();
		},
		
    log:
        function(in_str)
        {
            this.print(''+in_str);
        },
		
	update:
		function()
		{
			if (!flag_console) return;
			
			if (flag_con_delay)
				this.buf_pop();
			
			var tmp_out = '';
			var tmp_disp_ln = 0;
			
			var tmp = 0;
			if (this.lines.length >= flag_con_disp_lines)
				tmp = this.lines.length - flag_con_disp_lines;
			
			while ( tmp < this.lines.length ||
                    tmp_disp_ln < flag_con_disp_lines )
			{
				if (tmp < this.lines.length)
					tmp_out += this.lines[tmp] + '<br>';
				else
					tmp_out += '<br>';
				
				tmp++;
				tmp_disp_ln++;
			}
			
			this.element.innerHTML = tmp_out;
		}
}
