// helpers/chunkArray.ts
/**
 * Helper: split an array into chunks of N items
 */
export function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}
