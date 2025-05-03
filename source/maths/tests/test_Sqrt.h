/* Copyright (C) 2019 Wildfire Games.
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

#include "maths/Sqrt.h"

#include <random>

class TestSqrt : public CxxTest::TestSuite
{
public:
	void t(u32 n)
	{
		TS_ASSERT_EQUALS(isqrt64((u64)n*(u64)n), n);
	}

	void s(u64 n, u64 exp)
	{
		TS_ASSERT_EQUALS((u32)isqrt64(n), (u32)exp);
	}

	void test_sqrt()
	{
		t(0);
		t(1);
		t(2);
		t(255);
		t(256);
		t(257);
		t(65535);
		t(65536);
		t(65537);
		t(16777215);
		t(16777216);
		t(16777217);
		t(2147483647);
		t(2147483648u);
		t(2147483649u);
		t(4294967295u);

		s(2, 1);
		s(3, 1);
		s(4, 2);
		s(255, 15);
		s(256, 16);
		s(257, 16);
		s(65535, 255);
		s(65536, 256);
		s(65537, 256);
		s(999999, 999);
		s(1000000, 1000);
		s(1000001, 1000);
		s((u64)-1, 4294967295u);
	}

	void test_high()
	{
		// There's a couple of these that are off by one vs the double sqrt (though still arguably correct values),
		// so skip them.
		for (u64 i = 0; i < 65536; i += 4)
		{
			u64 n = (u64)-1 - (1ull<<48) - (1ull << 32) * i;
			s(n, (double)sqrt(n));
			n = (u64)-1 - (1ull<<49) - (1ull << 32) * i;
			s(n, (double)sqrt(n));
			n = (u64)-1 - (1ull<<50) - (1ull << 32) * i;
			s(n, (double)sqrt(n));
		}
	}

	void test_low()
	{
		// Test values in the range [0, 2^16)
		for (u64 i = 0; i < 65536; ++i)
			s(i, (double)sqrt(i));
	}

	void test_random()
	{
		// Test with some random u64s, to make sure the output agrees with floor(sqrt(double))
		// (TODO: This might be making non-portable assumptions about sqrt(double))

		std::mt19937 engine(42);

		std::uniform_int_distribution<u64> distributions[4] = {
			std::uniform_int_distribution<u64>(2000ul*2000*65535*65535, -1ull),
			std::uniform_int_distribution<u64>(20ul*20*65535*65535, 2000ul*2000*65535*65535),
			std::uniform_int_distribution<u64>(65535, 20ul*20*65535*65535),
			std::uniform_int_distribution<u64>(0, 65535),
		};

		for (auto& ints : distributions)
		{
			// Tests with squares of 20-2000, as these are common distances we want to sqrt

			double error = .0;
			double error_max = .0;

			size_t n = 1024;
			for (size_t i = 0; i < n; ++i)
			{
				u64 n = ints(engine);
				u32 isqrt = isqrt64(n);
				u64 sqrt = std::sqrt(static_cast<double>(n));
				u64 diff = std::abs<i64>(isqrt - sqrt);
				error += diff;
				//if (diff > 2)
				//	printf("Error: %llu %llu vs %llu, %i\n", n, isqrt, sqrt, diff);
				error_max = std::max(error_max, static_cast<double>(diff));
			}
			//printf("Error: %f %f\n", error / n, error_max);
			TS_ASSERT_LESS_THAN(error / n, 1.f);
			TS_ASSERT_LESS_THAN(error_max, 1.1f);
		}
	}
};