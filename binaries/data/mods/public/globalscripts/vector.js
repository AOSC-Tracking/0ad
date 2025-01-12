/////////////////////////////////////////////////////////////////////
//	Vector2D
//
//	Class for representing and manipulating 2D vectors
//
/////////////////////////////////////////////////////////////////////

// TODO: Type errors if v not instanceof Vector classes
// TODO: Possibly implement in C++

function Vector2D(x = 0, y = 0)
{
	this.set(x, y);
}

Vector2D.prototype.clone = function()
{
	return new Vector2D(this.x, this.y);
};

// Mutating 2D functions
//
// These functions modify the current object,
// and always return this object to allow chaining

/**
 * @param {number} x
 * @param {number} y
 */
Vector2D.prototype.set = function(x, y)
{
	this.x = x;
	this.y = y;
	return this;
};

/** @param {Vector2D} v */
Vector2D.prototype.setFrom = function(v)
{
	this.x = v.x;
	this.y = v.y;
	return this;
};

/** @param {Vector2D} v */
Vector2D.prototype.add = function(v)
{
	this.x += v.x;
	this.y += v.y;
	return this;
};

/** @param {Vector2D} v */
Vector2D.prototype.sub = function(v)
{
	this.x -= v.x;
	this.y -= v.y;
	return this;
};

/** @param {number} f */
Vector2D.prototype.mult = function(f)
{
	this.x *= f;
	this.y *= f;
	return this;
};

/** @param {number} f */
Vector2D.prototype.div = function(f)
{
	this.x /= f;
	this.y /= f;
	return this;
};

Vector2D.prototype.normalize = function()
{
	let magnitude = this.length();
	if (!magnitude)
		return this;

	return this.div(magnitude);
};

/**
 * Rotate a radians anti-clockwise
 * @param {number} angle
 */
Vector2D.prototype.rotate = function(angle)
{
	let sin = Math.sin(angle);
	let cos = Math.cos(angle);

	return this.set(
		this.x * cos + this.y * sin,
		-this.x * sin + this.y * cos);
};

/**
 * Rotate radians anti-clockwise around the specified rotation center.
 * @param {number} angle
 * @param {Vector2D} center
 */
Vector2D.prototype.rotateAround = function(angle, center)
{
	return this.sub(center).rotate(angle).add(center);
};

/**
 * Convert to integer coordinates.
 */
Vector2D.prototype.round = function()
{
	return this.set(Math.round(this.x), Math.round(this.y));
};

Vector2D.prototype.floor = function()
{
	return this.set(Math.floor(this.x), Math.floor(this.y));
};

/** @param {number} digits */
Vector2D.prototype.toFixed = function(digits)
{
	return this.set(this.x.toFixed(digits), this.y.toFixed(digits));
};

// Numeric 2D info functions (non-mutating)
//
// These methods serve to get numeric info on the vector, they don't modify the vector

/**
 * Returns a vector that forms a right angle with this one.
 */
Vector2D.prototype.perpendicular = function()
{
	return new Vector2D(-this.y, this.x);
};

/**
 * Computes the scalar product of the two vectors.
 * Geometrically, this is the product of the length of the two vectors and the cosine of the angle between them.
 * If the vectors are orthogonal, the product is zero.
 * @param {Vector2D} v
 */
Vector2D.prototype.dot = function(v)
{
	return this.x * v.x + this.y * v.y;
};

/**
 * Computes the non-zero coordinate of the cross product of the two vectors.
 * Geometrically, the cross of the vectors is a 3D vector perpendicular to the two 2D vectors.
 * The returned number corresponds to the area of the parallelogram with the vectors for sides.
 * @param {Vector2D} v
 */
Vector2D.prototype.cross = function(v)
{
	return this.x * v.y - this.y * v.x;
};

Vector2D.prototype.lengthSquared = function()
{
	return this.dot(this);
};

Vector2D.prototype.length = function()
{
	return Math.sqrt(this.lengthSquared());
};

/**
 * Compare this length to the length of v.
 * @param {Vector2D} v
 * @return {NaN | 0 | 1 | -1} - 0 if the lengths are equal,
 *  1 if this is longer than v,
 *  -1 if this is shorter than v,
 *  NaN if the vectors aren't comparable
 */
