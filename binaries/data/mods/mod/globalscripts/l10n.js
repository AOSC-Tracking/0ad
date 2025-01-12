/**
 * Function is used by the extract-messages tool.
 * So it may only be used on a plain string,
 * it won't have any effect on a calculated string.
 * @param {string} message
 */
function markForTranslation(message)
{
	return message;
}

/**
 * @param {string} context
 * @param {string} message
 */
function markForTranslationWithContext(context, message)
{
	return message;
}

/**
 * @param {string} singularMessage
 * @param {string} pluralMessage
 * @param {number} number
 */
function markForPluralTranslation(singularMessage, pluralMessage, number)
{
	return {
		"message": singularMessage,
		"pluralMessage": pluralMessage,
		"pluralCount": number
	};
}
