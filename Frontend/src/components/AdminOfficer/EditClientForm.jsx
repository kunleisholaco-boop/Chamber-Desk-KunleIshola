import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Building, Calendar, Briefcase, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import API_BASE_URL from '../../../config/api';

const EditClientForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [clientType, setClientType] = useState('Individual');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        // Individual fields
        fullName: '',
        gender: '',
        dateOfBirth: '',
        nationality: '',
        occupation: '',
        phone: '',
        email: '',
        address: '',
        emergencyContactName: '',
        emergencyContactRelationship: '',
        emergencyContactPhone: '',

        // Corporate fields
        companyName: '',
        rcNumber: '',
        contactPerson: '',
        companyAddress: '',
        corporatePrimaryContactName: '',
        corporatePrimaryContactDesignation: '',
        corporatePrimaryContactPhone: '',
        corporatePrimaryContactEmail: '',
        corporateSecondaryContactName: '',
        corporateSecondaryContactDesignation: '',
        corporateSecondaryContactPhone: '',
        corporateSecondaryContactEmail: '',

        // Government Agency fields
        agencyName: '',
        agencyType: '',
        ministry: '',
        agencyAddress: '',
        officialEmail: '',
        officialPhone: '',
        primaryContactName: '',
        primaryContactDesignation: '',
        primaryContactPhone: '',
        primaryContactEmail: '',
        secondaryContactName: '',
        secondaryContactDesignation: '',
        secondaryContactPhone: '',
        secondaryContactEmail: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchClientDetails();
    }, [id]);

    const fetchClientDetails = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                const data = await response.json();
                setClientType(data.clientType);
                populateForm(data);
            } else {
                setMessage({ type: 'error', text: 'Failed to fetch client details' });
            }
        } catch (err) {
            console.error('Error fetching client details:', err);
            setMessage({ type: 'error', text: 'Error fetching client details' });
        } finally {
            setIsLoading(false);
        }
    };

    const populateForm = (data) => {
        const newFormData = { ...formData };

        if (data.clientType === 'Individual') {
            // Individual client fields
            newFormData.fullName = data.name || '';
            newFormData.gender = data.gender || '';
            newFormData.dateOfBirth = data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '';
            newFormData.nationality = data.nationality || '';
            newFormData.occupation = data.occupation || '';
            newFormData.phone = data.phone || '';
            newFormData.email = data.email || '';
            newFormData.address = data.address || '';
            if (data.emergencyContact) {
                newFormData.emergencyContactName = data.emergencyContact.name || '';
                newFormData.emergencyContactRelationship = data.emergencyContact.relationship || '';
                newFormData.emergencyContactPhone = data.emergencyContact.phone || '';
            }
        } else if (data.clientType === 'Corporate Organization') {
            // Corporate client fields
            newFormData.companyName = data.name || '';
            newFormData.rcNumber = data.rcNumber || '';
            newFormData.companyAddress = data.address || '';
            newFormData.phone = data.phone || '';
            newFormData.email = data.email || '';
            if (data.primaryContact) {
                newFormData.corporatePrimaryContactName = data.primaryContact.name || '';
                newFormData.corporatePrimaryContactDesignation = data.primaryContact.designation || '';
                newFormData.corporatePrimaryContactPhone = data.primaryContact.phone || '';
                newFormData.corporatePrimaryContactEmail = data.primaryContact.email || '';
            }
            if (data.secondaryContact) {
                newFormData.corporateSecondaryContactName = data.secondaryContact.name || '';
                newFormData.corporateSecondaryContactDesignation = data.secondaryContact.designation || '';
                newFormData.corporateSecondaryContactPhone = data.secondaryContact.phone || '';
                newFormData.corporateSecondaryContactEmail = data.secondaryContact.email || '';
            }
        } else if (data.clientType === 'Government Agency') {
            // Government agency fields
            newFormData.agencyName = data.name || '';
            newFormData.agencyType = data.agencyType || '';
            newFormData.ministry = data.ministry || '';
            newFormData.agencyAddress = data.address || '';
            newFormData.officialEmail = data.email || '';
            newFormData.officialPhone = data.phone || '';
            if (data.primaryContact) {
                newFormData.primaryContactName = data.primaryContact.name || '';
                newFormData.primaryContactDesignation = data.primaryContact.designation || '';
                newFormData.primaryContactPhone = data.primaryContact.phone || '';
                newFormData.primaryContactEmail = data.primaryContact.email || '';
            }
            if (data.secondaryContact) {
                newFormData.secondaryContactName = data.secondaryContact.name || '';
                newFormData.secondaryContactDesignation = data.secondaryContact.designation || '';
                newFormData.secondaryContactPhone = data.secondaryContact.phone || '';
                newFormData.secondaryContactEmail = data.secondaryContact.email || '';
            }
        }

        setFormData(newFormData);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');

            // Prepare data based on client type
            let clientData = {
                clientType
            };

            if (clientType === 'Individual') {
                clientData.name = formData.fullName;
                clientData.gender = formData.gender;
                clientData.dateOfBirth = formData.dateOfBirth;
                clientData.nationality = formData.nationality;
                clientData.occupation = formData.occupation;
                clientData.phone = formData.phone;
                clientData.email = formData.email;
                clientData.address = formData.address;
                clientData.emergencyContact = {
                    name: formData.emergencyContactName,
                    relationship: formData.emergencyContactRelationship,
                    phone: formData.emergencyContactPhone
                };
            } else if (clientType === 'Corporate Organization') {
                clientData.name = formData.companyName;
                clientData.rcNumber = formData.rcNumber;
                clientData.phone = formData.phone;
                clientData.email = formData.email;
                clientData.address = formData.companyAddress;
                clientData.primaryContact = {
                    name: formData.corporatePrimaryContactName,
                    designation: formData.corporatePrimaryContactDesignation,
                    phone: formData.corporatePrimaryContactPhone,
                    email: formData.corporatePrimaryContactEmail
                };
                clientData.secondaryContact = {
                    name: formData.corporateSecondaryContactName,
                    designation: formData.corporateSecondaryContactDesignation,
                    phone: formData.corporateSecondaryContactPhone,
                    email: formData.corporateSecondaryContactEmail
                };
            } else if (clientType === 'Government Agency') {
                clientData.name = formData.agencyName;
                clientData.agencyType = formData.agencyType;
                clientData.ministry = formData.ministry;
                clientData.phone = formData.officialPhone;
                clientData.email = formData.officialEmail;
                clientData.address = formData.agencyAddress;
                clientData.primaryContact = {
                    name: formData.primaryContactName,
                    designation: formData.primaryContactDesignation,
                    phone: formData.primaryContactPhone,
                    email: formData.primaryContactEmail
                };
                clientData.secondaryContact = {
                    name: formData.secondaryContactName,
                    designation: formData.secondaryContactDesignation,
                    phone: formData.secondaryContactPhone,
                    email: formData.secondaryContactEmail
                };
            }

            const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(clientData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Failed to update client');
            }

            setMessage({ type: 'success', text: 'Client updated successfully!' });

            // Navigate back to client details after 1.5 seconds
            setTimeout(() => {
                navigate(`/admin/clients/${id}`);
            }, 1500);

        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading client details..." />;
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(`/admin/clients/${id}`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Edit Client</h2>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                {/* Client Type Display (Read-only) */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client Type</label>
                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                        {clientType}
                    </div>
                </div>

                {/* Individual Client Fields */}
                {clientType === 'Individual' && (
                    <>
                        <div className="border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth *</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            onClick={(e) => e.target.showPicker?.()}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality *</label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        value={formData.nationality}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Occupation / Employer *</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="occupation"
                                            value={formData.occupation}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Residential Address *</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                                    <input
                                        type="text"
                                        name="emergencyContactName"
                                        value={formData.emergencyContactName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship *</label>
                                    <input
                                        type="text"
                                        name="emergencyContactRelationship"
                                        value={formData.emergencyContactRelationship}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                                    <input
                                        type="tel"
                                        name="emergencyContactPhone"
                                        value={formData.emergencyContactPhone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Corporate Organization Fields */}
                {clientType === 'Corporate Organization' && (
                    <>
                        <div className="border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Corporate Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">RC Number *</label>
                                    <input
                                        type="text"
                                        name="rcNumber"
                                        value={formData.rcNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Address *</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="companyAddress"
                                            value={formData.companyAddress}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Primary Contact Person */}
                        <div className="border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact Person</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        name="corporatePrimaryContactName"
                                        value={formData.corporatePrimaryContactName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Designation *</label>
                                    <input
                                        type="text"
                                        name="corporatePrimaryContactDesignation"
                                        value={formData.corporatePrimaryContactDesignation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="corporatePrimaryContactPhone"
                                        value={formData.corporatePrimaryContactPhone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        name="corporatePrimaryContactEmail"
                                        value={formData.corporatePrimaryContactEmail}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Secondary Contact Person */}
                        <div className="border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Secondary Contact Person</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="corporateSecondaryContactName"
                                        value={formData.corporateSecondaryContactName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                                    <input
                                        type="text"
                                        name="corporateSecondaryContactDesignation"
                                        value={formData.corporateSecondaryContactDesignation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="corporateSecondaryContactPhone"
                                        value={formData.corporateSecondaryContactPhone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="corporateSecondaryContactEmail"
                                        value={formData.corporateSecondaryContactEmail}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Government Agency Fields */}
                {clientType === 'Government Agency' && (
                    <>
                        <div className="border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Government Agency Profile</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Agency Name *</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="agencyName"
                                            value={formData.agencyName}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Agency Type *</label>
                                    <select
                                        name="agencyType"
                                        value={formData.agencyType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Federal Government">Federal Government</option>
                                        <option value="State Government">State Government</option>
                                        <option value="Local Government">Local Government</option>
                                        <option value="MDAs">MDAs</option>
                                        <option value="Parastatal">Parastatal</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ministry / Department / Unit *</label>
                                    <input
                                        type="text"
                                        name="ministry"
                                        value={formData.ministry}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Official Phone Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="officialPhone"
                                            value={formData.officialPhone}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Official Email Address *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="officialEmail"
                                            value={formData.officialEmail}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Agency Address *</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="agencyAddress"
                                            value={formData.agencyAddress}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Primary Contact Person */}
                        <div className="border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Primary Contact Person</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        name="primaryContactName"
                                        value={formData.primaryContactName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Designation / Rank *</label>
                                    <input
                                        type="text"
                                        name="primaryContactDesignation"
                                        value={formData.primaryContactDesignation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="primaryContactPhone"
                                        value={formData.primaryContactPhone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        name="primaryContactEmail"
                                        value={formData.primaryContactEmail}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Secondary Contact Person */}
                        <div className="border-t pt-4">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Secondary Contact Person</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        name="secondaryContactName"
                                        value={formData.secondaryContactName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Designation / Rank</label>
                                    <input
                                        type="text"
                                        name="secondaryContactDesignation"
                                        value={formData.secondaryContactDesignation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="secondaryContactPhone"
                                        value={formData.secondaryContactPhone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="secondaryContactEmail"
                                        value={formData.secondaryContactEmail}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/clients/${id}`)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className={`flex-1 px-4 py-2.5 text-white font-semibold rounded-lg transition-colors ${isSaving ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                    >
                        {isSaving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditClientForm;
