import React, { useState, useEffect } from 'react';
import { X, MapPin, Video, Search, Clock } from 'lucide-react';

const ScheduleMeetingModal = ({ isOpen, onClose, onSuccess }) => {
    const [meetingUsers, setMeetingUsers] = useState([]);
    const [clients, setClients] = useState([]);
    const [attendeeTab, setAttendeeTab] = useState('staff');
    const [timeState, setTimeState] = useState({ hour: '12', minute: '00', period: 'AM' });
    const [attendeeSearch, setAttendeeSearch] = useState('');
    const [formData, setFormData] = useState({
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Update formData.time whenever timeState changes
    useEffect(() => {
        const { hour, minute, period } = timeState;
        let hour24 = parseInt(hour);
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;
        const timeString = `${String(hour24).padStart(2, '0')}:${minute}`;
        setFormData(prev => ({ ...prev, time: timeString }));
    }, [timeState]);

    const fetchMeetingUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const response = await fetch(`${API_BASE_URL}/api/users/selectable', {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                const filteredData = data.filter(u => u.email !== currentUser?.email);
                setMeetingUsers(filteredData);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients', {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setClients(data);
            }
        } catch (err) {
            console.error('Error fetching clients:', err);
        }
    };

    const generateZohoLink = async (meetingData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/meetings/generate-zoho-link', {
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
                    attendees: meetingData.attendees
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
            const response = await fetch(`${API_BASE_URL}/api/meetings', {
                method: 'POST',
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
                setMessage({ type: 'success', text: 'Meeting scheduled successfully!' });
                setTimeout(() => {
                    resetForm();
                    onClose();
                    if (onSuccess) onSuccess();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: 'Failed to schedule meeting' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error scheduling meeting' });
        } finally {
            setIsSubmitting(false);
        }
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
        setMessage({ type: '', text: '' });
        setAttendeeSearch('');
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

    const filteredMeetingUsers = meetingUsers.filter(user =>
        user.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(attendeeSearch.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-gray-900">Schedule Meeting</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                            className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            placeholder="e.g., Weekly Team Sync"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                onClick={(e) => e.target.showPicker?.()}
                                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                            <div className="flex gap-1">
                                <select
                                    value={timeState.hour}
                                    onChange={e => setTimeState({ ...timeState, hour: e.target.value })}
                                    className="px-2 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                                <span className="self-center">:</span>
                                <select
                                    value={timeState.minute}
                                    onChange={e => setTimeState({ ...timeState, minute: e.target.value })}
                                    className="px-2 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                >
                                    {['00', '15', '30', '45'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={timeState.period}
                                    onChange={e => setTimeState({ ...timeState, period: e.target.value })}
                                    className="px-2 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

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
                                    className="text-orange-600 focus:ring-orange-500"
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
                                    className="text-orange-600 focus:ring-orange-500"
                                />
                                <span className="flex items-center gap-1"><Video className="w-4 h-4" /> Online</span>
                            </label>
                        </div>
                    </div>

                    {formData.type === 'Physical' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                            <input
                                type="text"
                                required
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                placeholder="e.g., Conference Room A"
                            />
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                                <Video className="w-4 h-4" />
                                Zoho Meeting
                            </div>
                            <p className="text-xs text-blue-600">
                                A Zoho Meeting link will be automatically generated when you schedule this meeting.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>

                        {/* Tabs for Staff and Clients */}
                        <div className="flex border-b border-gray-200 mb-3">
                            <button
                                type="button"
                                onClick={() => { setAttendeeTab('staff'); fetchMeetingUsers(); }}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${attendeeTab === 'staff'
                                    ? 'border-orange-600 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Staff
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAttendeeTab('clients'); fetchClients(); }}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${attendeeTab === 'clients'
                                    ? 'border-orange-600 text-orange-600'
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
                                onFocus={() => attendeeTab === 'staff' ? fetchMeetingUsers() : fetchClients()}
                                className="w-full pl-9 pr-3 py-2 text-sm border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto">
                            {attendeeTab === 'staff' ? (
                                // Staff List
                                meetingUsers.filter(user =>
                                    user.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
                                    user.email.toLowerCase().includes(attendeeSearch.toLowerCase())
                                ).length === 0 ? (
                                    <p className="text-sm text-gray-500 p-4 text-center">No staff found.</p>
                                ) : (
                                    meetingUsers.filter(user =>
                                        user.name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
                                        user.email.toLowerCase().includes(attendeeSearch.toLowerCase())
                                    ).map(user => {
                                        const isSelected = formData.attendees.includes(user.email);
                                        return (
                                            <div
                                                key={user._id}
                                                onClick={() => toggleAttendee(user.email)}
                                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b last:border-b-0 ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRandomColor(user.name)}`}>
                                                    {getInitials(user.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-orange-600 border-orange-600' : 'border-gray-300'}`}>
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
                                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b last:border-b-0 ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRandomColor(client.name)}`}>
                                                    {getInitials(client.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-orange-600 border-orange-600' : 'border-gray-300'}`}>
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
                            className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-orange-500"
                            placeholder="Meeting agenda or notes..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400"
                        >
                            {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleMeetingModal;
