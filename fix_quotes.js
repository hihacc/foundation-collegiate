const fs = require('fs');
const path = require('path');

const filesToFix = [
  { path: 'src/app/admissions/page.tsx', replaces: [{ from: "parent's", to: "parent&apos;s" }, { from: "Father's", to: "Father&apos;s" }] },
  { path: 'src/app/contact/page.tsx', replaces: [{ from: "We'll", to: "We&apos;ll" }, { from: "we'll", to: "we&apos;ll" }, { from: "you're", to: "you&apos;re" }] },
  { path: 'src/app/results/page.tsx', replaces: [{ from: "Student's", to: "Student&apos;s" }, { from: "Father's", to: "Father&apos;s" }] },
  { path: 'src/components/home/AdmissionsBanner.tsx', replaces: [{ from: "Don't", to: "Don&apos;t" }] },
  { path: 'src/components/home/TestimonialsSection.tsx', replaces: [{ from: '"The', to: '&quot;The' }, { from: 'family."', to: 'family.&quot;' }] }
];

filesToFix.forEach(fileInfo => {
  const fullPath = path.join(__dirname, fileInfo.path);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    fileInfo.replaces.forEach(repl => {
      if (content.includes(repl.from)) {
        content = content.replaceAll(repl.from, repl.to);
        changed = true;
      }
    });
    // Just a fallback generic replace for stray single quotes in JSX text
    // We will do this carefully: look for text between > and <
    let newContent = content.replace(/>([^<]+)</g, (match, text) => {
      if(text.includes("'") && !text.includes("{") && !text.includes("}")) {
          return ">" + text.replace(/'/g, "&apos;") + "<";
      }
      return match;
    });
    
    if (content !== newContent || changed) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`Fixed ${fileInfo.path}`);
    }
  }
});
