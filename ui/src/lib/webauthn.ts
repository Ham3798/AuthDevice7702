import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { 
  RegistrationResponseJSON, 
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/types';
import { decode as cborDecode } from 'cbor-x';
import base64url from 'base64url';

/**
 * WebAuthn 등록을 위한 옵션 생성
 */
export function generateRegistrationOptions(
  userAddress: string,
  deviceName: string
): PublicKeyCredentialCreationOptionsJSON {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  
  return {
    rp: {
      name: 'Device Manager 7702',
      id: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
    },
    user: {
      id: base64url.encode(userAddress),
      name: userAddress,
      displayName: deviceName,
    },
    challenge: base64url.encode(Buffer.from(challenge)),
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    timeout: 60000,
    attestation: 'direct',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
  };
}

/**
 * WebAuthn 인증을 위한 옵션 생성
 */
export function generateAuthenticationOptions(
  allowCredentials?: Array<{ id: string; type: 'public-key' }>
): PublicKeyCredentialRequestOptionsJSON {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  
  return {
    challenge: base64url.encode(Buffer.from(challenge)),
    timeout: 60000,
    userVerification: 'required',
    allowCredentials: allowCredentials || [],
  };
}

/**
 * WebAuthn 등록 시작
 */
export async function registerWebAuthnDevice(
  userAddress: string,
  deviceName: string
): Promise<RegistrationResponseJSON> {
  try {
    const options = generateRegistrationOptions(userAddress, deviceName);
    const response = await startRegistration({ optionsJSON: options });
    return response;
  } catch (error) {
    console.error('WebAuthn registration failed:', error);
    throw new Error('WebAuthn 등록에 실패했습니다: ' + (error as Error).message);
  }
}

/**
 * WebAuthn 인증 시작
 */
export async function authenticateWebAuthn(
  credentialId?: string
): Promise<AuthenticationResponseJSON> {
  try {
    const allowCredentials = credentialId ? [{
      id: credentialId,
      type: 'public-key' as const,
    }] : undefined;
    
    const options = generateAuthenticationOptions(allowCredentials);
    const response = await startAuthentication({ optionsJSON: options });
    return response;
  } catch (error) {
    console.error('WebAuthn authentication failed:', error);
    throw new Error('WebAuthn 인증에 실패했습니다: ' + (error as Error).message);
  }
}

/**
 * WebAuthn 응답을 스마트 컨트랙트에서 사용할 수 있는 형태로 변환
 */
export function formatWebAuthnForContract(response: AuthenticationResponseJSON) {
  const clientDataJSON = base64url.decode(response.response.clientDataJSON);
  const authenticatorData = base64url.decode(response.response.authenticatorData);
  const signature = base64url.decode(response.response.signature);
  
  return {
    credentialId: response.id,
    clientDataJSON: '0x' + Buffer.from(clientDataJSON).toString('hex'),
    authenticatorData: '0x' + Buffer.from(authenticatorData).toString('hex'),
    signature: '0x' + Buffer.from(signature).toString('hex'),
  };
}

/**
 * 공개키 추출 (등록 응답에서)
 */
export function extractPublicKeyFromRegistration(response: RegistrationResponseJSON): string {
  try {
    // attestationObject를 디코딩하여 공개키 추출
    const attestationObjectBuffer = base64url.toBuffer(response.response.attestationObject);
    const decoded = cborDecode(attestationObjectBuffer);
    
    if (decoded.authData) {
      const authData = new Uint8Array(decoded.authData);
      // 공개키는 authData의 끝부분에 있음 (CBOR 인코딩됨)
      const credentialDataStart = 37 + 16 + 2; // rpIdHash(32) + flags(1) + counter(4) + aaguid(16) + credIdLen(2)
      const credentialIdLength = new DataView(authData.buffer, 53, 2).getUint16(0);
      const publicKeyStart = credentialDataStart + credentialIdLength;
      const publicKeyData = authData.slice(publicKeyStart);
      
      return '0x' + Buffer.from(publicKeyData).toString('hex');
    }
    
    throw new Error('공개키를 찾을 수 없습니다');
  } catch (error) {
    console.error('공개키 추출 실패:', error);
    throw new Error('공개키 추출에 실패했습니다');
  }
}

/**
 * 디바이스 ID 생성 (credential ID를 해시하여 생성)
 */
export async function generateDeviceId(credentialId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(credentialId);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return '0x' + Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * WebAuthn 지원 여부 확인
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && 
         'credentials' in navigator && 
         'create' in navigator.credentials &&
         'get' in navigator.credentials;
}

/**
 * Platform Authenticator (TouchID/FaceID 등) 지원 여부 확인
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Platform authenticator check failed:', error);
    return false;
  }
}

/**
 * 임시 사용자 인증 (데모용)
 */
export async function authenticateUser(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1000);
  });
} 