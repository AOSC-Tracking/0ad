/* Copyright (C) 2025 Wildfire Games.
 * ...the usual copyright header...
 */

#include "ICmpExample.h"

#include "simulation2/system/InterfaceScripted.h"

BEGIN_INTERFACE_WRAPPER(Example)
DEFINE_INTERFACE_METHOD("DoWhatever", ICmpExample, DoWhatever)
// DEFINE_INTERFACE_METHOD for all the other methods too
END_INTERFACE_WRAPPER(Example)
