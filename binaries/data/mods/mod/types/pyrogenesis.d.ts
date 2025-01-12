declare function print(...args: any[]): void;
declare function log(msg: string): void;
declare function warn(msg: string): void;
declare function error(msg: string): void;

// Firefox extension
declare function uneval(obj: any): string;

declare function clone<T>(obj: T): T;
declare function deepfreeze<T>(obj: T): T;

declare namespace Engine {
    function ProfileStart(name: string): void;
    function ProfileStop(): void;
    function ProfileAttribute(name: string): void;

    function ListDirectoryFiles(path: string, filterStr?: string, recurse ?:boolean): string[];
    function FileExists(path: string): boolean;
    function ReadJSONFile(path: string): unknown;
}
