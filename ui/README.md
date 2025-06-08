# Device Manager 7702 UI 🔐

Multi-Device WebAuthn Account Management with EIP-7702를 위한 Next.js 기반 사용자 인터페이스입니다.

## 🚀 주요 기능

### 📱 디바이스 관리
- **WebAuthn 기반 디바이스 등록**: 생체 인증 또는 하드웨어 보안 키를 사용하여 디바이스를 안전하게 등록
- **멀티 디바이스 지원**: 여러 디바이스를 동시에 관리하고 개별적으로 활성화/비활성화
- **실시간 상태 관리**: 디바이스의 활성 상태를 실시간으로 모니터링

### 🎫 세션 관리
- **임시 세션 키 생성**: 제한된 권한을 가진 임시 키를 생성하여 dApp에서 사용
- **유연한 만료 시간**: 1시간부터 1주일까지 다양한 만료 시간 설정
- **세션 권한 관리**: 각 세션별로 허용된 작업을 제한

### 🔗 Web3 통합
- **RainbowKit 지갑 연결**: 다양한 지갑을 쉽게 연결
- **Account Abstraction 지원**: EIP-4337 기반의 가스리스 트랜잭션
- **EIP-7702 통합**: 최신 Ethereum 표준 지원

## 🛠️ 기술 스택

- **프론트엔드**: Next.js 15, React 19, TypeScript
- **스타일링**: Tailwind CSS 4
- **Web3**: Wagmi 2, Viem 2, RainbowKit 2
- **인증**: WebAuthn (@simplewebauthn/browser)
- **데이터 인코딩**: CBOR-X, Base64URL

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 설정
WalletConnect Cloud에서 Project ID를 발급받아 `src/lib/wagmi.ts`에서 업데이트하세요:

```typescript
export const config = getDefaultConfig({
  appName: 'Device Manager 7702',
  projectId: 'YOUR_PROJECT_ID', // 여기에 실제 Project ID 입력
  // ...
});
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 애플리케이션을 확인하세요.

## 🏗️ 프로젝트 구조

```
ui/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx           # 메인 페이지
│   │   └── providers.tsx      # Web3 프로바이더 설정
│   ├── components/            # React 컴포넌트
│   │   ├── DeviceManager.tsx  # 메인 Device Manager 컴포넌트
│   │   ├── DeviceRegistration.tsx # 디바이스 등록 컴포넌트
│   │   ├── DeviceList.tsx     # 디바이스 목록 컴포넌트
│   │   └── SessionManager.tsx # 세션 관리 컴포넌트
│   └── lib/                   # 유틸리티 라이브러리
│       ├── wagmi.ts          # Wagmi 설정
│       ├── contracts.ts      # 스마트 컨트랙트 설정
│       └── webauthn.ts       # WebAuthn 유틸리티
├── package.json
└── README.md
```

## 🔧 핵심 컴포넌트 설명

### DeviceManager
- 전체 애플리케이션의 메인 컴포넌트
- 지갑 연결 상태 확인 및 탭 네비게이션 제공
- 디바이스 관리와 세션 관리 섹션을 통합

### DeviceRegistration
- WebAuthn을 사용한 새 디바이스 등록
- 브라우저 WebAuthn 지원 여부 자동 감지
- 플랫폼 인증기 사용 가능 여부 표시

### DeviceList
- 등록된 디바이스 목록 표시
- 디바이스 활성화/비활성화 토글
- 디바이스 제거 기능

### SessionManager
- 임시 세션 키 생성 및 관리
- 만료 시간 설정 및 자동 만료 처리
- 세션 취소 및 키 복사 기능

## 🔐 보안 고려사항

### WebAuthn 보안
- **생체 인증**: 지문, 얼굴 인식 등 생체 정보를 로컬에서만 처리
- **하드웨어 키**: YubiKey 등 FIDO2 호환 하드웨어 보안 키 지원
- **공개키 암호화**: 개인키는 브라우저 밖으로 노출되지 않음

### 세션 키 보안
- **제한된 권한**: 각 세션 키는 특정 작업만 수행 가능
- **자동 만료**: 설정된 시간 후 자동으로 무효화
- **수동 취소**: 언제든지 사용자가 세션을 취소 가능

### 데이터 저장
- **로컬 스토리지**: 현재는 데모용으로 브라우저 로컬 스토리지 사용
- **온체인 저장**: 실제 배포 시에는 스마트 컨트랙트에 저장 예정

## 🌐 지원 네트워크

- **Ethereum Mainnet**: 메인넷 지원
- **Sepolia Testnet**: 테스트넷 지원 (개발용)
- **Localhost**: 로컬 개발 환경 지원

## 📱 브라우저 지원

### WebAuthn 지원 브라우저
- ✅ Chrome 67+
- ✅ Firefox 60+
- ✅ Safari 14+
- ✅ Edge 18+

### 플랫폼 인증기 지원
- ✅ macOS: Touch ID, Face ID
- ✅ Windows: Windows Hello
- ✅ Android: 지문, 얼굴 인식
- ✅ iOS: Touch ID, Face ID

## 🚧 개발 로드맵

### Phase 1: 기본 UI ✅
- [x] WebAuthn 디바이스 등록
- [x] 세션 키 관리
- [x] 기본 UI/UX

### Phase 2: 스마트 컨트랙트 통합
- [ ] 실제 DeviceManager 컨트랙트 연동
- [ ] SessionDelegate 컨트랙트 연동
- [ ] 온체인 데이터 저장

### Phase 3: 고급 기능
- [ ] ZK Proof 통합
- [ ] 가스리스 트랜잭션
- [ ] 배치 작업 지원

### Phase 4: 최적화
- [ ] 성능 최적화
- [ ] 모바일 앱 지원
- [ ] PWA 변환

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙋‍♂️ 지원 및 문의

- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Discussions: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Device Manager 7702** - Secure Multi-Device Management for the Decentralized Web 🌐
