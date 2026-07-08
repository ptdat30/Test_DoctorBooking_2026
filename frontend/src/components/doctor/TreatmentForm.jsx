import { useState, useEffect } from 'react';
import { doctorService } from '../../services/doctorService';
import MedicationSearch from './MedicationSearch';
import PrescriptionTemplate from './PrescriptionTemplate';
import { formatDate } from '../../utils/formatDate';
import { formatTime } from '../../utils/formatTime';
import {
  Modal,
  BtnPrimary,
  BtnSecondary,
  FormField,
  Input,
  Select,
  Textarea,
  AlertError,
} from '../shell/DashboardPrimitives';

const TreatmentForm = ({ treatment, appointment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    appointmentId: null,
    patientId: null,
    diagnosis: '',
    diagnosisCode: '',
    prescription: '',
    treatmentNotes: '',
    followUpDate: '',
    advice: '',
    pharmacyInstructions: ''
  });
  const [medications, setMedications] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);

  useEffect(() => {
    loadPatients();
    loadDoctorInfo();
    if (treatment) {
      // Edit existing treatment
      setFormData({
        appointmentId: treatment.appointmentId || null,
        patientId: treatment.patientId,
        diagnosis: treatment.diagnosis || '',
        diagnosisCode: treatment.diagnosisCode || '',
        prescription: treatment.prescription || '',
        treatmentNotes: treatment.treatmentNotes || '',
        followUpDate: treatment.followUpDate || '',
        advice: treatment.advice || '',
        pharmacyInstructions: treatment.pharmacyInstructions || ''
      });
      if (treatment.medications) {
        // Map medications to ensure both name and medicationName are set
        // Parse commonDosages and commonFrequencies if they exist (from medication selection)
        const mappedMeds = treatment.medications.map(med => {
          let commonDosages = [];
          let commonFrequencies = [];
          
          // Parse if they exist (when medication was selected from search)
          if (med.commonDosages) {
            try {
              if (typeof med.commonDosages === 'string') {
                commonDosages = JSON.parse(med.commonDosages || '[]');
              } else if (Array.isArray(med.commonDosages)) {
                commonDosages = med.commonDosages;
              }
            } catch (e) {
              commonDosages = [];
            }
          }
          
          if (med.commonFrequencies) {
            try {
              if (typeof med.commonFrequencies === 'string') {
                commonFrequencies = JSON.parse(med.commonFrequencies || '[]');
              } else if (Array.isArray(med.commonFrequencies)) {
                commonFrequencies = med.commonFrequencies;
              }
            } catch (e) {
              commonFrequencies = [];
            }
          }
          
          return {
            ...med,
            name: med.medicationName || med.name,
            medicationName: med.medicationName || med.name,
            commonDosages: commonDosages,
            commonFrequencies: commonFrequencies
          };
        });
        setMedications(mappedMeds);
      }
    } else if (appointment) {
      // Create treatment from appointment
      setFormData({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        diagnosis: '',
        diagnosisCode: '',
        prescription: '',
        treatmentNotes: '',
        followUpDate: '',
        advice: '',
        pharmacyInstructions: ''
      });
      loadPatientInfo(appointment.patientId);
    }
  }, [treatment, appointment]);

  const loadPatients = async () => {
    try {
      const data = await doctorService.searchPatients('');
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  };

  const loadPatientInfo = async (patientId) => {
    try {
      const data = await doctorService.getPatientById(patientId);
      setPatientInfo(data);
    } catch (err) {
      console.error('Failed to load patient info:', err);
    }
  };

  const loadDoctorInfo = async () => {
    try {
      const data = await doctorService.getProfile();
      setDoctorInfo(data);
    } catch (err) {
      console.error('Failed to load doctor info:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddMedication = (medication) => {
    setMedications([...medications, medication]);
  };

  const handleRemoveMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedMeds = medications.map((m, idx) => ({
      medicationId: m.medicationId || m.id || null,
      medicationName: m.medicationName || m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      quantity: m.quantity,
      unit: m.unit,
      instructions: m.instructions,
      price: m.price,
      orderIndex: m.orderIndex ?? idx,
    }));

    try {
      if (treatment) {
        await doctorService.updateTreatment(treatment.id, {
          ...formData,
          medications: normalizedMeds
        });
      } else {
        if (!formData.patientId) {
          setError('Vui lòng chọn bệnh nhân');
          setLoading(false);
          return;
        }
        const treatmentData = {
          ...formData,
          medications: normalizedMeds,
          patientId: parseInt(formData.patientId),
          appointmentId: formData.appointmentId ? parseInt(formData.appointmentId) : null,
        };
        await doctorService.createTreatment(treatmentData);
        
        // TODO: Send email with prescription template
        // This will be implemented when backend is ready
        console.log('📧 Would send prescription email to:', patientInfo?.email);
        console.log('📄 Prescription data:', {
          patient: patientInfo,
          doctor: doctorInfo,
          prescription: {
            ...formData,
            medications,
            date: new Date().toISOString(),
            prescriptionNumber: `BN${Date.now()}`
          }
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu thông tin điều trị');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={treatment ? 'Chỉnh sửa điều trị' : 'Thêm điều trị mới'}
      footer={
        <>
          <BtnSecondary type="button" onClick={onClose}>Hủy</BtnSecondary>
          <BtnPrimary type="submit" form="treatment-form" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu điều trị'}
          </BtnPrimary>
        </>
      }
    >
      {error && <AlertError message={error} />}

      <form id="treatment-form" onSubmit={handleSubmit} className="space-y-6">
        {appointment && (
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 text-sm space-y-1">
            <p><span className="text-neutral-500">Bệnh nhân:</span> <strong>{appointment.patientName}</strong></p>
            <p><span className="text-neutral-500">Ngày:</span> {formatDate(appointment.appointmentDate)}</p>
            <p><span className="text-neutral-500">Giờ:</span> {formatTime(appointment.appointmentTime)}</p>
          </div>
        )}

        {!treatment && !appointment && (
          <FormField label="Bệnh nhân" required>
            <Select name="patientId" value={formData.patientId || ''} onChange={handleChange} required>
              <option value="">Chọn bệnh nhân</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.fullName} ({patient.email})</option>
              ))}
            </Select>
          </FormField>
        )}

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">Chẩn đoán</h3>
          <FormField label="Mã chẩn đoán">
            <Input name="diagnosisCode" value={formData.diagnosisCode} onChange={handleChange} placeholder="VD: J02" />
          </FormField>
          <FormField label="Chẩn đoán">
            <Textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange} rows={3} placeholder="Nhập chẩn đoán..." />
          </FormField>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">Kê đơn thuốc</h3>
          <MedicationSearch onSelectMedication={handleAddMedication} selectedMedications={medications} />
          {medications.length > 0 && (
            <div className="space-y-3">
              {medications.map((med, index) => (
                <div key={index} className="p-4 rounded-xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">Thuốc {index + 1}</span>
                    <button type="button" onClick={() => handleRemoveMedication(index)} className="text-xs text-rose-600 hover:text-rose-700 font-medium">Xóa</button>
                  </div>
                  <FormField label="Tên thuốc" required>
                    <Input
                      value={med.medicationName || med.name || ''}
                      onChange={(e) => {
                        handleMedicationChange(index, 'medicationName', e.target.value);
                        handleMedicationChange(index, 'name', e.target.value);
                      }}
                      required
                    />
                  </FormField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Liều dùng" required>
                      {med.commonDosages?.length > 0 && (
                        <Select value="" onChange={(e) => e.target.value && handleMedicationChange(index, 'dosage', e.target.value)} className="mb-2">
                          <option value="">Chọn liều dùng...</option>
                          {med.commonDosages.map((dose, idx) => <option key={idx} value={dose}>{dose}</option>)}
                        </Select>
                      )}
                      <Input value={med.dosage || ''} onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)} required />
                    </FormField>
                    <FormField label="Tần suất">
                      {med.commonFrequencies?.length > 0 && (
                        <Select value="" onChange={(e) => e.target.value && handleMedicationChange(index, 'frequency', e.target.value)} className="mb-2">
                          <option value="">Chọn tần suất...</option>
                          {med.commonFrequencies.map((freq, idx) => <option key={idx} value={freq}>{freq}</option>)}
                        </Select>
                      )}
                      <Input value={med.frequency || ''} onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)} />
                    </FormField>
                  </div>
                  <FormField label="Số lượng">
                    <div className="flex gap-2">
                      <Input type="number" value={med.quantity} onChange={(e) => handleMedicationChange(index, 'quantity', parseInt(e.target.value) || 0)} min={0} className="flex-1" />
                      <Select value={med.unit || 'viên'} onChange={(e) => handleMedicationChange(index, 'unit', e.target.value)} className="w-28">
                        <option value="viên">Viên</option>
                        <option value="gói">Gói</option>
                        <option value="chai">Chai</option>
                        <option value="tuýp">Tuýp</option>
                      </Select>
                    </div>
                  </FormField>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">Ghi chú điều trị</h3>
          <Textarea name="treatmentNotes" value={formData.treatmentNotes} onChange={handleChange} rows={4} placeholder="Nhập ghi chú..." />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Ngày tái khám">
            <Input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} />
          </FormField>
          <FormField label="Lời dặn">
            <Textarea name="advice" value={formData.advice} onChange={handleChange} rows={2} placeholder="VD: Ăn nóng, uống sôi" />
          </FormField>
        </section>

        {medications.length > 0 && (
          <>
            <BtnSecondary type="button" onClick={() => setShowPrescriptionPreview(!showPrescriptionPreview)} className="w-full sm:w-auto">
              {showPrescriptionPreview ? 'Ẩn' : 'Xem'} mẫu đơn thuốc
            </BtnSecondary>
            {showPrescriptionPreview && (
              <div className="rounded-xl border border-neutral-200 p-4 overflow-x-auto">
                <PrescriptionTemplate
                  prescriptionData={{ ...formData, medications, date: new Date().toISOString(), prescriptionNumber: `BN${Date.now()}` }}
                  patientData={patientInfo || appointment}
                  doctorData={doctorInfo}
                />
              </div>
            )}
          </>
        )}
      </form>
    </Modal>
  );
};

export default TreatmentForm;
