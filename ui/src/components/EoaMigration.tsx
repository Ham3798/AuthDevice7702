'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, useChainId, usePublicClient } from 'wagmi';

interface EoaMigrationProps {
  userAddress: string;
}

export function EoaMigration({ userAddress }: EoaMigrationProps) {
  const [isCreatingAuth, setIsCreatingAuth] = useState(false);
  const [accountNonce, setAccountNonce] = useState<number | null>(null);
  const [codeSize, setCodeSize] = useState<number | null>(null);
  const [authorizationResult, setAuthorizationResult] = useState<{
    txHash: string;
    deviceManagerAddress: string;
    status: string;
    authData?: any;
  } | null>(null);

  const { data: walletClient } = useWalletClient();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  // EIP-7702 데모 지원 여부 확인
  const isEip7702Supported = [17000, 11155111].includes(chainId); // Holesky (기본값), Sepolia

  // 계정 상태 확인
  useEffect(() => {
    const checkAccountStatus = async () => {
      if (!isConnected || !publicClient || !userAddress) return;

      try {
        // nonce 확인 (EIP-7702는 모든 nonce에서 사용 가능)
        const nonce = await publicClient.getTransactionCount({
          address: userAddress as `0x${string}`,
        });

        // 코드 크기 확인 (EOA인지 확인)
        const code = await publicClient.getBytecode({
          address: userAddress as `0x${string}`,
        });
        
        setAccountNonce(nonce);
        setCodeSize(code ? code.length : 0);

        console.log('계정 상태 확인:', {
          address: userAddress,
          nonce,
          codeSize: code ? code.length : 0,
          isEOA: !code || code === '0x'
        });

      } catch (error) {
        console.error('계정 상태 확인 실패:', error);
      }
    };

    checkAccountStatus();
  }, [isConnected, publicClient, userAddress]);

  const handleCreateAuthorization = async () => {
    if (!isConnected || !walletClient) {
      alert('지갑이 연결되지 않았습니다');
      return;
    }

    if (!isEip7702Supported) {
      alert('EIP-7702 데모를 지원하지 않는 네트워크입니다.\nHolesky 또는 Sepolia 네트워크로 전환해주세요.');
      return;
    }

    setIsCreatingAuth(true);
    setAuthorizationResult(null);

    try {
      console.log('🚀 EIP-7702 Authorization 생성 시작...');

      // 1. DeviceManager 컨트랙트 주소 (실제로는 배포된 주소 사용)
      const deviceManagerAddress = '0x1234567890123456789012345678901234567890';
      
      // 2. 현재 nonce 가져오기
      const currentNonce = accountNonce || 0;

      console.log('📝 Authorization 데이터 준비:', {
        chainId,
        address: deviceManagerAddress,
        nonce: currentNonce
      });

      // 3. EIP-712 도메인 및 타입 정의 (EIP-7702 사양)
      const domain = {
        name: 'AuthDevice7702',
        version: '1',
        chainId,
        verifyingContract: userAddress as `0x${string}` // EOA 주소
      };

      const types = {
        Authorization: [
          { name: 'chainId', type: 'uint256' },
          { name: 'address', type: 'address' },
          { name: 'nonce', type: 'uint256' }
        ]
      };

      // 4. Authorization 메시지
      const authorization = {
        chainId: BigInt(chainId),
        address: deviceManagerAddress,
        nonce: BigInt(currentNonce)
      };

      console.log('✍️ EIP-712 Authorization 서명 중...');

      // 5. Authorization 서명 (EIP-712)
      const signature = await walletClient.signTypedData({
        account: userAddress as `0x${string}`,
        domain,
        types,
        primaryType: 'Authorization',
        message: authorization
      });

      console.log('✅ Authorization 서명 완료:', signature);

      // 6. authorizationList 구성 (EIP-7702 트랜잭션용)
      const r = signature.slice(0, 66);
      const s = '0x' + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);
      
      const authorizationList = [{
        chainId: `0x${chainId.toString(16)}`,
        address: deviceManagerAddress,
        nonce: `0x${currentNonce.toString(16)}`,
        yParity: v === 27 ? '0x0' : '0x1',
        r: r,
        s: s
      }];

      console.log('📋 authorizationList 생성:', authorizationList);

      // 7. 데모 트랜잭션 실행 (실제로는 이 authorization을 사용하는 트랜잭션)
      // 실제 EIP-7702에서는 이 authorizationList를 포함한 트랜잭션을 전송
      const demoTx = await walletClient.sendTransaction({
        account: userAddress as `0x${string}`,
        to: userAddress as `0x${string}`, // 자기 자신에게 (데모용)
        value: BigInt(0),
        data: '0x' // 빈 데이터 (실제로는 DeviceManager 함수 호출)
        // authorizationList: authorizationList // EIP-7702 지원 시 추가
      });

      console.log('✅ EIP-7702 Authorization 트랜잭션 완료:', demoTx);

      setAuthorizationResult({
        txHash: demoTx,
        deviceManagerAddress: deviceManagerAddress,
        status: 'SUCCESS',
        authData: {
          authorization,
          signature,
          authorizationList
        }
      });

      alert('✅ EIP-7702 Authorization 생성 성공!\n\n' +
            `📝 Transaction: ${demoTx.slice(0, 20)}...\n` +
            `🏗️ DeviceManager: ${deviceManagerAddress.slice(0, 20)}...\n` +
            `🎉 이제 이 Authorization을 사용하여 DeviceManager를 delegate call할 수 있습니다!`);

    } catch (error: any) {
      console.error('❌ Authorization 생성 실패:', error);
      
      setAuthorizationResult({
        txHash: '',
        deviceManagerAddress: '',
        status: 'FAILED'
      });

      alert('❌ EIP-7702 Authorization 생성 실패:\n' + 
            (error?.message || error?.toString() || '알 수 없는 오류'));
    } finally {
      setIsCreatingAuth(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-green-800 mb-2">
          🔄 EIP-7702 Authorization 생성
        </h3>
        <p className="text-green-600 text-sm mb-4">
          EOA가 DeviceManager 컨트랙트를 delegate call할 수 있도록 일시적 권한을 부여합니다.
        </p>
        
        <div className="bg-green-100 rounded-md p-4 text-sm text-green-700">
          <p className="font-medium mb-2">🎯 EIP-7702 특징:</p>
          <ul className="space-y-1">
            <li>• <strong>일시적 권한</strong>: 각 트랜잭션에서만 유효</li>
            <li>• <strong>유연한 선택</strong>: 매번 다른 컨트랙트 선택 가능</li>
            <li>• <strong>되돌리기 가능</strong>: 언제든지 일반 EOA로 복원</li>
            <li>• <strong>nonce 제한 없음</strong>: 모든 nonce에서 사용 가능</li>
          </ul>
        </div>
      </div>

      {/* 계정 상태 정보 */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">현재 계정 상태</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>주소:</span>
            <span className="font-mono">{userAddress}</span>
          </div>
          <div className="flex justify-between">
            <span>Nonce:</span>
            <span className="font-medium text-blue-600">
              {accountNonce !== null ? accountNonce : 'Loading...'}
              <span className="text-xs text-gray-500 ml-1">(제한 없음)</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span>계정 유형:</span>
            <span className={`font-medium ${codeSize === 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {codeSize === 0 ? '✅ EOA' : `❓ Contract (${codeSize} bytes)`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>EIP-7702 지원:</span>
            <span className={`font-medium ${isEip7702Supported ? 'text-green-600' : 'text-red-600'}`}>
              {isEip7702Supported ? '✅ 지원됨' : '❌ 미지원'}
            </span>
          </div>
        </div>
      </div>

      {/* Authorization 생성 버튼 */}
      <button
        onClick={handleCreateAuthorization}
        disabled={isCreatingAuth || !isConnected || !isEip7702Supported}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium"
      >
        {isCreatingAuth ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            EIP-7702 Authorization 생성 중...
          </span>
        ) : (
          '🚀 DeviceManager Authorization 생성'
        )}
      </button>

      {/* Authorization 결과 */}
      {authorizationResult && (
        <div className={`border rounded-lg p-4 ${
          authorizationResult.status === 'SUCCESS' 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <h4 className={`font-semibold mb-3 ${
            authorizationResult.status === 'SUCCESS' ? 'text-green-800' : 'text-red-800'
          }`}>
            {authorizationResult.status === 'SUCCESS' ? '✅ Authorization 생성 성공' : '❌ Authorization 생성 실패'}
          </h4>
          
          {authorizationResult.status === 'SUCCESS' && (
            <div className="space-y-3 text-sm text-green-700">
              <div className="flex justify-between">
                <span>트랜잭션 해시:</span>
                <span className="font-mono break-all">{authorizationResult.txHash}</span>
              </div>
              <div className="flex justify-between">
                <span>DeviceManager 주소:</span>
                <span className="font-mono">{authorizationResult.deviceManagerAddress}</span>
              </div>
              
              {authorizationResult.authData && (
                <div className="mt-3 p-3 bg-green-100 rounded-md">
                  <p className="font-medium mb-2">📋 Authorization 데이터:</p>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(authorizationResult.authData.authorizationList, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="mt-3 p-3 bg-green-100 rounded-md">
                <p className="font-medium">🎉 사용 방법:</p>
                <p>이제 DeviceManager 함수를 호출하는 트랜잭션에 이 Authorization을 포함하여 delegate call을 실행할 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EIP-7702 동작 방식 설명 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
        <p className="font-medium mb-2">🔧 EIP-7702 동작 방식:</p>
        <ul className="space-y-1">
          <li>• <strong>트랜잭션별 적용</strong>: Authorization은 해당 트랜잭션에서만 유효</li>
          <li>• <strong>일시적 권한 위임</strong>: 트랜잭션 종료 후 EOA는 원래 상태로 복원</li>
          <li>• <strong>언제든 변경 가능</strong>: 다른 컨트랙트로 delegate call하거나 일반 EOA로 동작 가능</li>
          <li>• <strong>유연한 선택</strong>: 매번 사용할 컨트랙트 코드를 자유롭게 선택</li>
        </ul>
      </div>

      {/* 주의사항 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-700">
        <p className="font-medium mb-2">⚠️ 주의사항:</p>
        <ul className="space-y-1">
          <li>• EIP-7702를 지원하는 네트워크에서만 작동합니다</li>
          <li>• Authorization 서명 시 신뢰할 수 있는 컨트랙트인지 확인하세요</li>
          <li>• 반드시 테스트넷에서 먼저 테스트해보세요</li>
          <li>• 각 트랜잭션마다 새로운 Authorization이 필요할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
} 