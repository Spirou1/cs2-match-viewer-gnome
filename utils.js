import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';

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

        const session = new Soup.Session();
        const message = Soup.Message.new('GET', remoteUrl);
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