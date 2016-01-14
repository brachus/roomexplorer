Overview
===

RoomExplorer is a quick-n-dirty/from-scratch engine for writing highly
scriptable 2-d dungeon crawlers.

### Objects

RoomExplorer centers around objects.  Depending on 
type, each object has a set of predefined variables and built-in methods.

For example, there's the "actor" object type, which contains variables for 
keeping track of position, scale, a link to sprites/audio, etc.

Available object types:

* game
* sprite
* snd
* tilemap
* actor
* window

Unofficial types:

* room
* portal


### Scripts

Each object has an object script with three sections:

* init
* body
* term

Scripts are made up solely of built-in-method calls and labels.

Control structures, branches, and evaluators may be implemented in the future, 
but they're not right now.

All that's available are built-in methods for comparing variables and jumping 
on a conditional state.


Scripts are run all the way through in one engine loop to the last line of the 
term section, though the next_frame() method may be called to start from the 
beginning of a currently active section on the next loop.

After all the currently running scripts have ran through in one engine loop, 
actor object movements are incremented, graphics rendered, sound is 
updated, etc.

### The Engine Loop

The loop starts with running all active object scrips through, and then it 
does some background processing on every object, depending on type. Console, 
Graphics, Input, and Audio are all updated as well.

### Windows


Message and Menu windows are currently supported through the "window" object 
type.  Inventories/items will be available in the future.

### No Battle System


The engine only supports dungeon crawling for now.  The development has so far 
been centered on a personal project (a survival horror game) which is not 
centered around battles, thus the reason.

### Licensing

All original code BSD.
All original content is Creative Commons Attribution.

For exceptions, see NOTICE.md
