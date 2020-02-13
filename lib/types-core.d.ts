import { services } from './service';
export declare type ValueOf<T> = T[keyof T];
export declare type PackageJson = {
    name: string;
};
export interface Account {
    [key: string]: string | Account | string[];
    NAME: string;
    ID: string;
    NS: string[];
}
export interface Env {
    [key: string]: string;
}
export interface Principal {
    Service: string;
}
export declare type Region = string;
export declare type Service = typeof services[number];
