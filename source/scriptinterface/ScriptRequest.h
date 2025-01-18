/* Copyright (C) 2021 Wildfire Games.
 * This file is part of 0 A.D.
 *
 * 0 A.D. is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * 0 A.D. is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with 0 A.D.  If not, see <http://www.gnu.org/licenses/>.
 */

#ifndef INCLUDED_SCRIPTREQUEST
#define INCLUDED_SCRIPTREQUEST

#include "scriptinterface/ScriptForward.h"

// Ignore warnings in SM headers.
#if GCC_VERSION || CLANG_VERSION
# pragma GCC diagnostic push
# pragma GCC diagnostic ignored "-Wunused-parameter"
# pragma GCC diagnostic ignored "-Wnon-virtual-dtor"
#elif MSC_VERSION
# pragma warning(push, 1)
#endif

#include "js/RootingAPI.h"

#if GCC_VERSION || CLANG_VERSION
# pragma GCC diagnostic pop
#elif MSC_VERSION
# pragma warning(pop)
#endif

#include <memory>

class ScriptInterface;

class ScriptRequest
{
	friend class ScriptRequestGuard;

	ScriptRequest() = delete;
	ScriptRequest(const ScriptRequest& rq) = delete;
	ScriptRequest& operator=(const ScriptRequest& rq) = delete;
public:

	static ScriptRequest FromAlreadyEntered(JSContext* cx) { return ScriptRequest(cx); }

	/**
	 * Returns the script interface of the currently entered realm.
	 * NB: if the JS context changes, this will return a different script interface,
	 * so be _very_ careful when juggling between different realms.
	 */
	const ScriptInterface& GetCurrentScriptInterface() const;

	// Note that JSContext actually changes behind the scenes when creating another ScriptRequest for another realm,
	// so be _very_ careful when juggling between different realms.
	JSContext* cx;
private:
	ScriptRequest(JSContext* cx): cx(cx) {}
	// Implemented in ScriptInterface.cpp
	ScriptRequest(const ScriptInterface& scriptInterface);
};

// Defined in this file to avoid including ScriptInterface.h in a couple places.
namespace Script
{
JS::Value GetGlobalValue(const ScriptRequest& rq);
JS::HandleObject GetNativeScope(const ScriptRequest& rq);
};

/**
 * Spidermonkey maintains some 'local' state via the JSContext* object.
 * This object is an argument to most JSAPI functions.
 * Furthermore, this state is Realm (~ global) dependent. For many reasons, including GC safety,
 * The JSContext* Realm must be set up correctly when accessing it.
 * 'Entering' and 'Leaving' realms must be done in a LIFO manner.
 * SM recommends using JSAutoRealm, which provides an RAII option.
 *
 * ScriptRequestGuard combines both of the above in a single convenient package,
 * providing safe access to the JSContext*, the global object, and ensuring that the proper realm has been entered.
 * ScriptRequestGuard will enter the realm, where ScriptRequest assumes you have entered it somewhere before.
 * ScriptRequestGuard is implicitly convertible to ScriptRequest for convenience.
 * Most scriptinterface/ functions will take a ScriptRequest, to ensure proper rooting. You may sometimes
 * have to create one from a ScriptInterface.
 *
 * Be particularly careful when manipulating several script interfaces.
 */
class ScriptRequestGuard
{
	ScriptRequestGuard() = delete;
	ScriptRequestGuard(const ScriptRequestGuard& rq) = delete;
	ScriptRequestGuard& operator=(const ScriptRequestGuard& rq) = delete;
	ScriptRequestGuard(ScriptRequestGuard&& rq) = delete;
	ScriptRequestGuard& operator=(ScriptRequestGuard&& rq) = delete;
public:
	/**
	 * NB: the definitions are in scriptinterface.cpp, because these access members of the PImpled
	 * implementation of ScriptInterface, and that seemed more convenient.
	 */
	ScriptRequestGuard(const ScriptInterface& scriptInterface);
	ScriptRequestGuard(const ScriptInterface* scriptInterface) : ScriptRequestGuard(*scriptInterface) {}
	ScriptRequestGuard(std::shared_ptr<ScriptInterface> scriptInterface) : ScriptRequestGuard(*scriptInterface) {}
	ScriptRequestGuard(JSContext* cx);
	~ScriptRequestGuard();

	operator const ScriptRequest&() const { return rq; }

	JSContext* cx() const { return rq.cx; }

private:
	ScriptRequest rq;
	JS::Realm* m_FormerRealm;
};

#endif // INCLUDED_SCRIPTREQUEST
