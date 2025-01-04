declare interface ICmpPathfinder {
    GetPassabilityClass(passClass: string): number;
    GetClearance(passClass: number): number;
    UpdateGrid(): void;
}