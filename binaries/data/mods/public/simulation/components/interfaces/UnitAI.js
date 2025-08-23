Engine.RegisterInterface("UnitAI");

/**
 * Message of the form { "ableToMove": boolean }
 * sent from UnitAI whenever the unit's ability to move changes.
 */
Engine.RegisterMessageType("UnitAbleToMoveChanged");

/**
 * Message of the form { "to": number[] }
 * where "to" value is an array of data orders given by GetOrderData,
 * sent from UnitAI whenever the unit order data changes.
 */
Engine.RegisterMessageType("UnitAIOrderDataChanged");

/**
 * Message of the form { "entity": number }
 * sent from UnitAI whenever a pickup is requested.
 */
Engine.RegisterMessageType("PickupRequested");

/**
 * Message of the form { "entity": number }
 * sent from UnitAI whenever a pickup is aborted.
 */
Engine.RegisterMessageType("PickupCanceled");
