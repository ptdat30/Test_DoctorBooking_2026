import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const bookingErrors = new Counter('booking_errors');
const bookingLatency = new Trend('booking_latency');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USER = __ENV.TEST_USERNAME || 'patient1';
const PASSWORD = __ENV.TEST_PASSWORD || 'password123';
const DOCTOR_ID = Number(__ENV.DOCTOR_ID || 1);
const TARGET_PATH = __ENV.TARGET_PATH || '/api/appointments/book';
const APPOINTMENT_DAYS_AHEAD = Number(__ENV.APPOINTMENT_DAYS_AHEAD || 10000);
const VALID_APPOINTMENT_SLOTS = [
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
  '17:00',
];

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '3m', target: 500 },
  ],
  setupTimeout: '2m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>0'],
  },
};

function getToken() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: USER,
    password: PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed: ${loginRes.status} ${loginRes.body}`);
  }

  const body = loginRes.json();
  return body.token;
}

function randomFutureDate(daysAhead) {
  const base = new Date();
  const offset = Math.floor(Math.random() * daysAhead) + 1;
  base.setDate(base.getDate() + offset);
  return base.toISOString().split('T')[0];
}

function randomAppointment() {
  return {
    appointmentDate: randomFutureDate(APPOINTMENT_DAYS_AHEAD),
    appointmentTime: VALID_APPOINTMENT_SLOTS[Math.floor(Math.random() * VALID_APPOINTMENT_SLOTS.length)],
  };
}

export function setup() {
  return { token: getToken() };
}

export default function (data) {
  const token = data.token || getToken();
  const appointment = randomAppointment();
  const payload = {
    doctorId: DOCTOR_ID,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    notes: `k6 load test ${__ITER}`,
    paymentMethod: 'CASH',
    familyMemberId: null,
  };

  const res = http.post(`${BASE_URL}${TARGET_PATH}`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    tags: { name: 'book_appointment' },
  });

  bookingLatency.add(res.timings.duration);
  if (res.status >= 400) {
    bookingErrors.add(1);
  }

  const body = res && res.body ? res.json() : null;
  const appointmentId = body && (body.id || (body.appointment && body.appointment.id));

  check(res, {
    'booking status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'booking returned appointment id': (r) => !!appointmentId,
  });

  sleep(1);
}
