declare function warn(msg: string): void;

declare function markForTranslation(msg: string): string;

declare const SYSTEM_ENTITY: number;
declare const INVALID_PLAYER = -1;

/*~ If your library has properties exposed on a global variable,
*~ place them here.
*~ You should also place types (interfaces and type alias) here.
*/
declare namespace Engine {
    function QueryInterface(entity: number, iid: number): any;
    function PostMessage(entity: number, mid: number, data: any): void;
    function RegisterComponentType(iid: number, name: string, component: any): void;
}
