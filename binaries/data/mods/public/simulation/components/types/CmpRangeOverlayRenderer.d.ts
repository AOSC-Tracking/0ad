declare interface ICmpRangeOverlayRenderer {
    ResetRangeOverlays(): void;
    AddRangeOverlay(radius: number, texture: string, textureMask: string, thickness: number): void;
}