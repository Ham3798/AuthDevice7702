// Contract addresses (테스트넷용 - 실제 배포 시 업데이트 필요)
export const CONTRACT_ADDRESSES = {
  // EIP-7702 관련 컨트랙트들
  DEVICE_MANAGER: '0x1234567890123456789012345678901234567890', // DeviceManager 컨트랙트
  SESSION_DELEGATE: '0x2345678901234567890123456789012345678901', // SessionDelegate 컨트랙트
  WEBAUTHN_ACCOUNT: '0x3456789012345678901234567890123456789012', // WebAuthnAccount 컨트랙트
  
  // Account Abstraction 관련
  ENTRYPOINT: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // EntryPoint v0.6
  ACCOUNT_FACTORY: '0x4567890123456789012345678901234567890123', // AccountFactory
  
  // 테스트용 토큰들
  MOCK_ERC20: '0x6789012345678901234567890123456789012345',
  MOCK_ERC721: '0x7890123456789012345678901234567890123456',
} as const;

// 간단한 ABI들 (실제 배포된 컨트랙트에서 가져와야 함)
export const DEVICE_MANAGER_ABI = [
  // Device 관련 함수들
  'function registerDevice(bytes calldata publicKey, string calldata deviceName) external',
  'function deactivateDevice(bytes32 deviceId) external',
  'function isDeviceActive(address user, bytes32 deviceId) external view returns (bool)',
  'function getDeviceCount(address user) external view returns (uint256)',
  'function getDevice(address user, uint256 index) external view returns (bytes32 deviceId, string memory name, bool isActive)',
  
  // Events
  'event DeviceRegistered(address indexed user, bytes32 indexed deviceId, string name)',
  'event DeviceDeactivated(address indexed user, bytes32 indexed deviceId)',
] as const;

export const SESSION_DELEGATE_ABI = [
  // Session 관련 함수들
  'function createSession(address sessionKey, uint256 expiresAt, bytes4[] calldata allowedSelectors) external',
  'function revokeSession(address sessionKey) external',
  'function isSessionActive(address user, address sessionKey) external view returns (bool)',
  'function getSessionInfo(address user, address sessionKey) external view returns (uint256 expiresAt, bool isActive)',
  
  // Events
  'event SessionCreated(address indexed user, address indexed sessionKey, uint256 expiresAt)',
  'event SessionRevoked(address indexed user, address indexed sessionKey)',
] as const;

export const WEBAUTHN_ACCOUNT_ABI = [
  // WebAuthn 인증 관련
  'function initialize(address anOwner, address aDeviceManager) external',
  'function executeWithWebAuthn(address to, uint256 value, bytes calldata data, bytes calldata webAuthnData) external',
  'function verifyWebAuthnSignature(bytes32 messageHash, bytes calldata webAuthnData) external view returns (bool)',
  
  // Account 기본 함수들
  'function execute(address to, uint256 value, bytes calldata data) external',
  'function executeBatch(address[] calldata to, uint256[] calldata value, bytes[] calldata data) external',
  'function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4)',
  
  // Events
  'event WebAuthnExecution(address indexed to, uint256 value, bytes data)',
] as const;

// Network configurations
export const SUPPORTED_CHAINS = {
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  goerli: {
    id: 5,
    name: 'Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://goerli.etherscan.io',
  },
  localhost: {
    id: 31337,
    name: 'Localhost',
    rpcUrl: 'http://localhost:8545',
    blockExplorer: '',
  },
} as const;

// Gas 설정
export const GAS_SETTINGS = {
  DEVICE_REGISTRATION: '500000', // 디바이스 등록에 필요한 가스
  SESSION_CREATION: '300000',    // 세션 생성에 필요한 가스
  SESSION_REVOCATION: '100000',  // 세션 취소에 필요한 가스
  WEBAUTHN_EXECUTION: '800000',  // WebAuthn 실행에 필요한 가스
} as const; 