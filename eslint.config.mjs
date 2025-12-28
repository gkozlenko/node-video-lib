import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {    
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...globals.mocha,
            },
        },

        rules: {
            "comma-dangle": [
                "error",
                "always-multiline"
            ],
            "no-console": "error",
            "strict": [
                "error",
                "global"
            ],
            "indent": [
                "error", 
                4,
                {
                    "SwitchCase": 1,
                }
            ],
            "quotes": [
                "error",
                "single"
            ],
            "semi": [
                "error", 
                "always"
            ],
            "keyword-spacing": 2,
            "space-before-blocks": [
                "error", 
                "always"
            ],
            "space-before-function-paren": [
                "error", 
                {
                    "anonymous": "always",
                    "named": "never",
                }
            ],
            "dot-location": [
                "error", 
                "property"
            ],
            "space-infix-ops": "error",
            "key-spacing": [
                "error", 
                {
                    "beforeColon": false,
                    "afterColon": true,
                }
            ],
            "operator-linebreak": [
                "error", 
                "after"
            ],
            "func-call-spacing": "error",
            "comma-spacing": [
                "error", 
                {
                    "before": false,
                    "after": true,
                }
            ],
            "no-multiple-empty-lines": [
                "error", 
                {
                    "max": 1,
                }
            ],
            "curly": "error",
            "eqeqeq": "error",
            "no-use-before-define": "error",
            "no-unused-vars": "error",
            "no-unexpected-multiline": "error",
            "no-multi-str": "error",
            "no-trailing-spaces": "error",
            "linebreak-style": [
                "error", 
                "unix"
            ],
            "eol-last": "error",
        },
    }
];
