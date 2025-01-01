/* Copyright (C) 2025 Wildfire Games.
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

#include "lib/self_test.h"

#include "ps/CLogger.h"
#include "ps/Filesystem.h"
#include "scriptinterface/FunctionWrapper.h"
#include "scriptinterface/JSON.h"
#include "scriptinterface/Object.h"
#include "scriptinterface/Promises.h"
#include "scriptinterface/ScriptInterface.h"
#include "scriptinterface/ScriptContext.h"
#include "scriptinterface/StructuredClone.h"
#include "ps/scripting/JSInterface_VFS.h"

class TestTypescript : public CxxTest::TestSuite
{
public:
	void test_simple()
	{
		ScriptInterface script("Engine", "Test", g_ScriptContext);
		ScriptTestSetup(script);

		ScriptRequest rq(script);
		JSI_VFS::RegisterScriptFunctions_ReadWriteAnywhere(rq);

		TS_ASSERT(script.LoadGlobalScriptFile(L"node_modules/typescript/lib/typescript.js"));
		g_ScriptContext->RunJobs();
		TS_ASSERT(script.LoadGlobalScriptFile(L"transpile.js"));

		CStr input = "const someValue: number;", output;

		JS::RootedValue global(rq.cx, rq.globalValue());
		ScriptFunction::Call(rq, global, "transpileOnly", output, input);
		TS_ASSERT_EQUALS(output, "\"use strict\";\nconst someValue;\n");
	}

	void setUp()
	{
		g_VFS = CreateVfs();
		TS_ASSERT_OK(g_VFS->Mount(L"", DataDir() / "mods" / "typescript" / "", VFS_MOUNT_MUST_EXIST));
	}

	void tearDown()
	{
		g_VFS.reset();
	}
};
