export class StringHelper {
  public static generateRandomString(length: number): string {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;

    for (let i = 1; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  public static getRandomNumber(max: number = 999999, min: number = 1): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public static generateArrayFromNumberRange(startNumber: number, endNumber: number): number[] {
    const data: number[] = [];
    for (let i = startNumber; i <= endNumber; i++) {
      data.push(i);
    }

    return [...new Set(data)];
  }

  public static replaceUUID(input: string): string {
    // UUID v4 regex pattern
    const regex = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

    // Replacing all UUID v4 with 'id'
    return input.replace(regex, 'id');
  }
}
