const fs = require('fs');
let code = fs.readFileSync('context/AppContext.tsx', 'utf8');

code = code.replace(
  'import {',
  'import { WidgetBridge } from "../logic/widgetBridge.ts";\nimport {'
);

code = code.replace(
  'safeSetLocalStorage("focusflow-tasks", JSON.stringify(state.tasks));',
  'safeSetLocalStorage("focusflow-tasks", JSON.stringify(state.tasks));\n        WidgetBridge.syncState(state);'
);

fs.writeFileSync('context/AppContext.tsx', code);
