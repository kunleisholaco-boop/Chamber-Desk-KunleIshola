import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, ChevronLeft, ChevronRight, X, Users, MapPin, Video, Link as LinkIcon, Search, User, AlertTriangle, Pencil } from 'lucide-react';
import LoadingSpinner from '../../components/AdminOfficer/LoadingSpinner';
import API_BASE_URL from '../../config/api';

const Meetings = () => {
    const location = useLocation();

    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'Admin';
    const rolePrefix = userRole === 'HOC' ? '/hoc' : '/admin';
    const primaryColor = userRole === 'HOC' ? 'purple' : 'orange';

    const [meetings, setMeetings] = useState([]);
    const [users, setUsers] = useState([]); // Store selectable users
    const [clients, setClients] = useState([]); // Store selectable clients
    const [attendeeTab, setAttendeeTab] = useState('staff'); // 'staff' or 'clients'
    const [isLoading, setIsLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [meetingToCancel, setMeetingToCancel] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [attendeeSearch, setAttendeeSearch] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // Custom Time Picker State
    const [timeState, setTimeState] = useState({ hour: '12', minute: '00', period: 'AM' });

    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '', // Will be stored as HH:MM (24h) for backend consistency
        description: '',
        attendees: [], // Array of emails
        type: 'Physical', // 'Physical' or 'Online'
        location: '',
        meetingLink: '',
        platform: 'Zoho' // Default to Zoho
    });

    const dateInputRef = useRef(null);
    const filterDateInputRef = useRef(null);

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);
        fetchMeetings();
        fetchUsers();
        fetchClients();
    }, []);

    // Handle navigation from notifications
    useEffect(() => {
        if (location.state?.openMeetingId && meetings.length > 0) {
            const meetingToOpen = meetings.find(m => m._id === location.state.openMeetingId);
            if (meetingToOpen) {
                setSelectedMeeting(meetingToOpen);
                setShowDetailsModal(true);
                // Also update filter date to match the meeting
                setFilterDate(new Date(meetingToOpen.date).toISOString().split('T')[0]);
            }
        }
    }, [location.state, meetings]);

    // Update formData.time whenever timeState changes
    useEffect(() => {
        const { hour, minute, period } = timeState;
        let hour24 = parseInt(hour);
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;
        const timeString = `${String(hour24).padStart(2, '0')}:${minute}`;
        setFormData(prev => ({ ...prev, time: timeString }));
    }, [timeState]);

    const fetchMeetings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/meetings`, {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setMeetings(data);
            }
        } catch (err) {
            console.error('Error fetching meetings:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/users/selectable`, {
                headers: {
                    'x-auth-token': token
                }
            });
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setMessage({ type: 'error', text: 'Failed to load users' });
        }
    };

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients`, {
                headers: {
                    'x-auth-token': token
                }
            });
            const data = await response.json();
            setClients(data);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setMessage({ type: 'error', text: 'Failed to load clients' });
        }
    };

    const handleDateClick = (day) => {
        const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) return;

        const offset = selectedDate.getTimezoneOffset();
        const dateStr = new Date(selectedDate.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

        resetForm();
        setFormData(prev => ({ ...prev, date: dateStr }));
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            date: new Date().toISOString().split('T')[0],
            time: '',
            description: '',
            attendees: [],
            type: 'Physical',
            location: '',
            meetingLink: '',
            platform: 'Zoho'
        });
        setTimeState({ hour: '12', minute: '00', period: 'AM' });
        setIsEditing(false);
        setEditingId(null);
        setMessage({ type: '', text: '' });
    };

    const handleEditClick = (meeting) => {
        setIsEditing(true);
        setEditingId(meeting._id);

        // Parse time for timeState
        const [h, m] = meeting.time.split(':');
        const hour = parseInt(h);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;

        setTimeState({
            hour: String(hour12),
            minute: m,
            period: period
        });

        // Extract emails from attendees array (which might be objects now)
        const attendeeEmails = meeting.attendees ? meeting.attendees.map(a => typeof a === 'string' ? a : a.email) : [];

        setFormData({
            title: meeting.title,
            date: meeting.date.split('T')[0],
            time: meeting.time,
            description: meeting.description || '',
            attendees: attendeeEmails,
            type: meeting.type,
            location: meeting.location || '',
            meetingLink: meeting.meetingLink || '',
            platform: meeting.platform || 'Zoho'
        });

        setShowDetailsModal(false);
        setShowModal(true);
    };

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const daysArray = [...Array(days).keys()].map(i => i + 1);
    const emptyDays = [...Array(firstDay).keys()];

    const getMeetingsForDate = (day) => {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${d}`;

        return meetings.filter(m => {
            if (!m.date) return false;
            return m.date.split('T')[0] === dateStr && m.status !== 'cancelled';
        });
    };

    const generateZohoLink = async (meetingData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/meetings/generate-zoho-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    title: meetingData.title,
                    date: meetingData.date,
                    time: meetingData.time,
                    description: meetingData.description,
                    attendees: meetingData.attendees // Backend expects array of emails here for link generation
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.link;
            } else {
                const errData = await response.json();
                throw new Error(errData.msg || 'Failed to generate link');
            }
        } catch (err) {
            console.error('Zoho generation error:', err);
            throw err;
        }
    };

    const handleRSVP = async (status) => {
        if (!selectedMeeting) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/meetings/${selectedMeeting._id}/rsvp`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                const updatedMeeting = await response.json();
                setSelectedMeeting(updatedMeeting);
                // Update in list
                setMeetings(prev => prev.map(m => m._id === updatedMeeting._id ? updatedMeeting : m));
                setMessage({ type: 'success', text: `You have ${status} this meeting.` });
            } else {
                setMessage({ type: 'error', text: 'Failed to update RSVP status' });
            }
        } catch (err) {
            console.error('RSVP error:', err);
            setMessage({ type: 'error', text: 'Error updating RSVP status' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            let finalLink = formData.meetingLink;

            // Auto-generate Zoho link if Online and no link provided
            if (formData.type === 'Online' && !finalLink) {
                setMessage({ type: 'info', text: 'Generating Zoho Meeting link...' });
                try {
                    finalLink = await generateZohoLink(formData);
                } catch (zohoError) {
                    setMessage({ type: 'error', text: 'Failed to generate Zoho link: ' + zohoError.message });
                    setIsSubmitting(false);
                    return;
                }
            }

            const token = localStorage.getItem('token');
            const url = isEditing
                ? `${API_BASE_URL}/api/meetings/${editingId}`
                : `${API_BASE_URL}/api/meetings`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    ...formData,
                    meetingLink: finalLink
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: `Meeting ${isEditing ? 'updated' : 'scheduled'} successfully!` });
                fetchMeetings();
                setTimeout(() => {
                    setShowModal(false);
                    resetForm();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: `Failed to ${isEditing ? 'update' : 'schedule'} meeting` });
            }
        } catch (err) {
            setMessage({ type: 'error', text: `Error ${isEditing ? 'updating' : 'scheduling'} meeting` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const initiateCancel = (meeting) => {
        setMeetingToCancel(meeting);
        setShowCancelModal(true);
    };

    const confirmCancel = async () => {
        if (!meetingToCancel) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingToCancel._id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (response.ok) {
                fetchMeetings();
                setShowCancelModal(false);
                setMeetingToCancel(null);
                if (selectedMeeting && selectedMeeting._id === meetingToCancel._id) {
                    setShowDetailsModal(false);
                    setSelectedMeeting(null);
                }
            }
        } catch (err) {
            console.error('Error cancelling meeting:', err);
        }
    };

    const toggleAttendee = (email) => {
        setFormData(prev => {
            const currentAttendees = prev.attendees || [];
            if (currentAttendees.includes(email)) {
                return { ...prev, attendees: currentAttendees.filter(a => a !== email) };
            } else {
                return { ...prev, attendees: [...currentAttendees, email] };
            }
        });
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRandomColor = (name) => {
        const colors = ['bg-red-100 text-red-700', 'bg-green-100 text-green-700', 'bg-blue-100 text-blue-700', 'bg-yellow-100 text-yellow-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(attendeeSearch.toLowerCase())
    );

    const openDetails = (meeting) => {
        setSelectedMeeting(meeting);
        setShowDetailsModal(true);
    };

    // Helper to format 24h time to 12h for display
    const formatTimeDisplay = (time24) => {
        if (!time24) return '';
        const [h, m] = time24.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${m} ${ampm}`;
    };

    const filteredMeetings = meetings.filter(m => {
        if (!m.date) return false;
        return m.date.split('T')[0] === filterDate && m.status !== 'cancelled';
    });

    if (isLoading) return <LoadingSpinner message="Loading calendar..." />;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meetings & Schedule</h1>
                    <p className="text-gray-600 mt-1">Manage appointments and team meetings</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className={`flex items-center gap-2 px-4 py-2 bg-${primaryColor}-600 text-white rounded-lg hover:bg-${primaryColor}-700 transition-colors`}
                >
                    <Plus className="w-5 h-5" />
                    Schedule Meeting
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className={`w-5 h-5 text-${primaryColor}-600`} />
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrevMonth} className={`p-1 bg-black hover:bg-${primaryColor}-500 text-white rounded-full`}>
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={handleNextMonth} className={`p-1 bg-black hover:bg-${primaryColor}-500 text-white rounded-full`}>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 text-center border-b border-gray-200 bg-gray-50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-2 text-sm font-semibold text-gray-600">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-fr bg-white">
                    {emptyDays.map(i => (
                        <div key={`empty-${i}`} className="h-32 border-b border-r border-gray-100 bg-gray-50/30"></div>
                    ))}
                    {daysArray.map(day => {
                        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dayMeetings = getMeetingsForDate(day);
                        const isToday = new Date().toDateString() === dateObj.toDateString();
                        const isPast = dateObj < new Date().setHours(0, 0, 0, 0);

                        return (
                            <div
                                key={day}
                                onClick={() => !isPast && handleDateClick(day)}
                                className={`h-32 border-b border-r border-gray-100 p-2 relative group transition-colors 
                                    ${isPast ? 'bg-gray-50/50 cursor-not-allowed' : `hover:bg-${primaryColor}-50/30 cursor-pointer`} 
                                    ${isToday ? `bg-${primaryColor}-50` : ''}`}
                            >
                                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? `bg-${primaryColor}-600 text-white` : 'text-gray-700'}`}>
                                    {day}
                                </span>
                                <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)]">
                                    {dayMeetings.map(meeting => (
                                        <button
                                            key={meeting._id}
                                            onClick={(e) => { e.stopPropagation(); openDetails(meeting); }}
                                            className={`w-full text-left text-xs p-1 bg-${primaryColor}-100 text-${primaryColor}-800 rounded truncate flex items-center gap-1 hover:bg-${primaryColor}-200 transition-colors`}
                                            title={`${meeting.time} - ${meeting.title}`}
                                        >
                                            {meeting.type === 'Online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                            {formatTimeDisplay(meeting.time)} {meeting.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming Meetings List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h3>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            ref={filterDateInputRef}
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            onClick={() => filterDateInputRef.current?.showPicker()}
                            className={`pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-${primaryColor}-500 cursor-pointer text-black`}
                        />
                    </div>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredMeetings.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No meetings scheduled for this date
                        </div>
                    ) : (
                        filteredMeetings.map(meeting => {
                            const isCancelled = meeting.status === 'cancelled';
                            return (
                                <div
                                    key={meeting._id}
                                    onClick={() => openDetails(meeting)}
                                    className={`p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer ${isCancelled ? 'opacity-75' : ''}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${isCancelled ? 'bg-red-100 text-red-700' : 'bg-${primaryColor}-100 text-${primaryColor}-700'}`}>
                                            <span className="text-xs font-bold uppercase">{new Date(meeting.date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-lg font-bold">{new Date(meeting.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-semibold text-gray-900 ${isCancelled ? 'line-through text-gray-500' : ''}`}>{meeting.title}</h4>
                                                {isCancelled ? (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                                        Cancelled
                                                    </span>
                                                ) : (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${meeting.type === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {meeting.type}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {formatTimeDisplay(meeting.time)}
                                                </span>
                                                {meeting.type === 'Physical' ? (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {meeting.location || 'No location specified'}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <Video className="w-4 h-4" />
                                                        {meeting.platform}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {!isCancelled && currentUser && !meeting.clientCreator && meeting.createdBy === currentUser._id && (
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(meeting); }}
                                                className="p-2 text-gray-400 hover:text-blue-600"
                                                title="Edit Meeting"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); initiateCancel(meeting); }}
                                                className="p-2 text-gray-400 hover:text-red-600"
                                                title="Cancel Meeting"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Create/Edit Meeting Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Meeting' : 'Schedule Meeting'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {message.text && (
                                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500 focus:border-${primaryColor}-500`}
                                    placeholder="e.g., Weekly Team Sync"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <div className="relative">
                                        <input
                                            ref={dateInputRef}
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            onClick={() => dateInputRef.current?.showPicker()}
                                            className={`w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500 focus:border-${primaryColor}-500 cursor-pointer`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                                    <div className="flex gap-1">
                                        <select
                                            value={timeState.hour}
                                            onChange={e => setTimeState({ ...timeState, hour: e.target.value })}
                                            className={`px-2 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500`}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                        <span className="self-center">:</span>
                                        <select
                                            value={timeState.minute}
                                            onChange={e => setTimeState({ ...timeState, minute: e.target.value })}
                                            className={`px-2 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500`}
                                        >
                                            {['00', '15', '30', '45'].map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={timeState.period}
                                            onChange={e => setTimeState({ ...timeState, period: e.target.value })}
                                            className={`px-2 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500`}
                                        >
                                            <option value="AM">AM</option>
                                            <option value="PM">PM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Meeting Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                                <div className="flex gap-4">
                                    <label className="flex text-black items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="Physical"
                                            checked={formData.type === 'Physical'}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className={`text-${primaryColor}-600 text-black focus:ring-${primaryColor}-500`}
                                        />
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Physical</span>
                                    </label>
                                    <label className="flex text-black items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="Online"
                                            checked={formData.type === 'Online'}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className={`text-${primaryColor}-600 text-black focus:ring-${primaryColor}-500`}
                                        />
                                        <span className="flex items-center gap-1"><Video className="w-4 h-4" /> Online</span>
                                    </label>
                                </div>
                            </div>

                            {/* Conditional Fields based on Type */}
                            {formData.type === 'Physical' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        className={`w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500 focus:border-${primaryColor}-500`}
                                        placeholder="e.g., Conference Room A"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                                            <Video className="w-4 h-4" />
                                            Zoho Meeting
                                        </div>
                                        <p className="text-xs text-blue-600">
                                            A Zoho Meeting link will be automatically generated and sent to attendees when you schedule this meeting.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>

                                {/* Tabs for Staff and Clients */}
                                <div className="flex border-b border-gray-200 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setAttendeeTab('staff')}
                                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${attendeeTab === 'staff'
                                            ? `border-${primaryColor}-600 text-${primaryColor}-600`
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Staff
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAttendeeTab('clients')}
                                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${attendeeTab === 'clients'
                                            ? `border-${primaryColor}-600 text-${primaryColor}-600`
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Clients
                                    </button>
                                </div>

                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${attendeeTab}...`}
                                        value={attendeeSearch}
                                        onChange={e => setAttendeeSearch(e.target.value)}
                                        className={`w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-${primaryColor}-500`}
                                    />
                                </div>

                                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                                    {attendeeTab === 'staff' ? (
                                        // Staff List
                                        users.filter(user =>
                                            user.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
                                            user.email.toLowerCase().includes(attendeeSearch.toLowerCase())
                                        ).length === 0 ? (
                                            <p className="text-sm text-gray-500 p-4 text-center">No staff found.</p>
                                        ) : (
                                            users.filter(user =>
                                                user.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
                                                user.email.toLowerCase().includes(attendeeSearch.toLowerCase())
                                            ).map(user => {
                                                const isSelected = formData.attendees.includes(user.email);
                                                return (
                                                    <div
                                                        key={user._id}
                                                        onClick={() => toggleAttendee(user.email)}
                                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b last:border-b-0 ${isSelected ? `bg-${primaryColor}-50` : 'hover:bg-gray-50'}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRandomColor(user.name)}`}>
                                                            {getInitials(user.name)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? `bg-${primaryColor}-600 border-${primaryColor}-600` : 'border-gray-300'}`}>
                                                            {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )
                                    ) : (
                                        // Clients List
                                        clients.filter(client =>
                                            client.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
                                            client.email.toLowerCase().includes(attendeeSearch.toLowerCase())
                                        ).length === 0 ? (
                                            <p className="text-sm text-gray-500 p-4 text-center">No clients found.</p>
                                        ) : (
                                            clients.filter(client =>
                                                client.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
                                                client.email.toLowerCase().includes(attendeeSearch.toLowerCase())
                                            ).map(client => {
                                                const isSelected = formData.attendees.includes(client.email);
                                                return (
                                                    <div
                                                        key={client._id}
                                                        onClick={() => toggleAttendee(client.email)}
                                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b last:border-b-0 ${isSelected ? `bg-${primaryColor}-50` : 'hover:bg-gray-50'}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRandomColor(client.name)}`}>
                                                            {getInitials(client.name)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{client.email}</p>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? `bg-${primaryColor}-600 border-${primaryColor}-600` : 'border-gray-300'}`}>
                                                            {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Selected: {formData.attendees.length}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className={`w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-${primaryColor}-500 focus:border-${primaryColor}-500`}
                                    placeholder="Meeting agenda or notes..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 px-4 py-2 bg-${primaryColor}-600 text-white rounded-lg hover:bg-${primaryColor}-700 disabled:bg-orange-400`}
                                >
                                    {isSubmitting ? (isEditing ? 'Updating...' : 'Scheduling...') : (isEditing ? 'Update Meeting' : 'Schedule Meeting')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Meeting Details Modal */}
            {showDetailsModal && selectedMeeting && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                            <div>
                                <h3 className={`text-xl font-bold ${selectedMeeting.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{selectedMeeting.title}</h3>
                                {selectedMeeting.status === 'cancelled' && <span className="text-red-600 text-sm font-bold uppercase">Cancelled</span>}
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4" />
                                    {new Date(selectedMeeting.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</label>
                                    <p className="text-gray-900 font-medium flex items-center gap-2 mt-1">
                                        <Clock className={`w-4 h-4 text-${primaryColor}-600`} />
                                        {formatTimeDisplay(selectedMeeting.time)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
                                    <p className="text-gray-900 font-medium flex items-center gap-2 mt-1">
                                        {selectedMeeting.type === 'Online' ? <Video className="w-4 h-4 text-blue-600" /> : <MapPin className="w-4 h-4 text-green-600" />}
                                        {selectedMeeting.type}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {selectedMeeting.type === 'Online' ? 'Meeting Link' : 'Location'}
                                </label>
                                <div className="mt-1">
                                    {selectedMeeting.type === 'Online' ? (
                                        selectedMeeting.meetingLink ? (
                                            selectedMeeting.status === 'cancelled' ? (
                                                <span className="text-gray-400 italic flex items-center gap-1">
                                                    <LinkIcon className="w-4 h-4" />
                                                    Link disabled (Meeting Cancelled)
                                                </span>
                                            ) : (
                                                <a
                                                    href={selectedMeeting.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline break-all flex items-center gap-1"
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                    {selectedMeeting.meetingLink}
                                                </a>
                                            )
                                        ) : <span className="text-gray-500 italic">No link available</span>
                                    ) : (
                                        <p className="text-gray-900">{selectedMeeting.location || 'No location specified'}</p>
                                    )}
                                </div>
                            </div>

                            {selectedMeeting.attendees && selectedMeeting.attendees.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Attendees</label>
                                    <div className="flex flex-col gap-2">
                                        {/* Show creator first with badge */}
                                        {selectedMeeting.createdBy && (() => {
                                            const creatorEmail = typeof selectedMeeting.createdBy === 'string'
                                                ? selectedMeeting.createdBy
                                                : (selectedMeeting.createdBy.email || '');
                                            const creatorName = typeof selectedMeeting.createdBy === 'string'
                                                ? selectedMeeting.createdBy
                                                : (selectedMeeting.createdBy.name || selectedMeeting.createdBy.email);

                                            return (
                                                <div className="flex items-center justify-between text-sm pb-2 border-b border-purple-200">
                                                    <span className="flex items-center gap-1.5 text-gray-700">
                                                        {creatorName}
                                                        <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded">HOST</span>
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-green-100 text-green-800">
                                                        Accepted
                                                    </span>
                                                </div>
                                            );
                                        })()}

                                        {/* Show other attendees */}
                                        {selectedMeeting.attendees.map((attendee, idx) => {
                                            const email = typeof attendee === 'string' ? attendee : attendee.email;
                                            const status = typeof attendee === 'string' ? 'pending' : attendee.status;
                                            const creatorEmail = typeof selectedMeeting.createdBy === 'string'
                                                ? selectedMeeting.createdBy
                                                : (selectedMeeting.createdBy?.email || '');

                                            // Skip creator as they're shown above
                                            if (email === creatorEmail) return null;

                                            let statusColor = 'bg-gray-100 text-gray-800';
                                            if (status === 'accepted') statusColor = 'bg-green-100 text-green-800';
                                            if (status === 'declined') statusColor = 'bg-red-100 text-red-800';

                                            return (
                                                <div key={idx} className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-700">{email}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor}`}>
                                                        {status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedMeeting.description && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                                    <p className="text-gray-700 mt-1 text-sm bg-gray-50 p-3 rounded-lg">
                                        {selectedMeeting.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            {/* RSVP Buttons for Attendees */}
                            {selectedMeeting.status !== 'cancelled' && currentUser &&
                                selectedMeeting.attendees.some(a => (typeof a === 'string' ? a : a.email) === currentUser.email) && (() => {
                                    // Find current user's RSVP status
                                    const currentAttendee = selectedMeeting.attendees.find(a =>
                                        (typeof a === 'string' ? a : a.email) === currentUser.email
                                    );
                                    const userStatus = typeof currentAttendee === 'string' ? 'pending' : currentAttendee.status;

                                    return (
                                        <>
                                            <button
                                                onClick={() => handleRSVP('accepted')}
                                                disabled={userStatus === 'accepted'}
                                                className={`text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${userStatus === 'accepted'
                                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                                    : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                    }`}
                                            >
                                                {userStatus === 'accepted' ? 'Accepted' : 'Accept'}
                                            </button>
                                            <button
                                                onClick={() => handleRSVP('declined')}
                                                disabled={userStatus === 'declined'}
                                                className={`text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${userStatus === 'declined'
                                                    ? 'bg-red-100 text-red-700 cursor-not-allowed'
                                                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                    }`}
                                            >
                                                {userStatus === 'declined' ? 'Declined' : 'Decline'}
                                            </button>
                                        </>
                                    );
                                })()}

                            {/* Edit/Cancel Buttons for Creator - Only show if created by staff (not client) */}
                            {selectedMeeting.status !== 'cancelled' && currentUser &&
                                !selectedMeeting.clientCreator && // Don't show for client-created meetings
                                (selectedMeeting.createdBy === currentUser._id || selectedMeeting.createdBy === currentUser.id) && (
                                    <>
                                        <button
                                            onClick={() => handleEditClick(selectedMeeting)}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Edit Meeting
                                        </button>
                                        <button
                                            onClick={() => initiateCancel(selectedMeeting)}
                                            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Cancel Meeting
                                        </button>
                                    </>
                                )}
                        </div>
                    </div>
                </div >
            )}

            {/* Cancel Confirmation Modal */}
            {
                showCancelModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                            <div className="p-6 text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Meeting?</h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    Are you sure you want to cancel this meeting? This action cannot be undone, and all attendees will be notified.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                    >
                                        No, Keep it
                                    </button>
                                    <button
                                        onClick={confirmCancel}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                                    >
                                        Yes, Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Meetings;


