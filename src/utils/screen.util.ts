import { API_KEYS } from '../constants/api-keys.const';
import { IScreenOutput } from '../interfaces/screen.interface';

export class ScreenBrowser {
  private cachedAPIs: Partial<Record<keyof API_KEYS, any>> = {};
  private isUsedCaching: boolean = true;

  public enableCaching(): ScreenBrowser {
    this.isUsedCaching = true;
    return this;
  }

  public disableCaching(): ScreenBrowser {
    this.isUsedCaching = false;
    return this;
  }

  private setCache(key: API_KEYS, value: any): void {
    if (this.isUsedCaching) {
      this.cachedAPIs[key] = value;
    }
  }

  private getCache(key: API_KEYS): any {
    if (this.isUsedCaching) {
      return this.cachedAPIs[key];
    }

    return null;
  }

  public clearCache(): void {
    this.cachedAPIs = {};
  }

  public async gotoScreen(screen: IScreenOutput): Promise<Map<API_KEYS, any>> {
    const results: Map<API_KEYS, any> = new Map();

    const keyAPIs: API_KEYS[] = [];
    const handlerAPIs: Promise<any>[] = [];

    for (const [key, apiCaller] of Object.entries(screen)) {
      const cached = this.getCache(key as API_KEYS);
      if (cached) {
        results.set(key as API_KEYS, cached);
      } else {
        keyAPIs.push(key as API_KEYS);
        handlerAPIs.push(apiCaller);
      }
    }

    const responses = handlerAPIs.length > 0 ? await Promise.all(handlerAPIs) : [];
    for (const [index, key] of keyAPIs.entries()) {
      const response = responses[index];
      results.set(key, response);
      this.setCache(key as API_KEYS, response);
    }

    return results;
  }
}
