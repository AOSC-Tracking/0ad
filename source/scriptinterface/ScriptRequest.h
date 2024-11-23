/* Copyright (C) 2023 Wildfire Games.
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

#ifdef NDEBUG
#define SCRIPT_REQUEST_CHECK_REALM 0
#else
#define SCRIPT_REQUEST_CHECK_REALM 1
#endif

class ScriptInterface;

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
 * Most scriptinterface/ functions will take a ScriptRequest, to ensure proper rooting. You may sometimes
 * have to create one from a ScriptInterface.
 *
 * Be particularly careful when manipulating several script interfaces.
 */
class ScriptRequest
{
	ScriptRequest() = delete;
	ScriptRequest(const ScriptRequest& rq) = delete;
	ScriptRequest& operator=(const ScriptRequest& rq) = delete;
public:
	/**
	 * NB: the definitions are in scriptinterface.cpp, because these access members of the PImpled
	 * implementation of ScriptInterface, and that seemed more convenient.
	 */
	ScriptRequest(const ScriptInterface& scriptInterface);
	ScriptRequest(const ScriptInterface* scriptInterface) : ScriptRequest(*scriptInterface) {}
	ScriptRequest(std::shared_ptr<ScriptInterface> scriptInterface) : ScriptRequest(*scriptInterface) {}

	~ScriptRequest() {
		if (m_FormerRealm != reinterpret_cast<JS::Realm*>(this))
			JS::LeaveRealm(cx, m_FormerRealm);
	}

	/**
	 * Return the scriptInterface of the currently entered realm.
	 * NB: this will not return the 'expected' ScriptInterface if another realm was entered
	 * since this particular ScriptRequest object was created.
	 * If that behaviour is needed, pass ScriptInterface objects instead.
	 * Since that is almost certainly a code bug, this is asserted in debug builds.
	 * This is mostly a convenience to avoid passing both a request and a scriptInterface.
	 */
	const ScriptInterface& GetCurrentScriptInterface() const;

	/**
	 * Return the global object of the current context as a value (aka Realm aka ScriptInterface).
	 * Goes through ScriptInterface - don't use in hot code.
	 */
	JS::Value globalValue() const;

	/**
	 * Return the global object of the current context (aka Realm aka ScriptInterface).
	 * Goes through ScriptInterface - don't use in hot code.
	 */
	JSObject& globalObject() const;

	/**
	 * Return the object on which functions are exposed.
	 * Goes through ScriptInterface - don't use in hot code.
	 * Primarily exists to avoid including ScriptInterface in FunctionWrapper.h
	 */
	JS::HandleObject GetNativeScope() const;

	/**
	 * Create a script request from a JSContext.
	 * This can be used to get the script interface in e.g. a JSNative function.
	 * As the name implies, this does not enter any realm, so we must already be in the correct one.
	 */
	static ScriptRequest FromAlreadyEntered(JSContext* cx) {
		return ScriptRequest(cx);
	}

	// Note that JSContext actually changes behind the scenes when creating another ScriptRequest for another realm,
	// so be _very_ careful when juggling between different realms.
	JSContext* cx;

private:
	// @see fromAlreadyEntered
	// Store the address of the ScriptRequest object in m_FormerRealm as a safe tagged value,
	// indicating that we didn't actually enter anything.
	// This value is safe as it can't conflict with an actual JS::Realm.
	ScriptRequest(JSContext* cx) : cx(cx), m_FormerRealm(reinterpret_cast<JS::Realm*>(this)) {
		InitEnteredRealm();
	}

#if SCRIPT_REQUEST_CHECK_REALM
	/**
	 * In debug mode, ensures that scriptRequests are used correctly.
	 */
	void InitEnteredRealm();
	void CheckEnteredRealm() const;

	JS::Realm* m_EnteredRealm = nullptr;
#else
	void InitEnteredRealm() {};
	void CheckEnteredRealm() const {};
#endif
	JS::Realm* m_FormerRealm;
};

#endif // INCLUDED_SCRIPTREQUEST
