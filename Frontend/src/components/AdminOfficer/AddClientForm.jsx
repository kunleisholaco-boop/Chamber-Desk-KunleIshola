import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Building, Calendar, Briefcase, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddClientForm = () => {
    const navigate = useNavigate();
    const [clientType, setClientType] = useState('Individual');
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
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClientTypeChange = (e) => {
        setClientType(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('token');

            // Prepare data based on client type
            let clientData = {
                clientType,
                phone: formData.phone || formData.officialPhone,
                email: formData.email || formData.officialEmail,
                address: formData.address || formData.companyAddress || formData.agencyAddress
            };

            if (clientType === 'Individual') {
                clientData.name = formData.fullName;
                clientData.gender = formData.gender;
                clientData.dateOfBirth = formData.dateOfBirth;
                clientData.nationality = formData.nationality;
                clientData.occupation = formData.occupation;
                clientData.emergencyContact = {
                    name: formData.emergencyContactName,
                    relationship: formData.emergencyContactRelationship,
                    phone: formData.emergencyContactPhone
                };
            } else if (clientType === 'Corporate Organization') {
                clientData.name = formData.companyName;
                clientData.rcNumber = formData.rcNumber;
                clientData.contactPerson = formData.contactPerson;
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

            const response = await fetch(`${API_BASE_URL}/api/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(clientData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Failed to create client');
            }

            setMessage({ type: 'success', text: 'Client added successfully! Notifications sent to Managers and HOC.' });

            // Navigate back to clients list after 2 seconds
            setTimeout(() => {
                navigate('/admin/clients');
            }, 2000);

        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/clients')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Add New Client</h2>
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
                {/* Client Type Selection */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client Type *</label>
                    <select
                        value={clientType}
                        onChange={handleClientTypeChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
                        required
                    >
                        <option value="Individual">Individual</option>
                        <option value="Corporate Organization">Corporate Organization</option>
                        <option value="Government Agency">Government Agency</option>
                    </select>
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
                                            placeholder="John Doe"
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
                                            max={new Date().toISOString().split('T')[0]}
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
                                        placeholder="Nigerian"
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
                                            placeholder="Software Engineer at ABC Corp"
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
                                            placeholder="+234 800 000 0000"
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
                                            placeholder="john@example.com"
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
                                            placeholder="123 Main Street, Lagos"
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
                                        placeholder="Jane Doe"
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
                                        placeholder="Spouse, Sibling, etc."
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
                                        placeholder="+234 800 000 0000"
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
                                            placeholder="ABC Corporation Ltd"
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
                                        placeholder="RC123456"
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
                                            placeholder="+234 800 000 0000"
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
                                            placeholder="info@company.com"
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
                                            placeholder="123 Business District, Lagos"
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
                                        placeholder="John Doe"
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
                                        placeholder="CEO"
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
                                        placeholder="+234 800 000 0000"
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
                                        placeholder="ceo@company.com"
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
                                        placeholder="Jane Smith"
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
                                        placeholder="CFO"
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
                                        placeholder="+234 800 000 0000"
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
                                        placeholder="cfo@company.com"
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
                                            placeholder="Federal Ministry of..."
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
                                        placeholder="Department of..."
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
                                            placeholder="+234 9 000 0000"
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
                                            placeholder="info@agency.gov.ng"
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
                                            placeholder="Federal Secretariat, Abuja"
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
                                        placeholder="Dr. John Doe"
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
                                        placeholder="Director General"
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
                                        placeholder="+234 800 000 0000"
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
                                        placeholder="director@agency.gov.ng"
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
                                        placeholder="Mrs. Jane Smith"
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
                                        placeholder="Deputy Director"
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
                                        placeholder="+234 800 000 0000"
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
                                        placeholder="deputy@agency.gov.ng"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/clients')}
                        className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Adding Client...' : 'Add Client'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddClientForm;
