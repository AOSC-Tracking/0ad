
// We have some extensions to the Math object
declare interface Math {
    square(x: number): number;
    intPow(x: number, y: number): number;

    euclidDistance2DSquared(x1: number, y1: number, x2: number, y2: number): number;
    euclidDistance2D(x1: number, y1: number, x2: number, y2: number): number;
    euclidDistance3DSquared(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number;
    euclidDistance3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number;
}
