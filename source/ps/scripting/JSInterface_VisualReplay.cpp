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

#include "precompiled.h"

#include "JSInterface_VisualReplay.h"

#include "ps/CStr.h"
#include "ps/VisualReplay.h"
#include "ps/VideoMode.h"
#include "scriptinterface/FunctionWrapper.h"
#include "scriptinterface/ScriptRequest.h"

#include <SDL3/SDL_dialog.h>

#include <filesystem>
#include <string.h>

namespace JSI_VisualReplay
{
CStrW GetReplayDirectoryName(const CStrW& directoryName)
{
	// The string conversion is added to account for non-latin characters.
	return wstring_from_utf8(OsPath(VisualReplay::GetDirectoryPath() / directoryName).string8());
}

void SDLCALL ExportReplayCallback(void* userdata, const char* const* filelist, int /*filter*/)
{
	debug_printf("saved: %s\n", (char*)userdata);

	if (!filelist)
	{
		debug_printf("Error selecting file\n: %s", SDL_GetError());
		return;
	}

	if (!*filelist)
	{
		debug_printf("No file selected\n");
	}

	debug_printf("File selected: %s\n", *filelist);
	std::filesystem::copy_file((char*)userdata, *filelist);
}

void SDLCALL ImportReplayCallback(void* /*userdata*/, const char* const* filelist, int /*filter*/)
{
	if (!filelist)
	{
		debug_printf("Error selecting file\n: %s", SDL_GetError());
		return;
	}

	if (!*filelist)
	{
		debug_printf("No file selected\n");
	}

	while (*filelist)
	{
		debug_printf("File selected %s\n", *filelist);
		std::filesystem::path source = *filelist;
		std::filesystem::path basedir = OsPath(VisualReplay::GetDirectoryPath()).string8();
		std::filesystem::path directory = basedir / "some_dir_path";
		std::filesystem::path target = directory / "commands.txt";
		debug_printf("Target File path %s\n", target.c_str());
		std::filesystem::create_directory(directory, basedir);
		std::filesystem::copy_file(source, target);
		filelist++;
	}
}

void ExportReplay(const CStrW& directory)
{
	std::filesystem::path source = directory.c_str();
	source /= "commands.txt";
	char* file = strdup(source.c_str());
	SDL_ShowSaveFileDialog(
			&ExportReplayCallback,
			file, // userdata
			g_VideoMode.GetWindow(), // window for modal
			nullptr, // filters
			0, // num filters
			nullptr // default location
	);
}

void ImportReplays()
{
	SDL_ShowOpenFileDialog(
			&ImportReplayCallback, // callback
			nullptr, // *userdata
			g_VideoMode.GetWindow(), // *window
			nullptr, // *filters
			0, // nfilters
			nullptr, // *default_location
			true // allow_many
	);
}

void RegisterScriptFunctions(const ScriptRequest& rq)
{
	ScriptFunction::Register<&VisualReplay::GetReplays>(rq, "GetReplays");
	ScriptFunction::Register<&VisualReplay::DeleteReplay>(rq, "DeleteReplay");
	ScriptFunction::Register<&ExportReplay>(rq, "ExportReplay");
	ScriptFunction::Register<&ImportReplays>(rq, "ImportReplays");
	ScriptFunction::Register<&VisualReplay::StartVisualReplay>(rq, "StartVisualReplay");
	ScriptFunction::Register<&VisualReplay::GetReplayAttributes>(rq, "GetReplayAttributes");
	ScriptFunction::Register<&VisualReplay::GetReplayMetadata>(rq, "GetReplayMetadata");
	ScriptFunction::Register<&VisualReplay::HasReplayMetadata>(rq, "HasReplayMetadata");
	ScriptFunction::Register<&VisualReplay::AddReplayToCache>(rq, "AddReplayToCache");
	ScriptFunction::Register<&GetReplayDirectoryName>(rq, "GetReplayDirectoryName");
}
}
