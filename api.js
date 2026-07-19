import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
// import Soup from 'gi://Soup'; // Comentado temporariamente para o mock

export async function fetchMatches() {
    /* =========================================================================
     * MOCK 
     * ========================================================================= */
    try {
        const currentFile = Gio.File.new_for_uri(import.meta.url);
        const currentDir = currentFile.get_parent();
        const jsonFile = currentDir.get_child('jsonExemplo.json');
        const [success, contents] = jsonFile.load_contents(null);
        
        if (success) {
            const decoder = new TextDecoder('utf-8');
            const responseText = decoder.decode(contents);
            return JSON.parse(responseText);
        }
        return null;
    } catch (error) {
        log(`[CS2 Match Viewer] Erro ao carregar mock local: ${error.message}`);
        return null;
    }

    /* =========================================================================
     * 
     * -------------------------------------------------------------------------
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
    } catch(error) {
        log(`Error when trying to fetch live matches ${error.message}`);
        return null;
    }
     ========================================================================= */
}