import { DataFetcher } from "./datafetcher";

export class ApiDataFetcher<T> extends DataFetcher<T> {
    constructor(private endpoint: string) {
      super();
    }

    async fetchData(): Promise<T[]> {
      const response = await fetch(this.endpoint);
      const data: T[] = await response.json();
      return data;
    }
  }
