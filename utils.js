export function parseMatchMaps(match) {
    if (!match || !match.games || !Array.isArray(match.games)) {
        return [];
    }

    return [...match.games].sort((a, b) => a.number - b.number);
}