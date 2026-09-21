export class LRUCache<K, V> {
    private maxSize: number;
    private map: Map<K, V>;

    constructor(maxSize: number) {
      this.maxSize = maxSize;
      this.map = new Map();
    }

    get(key: K): V | null {
      if (!this.map.has(key)) return null;
      const value = this.map.get(key)!;
      this.map.delete(key);
      this.map.set(key, value);
      return value;
    }

    set(key: K, value: V): void {
      if (this.map.has(key)) {
        this.map.delete(key);
      } else if (this.map.size >= this.maxSize) {
        const oldestKey = this.map.keys().next().value as K;
        this.map.delete(oldestKey);
      }
      this.map.set(key, value);
    }
}
export default LRUCache;