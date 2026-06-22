export type ReleaseChangeType =
  | 'added'
  | 'fixed'
  | 'changed'
  | 'performance'
  | 'security'
  | 'documentation'
  | 'miscellaneous';

export interface ReleaseChange {
  type: ReleaseChangeType;
  text: string;
}

export interface Release {
  version: string;
  date: string;
  compareUrl?: string;
  releaseUrl?: string;
  changes: ReleaseChange[];
}
