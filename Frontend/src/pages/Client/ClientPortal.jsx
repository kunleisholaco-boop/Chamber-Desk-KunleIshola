import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase, Calendar, FileText } from 'lucide-react';
import ClientAuthSetup from '../../components/ClientPortal/ClientAuthSetup';
import ClientAuthLogin from '../../components/ClientPortal/ClientAuthLogin';
import API_BASE_URL from '../../../config/api';

const ClientPortal = () => {
    const { shareToken } = useParams();
    const navigate = useNavigate();
    const [authState, setAuthState] = useState('checking'); // 'checking', 'setup', 'login', 'authenticated'
    const [clientData, setClientData] = useState(null);
    const [cases, setCases] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, [shareToken]);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/details`);

            if (response.ok) {
                const data = await response.json();

                if (!data.pinSetupCompleted) {
                    setAuthState('setup');
                } else {
                    setAuthState('login');
                }
            } else if (response.status === 404) {
                setError('Invalid client portal link. Please check the URL and try again.');
            } else {
                setError('Unable to load portal. Please try again later.');
            }
        } catch (err) {
            setError('Connection error. Please check your internet connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetupComplete = async (clientName, pin) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/setup-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientName, pin })
            });

            if (response.ok) {
                // After successful setup, verify PIN and load cases
                return await handleLoginSuccess(pin);
            } else {
                return false;
            }
        } catch (err) {
            console.error('Setup error:', err);
            return false;
        }
    };

    const handleLoginSuccess = async (pin) => {
        try {
            // Verify PIN
            const verifyResponse = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            if (!verifyResponse.ok) {
                return false;
            }

            const verifyData = await verifyResponse.json();

            // Store PIN in sessionStorage for later use (e.g., posting replies)
            sessionStorage.setItem(`clientPin_${shareToken}`, pin);

            // Fetch client cases
            const casesResponse = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/cases`);

            if (casesResponse.ok) {
                const casesData = await casesResponse.json();
                setCases(casesData);
                setClientData({ name: verifyData.clientName });
                setAuthState('authenticated');
                return true;
            }

            return false;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'Open': 'bg-green-100 text-green-700',
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Closed': 'bg-gray-100 text-gray-700',
            'Completed-Won': 'bg-emerald-100 text-emerald-700',
            'Completed-Lost': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading portal...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Portal</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    // Auth states
    if (authState === 'setup') {
        return <ClientAuthSetup onSetupComplete={handleSetupComplete} />;
    }

    if (authState === 'login') {
        return <ClientAuthLogin onLoginSuccess={handleLoginSuccess} />;
    }

    // Authenticated - show client dashboard
    if (authState === 'authenticated' && clientData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {clientData.name}</h1>
                        <p className="text-gray-600">Your Client Portal Dashboard</p>
                    </div>

                    {/* Cases Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Briefcase className="w-6 h-6 text-purple-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Your Cases</h2>
                        </div>

                        {cases.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Cases Yet</h3>
                                <p className="text-gray-500">You don't have any cases at the moment.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {cases.map((caseItem) => (
                                    <div
                                        key={caseItem._id}
                                        onClick={() => navigate(`/client-portal/${shareToken}/case/${caseItem._id}`)}
                                        className="border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                                                {caseItem.caseTitle}
                                            </h3>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                            {caseItem.summary}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                                {caseItem.caseType}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(caseItem.status)}`}>
                                                {caseItem.status}
                                            </span>
                                            {caseItem.inCourt && (
                                                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                                    In Court
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>Started: {formatDate(caseItem.dateIssueStarted)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center text-gray-600 text-sm mt-8">
                        <p>If you have any questions, please contact your attorney.</p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default ClientPortal;

