const fs = require('fs');
const path = require('path');

const iconDir = path.resolve(__dirname, '../node_modules/phosphor-react-native/lib/typescript/icons');
const jsDir = path.resolve(__dirname, '../node_modules/phosphor-react-native/lib/commonjs/icons');

if (fs.existsSync(iconDir) && fs.existsSync(jsDir)) {
  const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js') && f !== 'index.js');
  let created = 0;
  for (const file of jsFiles) {
    const name = file.replace('.js', '');
    const dtsFile = path.join(iconDir, `${name}.d.ts`);
    if (!fs.existsSync(dtsFile)) {
      const content = `import { type Icon } from 'phosphor-react-native';\ndeclare const I: Icon;\n/** @deprecated Use ${name}Icon */\nexport declare const ${name}: Icon;\nexport { I as ${name}Icon };\n//# sourceMappingURL=${name}.d.ts.map\n`;
      fs.writeFileSync(dtsFile, content, 'utf8');
      created++;
    }
  }
  if (created > 0) {
    console.log(`Generated ${created} missing Phosphor TypeScript definitions.`);
  }
}
