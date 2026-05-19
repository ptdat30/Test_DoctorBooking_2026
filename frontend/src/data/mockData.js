// Mock data cho hệ thống Doctor Booking

export const mockDoctors = [
  {
    id: 1,
    name: 'BS. Nguyễn Văn Hùng',
    specialty: 'Tim mạch',
    hospital: 'Bệnh viện Bạch Mai',
    experience: 15,
    rating: 4.9,
    reviews: 234,
    consultations: 1200,
    price: 500000,
    avatar: '',
    badges: ['Siêu thân thiện', 'Phản hồi nhanh'],
    telemedicine: true,
    availableToday: true,
    description: 'Chuyên gia tim mạch với hơn 15 năm kinh nghiệm, chuyên điều trị các bệnh về tim mạch, huyết áp cao.',
    education: 'Tiến sĩ Y khoa - Đại học Y Hà Nội',
    languages: ['Tiếng Việt', 'Tiếng Anh']
  },
  {
    id: 2,
    name: 'BS. Trần Thị Lan',
    specialty: 'Nhi khoa',
    hospital: 'Bệnh viện Nhi Trung ương',
    experience: 12,
    rating: 4.8,
    reviews: 189,
    consultations: 980,
    price: 400000,
    avatar: '',
    badges: ['Chuyên gia tận tâm', 'Phản hồi nhanh'],
    telemedicine: true,
    availableToday: true,
    description: 'Bác sĩ nhi khoa giàu kinh nghiệm, chuyên điều trị các bệnh thường gặp ở trẻ em.',
    education: 'Thạc sĩ Nhi khoa - Đại học Y Hà Nội',
    languages: ['Tiếng Việt']
  },
  {
    id: 3,
    name: 'BS. Lê Minh Tuấn',
    specialty: 'Tiêu hóa',
    hospital: 'Bệnh viện Đại học Y Hà Nội',
    experience: 10,
    rating: 4.7,
    reviews: 156,
    consultations: 750,
    price: 450000,
    avatar: '',
    badges: ['Siêu thân thiện'],
    telemedicine: false,
    availableToday: false,
    description: 'Chuyên gia tiêu hóa, điều trị các bệnh về dạ dày, ruột, gan mật.',
    education: 'Bác sĩ Chuyên khoa II - Đại học Y Hà Nội',
    languages: ['Tiếng Việt', 'Tiếng Anh']
  },
  {
    id: 4,
    name: 'BS. Phạm Thị Hoa',
    specialty: 'Sản phụ khoa',
    hospital: 'Bệnh viện Phụ sản Trung ương',
    experience: 18,
    rating: 4.9,
    reviews: 312,
    consultations: 1500,
    price: 600000,
    avatar: '',
    badges: ['Chuyên gia tận tâm', 'Phản hồi nhanh', 'Siêu thân thiện'],
    telemedicine: true,
    availableToday: true,
    description: 'Bác sĩ sản phụ khoa hàng đầu, chuyên chăm sóc thai sản và phụ khoa.',
    education: 'Tiến sĩ Sản phụ khoa - Đại học Y Hà Nội',
    languages: ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Pháp']
  },
  {
    id: 5,
    name: 'BS. Hoàng Văn Đức',
    specialty: 'Tâm thần',
    hospital: 'Bệnh viện Tâm thần Trung ương',
    experience: 14,
    rating: 4.8,
    reviews: 278,
    consultations: 1100,
    price: 550000,
    avatar: '',
    badges: ['Chuyên gia tận tâm'],
    telemedicine: true,
    availableToday: true,
    description: 'Chuyên gia tâm lý và tâm thần, hỗ trợ điều trị các vấn đề về tâm lý, stress, trầm cảm.',
    education: 'Thạc sĩ Tâm thần học - Đại học Y Hà Nội',
    languages: ['Tiếng Việt', 'Tiếng Anh']
  },
  {
    id: 6,
    name: 'BS. Vũ Thị Mai',
    specialty: 'Da liễu',
    hospital: 'Bệnh viện Da liễu Trung ương',
    experience: 11,
    rating: 4.6,
    reviews: 145,
    consultations: 680,
    price: 420000,
    avatar: '',
    badges: ['Phản hồi nhanh'],
    telemedicine: true,
    availableToday: false,
    description: 'Chuyên gia da liễu, điều trị các bệnh về da, tóc, móng.',
    education: 'Bác sĩ Chuyên khoa I - Đại học Y Hà Nội',
    languages: ['Tiếng Việt']
  },
  {
    id: 7,
    name: 'BS. Đỗ Văn Nam',
    specialty: 'Xương khớp',
    hospital: 'Bệnh viện Chấn thương Chỉnh hình',
    experience: 16,
    rating: 4.7,
    reviews: 201,
    consultations: 920,
    price: 480000,
    avatar: '',
    badges: ['Siêu thân thiện', 'Phản hồi nhanh'],
    telemedicine: false,
    availableToday: true,
    description: 'Chuyên gia xương khớp, điều trị các bệnh về cơ xương khớp, đau lưng, đau cổ.',
    education: 'Bác sĩ Chuyên khoa II - Đại học Y Hà Nội',
    languages: ['Tiếng Việt', 'Tiếng Anh']
  },
  {
    id: 8,
    name: 'BS. Nguyễn Thị Hương',
    specialty: 'Mắt',
    hospital: 'Bệnh viện Mắt Trung ương',
    experience: 13,
    rating: 4.8,
    reviews: 167,
    consultations: 850,
    price: 460000,
    avatar: '',
    badges: ['Chuyên gia tận tâm'],
    telemedicine: false,
    availableToday: true,
    description: 'Bác sĩ nhãn khoa, chuyên điều trị các bệnh về mắt, cận thị, viễn thị.',
    education: 'Thạc sĩ Nhãn khoa - Đại học Y Hà Nội',
    languages: ['Tiếng Việt', 'Tiếng Anh']
  }
];

