
/*		** NOT MY CODE **
 * 
 *      code posted by ConroyP on stackoverflow.com:
 * 
 * 		http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object
 */

function clone(obj) {
    if(obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
        return obj;

    var temp = obj.constructor(); // changed

    for(var key in obj) {
        if(Object.prototype.hasOwnProperty.call(obj, key)) {
            obj['isActiveClone'] = null;
            temp[key] = clone(obj[key]);
            delete obj['isActiveClone'];
        }
    }    

    return temp;
}
