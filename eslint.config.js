import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                log: "readonly",
                logError: "readonly",
                print: "readonly",
                printerr: "readonly",
                imports: "readonly",
                
                console: "readonly",
                TextDecoder: "readonly",
                TextEncoder: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
        }
    }
];
