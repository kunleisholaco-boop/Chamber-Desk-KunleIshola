import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import ClientAuthSetup from '../../components/ClientPortal/ClientAuthSetup';
import ClientAuthLogin from '../../components/ClientPortal/ClientAuthLogin';
import ClientCaseOverview from '../../components/ClientPortal/ClientCaseOverview';
import ClientInformation from '../../components/ClientPortal/ClientInformation';
import ClientCaseDetails from '../../components/ClientPortal/ClientCaseDetails';
import ClientPartiesSection from '../../components/ClientPortal/ClientPartiesSection';
import ClientWitnessesSection from '../../components/ClientPortal/ClientWitnessesSection';
import ClientCourtInfo from '../../components/ClientPortal/ClientCourtInfo';
import ClientReportsTimeline from '../../components/ClientPortal/ClientReportsTimeline';
import API_BASE_URL from '../../../config/api';

const ClientCaseView = () => {
    const { shareToken } = useParams();
    const [authState, setAuthState] = useState('checking'); // 'checking', 'setup', 'login', 'authenticated'
    const [caseData, setCaseData] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, [shareToken]);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/cases/shared/${shareToken}/details`);

            if (response.ok) {
                const data = await response.json();

                if (!data.pinSetupCompleted) {
                    setAuthState('setup');
                } else {
                    setAuthState('login');
                }
            } else if (response.status === 404) {
                setError('Invalid case link. Please check the URL and try again.');
            } else {
                setError('Unable to load case. Please try again later.');
            }
        } catch (err) {
            setError('Connection error. Please check your internet connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetupComplete = async (clientName, pin) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/cases/shared/${shareToken}/setup-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientName, pin })
            });

            if (response.ok) {
                // After successful setup, verify PIN and load case
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
            const verifyResponse = await fetch(`${API_BASE_URL}/api/cases/shared/${shareToken}/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            if (!verifyResponse.ok) {
                return false;
            }

            // Store PIN in sessionStorage for later use (e.g., posting replies)
            sessionStorage.setItem(`clientPin_${shareToken}`, pin);

            // Fetch case data
            const caseResponse = await fetch(`${API_BASE_URL}/api/cases/shared/${shareToken}/details`);

            if (caseResponse.ok) {
                const data = await caseResponse.json();
                setCaseData(data);
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

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading case information...</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Case</h2>
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

    // Authenticated - show case details
    if (authState === 'authenticated' && caseData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Case Portal</h1>
                        <p className="text-gray-600">View all details and updates about your case</p>
                    </div>

                    {/* Case Overview */}
                    <ClientCaseOverview caseData={caseData} formatDate={formatDate} />

                    {/* Client Information */}
                    <ClientInformation client={caseData.client} />

                    {/* Case Details */}
                    <ClientCaseDetails caseData={caseData} formatDate={formatDate} />

                    {/* Parties */}
                    <ClientPartiesSection parties={caseData.parties} />

                    {/* Witnesses */}
                    <ClientWitnessesSection witnesses={caseData.witnesses} />

                    {/* Court Information */}
                    <ClientCourtInfo caseData={caseData} formatDate={formatDate} />

                    {/* Client Reports */}
                    <ClientReportsTimeline
                        clientReports={caseData.clientReports}
                        formatDate={formatDate}
                    />

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

export default ClientCaseView;

