import React, { useState, useEffect } from 'react';
import { useParams, Outlet, useNavigate } from 'react-router-dom';
import { AlertCircle, Menu, X, Bell } from 'lucide-react';
import ClientAuthSetup from '../../components/ClientPortal/ClientAuthSetup';
import ClientAuthLogin from '../../components/ClientPortal/ClientAuthLogin';
import ClientPortalSidebar from '../../components/ClientPortal/ClientPortalSidebar';
import API_BASE_URL from '../../config/api';

const ClientPortalLayout = () => {
    const { shareToken } = useParams();
    const navigate = useNavigate();
    const [authState, setAuthState] = useState('checking'); // 'checking', 'setup', 'login', 'authenticated'
    const [clientData, setClientData] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        checkAuthStatus();
    }, [shareToken]);

    useEffect(() => {
        if (authState === 'authenticated') {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [authState, shareToken]);

    const fetchUnreadCount = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/notifications/unread-count`);
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count || 0);
            }
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    const checkAuthStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/details`);

            if (response.ok) {
                const data = await response.json();

                if (!data.pinSetupCompleted) {
                    // Store client name for setup page
                    setClientData({ name: data.clientName });
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
        return <ClientAuthSetup clientName={clientData?.name} onSetupComplete={handleSetupComplete} />;
    }

    if (authState === 'login') {
        return <ClientAuthLogin onLoginSuccess={handleLoginSuccess} />;
    }

    // Authenticated - show layout with sidebar
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar - Desktop (Fixed) */}
            <div className="hidden md:block">
                <ClientPortalSidebar
                    shareToken={shareToken}
                    onLogout={handleLogout}
                />
            </div>

            {/* Sidebar - Mobile (Overlay) */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="w-64 h-full" onClick={(e) => e.stopPropagation()}>
                        <div className="relative h-full">
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="absolute top-4 right-4 p-2 text-white hover:bg-gray-800 rounded-lg z-50"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <ClientPortalSidebar
                                shareToken={shareToken}
                                onLogout={handleLogout}
                                onNavigate={() => setSidebarOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - Add left margin for fixed sidebar on desktop */}
            <div className="md:ml-64">
                {/* Header - Mobile */}
                <header className="bg-white shadow-sm p-4 flex justify-between items-center md:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-black text-lg">Chamber Desk</h1>
                    <button
                        onClick={() => navigate(`/client-portal/${shareToken}/notifications`)}
                        className="relative p-2 text-gray-600"
                        title="Notifications"
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </header>

                {/* Content Area - Renders child routes */}
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet context={{ clientData, shareToken }} />
                </div>
            </div>
        </div>
    );
};

export default ClientPortalLayout;

