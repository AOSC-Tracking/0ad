/**
 * @typedef {Template} TechTemplate
 */
/**
 * @typedef {Template} AuraTemplate
 */

/** @typedef {{ add?: number, multiply?: number, replace?: unknown, tokens?: string, affects?: (string | string[])[] }} Modification */

/**
 * @file This provides a cache for Aura and Technology templates.
 * They may not be serialized, otherwise rejoined clients would refer
 * to different objects, triggering an Out-of-sync error.
 * @template {TechTemplate | AuraTemplate} Template
 * @param {string} path
 */
function ModificationTemplates(path)
{
	let suffix = ".json";

	this.names = deepfreeze(listFiles(path, suffix, true));

	/** @type {Record<string, Template>} */
	this.templates = {};

	for (let name of this.names)
		this.templates[name] = /** @type {Template} */(Engine.ReadJSONFile(path + name + suffix));

	deepfreeze(this.templates);
}

ModificationTemplates.prototype.GetNames = function()
{
	return this.names;
};


/** @param {string} name */
ModificationTemplates.prototype.Has = function(name)
{
	return this.names.indexOf(name) != -1;
};

/** @param {string} name */
ModificationTemplates.prototype.Get = function(name)
{
	return this.templates[name];
};

ModificationTemplates.prototype.GetAll = function()
{
	return this.templates;
};


function LoadModificationTemplates()
{
	// @ts-expect-error
	global.AuraTemplates = new ModificationTemplates<AuraTemplate>("simulation/data/auras/");
	// @ts-expect-error
	global.TechnologyTemplates = new ModificationTemplates<TechTemplate>("simulation/data/technologies/");
}

/**
 * Derives modifications (to be applied to entities) from a given aura/technology.
 *
 * @param {(AuraTemplate | TechTemplate)} techTemplate - The aura/technology template to derive the modifications from.
 * @return An object containing the relevant modifications.
 */
function DeriveModificationsFromTech(techTemplate)
{
	if (!techTemplate.modifications)
		return {};

	/** @type {Record<string, { affects: string[], [key: string]: any }[]>} */
	let techMods = {};
	let techAffects = [];
	if (techTemplate.affects && techTemplate.affects.length)
		// @ts-expect-error
		techAffects = techTemplate.affects.map(affected => affected.split(/\s+/));
	else
		techAffects.push([]);

	for (let mod of techTemplate.modifications)
	{
		let affects = techAffects.slice();
		if (mod.affects)
		{
			let specAffects = mod.affects.split(/\s+/);
			for (let a in affects)
				affects[a] = affects[a].concat(specAffects);
		}

		/** @type {{ affects: string[], [key: string]: any }} */
		let newModifier = { "affects": affects };
		for (let idx in mod)
			if (idx !== "value" && idx !== "affects")
				newModifier[idx] = mod[idx];

		if (!techMods[mod.value])
			techMods[mod.value] = [];
		techMods[mod.value].push(newModifier);
	}
	return techMods;
}

/**
 * Derives modifications (to be applied to entities) from a provided array
 * of aura/technology template data.
 *
 * @param {(AuraTemplate | TechTemplate)[]} techsDataArray
 * @return The combined relevant modifications of all the technologies.
 */
function DeriveModificationsFromTechnologies(techsDataArray)
{
	if (!techsDataArray.length)
		return {};

	/** @type {ReturnType<DeriveModificationsFromTech>} */
	let derivedModifiers = {};
	for (let technology of techsDataArray)
	{
		// Auras don't have a "reqs" property
		if ('reqs' in technology && !technology.reqs)
			continue;

		let modifiers = DeriveModificationsFromTech(technology);
		for (let modPath in modifiers)
		{
			if (!derivedModifiers[modPath])
				derivedModifiers[modPath] = [];
			derivedModifiers[modPath] = derivedModifiers[modPath].concat(modifiers[modPath]);
		}
	}
	return derivedModifiers;
}

/**
 * Common definition of the XML schema for in-template modifications.
 */
const ModificationSchema =
"<interleave>" +
	"<element name='Paths' a:help='Space separated value paths to modify.'>" +
		"<attribute name='datatype'>" +
			"<value>tokens</value>" +
		"</attribute>" +
		"<text/>" +
	"</element>" +
	"<element name='Affects' a:help='An array of classes to affect.'>" +
		"<attribute name='datatype'>" +
			"<value>tokens</value>" +
		"</attribute>" +
		"<text/>" +
	"</element>" +
	"<choice>" +
		"<element name='Add'>" +
			"<data type='decimal' />" +
		"</element>" +
		"<element name='Multiply'>" +
			"<data type='decimal' />" +
		"</element>" +
		"<element name='Replace'>" +
			"<text/>" +
		"</element>" +
	"</choice>" +
"</interleave>";

const ModificationsSchema =
"<element name='Modifiers' a:help='List of modifiers.'>" +
	"<oneOrMore>" +
		"<element>" +
			"<anyName />" +
			ModificationSchema +
		"</element>" +
	"</oneOrMore>" +
"</element>";

/**
 * Derives a single modification (to be applied to entities) from a given XML template.
 *
 * @param {Template} template - The XML template node to derive the modification from.
 */
function DeriveModificationFromXMLTemplate(template)
{
	/** @type {Modification} */
	let effect = {};
	if (template.Add)
		effect.add = +template.Add;
	if (template.Multiply)
		effect.multiply = +template.Multiply;
	if (template.Replace)
		effect.replace = template.Replace;
	effect.affects = template.Affects ? template.Affects._string.split(/\s/) : [];

	/** @type {Record<string, Modification[]>} */
	let ret = {};
	for (let path of template.Paths._string.split(/\s/))
	{
		ret[path] = [effect];
	}

	return ret;
}

/**
 * Derives all modifications (to be applied to entities) from a given XML template.
 *
 * @param {Template} template - The XML template node to derive the modifications from.
 */
function DeriveModificationsFromXMLTemplate(template)
{
	/** @type {Record<string, Modification[]>} */
	let ret = {};
	for (let name in template)
	{
		let modification = DeriveModificationFromXMLTemplate(template[name]);
		for (let path in modification)
		{
			if (!ret[path])
				ret[path] = [];
			ret[path].push(modification[path][0]);
		}
	}
	return ret;
}
