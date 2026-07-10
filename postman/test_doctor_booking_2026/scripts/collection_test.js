// Collection-level test script helpers (embedded in Postman collection)

const maxMs = parseInt(pm.environment.get('max_response_ms') || '5000', 10);
const listMaxMs = parseInt(pm.environment.get('max_response_ms_list') || String(maxMs * 2), 10);
const requestUrl = pm.request.url.toString();
const isPatientListGet = pm.request.method === 'GET'
    && /\/(admin|doctor)\/patients(\?|$)/.test(requestUrl)
    && !/\/patients\/\d+/.test(requestUrl);
const thresholdMs = isPatientListGet ? listMaxMs : maxMs;

pm.test('Response time is below threshold', function () {
    pm.expect(pm.response.responseTime).to.be.below(thresholdMs);
});

// tv4 mini schema validator (Postman sandbox includes tv4)
function validateSchema(schema, data, label) {
    if (!schema || typeof tv4 === 'undefined') return;
    const valid = tv4.validate(data, schema);
    if (!valid) {
        console.error(label + ' schema error:', tv4.error);
    }
    pm.test(label + ' matches schema', function () {
        pm.expect(valid, JSON.stringify(tv4.error)).to.be.true;
    });
}

function assertRequiredFields(obj, fields, label) {
    pm.test(label + ' - required fields present', function () {
        fields.forEach(f => {
            pm.expect(obj).to.have.property(f);
            if (obj[f] !== undefined && obj[f] !== null) {
                pm.expect(obj[f]).to.not.equal(null);
            }
        });
    });
}

function onTestFail() {
    pm.environment.set('skip_dependent_tests', 'true');
    console.error('Test failed - dependent tests may be skipped. Request:', pm.info.requestName);
    try {
        console.error('Response:', pm.response.code, pm.response.text().substring(0, 500));
    } catch (e) { }
}

// Export helpers to globals for request scripts
pm.globals.set('__assertRequiredFields', assertRequiredFields.toString());
pm.globals.set('__validateSchema', validateSchema.toString());
pm.globals.set('__onTestFail', onTestFail.toString());

// Schemas from collection variables
const schemas = {
    auth: pm.collectionVariables.get('schema_auth_response'),
    error: pm.collectionVariables.get('schema_error_response'),
    patient: pm.collectionVariables.get('schema_patient_response'),
    appointment: pm.collectionVariables.get('schema_appointment_response')
};

pm.collectionVariables.set('__schemas_loaded', 'true');
