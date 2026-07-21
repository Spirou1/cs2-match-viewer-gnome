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
    } catch (error) {
        log(`Error when trying to fetch live matches ${error.message}`);
        return null;
    }
}

export async function fetchFinishedMatches(customDate = null) {
    const session = new Soup.Session();
    //important, adjust to fetch from current date

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = customDate || `${year}-${month}-${day}`;


    const url = `https://api.bo3.gg/api/v2/matches/finished?date=${dateStr}&utc_offset=0&filter[discipline_id][eq]=1`;
    const message = Soup.Message.new('GET', url);

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
