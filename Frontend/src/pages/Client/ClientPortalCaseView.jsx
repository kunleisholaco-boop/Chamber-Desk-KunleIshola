import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import ClientCaseOverview from '../../components/ClientPortal/ClientCaseOverview';
import ClientInformation from '../../components/ClientPortal/ClientInformation';
import ClientCaseDetails from '../../components/ClientPortal/ClientCaseDetails';
import ClientPartiesSection from '../../components/ClientPortal/ClientPartiesSection';
import ClientWitnessesSection from '../../components/ClientPortal/ClientWitnessesSection';
import ClientCourtInfo from '../../components/ClientPortal/ClientCourtInfo';
import ClientReportsTimeline from '../../components/ClientPortal/ClientReportsTimeline';
import API_BASE_URL from '../../../config/api';

const ClientPortalCaseView = () => {
    const { shareToken, caseId } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCaseDetails();
    }, [shareToken, caseId]);

    const fetchCaseDetails = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/client-portal/${shareToken}/case/${caseId}`);

            if (response.ok) {
                const data = await response.json();
                setCaseData(data);
            } else if (response.status === 404) {
                setError('Case not found or access denied.');
            } else {
                setError('Unable to load case details. Please try again later.');
            }
        } catch (err) {
            setError('Connection error. Please check your internet connection.');
        } finally {
            setIsLoading(false);
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
                    <p className="text-gray-600">Loading case details...</p>
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
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate(`/client-portal/${shareToken}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Show case details
    if (caseData) {
        return (
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(`/client-portal/${shareToken}/cases`)}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Cases
                </button>

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Case Details</h1>
                    <p className="text-gray-600">View all information about this case</p>
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
                    shareToken={shareToken}
                    caseId={caseId}
                />

                {/* Footer */}
                <div className="text-center text-gray-600 text-sm mt-8">
                    <p>If you have any questions, please contact your attorney.</p>
                </div>
            </div>
        );
    }

    return null;
};

export default ClientPortalCaseView;

