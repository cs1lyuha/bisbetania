declare module '*.bible' {
  const asset: number;
  export default asset;
}

// TypeScript 6 verifică și importurile fără nume (import '../global.css'); stilurile le procesează NativeWind.
declare module '*.css';
