export class ParseCoordinates {
    static tryParseCoords(input: string): { latitude: number; longitude: number } | null {
        const coordRegex = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/;
        if (!coordRegex.test(input)) return null;
        const [lat, lon] = input.split(",").map(Number);
        return { latitude: lat, longitude: lon };
    }
}