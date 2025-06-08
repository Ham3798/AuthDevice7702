'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  authenticateWebAuthn,
  formatWebAuthnForContract 
} from '@/lib/webauthn';
import { 
  generateSessionStartProof,
  createEncryptedSessionKey
} from '@/lib/zkProofs';

interface Session {
  id: string;
  name: string;
  sessionKey: string;
  publicKey: string;
  expiresAt: string;
  createdAt: string;
  isActive: boolean;
  permissions: string[];
}

interface SessionManagerProps {
  userAddress: string;
  refreshTrigger: number;
}

export function SessionManager({ userAddress, refreshTrigger }: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);
  const [loadingSessionId, setLoadingSessionId] = useState<string>('');

  useEffect(() => {
    loadSessions();
  }, [userAddress, refreshTrigger]);

  const loadSessions = () => {
    const storedSessions = JSON.parse(localStorage.getItem(`sessions_${userAddress}`) || '[]');
    // Auto-deactivate expired sessions
    const updatedSessions = storedSessions.map((session: Session) => ({
      ...session,
      isActive: session.isActive && new Date(session.expiresAt) > new Date()
    }));
    setSessions(updatedSessions);
    localStorage.setItem(`sessions_${userAddress}`, JSON.stringify(updatedSessions));
  };

  const createSession = async () => {
    // Auto-generate session name
    const sessionName = `Session-${Date.now().toString().slice(-6)}`;

    setIsCreating(true);
    try {
      console.log('🚀 Option 4 Session Creation Starting...');

      // 1. Require Touch ID authentication
      console.log('👆 Touch ID session start authentication...');
      const touchResponse = await authenticateWebAuthn();
      const touchData = formatWebAuthnForContract(touchResponse);

      // 2. Generate new session key
      const sessionWallet = new ethers.Wallet(ethers.hexlify(ethers.randomBytes(32)));
      
      // 3. Structure Touch signature data
      const touchSignature = {
        r: touchData.signature.slice(0, 66),
        s: touchData.signature.slice(66, 132),
        challenge: touchData.clientDataJSON
      };

      // 4. Generate ZK Proof (session start proof)
      console.log('🔄 Generating session start ZK Proof...');
      const sessionZkProof = await generateSessionStartProof(
        sessionWallet.address,
        touchSignature,
        'mock_device_id' // Actually use registered device ID
      );

      // 5. Generate AES encrypted session key
      console.log('🔐 Encrypting session key with Touch ID...');
      const encryptedSession = createEncryptedSessionKey(
        JSON.stringify(touchSignature),
        sessionWallet.privateKey
      );
      
      // 6. Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);
      
      console.log('✅ Option 4 Session Creation Complete:', {
        sessionAddress: sessionWallet.address,
        zkProofLength: sessionZkProof.proof.length,
        encryptedKeyLength: encryptedSession.encryptedKey.length,
        keyId: encryptedSession.keyId,
        expiresAt: expiresAt.toISOString()
      });

      const newSession: Session = {
        id: encryptedSession.keyId,
        name: sessionName,
        sessionKey: encryptedSession.encryptedKey, // Store encrypted key
        publicKey: sessionWallet.address,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        isActive: true,
        permissions: ['transfer', 'approve'],
      };

      const updatedSessions = [...sessions, newSession];
      setSessions(updatedSessions);
      localStorage.setItem(`sessions_${userAddress}`, JSON.stringify(updatedSessions));

      alert('✅ EIP-7702 + ZK Proof Session Creation Successful!\n\n' +
            `🎫 Session ID: ${encryptedSession.keyId.slice(0, 10)}...\n` +
            `🔐 Encrypted: ${encryptedSession.encryptedKey.length} chars\n` +
            `👆 Touch-to-Sign Ready!`);
      
      setExpirationHours(24);

    } catch (error) {
      console.error('❌ Option 4 Session Creation Failed:', error);
      alert('❌ EIP-7702 Session Creation Failed:\n' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) {
      return;
    }

    setLoadingSessionId(sessionId);
    try {
      const updatedSessions = sessions.map(session =>
        session.id === sessionId ? { ...session, isActive: false } : session
      );
      setSessions(updatedSessions);
      localStorage.setItem(`sessions_${userAddress}`, JSON.stringify(updatedSessions));
      
      alert('✅ Session has been revoked.');
    } catch (error) {
      console.error('Session revocation failed:', error);
      alert('❌ Failed to revoke session.');
    } finally {
      setLoadingSessionId('');
    }
  };

  const copySessionKey = (sessionKey: string) => {
    navigator.clipboard.writeText(sessionKey);
    alert('📋 Session key copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Non-functional Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex">
          <span className="text-red-500 mr-2">⚠️</span>
          <div>
            <h4 className="text-sm font-medium text-red-800">Not Implemented</h4>
            <p className="text-sm text-red-700">Session management functionality is not yet implemented. This is a UI mockup only.</p>
          </div>
        </div>
      </div>

      {/* Create New Session */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          ➕ Start New Session (No MetaMask Required)
        </h3>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">🔄 Session Creation Process</h4>
          <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
            <li><strong>Touch ID Authentication</strong> - Passkey verification for security</li>
            <li><strong>ZK Proof Generation</strong> - Privacy-preserving authentication proof</li>
            <li><strong>Session Key Creation</strong> - Generate ephemeral signing key</li>
            <li><strong>startSession() Call</strong> - Register session key to SessionDelegate</li>
            <li><strong>Local Encryption</strong> - Encrypted session key stored securely</li>
          </ol>
        </div>

        <div className="grid md:grid-cols-1 gap-4">
          <div>
            <label htmlFor="expirationHours" className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Time (hours)
            </label>
            <select
              id="expirationHours"
              value={expirationHours}
              onChange={(e) => setExpirationHours(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={168}>1 week</option>
            </select>
          </div>
        </div>

        <button
          onClick={createSession}
          disabled={isCreating}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Session...
            </span>
          ) : (
            '🎫 Create Session with Touch ID'
          )}
        </button>
      </div>

      {/* Active Sessions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          🎫 Active Sessions ({sessions.filter(s => s.isActive && !isExpired(s.expiresAt)).length})
        </h3>
        
        {sessions.filter(s => s.isActive && !isExpired(s.expiresAt)).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">🎫</p>
            <p>No active sessions.</p>
            <p className="text-sm">Create a new session above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions
              .filter(s => s.isActive && !isExpired(s.expiresAt))
              .map((session) => (
                <div
                  key={session.id}
                  className="border border-green-200 bg-green-50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <h4 className="font-medium text-gray-800">{session.name}</h4>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Created: {formatDate(session.createdAt)}</p>
                        <p>Expires: {formatDate(session.expiresAt)}</p>
                        <p className="text-green-600 font-medium">
                          ⏱️ {getTimeUntilExpiry(session.expiresAt)}
                        </p>
                        <p className="font-mono text-xs break-all">
                          ID: {session.id.slice(0, 20)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => copySessionKey(session.sessionKey)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                      >
                        📋 Copy Key
                      </button>
                      
                      <button
                        onClick={() => revokeSession(session.id)}
                        disabled={loadingSessionId === session.id}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
                      >
                        {loadingSessionId === session.id ? '⏳' : '🚫 Revoke'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Expired Sessions */}
      {sessions.filter(s => !s.isActive || isExpired(s.expiresAt)).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            ⏰ Expired Sessions ({sessions.filter(s => !s.isActive || isExpired(s.expiresAt)).length})
          </h3>
          
          <div className="space-y-3">
            {sessions
              .filter(s => !s.isActive || isExpired(s.expiresAt))
              .map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                        <h4 className="font-medium text-gray-800">{session.name}</h4>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          {isExpired(session.expiresAt) ? 'Expired' : 'Revoked'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Created: {formatDate(session.createdAt)}</p>
                        <p>Expired: {formatDate(session.expiresAt)}</p>
                        <p className="font-mono text-xs break-all">
                          ID: {session.id.slice(0, 20)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">ℹ️ Session Information:</p>
        <ul className="space-y-1 text-blue-600">
          <li>• Sessions enable Touch-to-Sign functionality</li>
          <li>• Each session has a unique encrypted key</li>
          <li>• Sessions automatically expire after the set time</li>
          <li>• You can revoke sessions manually at any time</li>
        </ul>
      </div>
    </div>
  );
} 