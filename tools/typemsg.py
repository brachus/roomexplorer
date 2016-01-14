from sys import argv

bullets = False
max_lines = 3
max_cols = 25

msg = ''

batch = ''
dobatch = False

newlns = False

tmp = 1
while tmp < len(argv):
  tflag = argv[tmp]
  if tflag == '-b':
    bullets = True
  elif tflag == '-n':
    newlns = True
  else:
    try:
      f = open(tflag)
      batch = f.read()
      f.close()
      dobatch = True
    except IOError:
      print 'err: "'+tflag+'" doesn\'t exist.'
      print 'exiting ...'
      exit(1)
  tmp += 1

# display intro (if no batch file has been specified)
if dobatch == False:
  if bullets:
    print (':  bullets are on. ')
  print (':  controls: ".q" to end msg.')
  print (':            ".w" to add new wait break.')

  # print a ruler to guide user in how long lines can be.
  if bullets==False:
    print ('_'*max_cols)
  else:
    print ('_'*(max_cols-2))

if bullets:
  msg += '#b '

if dobatch:
  batch = batch.split('\n')
  batchln = 0

begin_ln = True
while 1:
  if dobatch == False:
    ln = raw_input('')
  else:
    if batchln == len(batch):
      ln = '.q'
    else:
      ln = batch[batchln]
      batchln += 1
  
  if ln.lower() == '.q':
    msg += '#w'
    break
  elif ln.lower() == '.w':
    msg += '#w'
    if newlns:
      msg += '\n'
    msg += '#n'
    if bullets:
      msg += '#b '
    begin_ln = True
    continue
  else:
    # newline controls are added
    # before lines are added to msg
    if begin_ln:
      begin_ln = False
    else:
      if newlns:
        msg += '\n'
      msg += '#n'
      if bullets:
        msg += '  '
    # insert escape characters before quotes
    ln = ln.replace('"', '\\"')
    ln = ln.replace('\'', '\\\'')
    msg += ln

# write it out
print (msg)


'''
an example:

:  bullets are on. 
:  controls: ".q" to end msg.
:            ".w" to add new wait break.
this tile map
could use some
scaling up
.w
it is currently
looking quite
elfish.
.w
if you look at the
staircase, you 
can readily tell that
our character will
not fit at all!
.w
how sad...
.q

'''