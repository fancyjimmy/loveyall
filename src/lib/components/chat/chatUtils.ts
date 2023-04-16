export function colorFromName(name: string) {
    const minSaturation = 50;
    const maxSaturation = 100;
    const minLightness = 30;
    const maxLightness = 60;

    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };
    const seededRandomNumberGenerator = (a: number) => {
        return function () {
            let t = (a += 0x6d2b79f5);
            t = (t ^ (t >>> 15) * t | 1) | 0;
            t ^= t + (t ^ (t >>> 7) * t | 61) | 0;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    };

    const random = seededRandomNumberGenerator(hashCode(name));

    const hue = Math.floor(random() * 360);
    const saturation = Math.floor(random() * (maxSaturation - minSaturation) + minSaturation);
    const lightness = Math.floor(random() * (maxLightness - minLightness) + minLightness);

    return {
        h: hue,
        s: saturation,
        l: lightness
    };
}

export type HSLColor = {
    h: number,
    s: number,
    l: number
}

export function toHslString({h, s, l}: HSLColor) {
    return `hsl(${h}, ${s}%, ${l}%)`;
}

export function darken({h, s, l}: HSLColor, amount: number) {
    return {
        h,
        s,
        l: l - amount
    };
}
