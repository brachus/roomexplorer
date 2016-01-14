from sys import argv

if len(argv) > 1:
	fname = argv[1]
else:
	print "Usage:\nsplitupstring [input file]\n\nOutput is written to \"out\""

f = open(fname)
dat = f.read()
f.close()

LINELEN = 75

new = '"'

tmp = 0
for x in dat:
	if x != '"':
		new += x
	else:
		new += '\"'
	tmp += 1
	if tmp >= LINELEN:
		new += '" +\n"'
		tmp = 0
new += '"'

f = open('out', 'w')
f.write(new)
f.close()

print 'Successfully wrote to "out"!'
