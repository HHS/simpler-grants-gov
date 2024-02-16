export abstract class DataFetcher<T> {
    abstract fetchData(): Promise<T[]>;
  }
