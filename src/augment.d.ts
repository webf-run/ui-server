export type Duplex = 'half';

declare global {
  interface RequestInit {
    duplex?: Duplex;
  }
}
