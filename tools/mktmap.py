#### tmap_maker #####
# takes in input image
# and outputs tiles and 
# script data, removing
# duplicates.
#
#####################

import pygame
from math import floor
from os import mkdir
from os.path import join
from sys import argv

def ret_cntr_fn(in_int):
	tmp = str(in_int)
	if len(tmp) == 1:
		return '00'+tmp
	if len(tmp) == 2:
		return '0'+tmp
	if len(tmp) == 3:
		return tmp

if len(argv) == 1:
	print '''Usage:
mktmap.py [input image]

	Output obj is written to "out".
	Data is written to "./dat/[img name w/o extension]".'''
	exit(1)
else:
	fname = argv[1]


# general flow:
#  input: fname, out_tiledat_mkdir, out_script_name
#  output: create folder, create tiles and save them
#           to folder, save script to script_name


base_name = ''
for x in fname:
  if x == '.':
    break
  base_name += x


tiledat_mkfolder = 'dat/'+base_name
  


in_surf = pygame.image.load(fname)
in_wh = [in_surf.get_width(), in_surf.get_height()]


# input image must be divisible by 16 at both width and height

if (in_wh[0] % 16 > 0 or in_wh[1] % 16 > 0):
  print('err: both width and height of input\nimage '+
        'must be divisible by 16.\nexiting ...')
  exit(1)

# this will store output tiles.
# the goal is to create tiles which will
#  all be unique;  any duplicates will
#  be kept as one tile referenced by many.
tlib = [];
# each item: img_to_str

in_tile_wh = [ floor(in_wh[0]/16), floor(in_wh[1]/16) ]

ttile_ul = [0,0]
ttile = [0,0]

tarray = []

# generate non-duplicating tiles:
while ttile[1] < in_tile_wh[1]:
  ttile[0] = 0
  ttile_ul[0] = 0
  tarray.append([]) # add row to tarray
  
  while ttile[0] < in_tile_wh[0]:
    # get tile dat;
    # compare it against each
    #  entry in tlib;
    # if NO match, add to tlib,
    #   set use_idx to last entry
    #   in tlib;
    # else (if match),
    #   set use_idx to match;
    use_idx = -1
    
    # get subsurf
    ttile_subsurf = in_surf.subsurface(
                        (
                            ttile_ul,
                            [16, 16]
                        )
                      )
    
    ttile_img_dat = pygame.image.tostring(ttile_subsurf,'RGBA')
    # fromstring(str, (w,h), format)
    
    fnd = False;
    tmp = 0
    while tmp < len(tlib):
      if tlib[tmp] == ttile_img_dat:
        use_idx = tmp
        fnd = True
        break
      tmp += 1
    
    if fnd == False:
      tlib.append(ttile_img_dat)
      use_idx = len(tlib)-1
    
    
    tarray[ttile[1]].append(use_idx)
    ttile_ul[0] += 16
    ttile[0] += 1
  ttile_ul[1] += 16
  ttile[1] += 1
  
  if len(tlib) == 0:
    print('err: found no tiles!')
    print('exiting ...')
    exit(1)

# create script dat
arr_str = '['
trow=0
while trow < len(tarray):
  arr_str += '['
  tcol = 0
  while tcol < len(tarray[trow]):
    arr_str += str(tarray[trow][tcol])
    if tcol < len(tarray[trow])-1:
      arr_str += ','
    tcol += 1
  arr_str += ']'
  if trow < len(tarray) - 1:
    arr_str += ','
  arr_str += '\n'
  trow += 1
arr_str += ']'

script_str = 'tilemap '+base_name+'\n'+'{\n'
script_str += '\t.pos = [0,0];\n'
script_str += '\t.gfx = \n'
script_str += '\t{\n'
script_str += '\t\timg\n'
# add image paths to script
tmp = 0
while tmp < len(tlib):
  script_str += '\t\t \'' + join(tiledat_mkfolder, ret_cntr_fn(tmp)+'.png')  + '\'\n'
  tmp+=1
script_str += '\t};\n'

# add blockers definition to script.
# also add comments at each item
#  in the list to help user to 
#  identify the place of each blocker item.
script_str += '\t.blockers = \n'
script_str += '\t[\n'
tmp = 0
while tmp < (len(tlib)-1):
  script_str += '\t\t[\'none\'],  /* '+str(tmp)+' */\n'
  tmp += 1
script_str += '\t\t[\'none\']   /* '+str(len(tlib)-1)+' */\n'
script_str += '\t];\n'


script_str += '\t.block_bool = \n'
script_str += '\t[\n'
tmp = 0
while tmp < (len(tlib)-1):
  script_str += '\t\t\'and\',  /* '+str(tmp)+' */\n'
  tmp += 1
script_str += '\t\t\'and\'   /* '+str(len(tlib)-1)+' */\n'
script_str += '\t];\n'
script_str += '\t.array = \n'
script_str += arr_str + ';\n}'



  
print('script data:\n')
print(script_str)

# save script data
f = open('out','w')
f.write(script_str)
f.close()

# save each tile from lib
try:
  mkdir('dat')
except OSError:
  pass # most likely the folder exists.

# save each tile from lib
try:
  mkdir(tiledat_mkfolder)
except OSError:
  pass # most likely the folder exists.
  

  
fn_cntr = 0
for x in tlib:
  pygame.image.save(
        pygame.image.fromstring(x,(16,16),'RGBA'),
        join(tiledat_mkfolder, ret_cntr_fn(fn_cntr)+'.png')
        )
  fn_cntr += 1


print 'successfully wrote to "out" and output folder "'+tiledat_mkfolder+'"'
