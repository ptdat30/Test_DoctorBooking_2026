// Collection-level pre-request script (embedded in Postman collection)
if (pm.environment.get('skip_dependent_tests') === 'true') {
    const skipFolders = ['22_E2E_Flows', '99_Skip_Notice'];
    const folderName = pm.info.requestName || '';
    if (!skipFolders.some(f => (pm.request && pm.request.url && pm.request.url.toString().includes('setup')))) {
        // Allow setup/auth to reset skip flag
    }
}

// Dynamic test data
const ts = Date.now();
pm.environment.set('random_email', `autotest_${ts}@test.local`);
pm.environment.set('random_username', `autotest_${ts}`);
pm.environment.set('random_string', `str_${ts}`);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const y = tomorrow.getFullYear();
const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
const d = String(tomorrow.getDate()).padStart(2, '0');
pm.environment.set('tomorrow_date', `${y}-${m}-${d}`);

if (!pm.environment.get('slot_time')) {
    pm.environment.set('slot_time', '09:00:00');
}

// Role-based auth_token from folder variable or current_role
const currentRole = pm.variables.get('current_role') || pm.environment.get('current_role') || 'PATIENT';
pm.environment.set('current_role', currentRole);

const roleTokenMap = {
    PATIENT: 'patient_token',
    DOCTOR: 'doctor_token',
    ADMIN: 'admin_token'
};
const tokenKey = roleTokenMap[currentRole] || 'patient_token';
const activeToken = pm.environment.get(tokenKey);
if (activeToken && pm.variables.get('use_auth') !== 'false') {
    pm.environment.set('auth_token', activeToken);
}

// Helper: set auth header if use_auth not false
if (pm.variables.get('use_auth') !== 'false' && pm.environment.get('auth_token')) {
    pm.request.headers.upsert({ key: 'Authorization', value: 'Bearer ' + pm.environment.get('auth_token') });
}
