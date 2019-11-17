import {
  services
} from './service';

// import {
//   JsonObject
// } from 'lodash-firecloud/types';

export type ValueOf<T> = T[keyof T];

export type PackageJson = { // JsonObject & {
  name: string;
};

export interface Account {
  NAME: string;
  ID: string;
  NS: string[];
  // `ID`: [Circular]
  // `NAME`: [Circular]
  // `prefix`: [Circular]
  // TODO figure out how to remove string[] from the line below. Only needed because of NS
  [key: string]: string | Account | string[];
}

export interface Env {
  [key: string]: string;
}

export interface Principal {
  Service: string;
}

export type Region = string;

export type Service = typeof services[number];
