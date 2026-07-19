import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                // Globais específicas do GNOME e GJS
                log: "readonly",
                logError: "readonly",
                print: "readonly",
                printerr: "readonly",
                imports: "readonly",
                
                // Globais de JavaScript comum
                console: "readonly",
                TextDecoder: "readonly",
                TextEncoder: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
            }
        },
        rules: {
            // Lança erro caso use alguma variável não declarada
            "no-undef": "error",
            // Lança aviso (warning) para variáveis não utilizadas
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
        }
    }
];