export const mockSpecialties = [
  { id: 1, name: 'Tim mạch', icon: '❤️', description: 'Điều trị các bệnh về tim và mạch máu', doctorCount: 45 },
  { id: 2, name: 'Nhi khoa', icon: '👶', description: 'Chăm sóc sức khỏe trẻ em', doctorCount: 38 },
  { id: 3, name: 'Tiêu hóa', icon: '🫀', description: 'Điều trị các bệnh về đường tiêu hóa', doctorCount: 32 },
  { id: 4, name: 'Sản phụ khoa', icon: '🤰', description: 'Chăm sóc thai sản và phụ khoa', doctorCount: 42 },
  { id: 5, name: 'Tâm thần', icon: '🧠', description: 'Điều trị các vấn đề tâm lý và tâm thần', doctorCount: 28 },
  { id: 6, name: 'Da liễu', icon: '', description: 'Điều trị các bệnh về da', doctorCount: 25 },
  { id: 7, name: 'Xương khớp', icon: '🦴', description: 'Điều trị các bệnh về cơ xương khớp', doctorCount: 35 },
  { id: 8, name: 'Mắt', icon: '👁️', description: 'Điều trị các bệnh về mắt', doctorCount: 30 },
  { id: 9, name: 'Tai mũi họng', icon: '👂', description: 'Điều trị các bệnh về tai mũi họng', doctorCount: 27 },
  { id: 10, name: 'Thần kinh', icon: '🧬', description: 'Điều trị các bệnh về thần kinh', doctorCount: 33 },
  { id: 11, name: 'Nội tiết', icon: '⚕️', description: 'Điều trị các bệnh về nội tiết', doctorCount: 29 },
  { id: 12, name: 'Ung bướu', icon: '🔬', description: 'Điều trị và phòng ngừa ung thư', doctorCount: 22 }
];

export const mockSymptoms = [
  { id: 1, name: 'Đau đầu', category: 'Thần kinh', specialty: 'Thần kinh', severity: 'medium' },
  { id: 2, name: 'Sốt', category: 'Tổng quát', specialty: 'Nhi khoa', severity: 'high' },
  { id: 3, name: 'Đau bụng', category: 'Tiêu hóa', specialty: 'Tiêu hóa', severity: 'medium' },
  { id: 4, name: 'Ho', category: 'Hô hấp', specialty: 'Tai mũi họng', severity: 'low' },
  { id: 5, name: 'Đau ngực', category: 'Tim mạch', specialty: 'Tim mạch', severity: 'high' },
  { id: 6, name: 'Khó thở', category: 'Hô hấp', specialty: 'Tim mạch', severity: 'high' },
  { id: 7, name: 'Đau lưng', category: 'Xương khớp', specialty: 'Xương khớp', severity: 'medium' },
  { id: 8, name: 'Mệt mỏi', category: 'Tổng quát', specialty: 'Nội tiết', severity: 'low' },
  { id: 9, name: 'Chóng mặt', category: 'Thần kinh', specialty: 'Thần kinh', severity: 'medium' },
  { id: 10, name: 'Buồn nôn', category: 'Tiêu hóa', specialty: 'Tiêu hóa', severity: 'medium' },
  { id: 11, name: 'Đau khớp', category: 'Xương khớp', specialty: 'Xương khớp', severity: 'medium' },
  { id: 12, name: 'Mất ngủ', category: 'Tâm thần', specialty: 'Tâm thần', severity: 'low' },
  { id: 13, name: 'Lo âu', category: 'Tâm thần', specialty: 'Tâm thần', severity: 'medium' },
  { id: 14, name: 'Phát ban', category: 'Da liễu', specialty: 'Da liễu', severity: 'low' },
  { id: 15, name: 'Đau mắt', category: 'Mắt', specialty: 'Mắt', severity: 'medium' },
  { id: 16, name: 'Đau họng', category: 'Hô hấp', specialty: 'Tai mũi họng', severity: 'low' },
  { id: 17, name: 'Đau răng', category: 'Răng hàm mặt', specialty: 'Răng hàm mặt', severity: 'medium' },
  { id: 18, name: 'Tăng huyết áp', category: 'Tim mạch', specialty: 'Tim mạch', severity: 'high' },
  { id: 19, name: 'Tiểu đường', category: 'Nội tiết', specialty: 'Nội tiết', severity: 'high' },
  { id: 20, name: 'Đau bụng kinh', category: 'Phụ khoa', specialty: 'Sản phụ khoa', severity: 'medium' }
];

