Engine.RegisterInterface("Foundation");

/**
 * Message of the form { "entity": number, "newentity": number }
 * sent from Foundation and Repairable components to its own entity when a construction has been completed.
 * Units can watch for this and change the task once it's complete.
 */
Engine.RegisterMessageType("ConstructionFinished");
