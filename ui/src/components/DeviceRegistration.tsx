'use client';

import { useState, useEffect } from 'react';
import { 
  registerWebAuthnDevice, 
  isWebAuthnSupported, 
  isPlatformAuthenticatorAvailable,
  extractPublicKeyFromRegistration,
  generateDeviceId,
  formatWebAuthnForContract
} from '@/lib/webauthn';
import { 
  generateDeviceRegistrationProof,
  createEIP7702Authorization
} from '@/lib/zkProofs';
import { ethers } from 'ethers';

interface DeviceRegistrationProps {
  userAddress: string;
  onDeviceRegistered: () => void;
}

export function DeviceRegistration({ userAddress, onDeviceRegistered }: DeviceRegistrationProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false);

  useEffect(() => {
    // Check WebAuthn support
    setWebAuthnSupported(isWebAuthnSupported());
    
    // Check platform authenticator availability
    isPlatformAuthenticatorAvailable().then(setPlatformAuthAvailable);
  }, []);

  const handleRegisterDevice = async () => {
    if (!webAuthnSupported) {
      alert('This browser does not support WebAuthn');
      return;
    }

    // Auto-generate device name
    const finalDeviceName = `Device-${Date.now().toString().slice(-6)}`;

    setIsRegistering(true);
    try {
      console.log('🚀 Option 4 Device Registration Starting...');

      // 1. Execute WebAuthn registration
      const registrationResponse = await registerWebAuthnDevice(userAddress, finalDeviceName);
      
      // 2. Extract public key
      const publicKey = extractPublicKeyFromRegistration(registrationResponse);
      
      // 3. Generate device ID
      const deviceId = await generateDeviceId(registrationResponse.id);
      
      // 4. Generate ZK Proof (P-256 signature → ZK proof)
      console.log('🔄 Generating ZK Proof...');
      
      // Extract required data from registration response
      const mockSignature = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(64)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      
      const zkProof = await generateDeviceRegistrationProof(publicKey, {
        r: mockSignature.slice(0, 66), // First 32 bytes
        s: mockSignature.slice(66, 132), // Next 32 bytes
        clientDataJSON: registrationResponse.response.clientDataJSON,
        authenticatorData: registrationResponse.response.attestationObject
      });

      // 5. Prepare EIP-7702 Authorization (required for actual deployment)
      const mockWallet = new ethers.Wallet(ethers.hexlify(ethers.randomBytes(32)));
      const eip7702Auth = await createEIP7702Authorization(
        '0x1234567890123456789012345678901234567890', // DeviceManager address
        0, // nonce
        11155111, // Sepolia chain ID
        mockWallet
      );

      console.log('✅ Option 4 Registration Flow Complete:', {
        deviceId: deviceId,
        publicKey,
        zkProofLength: zkProof.proof.length,
        eip7702Ready: !!eip7702Auth
      });
      
      // 6. Save to local storage (would actually save on-chain)
      const devices = JSON.parse(localStorage.getItem(`devices_${userAddress}`) || '[]');
      const newDevice = {
        id: deviceId,
        name: finalDeviceName,
        registeredAt: new Date().toISOString(),
        credentialId: registrationResponse.id,
        publicKey,
        zkProof: zkProof.proof,
        isActive: true,
        // Option 4 specific data
        model: 'AuthDevice7702_Option4',
        registrationData: {
          clientDataJSON: registrationResponse.response.clientDataJSON,
          attestationObject: registrationResponse.response.attestationObject
        },
        eip7702Authorization: eip7702Auth
      };
      devices.push(newDevice);
      localStorage.setItem(`devices_${userAddress}`, JSON.stringify(devices));

      alert('✅ EIP-7702 + ZK Proof Device Registration Successful!\n\n' +
            `📱 Device ID: ${deviceId.slice(0, 10)}...\n` +
            `🔐 ZK Proof: ${zkProof.proof.length} bytes\n` +
            `🔗 EIP-7702 Ready: ${!!eip7702Auth}`);
      
      onDeviceRegistered();

    } catch (error) {
      console.error('❌ Option 4 Registration Failed:', error);
      alert('❌ EIP-7702 Device Registration Failed:\n' + (error as Error).message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Non-functional Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex">
          <span className="text-red-500 mr-2">⚠️</span>
          <div>
            <h4 className="text-sm font-medium text-red-800">Not Implemented</h4>
            <p className="text-sm text-red-700">Device registration functionality is not yet implemented. This is a UI mockup only.</p>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800">
        🆕 Register New Device (EIP-7702 Upgrade)
      </h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Registration Process</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li><strong>MetaMask Signature</strong> - One-time EOA signature for SETCODETX</li>
            <li><strong>Passkey Authentication</strong> - WebAuthn Touch ID verification</li>
            <li><strong>ZK Proof Generation</strong> - Noir circuit creates privacy proof</li>
            <li><strong>Smart Account Upgrade</strong> - EOA → EIP-7702 transformation</li>
            <li><strong>On-chain Registration</strong> - Device registered to DeviceManager</li>
          </ol>
        </div>
        
        <button
          onClick={handleRegisterDevice}
          disabled={isRegistering || !webAuthnSupported}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isRegistering ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing EIP-7702 Upgrade...
            </span>
          ) : (
            '🔐 Start EIP-7702 Device Registration'
          )}
        </button>
      </div>

      {/* WebAuthn Support Status */}
      <div className={`border rounded-md p-4 text-sm ${
        webAuthnSupported 
          ? 'border-green-200 bg-green-50 text-green-700' 
          : 'border-red-200 bg-red-50 text-red-700'
      }`}>
        <p className="font-medium mb-1">
          {webAuthnSupported ? '✅ WebAuthn Supported' : '❌ WebAuthn Not Supported'}
        </p>
        {webAuthnSupported ? (
          <div className="space-y-1 text-green-600">
            <p>• Platform Authenticator: {platformAuthAvailable ? 'Available' : 'Not Available'}</p>
            <p>• Biometric authentication or hardware keys can be used</p>
            <p>• Only registered devices can access the account</p>
          </div>
        ) : (
          <div className="space-y-1 text-red-600">
            <p>• This browser does not support WebAuthn</p>
            <p>• Please use modern browsers like Chrome, Firefox, Safari</p>
          </div>
        )}
      </div>
    </div>
  );
} 