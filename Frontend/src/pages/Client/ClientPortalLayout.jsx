import React, { useState, useEffect } from 'react';
import { useParams, Outlet, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import ClientAuthSetup from '../../components/ClientPortal/ClientAuthSetup';
import ClientAuthLogin from '../../components/ClientPortal/ClientAuthLogin';
import ClientPortalSidebar from '../../components/ClientPortal/ClientPortalSidebar';
import API_BASE_URL from '../../../config/api';

const ClientPortalLayout = () => {
    const { shareToken } = useParams();
    const navigate = useNavigate();
    const [authState, setAuthState] = useState('checking'); // 'checking', 'setup', 'login', 'authenticated'
    const [clientData, setClientData] = useState(null);
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
                    // Check if we have a valid session PIN
                    const sessionPin = sessionStorage.getItem(`clientPin_${shareToken}`);
                    if (sessionPin) {
                        // Validate session PIN
                        const verifyResponse = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/verify-pin`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ pin: sessionPin })
                        });

                        if (verifyResponse.ok) {
                            const verifyData = await verifyResponse.json();
                            setClientData({ name: verifyData.clientName, id: verifyData.clientId, email: verifyData.clientEmail });
                            setAuthState('authenticated');
                        } else {
                            sessionStorage.removeItem(`clientPin_${shareToken}`);
                            setAuthState('login');
                        }
                    } else {
                        setAuthState('login');
                    }
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
            const verifyResponse = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            if (!verifyResponse.ok) {
                return false;
            }

            const verifyData = await verifyResponse.json();
            sessionStorage.setItem(`clientPin_${shareToken}`, pin);
            setClientData({ name: verifyData.clientName, id: verifyData.clientId, email: verifyData.clientEmail });
            setAuthState('authenticated');
            return true;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem(`clientPin_${shareToken}`);
        setAuthState('login');
        setClientData(null);
        navigate(`/client-portal/${shareToken}`);
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

    // Authenticated - show layout with sidebar
    return (
        <div className="flex min-h-screen bg-gray-50">
            <ClientPortalSidebar shareToken={shareToken} onLogout={handleLogout} />
            <div className="flex-1 ml-64 p-8">
                <Outlet context={{ clientData, shareToken }} />
            </div>
        </div>
    );
};

export default ClientPortalLayout;

