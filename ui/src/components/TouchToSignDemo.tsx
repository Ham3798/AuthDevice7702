'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { 
  authenticateWebAuthn,
  formatWebAuthnForContract 
} from '@/lib/webauthn';
import { touchToSignTransaction } from '@/lib/zkProofs';

interface TouchToSignDemoProps {
  userAddress: string;
}

interface MockTransaction {
  to: string;
  value: string;
  data: string;
  description: string;
}

export function TouchToSignDemo({ userAddress }: TouchToSignDemoProps) {
  const [isSigning, setIsSigning] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<string>('transfer');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [signatureResult, setSignatureResult] = useState<{
    transaction: MockTransaction;
    signature: string;
    sessionAddress: string;
    timestamp: string;
    touchId: string;
    transactionHash: string;
  } | null>(null);

  // Mock transaction templates
  const mockTransactions: Record<string, MockTransaction> = {
    transfer: {
      to: '0x742d35Cc6634C0532925a3b8D8c6C0e8Ac7d26e5',
      value: ethers.parseEther('0.1').toString(),
      data: '0x',
      description: 'Send 0.1 ETH'
    },
    approve: {
      to: '0xA0b86a33E6941e6AA2FA8cB29c37F7Bd7f0e7E5F',
      value: '0',
      data: '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d8c6c0e8ac7d26e5000000000000000000000000000000000000000000000000016345785d8a0000',
      description: 'Approve ERC20 Token'
    },
    mint: {
      to: '0x8B2D1b9F4a8cD8e9F5C6A7E3B1F9D2C4E5A6B8C9',
      value: ethers.parseEther('0.01').toString(),
      data: '0x6a627842000000000000000000000000742d35cc6634c0532925a3b8d8c6c0e8ac7d26e5',
      description: 'Mint NFT'
    }
  };

  const handleTouchToSign = async () => {
    if (!selectedSession) {
      alert('Please select a session first');
      return;
    }

    setIsSigning(true);
    setSignatureResult(null);

    try {
      console.log('🚀 Touch-to-Sign Demo Starting...');

      // 1. Load session information
      const sessions = JSON.parse(localStorage.getItem(`sessions_${userAddress}`) || '[]');
      const session = sessions.find((s: { id: string }) => s.id === selectedSession);
      
      if (!session) {
        throw new Error('Session not found');
      }

      // 2. Prepare transaction data
      const txData = selectedTx === 'custom' ? {
        to: recipient,
        value: ethers.parseEther(amount || '0').toString(),
        data: '0x',
        description: `${amount || '0'} ETH → ${recipient}`
      } : mockTransactions[selectedTx];

      const transactionData = JSON.stringify({
        to: txData.to,
        value: txData.value,
        data: txData.data,
        nonce: Date.now(), // Mock nonce
        gasLimit: '21000',
        gasPrice: ethers.parseUnits('20', 'gwei').toString()
      });

      console.log('📝 Transaction prepared:', {
        description: txData.description,
        to: txData.to,
        value: txData.value
      });

      // 3. Touch ID authentication
      console.log('👆 Touch ID authentication request...');
      const touchResponse = await authenticateWebAuthn();
      const touchData = formatWebAuthnForContract(touchResponse);

      // Generate Touch signature data
      const touchSignature = JSON.stringify({
        r: touchData.signature.slice(0, 66),
        s: touchData.signature.slice(66, 132),
        challenge: touchData.clientDataJSON
      });

      // 4. Execute Touch-to-Sign
      console.log('🔐 Executing Touch-to-Sign...');
      const signResult = await touchToSignTransaction(
        transactionData,
        session.sessionKey, // Encrypted session key
        touchSignature
      );

      console.log('✅ Touch-to-Sign Complete:', signResult);

      setSignatureResult({
        transaction: txData,
        signature: signResult.signature,
        sessionAddress: signResult.sessionAddress,
        timestamp: new Date().toISOString(),
        touchId: touchResponse.id,
        transactionHash: ethers.keccak256(ethers.toUtf8Bytes(transactionData))
      });

      alert('✅ Touch-to-Sign Success!\n\n' +
            `👆 Touch ID: ${touchResponse.id.slice(0, 10)}...\n` +
            `✍️ Signature: ${signResult.signature.slice(0, 20)}...\n` +
            `🔑 Session: ${signResult.sessionAddress.slice(0, 10)}...`);

    } catch (error) {
      console.error('❌ Touch-to-Sign Failed:', error);
      alert('❌ Touch-to-Sign Failed:\n' + (error as Error).message);
    } finally {
      setIsSigning(false);
    }
  };

  // Load saved session list
  const sessions = JSON.parse(localStorage.getItem(`sessions_${userAddress}`) || '[]')
    .filter((s: { isActive: boolean; expiresAt: string }) => s.isActive && new Date(s.expiresAt) > new Date());

  return (
    <div className="space-y-6">
      {/* Non-functional Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex">
          <span className="text-red-500 mr-2">⚠️</span>
          <div>
            <h4 className="text-sm font-medium text-red-800">Not Implemented</h4>
            <p className="text-sm text-red-700">Touch-to-Sign functionality is not yet implemented. This is a UI mockup only.</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-purple-800 mb-2">
          👆 Transaction Execution Demo
        </h3>
        <p className="text-purple-600 text-sm mb-3">
          Low-cost ecrecover-based transactions with Touch ID security
        </p>
        <div className="bg-white rounded-md p-3">
          <h4 className="font-semibold text-purple-700 mb-2">⚡ Execution Flow</h4>
          <ol className="text-xs text-purple-600 space-y-1 list-decimal list-inside">
            <li><strong>Touch ID</strong> → Unlock encrypted session key</li>
            <li><strong>sessionPriv</strong> → Sign transaction locally</li>
            <li><strong>ecrecover</strong> → Low gas cost on-chain verification</li>
            <li><strong>SessionDelegate</strong> → Execute transaction</li>
          </ol>
        </div>
      </div>

      {/* Session Selection */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">1️⃣ Select Session</h4>
        {sessions.length === 0 ? (
          <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-md">
            No active sessions available. Please create a session first.
          </div>
        ) : (
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a session...</option>
            {sessions.map((session: { id: string; name: string; publicKey: string }) => (
              <option key={session.id} value={session.id}>
                {session.name} - {session.publicKey.slice(0, 10)}...
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Transaction Selection */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">2️⃣ Transaction Type</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(mockTransactions).map(([key, tx]) => (
            <button
              key={key}
              onClick={() => setSelectedTx(key)}
              className={`p-3 text-sm rounded-md border transition-colors ${
                selectedTx === key
                  ? 'bg-purple-100 border-purple-500 text-purple-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tx.description}
            </button>
          ))}
          <button
            onClick={() => setSelectedTx('custom')}
            className={`p-3 text-sm rounded-md border transition-colors ${
              selectedTx === 'custom'
                ? 'bg-purple-100 border-purple-500 text-purple-700'
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Custom Transfer
          </button>
        </div>

        {/* Custom transaction inputs */}
        {selectedTx === 'custom' && (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Touch-to-Sign Button */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">3️⃣ Execute Transaction</h4>
        <button
          onClick={handleTouchToSign}
          disabled={isSigning || !selectedSession || (selectedTx === 'custom' && (!recipient || !amount))}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-md hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-lg font-semibold"
        >
          {isSigning ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Touch-to-Sign...
            </span>
          ) : (
            '👆 Touch to Sign Transaction'
          )}
        </button>
      </div>

      {/* Signature Result */}
      {signatureResult && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">✅ Signature Result</h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-green-800 mb-2">Transaction Details</h5>
                <div className="text-sm text-green-700 space-y-1">
                  <p><span className="font-medium">Type:</span> {signatureResult.transaction.description}</p>
                  <p><span className="font-medium">To:</span> {signatureResult.transaction.to}</p>
                  <p><span className="font-medium">Value:</span> {ethers.formatEther(signatureResult.transaction.value)} ETH</p>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-green-800 mb-2">Signature Info</h5>
                <div className="text-sm text-green-700 space-y-1">
                  <p><span className="font-medium">Touch ID:</span> {signatureResult.touchId.slice(0, 20)}...</p>
                  <p><span className="font-medium">Session:</span> {signatureResult.sessionAddress.slice(0, 20)}...</p>
                  <p><span className="font-medium">Time:</span> {new Date(signatureResult.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-green-800 mb-2">Signature & Hash</h5>
              <div className="text-sm text-green-700 space-y-2">
                <div>
                  <span className="font-medium">Signature:</span>
                  <code className="block mt-1 p-2 bg-green-100 rounded text-xs break-all">
                    {signatureResult.signature}
                  </code>
                </div>
                <div>
                  <span className="font-medium">Transaction Hash:</span>
                  <code className="block mt-1 p-2 bg-green-100 rounded text-xs break-all">
                    {signatureResult.transactionHash}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">ℹ️ How Transaction Execution Works:</p>
        <ul className="space-y-1 text-blue-600">
          <li>• <strong>Touch ID unlocks session key</strong> - No MetaMask popup needed</li>
          <li>• <strong>sessionPriv signs transaction</strong> - Local cryptographic signing</li>
          <li>• <strong>ecrecover verification</strong> - Low gas cost on-chain validation</li>
          <li>• <strong>SessionDelegate execution</strong> - Smart contract handles the transaction</li>
          <li>• <strong>Zero private key exposure</strong> - Session keys are ephemeral and encrypted</li>
        </ul>
      </div>
    </div>
  );
} 