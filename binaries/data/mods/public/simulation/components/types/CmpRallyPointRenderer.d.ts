declare interface ICmpRallyPointRenderer {
    UpdatePosition(rallyPointId: number, position: Vector2D): void;
    Reset(): void;
}
