import base64;
from sys import argv

MIN_REP = 4
ESC_CHAR = '.'

LINE_LEN = 120

def rm_newlines(src):
	new = ''
	for x in src:
		if x != '\n':
			new += x
	return new

def lineify(src):
	new = ''
	cntr = LINE_LEN
	for x in src:
		new += x
		cntr -= 1
		if cntr <= 0:
			new += '\n'
			cntr = LINE_LEN
	return new

def b64str_compress(src):
	new = ''
	tmpstr = ''
	for x in src:
		if (len(tmpstr) > 0):
			if x == tmpstr[0]:
				tmpstr += x
			else:
				if len(tmpstr) >= MIN_REP:
					new += ESC_CHAR+str(len(tmpstr))+tmpstr[0]+ESC_CHAR
				else:
					new += tmpstr
				tmpstr = x
		else:
			tmpstr = x
	return new
				
	

#def b64str_decompress():


if len(argv) > 1:
	fname = argv[1]
else:
	fname = raw_input('input file $ ');

f = open(fname)
dat = f.read()
f.close()

dat = base64.encodestring(dat)

cmpr_dat = b64str_compress(rm_newlines(dat))

print cmpr_dat
print
print len(dat), len(cmpr_dat)

f = open('out','w')
f.write( rm_newlines(dat) )
f.close()

print 'wrote to "out" successfully!'