Vector2D.prototype.compareLength = function(v)
{
	return Math.sign(this.lengthSquared() - v.lengthSquared());
};

/** @param {Vector2D} v */
Vector2D.prototype.distanceToSquared = function(v)
{
	return Math.euclidDistance2DSquared(this.x, this.y, v.x, v.y);
};

/** @param {Vector2D} v */
Vector2D.prototype.distanceTo = function(v)
{
	return Math.euclidDistance2D(this.x, this.y, v.x, v.y);
};

/**
 * Returns the angle going from this position to v.
 * Angles are between -PI and PI. E.g., north is 0, east is PI/2.
 * @param {Vector2D} v
 */
Vector2D.prototype.angleTo = function(v)
{
	return Math.atan2(v.x - this.x, v.y - this.y);
};

// Static 2D functions
//
// Static functions that return a new vector object.
// Note that object creation is slow in JS, so use them only when necessary

/** @param {{ x: number, z: number }} v */
Vector2D.from3D = function(v)
{
	return new Vector2D(v.x, v.z);
};

/**
 * @param {Vector2D} v1
 * @param {Vector2D} v2
 */
Vector2D.add = function(v1, v2)
{
	return new Vector2D(v1.x + v2.x, v1.y + v2.y);
};

/**
 * @param {Vector2D} v1
 * @param {Vector2D} v2
 */
Vector2D.sub = function(v1, v2)
{
	return new Vector2D(v1.x - v2.x, v1.y - v2.y);
};

/**
 * @param {Vector2D} v1
 * @param {Vector2D} v2
 */
Vector2D.isEqualTo = function(v1, v2)
{
	return v1.x == v2.x && v1.y == v2.y;
};

/**
 * @param {Vector2D} v
 * @param {number} f
 */
Vector2D.mult = function(v, f)
{
	return new Vector2D(v.x * f, v.y * f);
};

/**
 * @param {Vector2D} v
 * @param {number} f
 */
Vector2D.div = function(v, f)
{
	return new Vector2D(v.x / f, v.y / f);
};

/**
 * @param {Vector2D} v1
 * @param {Vector2D} v2
 */
Vector2D.min = function(v1, v2)
{
	return new Vector2D(Math.min(v1.x, v2.x), Math.min(v1.y, v2.y));
};

/**
 * @param {Vector2D} v1
 * @param {Vector2D} v2
 */
Vector2D.max = function(v1, v2)
{
	return new Vector2D(Math.max(v1.x, v2.x), Math.max(v1.y, v2.y));
};

/** @param {Vector2D[]} vectorList */
Vector2D.average = function(vectorList)
{
	return Vector2D.sum(vectorList).div(vectorList.length);
};

/** @param {Vector2D[]} vectorList */
Vector2D.sum = function(vectorList)
{
	// Do not use for...of nor array functions for performance
	let sum = new Vector2D();

	for (let i = 0; i < vectorList.length; ++i)
		sum.add(vectorList[i]);

	return sum;
};

/**
 * @param {Vector2D} v1
 * @param {Vector2D} v2
 */
Vector2D.dot = function(v1, v2)
{
	return v1.x * v2.x + v1.y * v2.y;
};

/////////////////////////////////////////////////////////////////////
//	Vector3D
//
//	Class for representing and manipulating 3D vectors
//
/////////////////////////////////////////////////////////////////////

function Vector3D(x = 0, y = 0, z = 0)
{
	this.set(x, y, z);
}

Vector3D.prototype.clone = function()
{
	return new Vector3D(this.x, this.y, this.z);
};

// Mutating 3D functions
//
// These functions modify the current object,
// and always return this object to allow chaining

/**
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
Vector3D.prototype.set = function(x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;
	return this;
};

/** @param {Vector3D} v */
Vector3D.prototype.add = function(v)
{
	this.x += v.x;
	this.y += v.y;
	this.z += v.z;
	return this;
};

/** @param {Vector3D} v */
Vector3D.prototype.sub = function(v)
{
	this.x -= v.x;
	this.y -= v.y;
	this.z -= v.z;
	return this;
};

