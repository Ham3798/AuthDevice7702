'use client';

import { useState, useEffect } from 'react';

interface Device {
  id: string;
  name: string;
  registeredAt: string;
  credentialId: string;
  publicKey: string;
  isActive: boolean;
}

interface DeviceListProps {
  userAddress: string;
  refreshTrigger: number;
  onDeviceAction: () => void;
}

export function DeviceList({ userAddress, refreshTrigger, onDeviceAction }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDeviceId, setLoadingDeviceId] = useState<string>('');

  useEffect(() => {
    loadDevices();
  }, [userAddress, refreshTrigger]);

  const loadDevices = () => {
    const storedDevices = JSON.parse(localStorage.getItem(`devices_${userAddress}`) || '[]');
    setDevices(storedDevices);
  };

  const handleToggleDevice = async (deviceId: string) => {
    setLoadingDeviceId(deviceId);
    try {
      const updatedDevices = devices.map(device =>
        device.id === deviceId ? { ...device, isActive: !device.isActive } : device
      );
      setDevices(updatedDevices);
      localStorage.setItem(`devices_${userAddress}`, JSON.stringify(updatedDevices));
      
      const device = updatedDevices.find(d => d.id === deviceId);
      alert(`✅ Device ${device?.isActive ? 'activated' : 'deactivated'}.`);
      onDeviceAction();
    } catch (error) {
      console.error('Device toggle failed:', error);
      alert('❌ Failed to change device status.');
    } finally {
      setLoadingDeviceId('');
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this device?')) {
      return;
    }

    setLoadingDeviceId(deviceId);
    try {
      const updatedDevices = devices.filter(device => device.id !== deviceId);
      setDevices(updatedDevices);
      localStorage.setItem(`devices_${userAddress}`, JSON.stringify(updatedDevices));
      
      alert('✅ Device has been removed.');
      onDeviceAction();
    } catch (error) {
      console.error('Device removal failed:', error);
      alert('❌ Failed to remove device.');
    } finally {
      setLoadingDeviceId('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  if (devices.length === 0) {
    return (
      <div className="space-y-4">
        {/* Non-functional Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex">
            <span className="text-red-500 mr-2">⚠️</span>
            <div>
              <h4 className="text-sm font-medium text-red-800">Not Implemented</h4>
              <p className="text-sm text-red-700">Device management functionality is not yet implemented. This is a UI mockup only.</p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800">
          📱 Registered Devices
        </h3>
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">📵</p>
          <p>No registered devices.</p>
          <p className="text-sm">Try registering a new device above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Non-functional Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex">
          <span className="text-red-500 mr-2">⚠️</span>
          <div>
            <h4 className="text-sm font-medium text-red-800">Not Implemented</h4>
            <p className="text-sm text-red-700">Device management functionality is not yet implemented. This is a UI mockup only.</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800">
        📱 Registered Devices ({devices.length})
      </h3>
      
      <div className="space-y-3">
        {devices.map((device) => (
          <div
            key={device.id}
            className={`border rounded-lg p-4 transition-all ${
              device.isActive 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${
                    device.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`}></span>
                  <h4 className="font-medium text-gray-800">{device.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    device.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {device.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Registered: {formatDate(device.registeredAt)}</p>
                  <p className="font-mono break-all">
                    ID: {device.credentialId.slice(0, 20)}...
                  </p>
                </div>
              </div>

              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleToggleDevice(device.id)}
                  disabled={loadingDeviceId === device.id}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    device.isActive
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } disabled:opacity-50`}
                >
                  {loadingDeviceId === device.id ? (
                    '⏳'
                  ) : device.isActive ? (
                    '🔒 Deactivate'
                  ) : (
                    '🔓 Activate'
                  )}
                </button>
                
                <button
                  onClick={() => handleRemoveDevice(device.id)}
                  disabled={loadingDeviceId === device.id}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
                >
                  {loadingDeviceId === device.id ? '⏳' : '🗑️ Remove'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-700">
        <p className="font-medium mb-1">⚠️ Security Notice:</p>
        <ul className="space-y-1 text-amber-600">
          <li>• Only register trusted devices</li>
          <li>• Remove lost or stolen devices immediately</li>
          <li>• Review your device list regularly</li>
        </ul>
      </div>
    </div>
  );
} 