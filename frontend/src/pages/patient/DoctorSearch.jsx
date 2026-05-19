import { useEffect, useState } from 'react';
import { Search, Eye, Calendar, User, Clock } from 'lucide-react';
import PatientLayout from '../../components/patient/PatientLayout';
import { patientService } from '../../services/patientService';
import DoctorDetail from '../../components/patient/DoctorDetail';
import '../../pages/admin/AdminPages.css'; // Reuse admin table styles

// Symptom to specialty mapping
const symptomToSpecialty = {
  'headache': 'Neurologist',
  'back pain': 'Orthopedist',
  'chest pain': 'Cardiologist',
  'fever': 'General Practitioner',
  'cough': 'Pulmonologist',
  'stomach': 'Gastroenterologist',
  'skin': 'Dermatologist',
  'eye': 'Ophthalmologist',
  'ear': 'ENT Specialist',
  'mental': 'Psychiatrist'
};

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedSpecialties, setSuggestedSpecialties] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDoctors(doctors);
      setSuggestedSpecialties([]);
      setCurrentPage(1);
      return;
    }

    // Analyze symptoms and suggest specialties
    const lowerSearch = searchTerm.toLowerCase();
    const suggestions = [];

    Object.keys(symptomToSpecialty).forEach(symptom => {
      if (lowerSearch.includes(symptom)) {
        suggestions.push(symptomToSpecialty[symptom]);
      }
    });

    setSuggestedSpecialties([...new Set(suggestions)]);

    // Filter doctors
    const filtered = doctors.filter(doctor => {
      const searchLower = searchTerm.toLowerCase();
      return (
        doctor.fullName?.toLowerCase().includes(searchLower) ||
        doctor.specialization?.toLowerCase().includes(searchLower) ||
        doctor.qualification?.toLowerCase().includes(searchLower)
      );
    });

    // Calculate match scores
    const doctorsWithScores = filtered.map(doctor => {
      let score = 50;
      if (suggestions.length > 0 &&
        doctor.specialization &&
        suggestions.some(s => doctor.specialization.includes(s))) {
        score += 30;
      }
      if (doctor.experience > 10) score += 10;
      if (doctor.experience > 5) score += 5;
      if (doctor.rating > 4.5) score += 8;
      else if (doctor.rating > 4) score += 5;
      if (doctor.nextAvailableSlot) score += 2;

      return { ...doctor, matchScore: Math.min(100, score) };
    });

    doctorsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    setFilteredDoctors(doctorsWithScores);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, doctors]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await patientService.searchDoctors('');

      // Enhance doctors with mock data
      const enhanced = data.map((doctor, index) => ({
        ...doctor,
        matchScore: 85 + Math.floor(Math.random() * 15),
        rating: doctor.rating || (4 + Math.random() * 1),
        nextAvailableSlot: index % 3 === 0 ? 'Today at 14:00' :
          index % 3 === 1 ? 'Tomorrow at 10:00' : 'Available Now',
        isAvailable: index % 4 !== 0,
        price: 200000 + Math.floor(Math.random() * 300000)
      }));

      setDoctors(enhanced);
      setFilteredDoctors(enhanced);
      setError('');
    } catch (err) {
      setError('Failed to load doctors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const doctor = await patientService.getDoctorById(id);
      setSelectedDoctor(doctor);
    } catch (err) {
      setError('Failed to load doctor details');
      console.error(err);
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <PatientLayout>
      <div className="admin-main">
        <div className="main-content">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Danh sách Bác sĩ</h1>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, chuyên khoa, triệu chứng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              {suggestedSpecialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 flex items-center mr-2">Gợi ý chuyên khoa:</span>
                  {suggestedSpecialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Doctors Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bác sĩ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chuyên khoa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lịch trống</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        <div className="flex justify-center items-center h-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                        </div>
                      </td>
                    </tr>
                  ) : currentDoctors.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        Không tìm thấy bác sĩ nào
                      </td>
                    </tr>
                  ) : (
                    currentDoctors.map((doctor, index) => (
                      <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {indexOfFirstItem + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold border border-gray-300">
                              {doctor.fullName?.charAt(0) || 'D'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{doctor.fullName}</div>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <span className="text-yellow-500 mr-1">★</span> 
                                {doctor.rating?.toFixed(1) || '4.5'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.specialization || 'Đa khoa'}</div>
                          <div className="text-sm text-gray-500">{doctor.qualification || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.experience || 5}+ năm KN</div>
                          <div className="text-sm text-gray-500">{(doctor.price / 1000).toFixed(0)}k VND/Lượt</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doctor.isAvailable ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                              {doctor.nextAvailableSlot}
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                              Kín lịch
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewDetails(doctor.id)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="Xem hồ sơ"
                            >
                              <User className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleViewDetails(doctor.id)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Đặt lịch"
                            >
                              <Calendar className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> -{' '}
                  <span className="font-medium">{Math.min(indexOfLastItem, filteredDoctors.length)}</span> của{' '}
                  <span className="font-medium">{filteredDoctors.length}</span> bác sĩ
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded border text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Trước
                  </button>
                  
                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => paginate(idx + 1)}
                      className={`px-3 py-1 rounded border text-sm ${
                        currentPage === idx + 1
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded border text-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Doctor Detail Modal */}
      {selectedDoctor && (
        <DoctorDetail
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
        />
      )}
    </PatientLayout>
  );
};

export default DoctorSearch;