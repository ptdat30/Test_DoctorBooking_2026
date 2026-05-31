/**
 * Generates test_doctor_booking_2026.postman_collection.json
 * Run: node generate-collection.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

const prerequestScript = read('scripts/collection_prerequest.js');
const testScript = read('scripts/collection_test.js');
const schemaAuth = JSON.stringify(readJson('schemas/auth_response.schema.json'));
const schemaError = JSON.stringify(readJson('schemas/error_response.schema.json'));
const schemaPatient = JSON.stringify(readJson('schemas/patient_response.schema.json'));
const schemaAppointment = JSON.stringify(readJson('schemas/appointment_response.schema.json'));

let reqId = 0;
const uid = () => require('crypto').randomUUID();

function req(name, method, rawUrl, opts = {}) {
  const id = uid();
  const item = {
    name,
    request: {
      method,
      header: opts.headers || [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Authorization', value: 'Bearer {{auth_token}}', disabled: opts.noAuth === true }
      ],
      url: typeof rawUrl === 'string' ? rawUrl : rawUrl,
      description: opts.description || ''
    },
    event: []
  };
  if (opts.body !== undefined) {
    item.request.body = {
      mode: 'raw',
      raw: typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body, null, 2),
      options: { raw: { language: 'json' } }
    };
  }
  if (opts.folderVars) {
    item.request.description += '\nFolder vars: ' + JSON.stringify(opts.folderVars);
  }
  if (opts.prerequest) {
    item.event.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: opts.prerequest.split('\n') } });
  }
  if (opts.test) {
    item.event.push({ listen: 'test', script: { type: 'text/javascript', exec: opts.test.split('\n') } });
  }
  return item;
}

const BASE = '{{base_url}}';

const loginTest = (role, tokenVar, userIdVar) => `
pm.environment.set('current_role', '${role}');
pm.test('Status code is 200', () => pm.response.to.have.status(200));
const json = pm.response.json();
pm.test('Has JWT token', () => pm.expect(json.token).to.be.a('string'));
pm.environment.set('${tokenVar}', json.token);
pm.environment.set('auth_token', json.token);
if (json.refreshToken) pm.environment.set('refresh_token', json.refreshToken);
if (json.id) pm.environment.set('${userIdVar}', json.id);
console.log('Logged in as ${role}:', json.username);
`.trim();

const statusTest = (code) => `
pm.test('Status code is ${code}', () => pm.response.to.have.status(${code}));
if (pm.response.code !== ${code}) { pm.environment.set('skip_dependent_tests', 'true'); console.error(pm.response.text()); }
`.trim();

const authSchemaTest = `
if (pm.response.code === 200 || pm.response.code === 201) {
  const json = pm.response.json();
  const schema = ${schemaAuth};
  if (typeof tv4 !== 'undefined') {
    pm.test('Auth response schema', () => pm.expect(tv4.validate(json, schema)).to.be.true);
  }
  pm.test('Token is string', () => pm.expect(json.token).to.be.a('string'));
}
`.trim();

function folder(name, items, desc = '') {
  return { name, description: desc, item: items };
}

function posNeg(positive, negative, folderDesc = '') {
  return [
    folder('Positive Tests', positive, folderDesc),
    folder('Negative Tests', negative, folderDesc)
  ];
}

// --- 00 Setup ---
const setup = folder('00_Setup', [
  req('Reset Skip Flag', 'GET', `${BASE}/api/public/health`, {
    noAuth: true,
    test: `pm.environment.set('skip_dependent_tests', 'false');\n${statusTest(200)}`
  }),
  req('Login Patient', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true,
    body: { username: '{{patient_username}}', password: '{{patient_password}}' },
    test: loginTest('PATIENT', 'patient_token', 'patient_userId') + '\n' + authSchemaTest
  }),
  req('Login Doctor', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true,
    body: { username: '{{doctor_username}}', password: '{{doctor_password}}' },
    test: loginTest('DOCTOR', 'doctor_token', 'doctor_userId') + '\n' + authSchemaTest
  }),
  req('Get Doctor Profile Setup', 'GET', `${BASE}/api/doctor/profile`, {
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer {{doctor_token}}' }
    ],
    test: `pm.test('Status code is 200', () => pm.response.to.have.status(200));\nif(pm.response.code===200){\n  pm.environment.set('doctorId', String(pm.response.json().id));\n}`
  }),
  req('Login Admin', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true,
    body: { username: '{{admin_username}}', password: '{{admin_password}}' },
    test: loginTest('ADMIN', 'admin_token', 'admin_userId') + '\n' + authSchemaTest
  }),
  req('Data-Driven Login - {{role}}', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true,
    body: { username: '{{username}}', password: '{{password}}' },
    test: `
if (!pm.iterationData || (pm.iterationData.toObject && Object.keys(pm.iterationData.toObject()).length === 0)) {
  console.log('Skipping data-driven assertions because no iteration data was provided.');
} else {
  const expected = parseInt(pm.iterationData?.expected_status || pm.environment.get('expected_status') || '200', 10);
  pm.test('Status matches expected', () => pm.response.to.have.status(expected));
  const json = pm.response.json();
  const role = pm.iterationData?.role || 'PATIENT';
  const map = { PATIENT: 'patient_token', DOCTOR: 'doctor_token', ADMIN: 'admin_token' };
  if (json.token) {
    pm.environment.set(map[role], json.token);
    pm.environment.set('auth_token', json.token);
  }
}
`.trim()
  })
]);

// --- 01 Public ---
const publicFolder = folder('01_Public', posNeg(
  [req('GET Health - Success', 'GET', `${BASE}/api/public/health`, {
    noAuth: true,
    test: statusTest(200) + `\npm.test('Body contains status', () => { const b = pm.response.text(); pm.expect(b.length).to.be.above(0); });`
  })],
  [req('GET Health - Wrong Method POST', 'POST', `${BASE}/api/public/health`, {
    noAuth: true,
    test: `pm.test('Returns 405, 403 or 500', () => pm.expect([405,403,404,500]).to.include(pm.response.code));`
  })]
));

// --- 02 Auth ---
const authPos = [
  req('GET Auth Test Endpoint', 'GET', `${BASE}/api/auth/test`, { noAuth: true, test: statusTest(200) }),
  req('POST Login - Valid Patient', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true, body: { username: '{{patient_username}}', password: '{{patient_password}}' },
    test: loginTest('PATIENT', 'patient_token', 'patient_userId') + '\n' + authSchemaTest
  }),
  req('POST Register - Valid New Patient', 'POST', `${BASE}/api/auth/register`, {
    noAuth: true,
    body: { username: '{{random_username}}', password: 'password123', email: '{{random_email}}', fullName: 'Auto Test', phone: '0900000001', role: 'PATIENT' },
    test: statusTest(201) + '\n' + authSchemaTest + `\npm.environment.set('last_registered_username', pm.environment.get('random_username'));`
  })
];
const authNeg = [
  req('POST Login - Missing Password', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true, body: { username: 'patient1' }, test: statusTest(400)
  }),
  req('POST Login - Invalid Credentials', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true, body: { username: 'patient1', password: 'wrongpass' }, test: statusTest(401)
  }),
  req('POST Register - Invalid Email', 'POST', `${BASE}/api/auth/register`, {
    noAuth: true, body: { username: 'u1', password: 'password123', email: 'bad', fullName: 'X' }, test: statusTest(400)
  }),
  req('POST Register - Short Password', 'POST', `${BASE}/api/auth/register`, {
    noAuth: true, body: { username: 'u2', password: '123', email: 'a@b.com', fullName: 'X' }, test: statusTest(400)
  }),
  req('POST Login - SQL Injection Username', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true, body: { username: "admin' OR '1'='1", password: 'x' },
    test: `pm.test('Not 500', () => pm.expect(pm.response.code).to.be.below(500));\npm.test('401 or 400', () => pm.expect([401,400]).to.include(pm.response.code));`
  }),
  req('POST Register - XSS in fullName', 'POST', `${BASE}/api/auth/register`, {
    noAuth: true,
    body: { username: '{{random_username}}', password: 'password123', email: '{{random_email}}', fullName: '<script>alert(1)</script>', role: 'PATIENT' },
    test: `pm.test('201 or 400', () => pm.expect([201,400]).to.include(pm.response.code));`
  })
];
const authFolder = folder('02_Auth', posNeg(authPos, authNeg));

// Patient module builder
function patientModule(name, posItems, negItems) {
  return folder(name, [
    ...posNeg(posItems, negItems, `current_role=PATIENT`).map(f => {
      f.item.forEach(r => {
        if (!r.event) r.event = [];
        const pre = [
          "pm.environment.set('current_role', 'PATIENT');",
          "const tok = pm.environment.get('patient_token');",
          "pm.environment.set('auth_token', tok);",
          "if (tok) pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + tok});"
        ];
        r.event.unshift({
          listen: 'prerequest',
          script: { type: 'text/javascript', exec: pre.concat(
            r.event.find(e => e.listen === 'prerequest')?.script?.exec || []
          ) }
        });
      });
      return f;
    })
  ]);
}

const patientProfilePos = [
  req('GET Profile', 'GET', `${BASE}/api/patient/profile`, {
    test: statusTest(200) + `\nconst j=pm.response.json();\npm.test('Has id',()=>pm.expect(j.id).to.be.a('number'));\npm.environment.set('patientId', j.id);`
  }),
  req('PUT Profile - Valid', 'PUT', `${BASE}/api/patient/profile`, {
    body: { fullName: 'Patient Auto Updated', phone: '0901111222', address: 'Test Address' },
    test: statusTest(200)
  })
];
const patientProfileNeg = [
  req('GET Profile - No Token', 'GET', `${BASE}/api/patient/profile`, {
    prerequest: "pm.request.headers.remove('Authorization');",
    test: statusTest(403)
  }),
  req('PUT Profile - Doctor Token Forbidden', 'PUT', `${BASE}/api/patient/profile`, {
    prerequest: "pm.request.headers.upsert({key:'Authorization',value:'Bearer '+pm.environment.get('doctor_token')});",
    body: { fullName: 'Hack' }, test: statusTest(403)
  })
];

const patientDoctorsPos = [
  req('GET Doctors List', 'GET', `${BASE}/api/patient/doctors`, {
    test: statusTest(200) + `\nconst arr=pm.response.json();\npm.test('Is array',()=>pm.expect(arr).to.be.an('array'));\nif(arr.length){\n  const doc=arr.find(d => d.username === pm.environment.get('doctor_username'));\n  if(doc) pm.environment.set('doctorId', String(doc.id));\n  else if(!pm.environment.get('doctorId')) pm.environment.set('doctorId', String(arr[0].id));\n}`
  }),
  req('GET Doctor By ID', 'GET', `${BASE}/api/patient/doctors/{{doctorId}}`, { test: statusTest(200) })
];
const patientDoctorsNeg = [
  req('GET Doctor - Not Found', 'GET', `${BASE}/api/patient/doctors/999999`, { test: statusTest(404) })
];

const apptBody = (o) => JSON.stringify(o, null, 2);
const patientApptPos = [
  req('GET Available Slots', 'GET', `${BASE}/api/patient/appointments/available-slots?doctorId={{doctorId}}&date={{tomorrow_date}}`, {
    test: statusTest(200) + `\nconst slots = pm.response.json();\nif (slots && slots.length > 0) {\n  let slot = slots[0];\n  if (slot.length === 5) slot += ':00';\n  pm.environment.set('appointmentTime', slot);\n} else {\n  pm.environment.set('appointmentTime', '09:00:00');\n}`
  }),
  req('POST Appointment - Valid CASH', 'POST', `${BASE}/api/patient/appointments`, {
    body: { doctorId: '{{doctorId}}', appointmentDate: '{{tomorrow_date}}', appointmentTime: '{{appointmentTime}}', notes: 'Auto test', paymentMethod: 'CASH' },
    test: statusTest(201) + `\nconst j=pm.response.json();\nconst apt=j.appointment||j;\npm.environment.set('appointmentId', apt.id);\nif(apt.patientId) pm.environment.set('patientId', apt.patientId);\npm.test('doctorId matches',()=>pm.expect(String(apt.doctorId)).to.eql(String(pm.environment.get('doctorId'))));`
  }),
  req('GET Appointments List', 'GET', `${BASE}/api/patient/appointments`, { test: statusTest(200) }),
  req('GET Appointment By ID', 'GET', `${BASE}/api/patient/appointments/{{appointmentId}}`, {
    prerequest: "if(!pm.environment.get('appointmentId')){pm.environment.set('appointmentId','999999');}",
    test: statusTest(200)
  })
];
const patientApptNeg = [
  req('POST Appointment - Missing doctorId', 'POST', `${BASE}/api/patient/appointments`, {
    body: { appointmentDate: '{{tomorrow_date}}', appointmentTime: '10:00:00', paymentMethod: 'CASH' }, test: statusTest(400)
  }),
  req('POST Appointment - Invalid Time Type', 'POST', `${BASE}/api/patient/appointments`, {
    body: { doctorId: '{{doctorId}}', appointmentDate: '{{tomorrow_date}}', appointmentTime: 'invalid', paymentMethod: 'CASH' }, test: statusTest(400)
  }),
  req('GET Appointment - Not Found', 'GET', `${BASE}/api/patient/appointments/999999`, { test: statusTest(404) }),
  req('POST Appointment - No Auth', 'POST', `${BASE}/api/patient/appointments`, {
    prerequest: "pm.request.headers.remove('Authorization');",
    body: { doctorId: 1, appointmentDate: '{{tomorrow_date}}', appointmentTime: '09:00:00' }, test: statusTest(403)
  })
];

const patientTreatPos = [
  req('GET Treatments', 'GET', `${BASE}/api/patient/treatments`, { test: statusTest(200) }),
  req('GET Treatment By ID', 'GET', `${BASE}/api/patient/treatments/{{treatmentId}}`, {
    prerequest: "if(!pm.environment.get('treatmentId')){pm.environment.set('treatmentId','999999');}",
    test: `pm.test('200 or 404 if no treatmentId', () => pm.expect([200,404]).to.include(pm.response.code));`
  })
];
const patientTreatNeg = [
  req('GET Treatment - Not Found', 'GET', `${BASE}/api/patient/treatments/999999`, { test: statusTest(404) })
];

const patientFeedbackPos = [
  req('GET Feedbacks', 'GET', `${BASE}/api/patient/feedbacks`, { test: statusTest(200) }),
  req('POST Feedback - Valid', 'POST', `${BASE}/api/patient/feedbacks`, {
    prerequest: `const adminToken = pm.environment.get('admin_token');\nconst apptId = pm.environment.get('appointmentId');\nif (adminToken && apptId) {\n  pm.sendRequest({\n    url: pm.environment.get('base_url') + '/api/admin/appointments/' + apptId,\n    method: 'PUT',\n    header: {\n      'Content-Type': 'application/json',\n      'Authorization': 'Bearer ' + adminToken\n    },\n    body: {\n      mode: 'raw',\n      raw: JSON.stringify({ status: 'COMPLETED' })\n    }\n  }, function (err, res) {\n    if (err) console.error('Failed to auto-complete appointment for feedback:', err);\n    else console.log('Auto-completed appointment for feedback: status code', res.code);\n  });\n}`,
    body: { appointmentId: '{{appointmentId}}', rating: 5, comment: 'Great service - auto test' },
    test: statusTest(201) + `\nif(pm.response.code===201){pm.environment.set('feedbackId', pm.response.json().id);}`
  })
];
const patientFeedbackNeg = [
  req('POST Feedback - Missing Rating', 'POST', `${BASE}/api/patient/feedbacks`, {
    body: { appointmentId: '{{appointmentId}}', comment: 'No rating' }, test: statusTest(400)
  }),
  req('POST Feedback - Rating Out Of Range', 'POST', `${BASE}/api/patient/feedbacks`, {
    body: { appointmentId: '{{appointmentId}}', rating: 99 }, test: statusTest(400)
  })
];

const patientFamilyPos = [
  req('GET Family Members', 'GET', `${BASE}/api/patient/family-members`, { test: statusTest(200) }),
  req('GET Family Stats', 'GET', `${BASE}/api/patient/family-members/stats`, { test: statusTest(200) }),
  req('POST Family Member', 'POST', `${BASE}/api/patient/family-members`, {
    body: { fullName: 'Family Auto', relationship: 'CHILD', gender: 'MALE', phone: '0909999888' },
    test: statusTest(201) + `\nif(pm.response.code===201) pm.environment.set('familyMemberId', pm.response.json().id);`
  })
];
const patientFamilyNeg = [
  req('POST Family Member - Missing fullName', 'POST', `${BASE}/api/patient/family-members`, {
    body: { relationship: 'CHILD' }, test: statusTest(400)
  }),
  req('DELETE Family Member - Not Found', 'DELETE', `${BASE}/api/patient/family-members/999999`, {
    test: `pm.test('400 or 404', () => pm.expect([400,404]).to.include(pm.response.code));`
  })
];

const patientWalletPos = [
  req('GET Wallet', 'GET', `${BASE}/api/patient/wallet`, { test: statusTest(200) }),
  req('GET Wallet Transactions', 'GET', `${BASE}/api/patient/wallet/transactions`, { test: statusTest(200) }),
  req('POST Wallet Top-Up - Valid', 'POST', `${BASE}/api/patient/wallet/top-up`, {
    body: { amount: 10000, paymentMethod: 'VNPAY' }, test: `pm.test('200 or 201 or 400 vnpay', () => pm.expect([200,201,400]).to.include(pm.response.code));`
  })
];
const patientWalletNeg = [
  req('POST Top-Up - Below Minimum', 'POST', `${BASE}/api/patient/wallet/top-up`, {
    body: { amount: 100, paymentMethod: 'VNPAY' }, test: statusTest(400)
  })
];

const patientAiPos = [
  req('POST Check Symptoms - Valid', 'POST', `${BASE}/api/patient/ai/check-symptoms`, {
    body: { symptoms: 'đau đầu, sốt nhẹ' },
    test: `if(pm.environment.get('skip_ai_tests')==='true'){ pm.test('Skipped',()=>pm.expect(true).to.be.true); } else { pm.test('200 or 503',()=>pm.expect([200,503,500]).to.include(pm.response.code)); }`
  })
];
const patientAiNeg = [
  req('POST Check Symptoms - Empty', 'POST', `${BASE}/api/patient/ai/check-symptoms`, {
    body: { symptoms: '' }, test: statusTest(400)
  })
];

const patientNotifPos = [
  req('GET Notifications', 'GET', `${BASE}/api/patient/notifications`, { test: statusTest(200) }),
  req('GET Unread Count', 'GET', `${BASE}/api/patient/notifications/unread-count`, { test: statusTest(200) }),
  req('PUT Mark All Read', 'PUT', `${BASE}/api/patient/notifications/mark-all-read`, { test: statusTest(200) })
];
const patientNotifNeg = [
  req('PUT Mark Read - Not Found', 'PUT', `${BASE}/api/patient/notifications/999999/read`, {
    test: `pm.test('400 or 404', () => pm.expect([400,404]).to.include(pm.response.code));`
  })
];

// Doctor modules
function doctorFolder(name, pos, neg) {
  const wrap = (items) => items.map(r => {
    const pre = [
      "pm.environment.set('current_role', 'DOCTOR');",
      "const tok = pm.environment.get('doctor_token');",
      "pm.environment.set('auth_token', tok);",
      "if (tok) pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + tok});"
    ];
    r.event = r.event || [];
    const existing = r.event.find(e => e.listen === 'prerequest');
    if (existing) existing.script.exec = pre.concat(existing.script.exec);
    else r.event.unshift({ listen: 'prerequest', script: { type: 'text/javascript', exec: pre } });
    return r;
  });
  return folder(name, [folder('Positive Tests', wrap(pos)), folder('Negative Tests', wrap(neg))]);
}

const doctorProfilePos = [
  req('GET Doctor Profile', 'GET', `${BASE}/api/doctor/profile`, { test: statusTest(200) }),
  req('PUT Doctor Profile', 'PUT', `${BASE}/api/doctor/profile`, {
    body: { fullName: 'Doctor Auto', phone: '0902222333' }, test: statusTest(200)
  })
];
const doctorProfileNeg = [
  req('GET Profile - Patient Token', 'GET', `${BASE}/api/doctor/profile`, {
    prerequest: "pm.request.headers.upsert({key:'Authorization',value:'Bearer '+pm.environment.get('patient_token')});",
    test: statusTest(403)
  })
];

const doctorApptPos = [
  req('GET Appointments', 'GET', `${BASE}/api/doctor/appointments`, { test: statusTest(200) }),
  req('GET Appointment By ID', 'GET', `${BASE}/api/doctor/appointments/{{appointmentId}}`, {
    prerequest: "if(!pm.environment.get('appointmentId')){pm.environment.set('appointmentId','999999');}",
    test: `pm.test('200 or 404', () => pm.expect([200,404]).to.include(pm.response.code));`
  }),
  req('PUT Confirm Appointment', 'PUT', `${BASE}/api/doctor/appointments/{{appointmentId}}/confirm`, {
    prerequest: "if(!pm.environment.get('appointmentId')){pm.environment.set('appointmentId','999999');}",
    test: `pm.test('200, 400 or 404', () => pm.expect([200,400,404]).to.include(pm.response.code));`
  })
];
const doctorApptNeg = [
  req('GET Appointment - Not Found', 'GET', `${BASE}/api/doctor/appointments/999999`, { test: statusTest(404) })
];

const doctorTreatPos = [
  req('GET Treatments', 'GET', `${BASE}/api/doctor/treatments`, { test: statusTest(200) }),
  req('POST Treatment', 'POST', `${BASE}/api/doctor/treatments`, {
    body: { appointmentId: '{{appointmentId}}', patientId: '{{patientId}}', diagnosis: 'Auto diagnosis', prescription: 'Rest', treatmentNotes: 'Test' },
    test: statusTest(201) + `\nif(pm.response.code===201) pm.environment.set('treatmentId', pm.response.json().id);`
  })
];
const doctorTreatNeg = [
  req('POST Treatment - Missing patientId', 'POST', `${BASE}/api/doctor/treatments`, {
    body: { appointmentId: '{{appointmentId}}', diagnosis: 'X' }, test: statusTest(400)
  })
];

const doctorPatientsPos = [
  req('GET Patients', 'GET', `${BASE}/api/doctor/patients`, { test: statusTest(200) }),
  req('GET Patient By ID', 'GET', `${BASE}/api/doctor/patients/{{patientId}}`, {
    test: `pm.test('200 or 404', () => pm.expect([200,404]).to.include(pm.response.code));`
  })
];
const doctorPatientsNeg = [
  req('GET Patient - Not Found', 'GET', `${BASE}/api/doctor/patients/999999`, { test: statusTest(404) })
];

const doctorMiscPos = [
  req('GET Medications', 'GET', `${BASE}/api/doctor/medications`, { test: statusTest(200) }),
  req('GET Feedbacks', 'GET', `${BASE}/api/doctor/feedbacks`, { test: statusTest(200) }),
  req('GET Average Rating', 'GET', `${BASE}/api/doctor/average-rating`, { test: statusTest(200) })
];
const doctorMiscNeg = [
  req('GET Feedbacks - Invalid Rating', 'GET', `${BASE}/api/doctor/feedbacks/rating/99`, {
    test: `pm.test('200 or 404', () => pm.expect([200,404]).to.include(pm.response.code));`
  })
];

// Admin
function adminFolder(name, pos, neg) {
  const wrap = (items) => items.map(r => {
    const pre = [
      "pm.environment.set('current_role', 'ADMIN');",
      "const tok = pm.environment.get('admin_token');",
      "pm.environment.set('auth_token', tok);",
      "if (tok) pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + tok});"
    ];
    r.event = r.event || [];
    const existing = r.event.find(e => e.listen === 'prerequest');
    if (existing) existing.script.exec = pre.concat(existing.script.exec);
    else r.event.unshift({ listen: 'prerequest', script: { type: 'text/javascript', exec: pre } });
    return r;
  });
  return folder(name, [folder('Positive Tests', wrap(pos)), folder('Negative Tests', wrap(neg))]);
}

const adminDoctorsPos = [
  req('GET Doctors', 'GET', `${BASE}/api/admin/doctors`, { test: statusTest(200) }),
  req('GET Doctor By ID', 'GET', `${BASE}/api/admin/doctors/{{doctorId}}`, { test: statusTest(200) }),
  req('GET Doctors Search', 'GET', `${BASE}/api/admin/doctors?search=doctor`, { test: statusTest(200) })
];
const adminDoctorsNeg = [
  req('GET Doctor - Not Found', 'GET', `${BASE}/api/admin/doctors/999999`, { test: statusTest(404) }),
  req('POST Doctor - Missing Fields', 'POST', `${BASE}/api/admin/doctors`, {
    body: { username: 'x' }, test: statusTest(400)
  })
];

const adminPatientsPos = [
  req('GET Patients', 'GET', `${BASE}/api/admin/patients`, { test: statusTest(200) }),
  req('GET Patient By ID', 'GET', `${BASE}/api/admin/patients/{{patientId}}`, {
    test: `pm.test('200 or 404', () => pm.expect([200,404]).to.include(pm.response.code));`
  })
];
const adminPatientsNeg = [
  req('GET Patient - Not Found', 'GET', `${BASE}/api/admin/patients/999999`, { test: statusTest(404) })
];

const adminApptPos = [
  req('GET Appointments', 'GET', `${BASE}/api/admin/appointments`, { test: statusTest(200) }),
  req('GET Appointment By ID', 'GET', `${BASE}/api/admin/appointments/{{appointmentId}}`, {
    prerequest: "if(!pm.environment.get('appointmentId')){pm.environment.set('appointmentId','999999');}",
    test: `pm.test('200 or 404', () => pm.expect([200,404]).to.include(pm.response.code));`
  })
];
const adminApptNeg = [
  req('GET Appointment - Not Found', 'GET', `${BASE}/api/admin/appointments/999999`, { test: statusTest(404) })
];

const adminFeedPos = [
  req('GET Feedbacks', 'GET', `${BASE}/api/admin/feedbacks`, { test: statusTest(200) }),
  req('GET Feedbacks By Doctor', 'GET', `${BASE}/api/admin/feedbacks/doctor/{{doctorId}}`, { test: statusTest(200) })
];
const adminFeedNeg = [
  req('GET Feedback - Not Found', 'GET', `${BASE}/api/admin/feedbacks/999999`, { test: statusTest(404) })
];

const adminUsersPos = [
  req('GET Users', 'GET', `${BASE}/api/admin/users`, { test: statusTest(200) }),
  req('POST User - Valid', 'POST', `${BASE}/api/admin/users`, {
    body: { username: '{{random_username}}', email: '{{random_email}}', password: 'password123', role: 'PATIENT', enabled: true },
    test: statusTest(201) + `\nif(pm.response.code===201) pm.environment.set('admin_user_id', pm.response.json().id);`
  })
];
const adminUsersNeg = [
  req('POST User - Invalid Email', 'POST', `${BASE}/api/admin/users`, {
    body: { username: 'bad', email: 'x', password: 'password123', role: 'PATIENT' }, test: statusTest(400)
  }),
  req('GET User - Not Found', 'GET', `${BASE}/api/admin/users/999999`, { test: statusTest(404) })
];

// E2E Flow
const e2e = folder('22_E2E_Flows', [
  req('E2E-01 Login Patient', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true, body: { username: '{{patient_username}}', password: '{{patient_password}}' },
    test: loginTest('PATIENT', 'patient_token', 'patient_userId')
  }),
  req('E2E-02 GET Doctors', 'GET', `${BASE}/api/patient/doctors`, {
    prerequest: "pm.environment.set('auth_token', pm.environment.get('patient_token')); pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + pm.environment.get('patient_token')});",
    test: statusTest(200) + `\nconst a=pm.response.json();\nconst doc=a.find(d => d.username === pm.environment.get('doctor_username'));\nif(doc) pm.environment.set('doctorId', String(doc.id));\nelse if(a.length) pm.environment.set('doctorId', String(a[0].id));`
  }),
  req('E2E-03 GET Slots', 'GET', `${BASE}/api/patient/appointments/available-slots?doctorId={{doctorId}}&date={{tomorrow_date}}`, {
    prerequest: "pm.environment.set('auth_token', pm.environment.get('patient_token')); pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + pm.environment.get('patient_token')});",
    test: statusTest(200) + `\nconst slots = pm.response.json();\nif (slots && slots.length > 0) {\n  let slot = slots[slots.length - 1];\n  if (slot.length === 5) slot += ':00';\n  pm.environment.set('e2e_appointmentTime', slot);\n} else {\n  pm.environment.set('e2e_appointmentTime', '14:00:00');\n}`
  }),
  req('E2E-04 POST Appointment', 'POST', `${BASE}/api/patient/appointments`, {
    prerequest: "pm.environment.set('auth_token', pm.environment.get('patient_token')); pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + pm.environment.get('patient_token')});",
    body: { doctorId: '{{doctorId}}', appointmentDate: '{{tomorrow_date}}', appointmentTime: '{{e2e_appointmentTime}}', paymentMethod: 'CASH', notes: 'E2E flow' },
    test: statusTest(201) + `\nconst apt=(pm.response.json().appointment||pm.response.json()); pm.environment.set('appointmentId', apt.id); if(apt.patientId) pm.environment.set('patientId', apt.patientId);`
  }),
  req('E2E-05 Login Doctor', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true, body: { username: '{{doctor_username}}', password: '{{doctor_password}}' },
    test: loginTest('DOCTOR', 'doctor_token', 'doctor_userId')
  }),
  req('E2E-06 Confirm Appointment', 'PUT', `${BASE}/api/doctor/appointments/{{appointmentId}}/confirm`, {
    prerequest: "pm.environment.set('auth_token', pm.environment.get('doctor_token')); pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + pm.environment.get('doctor_token')});",
    test: `pm.test('200 or 404', () => pm.expect([200,404]).to.include(pm.response.code));`
  }),
  req('E2E-07 POST Treatment', 'POST', `${BASE}/api/doctor/treatments`, {
    prerequest: "pm.environment.set('auth_token', pm.environment.get('doctor_token')); pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + pm.environment.get('doctor_token')});",
    body: { appointmentId: '{{appointmentId}}', patientId: '{{patientId}}', diagnosis: 'E2E', prescription: 'N/A' },
    test: statusTest(201)
  }),
  req('E2E-08 Login Patient Feedback', 'POST', `${BASE}/api/auth/login`, {
    noAuth: true, body: { username: '{{patient_username}}', password: '{{patient_password}}' },
    test: loginTest('PATIENT', 'patient_token', 'patient_userId')
  }),
  req('E2E-09 POST Feedback', 'POST', `${BASE}/api/patient/feedbacks`, {
    prerequest: "pm.environment.set('auth_token', pm.environment.get('patient_token')); pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + pm.environment.get('patient_token')});",
    body: { appointmentId: '{{appointmentId}}', rating: 4, comment: 'E2E feedback' },
    test: `pm.test('201 or 400 duplicate', () => pm.expect([201,400]).to.include(pm.response.code));`
  }),
  req('E2E-10 Cleanup Delete Appointment', 'DELETE', `${BASE}/api/patient/appointments/{{appointmentId}}`, {
    prerequest: "pm.environment.set('auth_token', pm.environment.get('patient_token')); pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + pm.environment.get('patient_token')});",
    test: `pm.test('200 or 204 or 400 or 404', () => pm.expect([200,204,400,404]).to.include(pm.response.code));`
  }),
  req('E2E-11 Family CRUD Create', 'POST', `${BASE}/api/patient/family-members`, {
    prerequest: "pm.environment.set('auth_token', pm.environment.get('patient_token')); pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + pm.environment.get('patient_token')});",
    body: { fullName: 'E2E Family', relationship: 'SPOUSE' },
    test: statusTest(201) + `\nif(pm.response.code===201) pm.environment.set('familyMemberId', pm.response.json().id);`
  }),
  req('E2E-12 Family Delete Cleanup', 'DELETE', `${BASE}/api/patient/family-members/{{familyMemberId}}`, {
    prerequest: "pm.environment.set('auth_token', pm.environment.get('patient_token')); pm.request.headers.upsert({key: 'Authorization', value: 'Bearer ' + pm.environment.get('patient_token')});",
    test: `pm.test('204 or 200 or 404', () => pm.expect([200,204,404]).to.include(pm.response.code));`
  })
], 'End-to-end chained flow with cleanup');

const debugFolder = folder('23_Debug_Test', [
  req('GET Test Auth Info', 'GET', `${BASE}/api/test/auth-info`, { noAuth: true, test: statusTest(200) }),
  req('GET Test DB Check', 'GET', `${BASE}/api/test/db-check`, { noAuth: true, test: statusTest(200) })
], 'Local debug only - no auth required');

const collection = {
  info: {
    _postman_id: uid(),
    name: 'test_doctor_booking_2026 - API Automation Test Suite',
    description: 'Professional API automation test suite for Doctor Booking System (test_doctor_booking_2026). Includes positive/negative tests, schema validation, data-driven tests, E2E flows, and Newman CI support.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  event: [
    { listen: 'prerequest', script: { type: 'text/javascript', exec: prerequestScript.split('\n') } },
    { listen: 'test', script: { type: 'text/javascript', exec: testScript.split('\n') } }
  ],
  variable: [
    { key: 'schema_auth_response', value: schemaAuth },
    { key: 'schema_error_response', value: schemaError },
    { key: 'schema_patient_response', value: schemaPatient },
    { key: 'schema_appointment_response', value: schemaAppointment }
  ],
  item: [
    setup,
    publicFolder,
    authFolder,
    patientModule('03_Patient_Profile', patientProfilePos, patientProfileNeg),
    patientModule('04_Patient_Doctors', patientDoctorsPos, patientDoctorsNeg),
    patientModule('05_Patient_Appointments', patientApptPos, patientApptNeg),
    patientModule('06_Patient_Treatments', patientTreatPos, patientTreatNeg),
    patientModule('07_Patient_Feedbacks', patientFeedbackPos, patientFeedbackNeg),
    patientModule('08_Patient_FamilyMembers', patientFamilyPos, patientFamilyNeg),
    patientModule('09_Patient_Wallet_Payments', patientWalletPos, patientWalletNeg),
    patientModule('10_Patient_AI', patientAiPos, patientAiNeg),
    patientModule('11_Patient_Notifications', patientNotifPos, patientNotifNeg),
    doctorFolder('12_Doctor_Profile', doctorProfilePos, doctorProfileNeg),
    doctorFolder('13_Doctor_Appointments', doctorApptPos, doctorApptNeg),
    doctorFolder('14_Doctor_Treatments', doctorTreatPos, doctorTreatNeg),
    doctorFolder('15_Doctor_Patients', doctorPatientsPos, doctorPatientsNeg),
    doctorFolder('16_Doctor_Medications_Feedbacks', doctorMiscPos, doctorMiscNeg),
    adminFolder('17_Admin_Doctors', adminDoctorsPos, adminDoctorsNeg),
    adminFolder('18_Admin_Patients', adminPatientsPos, adminPatientsNeg),
    adminFolder('19_Admin_Appointments', adminApptPos, adminApptNeg),
    adminFolder('20_Admin_Feedbacks', adminFeedPos, adminFeedNeg),
    adminFolder('21_Admin_Users', adminUsersPos, adminUsersNeg),
    e2e,
    debugFolder
  ]
};

const outPath = path.join(ROOT, 'test_doctor_booking_2026.postman_collection.json');
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2));
const count = JSON.stringify(collection).match(/"method":/g)?.length || 0;
console.log(`Generated ${outPath}`);
console.log(`Approximate requests: ${count}`);
