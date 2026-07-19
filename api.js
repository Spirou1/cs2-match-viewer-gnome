import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
// import Soup from 'gi://Soup'; // Comentado temporariamente para o mock

export async function fetchMatches() {
    /* =========================================================================
     * MOCK TEMPORÁRIO PARA DESENVOLVIMENTO
     * -------------------------------------------------------------------------
     * Lê o arquivo 'jsonExemplo.json' local enquanto não há partidas ao vivo.
     * Para voltar a usar a API real, basta comentar este bloco de leitura 
     * e descomentar a requisição HTTP com o Soup abaixo.
     * ========================================================================= */
    try {
        const currentFilePath = import.meta.url.replace('file://', '');
        const currentDir = GLib.path_get_dirname(currentFilePath);
        const jsonPath = GLib.build_filenamev([currentDir, 'jsonExemplo.json']);

        const file = Gio.File.new_for_path(jsonPath);
        const [success, contents] = file.load_contents(null);
        
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
     * CÓDIGO DA API REAL (HTTP REQUEST COM LIBSOUP 3)
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