export const mockHospitals = [
  { id: 1, name: 'Bệnh viện Bạch Mai', address: '78 Giải Phóng, Hà Nội', rating: 4.8 },
  { id: 2, name: 'Bệnh viện Nhi Trung ương', address: '18/879 La Thành, Hà Nội', rating: 4.7 },
  { id: 3, name: 'Bệnh viện Đại học Y Hà Nội', address: '1 Tôn Thất Tùng, Hà Nội', rating: 4.6 },
  { id: 4, name: 'Bệnh viện Phụ sản Trung ương', address: '43 Tràng Thi, Hà Nội', rating: 4.8 },
  { id: 5, name: 'Bệnh viện Tâm thần Trung ương', address: '78 Giải Phóng, Hà Nội', rating: 4.5 },
  { id: 6, name: 'Bệnh viện Da liễu Trung ương', address: '15A Phương Mai, Hà Nội', rating: 4.6 },
  { id: 7, name: 'Bệnh viện Chấn thương Chỉnh hình', address: '929 Đường Láng, Hà Nội', rating: 4.7 },
  { id: 8, name: 'Bệnh viện Mắt Trung ương', address: '85 Bà Triệu, Hà Nội', rating: 4.8 }
];

// Hàm tìm kiếm bác sĩ
export const searchDoctors = (query, filters = {}) => {
  let results = [...mockDoctors];

  // Lọc theo query
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(doctor =>
      doctor.name.toLowerCase().includes(lowerQuery) ||
      doctor.specialty.toLowerCase().includes(lowerQuery) ||
      doctor.hospital.toLowerCase().includes(lowerQuery)
    );
  }

  // Lọc theo chuyên khoa
  if (filters.specialty) {
    results = results.filter(doctor => doctor.specialty === filters.specialty);
  }

  // Lọc theo telemedicine
  if (filters.telemedicine) {
    results = results.filter(doctor => doctor.telemedicine === true);
  }

  // Sắp xếp theo rating
  results.sort((a, b) => b.rating - a.rating);

  return results;
};

// Hàm tìm kiếm theo triệu chứng
export const searchBySymptom = (symptomName) => {
  const symptom = mockSymptoms.find(s =>
    s.name.toLowerCase().includes(symptomName.toLowerCase())
  );

  if (!symptom) {
    return { specialty: 'Tổng quát', doctors: searchDoctors('', { specialty: 'Tổng quát' }) };
  }

  const doctors = searchDoctors('', { specialty: symptom.specialty });
  return {
    symptom: symptom.name,
    specialty: symptom.specialty,
    severity: symptom.severity,
    doctors: doctors
  };
};

// Hàm tìm kiếm chuyên khoa
export const searchSpecialties = (query) => {
  if (!query) return mockSpecialties;
  
  const lowerQuery = query.toLowerCase();
  return mockSpecialties.filter(specialty =>
    specialty.name.toLowerCase().includes(lowerQuery) ||
    specialty.description.toLowerCase().includes(lowerQuery)
  );
};

// Hàm tìm kiếm triệu chứng
export const searchSymptoms = (query) => {
  if (!query) return mockSymptoms.slice(0, 10); // Trả về 10 triệu chứng phổ biến
  
  const lowerQuery = query.toLowerCase();
  return mockSymptoms.filter(symptom =>
    symptom.name.toLowerCase().includes(lowerQuery) ||
    symptom.category.toLowerCase().includes(lowerQuery)
  );
};

// Lấy bác sĩ theo ID
export const getDoctorById = (id) => {
  return mockDoctors.find(doctor => doctor.id === parseInt(id));
};

// Lấy chuyên khoa theo ID
export const getSpecialtyById = (id) => {
  return mockSpecialties.find(specialty => specialty.id === parseInt(id));
};

