export class HttpHelper {
  public static async sleep(ms: number = 10000, isRandom: boolean = false): Promise<number> {
    const duration = isRandom ? Math.floor(Math.random() * ms) : ms;
    await new Promise((r) => setTimeout(r, duration));
    return duration;
  }
}
