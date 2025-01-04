/**
 * Simple wrapper function for playing sounds that are associated with entities
 * @param {string} name Typically one of 'walk', 'run', 'attack', 'death', 'build',
 *     'gather_fruit', 'gather_grain', 'gather_wood', 'gather_stone', 'gather_metal'
 * @param {EntityId} ent
 */
function PlaySound(name, ent)
{
	var cmpSound = Engine.QueryInterface(ent, IID_Sound);
	if (cmpSound)
		cmpSound.PlaySoundGroup(name);
}

Engine.RegisterGlobal("PlaySound", PlaySound);
