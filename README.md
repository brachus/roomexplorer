Overview
===

RoomExplorer is a quick-n-dirty/from-scratch engine for writing highly
scriptable 2-d dungeon crawlers.  It's written in Javascript/CSS3/HTML5.

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

Scripts are ultimatley made up of built-in-method calls and labels.

There is right now *really* minimal support for conditional
branches:

`
if r0 {
	do_something();
} else if r1 {
	do_something_elseif();
} else {
	do_something_else();
}
`

Conditional block syntax is parsed into jump calls and labels.  Branch
recursion is supported.  Only register identifiers ('r#') are supported.

Evaluators may be implemented in the future, but they're not right now.


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