/** @param {number} f */
Vector3D.prototype.mult = function(f)
{
	this.x *= f;
	this.y *= f;
	this.z *= f;
	return this;
};

/** @param {number} f */
Vector3D.prototype.div = function(f)
{
	this.x /= f;
	this.y /= f;
	this.z /= f;
	return this;
};

Vector3D.prototype.normalize = function()
{
	let magnitude = this.length();
	if (!magnitude)
		return this;

	return this.div(magnitude);
};

/**
 * Convert to integer coordinates.
 */
Vector3D.prototype.round = function()
{
	return this.set(Math.round(this.x), Math.round(this.y), Math.round(this.z));
};

Vector3D.prototype.floor = function()
{
	return this.set(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
};

/** @param {number} digits */
Vector3D.prototype.toFixed = function(digits)
{
	return this.set(this.x.toFixed(digits), this.y.toFixed(digits), this.z.toFixed(digits));
};

// Numeric 3D info functions (non-mutating)
//
// These methods serve to get numeric info on the vector, they don't modify the vector

/** @param {Vector3D} v */
Vector3D.prototype.dot = function(v)
{
	return this.x * v.x + this.y * v.y + this.z * v.z;
};

/**
 * Returns a vector perpendicular to the two given vectors.
 * The length of the returned vector corresponds to the area of the parallelogram with the vectors for sides.
 * @param {Vector3D} v
 */
Vector3D.prototype.cross = function(v)
{
	return new Vector3D(
		this.y * v.z - this.z * v.y,
		this.z * v.x - this.x * v.z,
		this.x * v.y - this.y * v.x);
};

Vector3D.prototype.lengthSquared = function()
{
	return this.dot(this);
};

Vector3D.prototype.length = function()
{
	return Math.sqrt(this.lengthSquared());
};

/**
 * Compare this length to the length of v,
 * @param {Vector3D} v
 * @return {NaN | 0 | 1 | -1} - 0 if the lengths are equal,
 *  1 if this is longer than v,
 *  -1 if this is shorter than v,
 *  NaN if the vectors aren't comparable
 */
Vector3D.prototype.compareLength = function(v)
{
	return Math.sign(this.lengthSquared() - v.lengthSquared());
};

/** @param {Vector3D} v */
Vector3D.prototype.distanceToSquared = function(v)
{
	return Math.euclidDistance3DSquared(this.x, this.y, this.z, v.x, v.y, v.z);
};

/** @param {Vector3D} v */
Vector3D.prototype.distanceTo = function(v)
{
	return Math.euclidDistance3D(this.x, this.y, this.z, v.x, v.y, v.z);
};

/** @param {Vector3D} v */
Vector3D.prototype.horizDistanceToSquared = function(v)
{
	return Math.euclidDistance2DSquared(this.x, this.z, v.x, v.z);
};

/** @param {Vector3D} v */
Vector3D.prototype.horizDistanceTo = function(v)
{
	return Math.sqrt(this.horizDistanceToSquared(v));
};

/**
 * Returns the angle going from this position to v.
 * @param {Vector3D} v
 */
Vector3D.prototype.horizAngleTo = function(v)
{
	return Math.atan2(v.x - this.x, v.z - this.z);
};

// Static 3D functions
//
// Static functions that return a new vector object.
// Note that object creation is slow in JS, so use them only when really necessary

/**
 * @param {Vector3D} v1
 * @param {Vector3D} v2
 */
Vector3D.add = function(v1, v2)
{
	return new Vector3D(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
};

/**
 * @param {Vector3D} v1
 * @param {Vector3D} v2
 */
Vector3D.sub = function(v1, v2)
{
	return new Vector3D(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
};

/**
 * @param {Vector3D} v1
 * @param {Vector3D} v2
 */
Vector3D.isEqualTo = function(v1, v2)
{
	return v1.x == v2.x && v1.y == v2.y && v1.z == v2.z;
};

/**
 * @param {Vector3D} v
 * @param {number} f
 */
Vector3D.mult = function(v, f)
{
	return new Vector3D(v.x * f, v.y * f, v.z * f);
};

/**
 * @param {Vector3D} v
 * @param {number} f
 */
Vector3D.div = function(v, f)
{
	return new Vector3D(v.x / f, v.y / f, v.z / f);
};
