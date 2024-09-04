import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


export default [
  {
    files: ["src/*.{js,mjs,cjs,jsx}"],
    
  },
  {
    languageOptions: {
      globals: {
        
      }
    }
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
];