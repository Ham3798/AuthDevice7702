import { DeviceManager } from '@/components/DeviceManager';
import { NetworkWarning } from '@/components/NetworkWarning';
import { Eip7702Verification } from '@/components/Eip7702Verification';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Connect Button */}
      <div className="flex justify-center">
        <ConnectButton />
      </div>

      {/* EIP-7702 Network Status Warning */}
      <NetworkWarning />

      {/* Device Manager Main Component */}
      <DeviceManager />
      
      {/* EIP-7702 Specification Verification */}
      <Eip7702Verification />

      {/* AuthDevice7702 Hybrid Model Description */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">
          🌟 AuthDevice7702 - EIP-7702 + WebAuthn Hybrid Model
        </h2>
        <p className="text-purple-700 mb-4">
          Revolutionary approach: One-time MetaMask setup transforms EOA into smart account, then Touch ID handles all future transactions with low gas costs
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-md p-4">
            <h4 className="font-semibold text-purple-600 mb-2">🔐 MetaMask-Free UX</h4>
            <p className="text-purple-700">After initial setup, only Touch ID needed for all transactions</p>
          </div>
          <div className="bg-white rounded-md p-4">
            <h4 className="font-semibold text-green-600 mb-2">⛽ Ultra-Low Gas</h4>
            <p className="text-green-700">ecrecover-based session signatures avoid expensive ZK verification</p>
          </div>
          <div className="bg-white rounded-md p-4">
            <h4 className="font-semibold text-blue-600 mb-2">🛡️ ZK Privacy</h4>
            <p className="text-blue-700">Noir circuits protect WebAuthn signatures while proving authenticity</p>
          </div>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 AuthDevice7702 Demo Workflow</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-blue-600">1️⃣ Device Registration</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• <strong>One-time MetaMask signature</strong> for existing EOA (SETCODETX, etc.)</li>
              <li>• Passkey (WebAuthn) authentication → ZK Proof generation in Noir</li>
              <li>• On-chain registration to DeviceManager</li>
              <li>• <strong>EOA → EIP-7702 Smart Account upgrade</strong></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-green-600">2️⃣ Session Start</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• <strong>No more MetaMask required</strong> after initial setup</li>
              <li>• Passkey ZK Proof generation (touch authentication)</li>
              <li>• Call startSession() → Register session key to SessionDelegate</li>
              <li>• Encrypted session key stored locally</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-purple-600">3️⃣ Transaction Execution</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>• <strong>Touch ID for every TX</strong> to unlock session key</li>
              <li>• Sign with sessionPriv → ecrecover-based execution</li>
              <li>• <strong>Low gas cost</strong> transactions</li>
              <li>• Zero-knowledge privacy protection</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>🔑 Key Innovation:</strong> After initial MetaMask setup, users only need Touch ID for all transactions. 
            The hybrid model combines EIP-7702 smart account capabilities with WebAuthn security and ZK privacy, 
            while maintaining low gas costs through ecrecover-based session signatures.
          </p>
        </div>
        
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>🚧 Current Status:</strong> This demo currently shows UI mockups only. 
            The actual EIP-7702 upgrade, Noir ZK circuits, and WebAuthn integration are not yet implemented.
          </p>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🛠️ Technology Stack</h2>
        <div className="flex flex-wrap gap-2">
          {[
            'EIP-7702 (Not Implemented)',
            'WebAuthn (Simulation)',
            'Account Abstraction',
            'ZK Proofs (Mock)',
            'Multi-Device',
            'Session Keys',
            'Next.js',
            'TypeScript',
            'Tailwind CSS',
            'RainbowKit',
            'Wagmi',
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Demo Status Disclaimer */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 mb-4">
          ⚠️ Demo Status: Non-Functional Prototype
        </h2>
        <div className="space-y-3 text-red-700">
          <p>
            <strong>This is a UI demonstration only.</strong> All EIP-7702 features displayed in this interface are not yet implemented and will not function.
          </p>
          <p>
            This demo serves to showcase the intended user interface design and workflow for the AuthDevice7702 hybrid authentication model.
          </p>
          <div className="mt-4 p-3 bg-red-100 rounded border">
            <p className="text-sm font-medium">What works:</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>• User interface and navigation</li>
              <li>• Form interactions and validations</li>
              <li>• Local storage for demo data</li>
            </ul>
          </div>
          <div className="mt-3 p-3 bg-red-100 rounded border">
            <p className="text-sm font-medium">What doesn't work:</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>• Actual EIP-7702 authorization creation</li>
              <li>• Real WebAuthn device registration</li>
              <li>• On-chain transactions</li>
              <li>• ZK proof generation</li>
              <li>• Session key cryptography</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
