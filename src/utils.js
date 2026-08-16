import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';
import { getSession } from './api.js';

const cacheDir = GLib.build_filenamev([GLib.get_user_cache_dir(), 'cs2matchviewer']);
GLib.mkdir_with_parents(cacheDir, 0o755);

export function parseMatchMaps(match) {
    if (!match || !match.games || !Array.isArray(match.games)) {
        return [];
    }

    return [...match.games].sort((a, b) => a.number - b.number);
}

export async function getCachedImageUri(remoteUrl) {
    if (!remoteUrl) return null;

    try {
        const fileName = GLib.compute_checksum_for_string(GLib.ChecksumType.MD5, remoteUrl, -1) + '.png';
        const filePath = GLib.build_filenamev([cacheDir, fileName]);
        const file = Gio.File.new_for_path(filePath);

        if (file.query_exists(null)) {
            return file.get_uri();
        }

        const message = Soup.Message.new('GET', remoteUrl);
        const session = getSession();
        const bytes = await session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null);

        file.replace_contents(
            bytes.toArray(),
            null,
            false,
            Gio.FileCreateFlags.NONE,
            null
        );

        return file.get_uri();
    } catch {
        return null;
    }
}

const flagsDir = Gio.File.new_for_uri(import.meta.url)
    .get_parent() 
    .get_parent() 
    .get_child('assets')
    .get_child('flags');

export function getCountryFlagUri(countryCode) {
    if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
        return null;
    }

    const flagFile = flagsDir.get_child(`${countryCode.toLowerCase()}.png`);

    if (flagFile.query_exists(null)) {
        return flagFile.get_uri();
    }

    const fallbackFlag = flagsDir.get_child('un.png');
    if (fallbackFlag.query_exists(null)) {
        return fallbackFlag.get_uri();
    }

    return null;
}

export function formatRating(bo3Rating) {
    if (!bo3Rating || typeof bo3Rating !== 'number') return '';

    const ratingHLTV = (bo3Rating / 5.50) - 0.05;
    return ratingHLTV.toFixed(2);
}
