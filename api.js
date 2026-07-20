import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';

export async function fetchMatches() {
    const session = new Soup.Session();
    const message = Soup.Message.new('GET', 'https://api.bo3.gg/api/v2/matches/live?filter[discipline_id][eq]=1');

    try {
        const bytes = await session.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null
        );
        const decoder = new TextDecoder('utf-8');
        const responseText = decoder.decode(bytes.toArray());
        const json = JSON.parse(responseText);
        return json;

        // const file = Gio.File.new_for_uri(import.meta.url).get_parent().get_child('jsonExemplo.json');
        // const [success, contents] = file.load_contents(null);
        // if (success) {
        //     const decoder = new TextDecoder('utf-8');
        //     const responseText = decoder.decode(contents);
        //     return JSON.parse(responseText);
        // }
        // return null;
    } catch(error) {
        log(`Error when trying to fetch live matches ${error.message}`);
        return null;
    }
}

export async function fetchFinishedMatches() {
    const session = new Soup.Session();
    const message = Soup.Message.new('GET', 'https://api.bo3.gg/api/v2/matches/finished?date=2026-07-19&utc_offset=0&filter[discipline_id][eq]=1');

    try {
        const bytes = await session.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null
        );
        const decoder = new TextDecoder('utf-8');
        const responseText = decoder.decode(bytes.toArray());
        const json = JSON.parse(responseText);

        return json;
    } catch (error) {
        log(`Error when trying to fetch finished matches ${error.message}`);
        return null;
    }
}
