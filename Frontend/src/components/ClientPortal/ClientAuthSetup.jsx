import React, { useState } from 'react';
import { Shield, User, Lock } from 'lucide-react';

const ClientAuthSetup = ({ clientName, onSetupComplete }) => {
    const [inputName, setInputName] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate PIN
        if (!/^\d{4}$/.test(pin)) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        setIsLoading(true);
        const success = await onSetupComplete(inputName, pin);
        setIsLoading(false);

        if (!success) {
            setError('Name verification failed. Please enter your full name exactly as registered.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-purple-100 rounded-full">
                        <Shield className="w-12 h-12 text-purple-600" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                    First-Time Setup
                </h2>
                <p className="text-gray-600 text-center mb-8">
                    Verify your identity and create a 4-digit PIN
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name *
                        </label>

                        {clientName && (
                            <div className="mb-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                                <p className="text-xs text-purple-600 font-medium mb-1">Your registered name:</p>
                                <p className="text-lg font-bold text-purple-900">{clientName}</p>
                                <p className="text-xs text-purple-600 mt-1">Please type this name exactly as shown above</p>
                            </div>
                        )}

                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {!clientName && (
                            <p className="text-xs text-gray-500 mt-1">
                                Enter your name exactly as it appears in the case
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Create 4-Digit PIN *
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="••••"
                                maxLength="4"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black text-center text-2xl tracking-widest"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirm PIN *
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="••••"
                                maxLength="4"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black text-center text-2xl tracking-widest"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Verifying...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClientAuthSetup;
