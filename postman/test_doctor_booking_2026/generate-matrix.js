const fs = require('fs');
const path = require('path');
const col = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_doctor_booking_2026.postman_collection.json'), 'utf8'));

const rows = [];
function walk(items, module) {
  for (const it of items) {
    if (it.item) walk(it.item, it.name);
    else if (it.request) {
      const type = module.includes('Negative') ? 'Negative' : module.includes('Positive') ? 'Positive' : 'Setup/E2E';
      const url = typeof it.request.url === 'string' ? it.request.url : JSON.stringify(it.request.url);
      rows.push({
        module: module.replace(/^(Positive Tests|Negative Tests)$/, '').trim() || module,
        endpoint: `${it.request.method} ${url.split('{{base_url}}').pop() || url}`,
        testName: it.name,
        type,
        expected: inferExpected(it),
        assertions: inferAssertions(it)
      });
    }
  }
}

function inferExpected(item) {
  const n = item.name.toLowerCase();
  if (n.includes('201') || n.includes('valid') && item.request.method === 'POST') return '201';
  if (n.includes('404') || n.includes('not found')) return '404';
  if (n.includes('401') || n.includes('invalid credential')) return '401';
  if (n.includes('403') || n.includes('no token') || n.includes('forbidden')) return '403';
  if (n.includes('400') || n.includes('missing') || n.includes('invalid')) return '400';
  if (n.includes('204') || n.includes('delete')) return '200/204';
  return '200';
}

function inferAssertions(item) {
  const tests = (item.event || []).find(e => e.listen === 'test');
  if (!tests) return 'response time, status code';
  const exec = tests.script.exec.join(' ');
  const a = [];
  if (exec.includes('schema')) a.push('tv4 schema');
  if (exec.includes('responseTime')) a.push('response time < max_response_ms');
  if (exec.includes('token')) a.push('JWT + env chaining');
  if (exec.includes('array')) a.push('array validation');
  return a.length ? a.join('; ') : 'status code';
}

walk(col.item, 'Root');

let md = `# TEST_CASE_MATRIX — test_doctor_booking_2026

> Auto-generated from Postman collection. Regenerate: \`node generate-matrix.js\`

## Summary

| Metric | Value |
|--------|-------|
| Total requests | ${rows.length} |
| Positive | ${rows.filter(r => r.type === 'Positive').length} |
| Negative | ${rows.filter(r => r.type === 'Negative').length} |
| Other (Setup/E2E) | ${rows.filter(r => r.type === 'Setup/E2E').length} |

## API behavior notes (from backend)

| Scenario | Actual status |
|----------|---------------|
| Missing/invalid JWT on role routes | **403** (Spring Security) |
| Wrong login credentials | **401** |
| Validation errors (@Valid) | **400** + \`errors\` map |
| Duplicate DB constraint | **400** (not 409) |
| No \`/api/auth/refresh\` | Re-login via pre-request |

## Test matrix

| Module | Endpoint | Test name | Type | Expected | Key assertions |
|--------|----------|-----------|------|----------|----------------|
`;

for (const r of rows) {
  md += `| ${r.module} | ${r.endpoint.replace(/\|/g, '\\|').substring(0, 60)} | ${r.testName} | ${r.type} | ${r.expected} | ${r.assertions} |\n`;
}

md += `
## Data-driven files

| File | Variables | Usage |
|------|-----------|-------|
| data/users_login.json | role, username, password, expected_status | Newman \`-d\` / Collection Runner |
| data/register_cases.json | case_name, expected_status, username, email... | Register iteration |
| data/appointment_cases.json | doctorId, appointmentDate, expected_status | Appointment iteration |
| data/negative_payloads.json | injection/XSS cases | Security negatives |

## Newman commands

\`\`\`powershell
# Full setup login (3 roles)
./newman/run.ps1 -SetupOnly

# E2E flow only
./newman/run.ps1 -E2EOnly

# Specific folder
./newman/run.ps1 -Folder "02_Auth"

# With data file
./newman/run.ps1 -DataFile "register_cases.json" -Folder "02_Auth"
\`\`\`

\`\`\`bash
newman run test_doctor_booking_2026.postman_collection.json \\
  -e test_doctor_booking_2026.postman_environment.json \\
  -d data/users_login.json \\
  --reporters cli,html --reporter-html-export reports/report.html
\`\`\`
`;

fs.writeFileSync(path.join(__dirname, 'TEST_CASE_MATRIX.md'), md);
console.log('Wrote TEST_CASE_MATRIX.md with', rows.length, 'rows');
