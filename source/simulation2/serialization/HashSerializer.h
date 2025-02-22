/* Copyright (C) 2017 Wildfire Games.
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

#ifndef INCLUDED_HASHSERIALIZER
#define INCLUDED_HASHSERIALIZER

#include "BinarySerializer.h"

#include "maths/MD5.h"
#include "scriptinterface/ScriptRequest.h"

class CHashSerializerImpl
{
	// We don't care about cryptographic strength, just about detection of
	// unintended changes and about performance, so MD5 is an adequate choice
	typedef MD5 HashFunc;

public:
	size_t GetHashLength();
	const u8* ComputeHash();

	void Put(const char* UNUSED(name), const u8* data, size_t len)
	{
		m_Hash.Update(data, len);
	}

private:
	HashFunc m_Hash;
	u8 m_HashData[HashFunc::DIGESTSIZE];
};

/**
 * PutScriptVal implementation details.
 * (Split out from the main class because it's too big to be inlined.)
 */
class CHashSerializerScriptImpl
{
public:
	CHashSerializerScriptImpl(const ScriptInterface& scriptInterface, ISerializer& serializer);

	void ScriptString(const ScriptRequest& rq, const char* name, JS::HandleString string);
	void PutScriptVal(JS::HandleValue val);
private:
	void HandleScriptVal(const ScriptRequest& rq, JS::HandleValue val);

	const ScriptInterface& m_ScriptInterface;
	ScriptRequest m_Request;
	ISerializer& m_Serializer;

	JS::PropertyKey m_SerializePropId;
	JS::PropertyKey m_DeserializePropId;
};


class CHashSerializer : public CBinarySerializer<CHashSerializerImpl, CHashSerializerScriptImpl>
{
public:
	CHashSerializer(const ScriptInterface& scriptInterface);

	size_t GetHashLength();
	const u8* ComputeHash();
};

#endif // INCLUDED_HASHSERIALIZER
