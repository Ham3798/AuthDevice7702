'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { DeviceRegistration } from './DeviceRegistration';
import { DeviceList } from './DeviceList';
import { SessionManager } from './SessionManager';
import { TouchToSignDemo } from './TouchToSignDemo';

export function DeviceManager() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'devices' | 'sessions' | 'touchsign'>('devices');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          🔗 Please Connect Your Wallet
        </h2>
        <p className="text-gray-600">
          You need to connect your wallet first to use Device Manager.
        </p>
      </div>
    );
  }

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Demo Status Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-amber-600 text-lg">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Demo Status: Non-Functional Prototype
            </h3>
            <p className="mt-1 text-sm text-amber-700">
              This is a UI demonstration only. All EIP-7702 features are not yet implemented and will not function.
              This demo shows the intended user interface and workflow design.
            </p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          📱 Connected Account
        </h2>
        <p className="text-gray-600 font-mono text-sm break-all">
          {address}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'devices'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🔐 Device Management
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'sessions'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🎫 Session Management
          </button>
          <button
            onClick={() => setActiveTab('touchsign')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'touchsign'
                ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            👆 Touch-to-Sign
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'devices' ? (
            <div className="space-y-6">
              <DeviceRegistration 
                userAddress={address!} 
                onDeviceRegistered={refreshData}
              />
              <DeviceList 
                userAddress={address!} 
                refreshTrigger={refreshTrigger}
                onDeviceAction={refreshData}
              />
            </div>
          ) : activeTab === 'sessions' ? (
            <SessionManager 
              userAddress={address!} 
              refreshTrigger={refreshTrigger}
            />
          ) : (
            <TouchToSignDemo 
              userAddress={address!}
            />
          )}
        </div>
      </div>
    </div>
  );
} 