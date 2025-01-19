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

#include <memory>

class ScriptInterface;

class WithRequest
{
	friend class ScriptRequest;

	WithRequest() = delete;
	WithRequest(const WithRequest& rq) = delete;
	WithRequest& operator=(const WithRequest& rq) = delete;
public:

	static WithRequest FromAlreadyEntered(JSContext* cx) { return WithRequest(cx); }
	/**
	 * Returns the script interface of the currently entered realm.
	 * NB: if the JS context changes, this will return a different script interface,
	 * so be _very_ careful when juggling between different realms.
	 */
	const ScriptInterface& GetCurrentScriptInterface() const;

	JSContext* cx() const { return m_Cx; }

private:
	WithRequest(JSContext* cx): m_Cx(cx) {}
	// Implemented in ScriptInterface.cpp
	WithRequest(const ScriptInterface& scriptInterface);

	// Note that JSContext actually changes behind the scenes when creating another ScriptRequest for another realm,
	// so be _very_ careful when juggling between different realms.
	JSContext* m_Cx;
};

/**
 * Spidermonkey maintains some 'local' state via the JSContext* object.
 * This object is an argument to most JSAPI functions.
 * Furthermore, this state is Realm (~ global) dependent. For many reasons, including GC safety,
 * The JSContext* Realm must be set up correctly when accessing it.
 * 'Entering' and 'Leaving' realms must be done in a LIFO manner.
 * SM recommends using JSAutoRealm, which provides an RAII option.
 *
 * ScriptRequest combines both of the above in a single convenient package,
 * providing safe access to the JSContext*, the global object, and ensuring that the proper realm has been entered.
 * ScriptRequest will enter the realm, where WithRequest assumes you have entered it somewhere before.
 * ScriptRequest is implicitly convertible to WithRequest for convenience.
 * Most scriptinterface/ functions will take a WithRequest, to ensure proper rooting. You may sometimes
 * have to create one from a ScriptInterface.
 *
 * Be particularly careful when manipulating several script interfaces.
 */
class ScriptRequest
{
	ScriptRequest() = delete;
	ScriptRequest(const ScriptRequest& rq) = delete;
	ScriptRequest& operator=(const ScriptRequest& rq) = delete;
	ScriptRequest(ScriptRequest&& rq) = delete;
	ScriptRequest& operator=(ScriptRequest&& rq) = delete;
public:
	/**
	 * NB: the definitions are in scriptinterface.cpp, because these access members of the PImpled
	 * implementation of ScriptInterface, and that seemed more convenient.
	 */
	ScriptRequest(const ScriptInterface& scriptInterface);
	ScriptRequest(const ScriptInterface* scriptInterface) : ScriptRequest(*scriptInterface) {}
	ScriptRequest(std::shared_ptr<ScriptInterface> scriptInterface) : ScriptRequest(*scriptInterface) {}
	ScriptRequest(JSContext* cx);
	~ScriptRequest();

	operator const WithRequest&() const { return rq; }

	JSContext* cx() const { return rq.cx(); }

private:
	WithRequest rq;
	JS::Realm* m_FormerRealm;
};

#endif // INCLUDED_SCRIPTREQUEST
