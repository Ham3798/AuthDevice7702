import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  sepolia,
  holesky,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'AuthDevice7702 - EIP-7702 Demo',
  projectId: 'YOUR_PROJECT_ID', // WalletConnect Cloud에서 발급받은 Project ID를 여기에 입력하세요
  chains: [
    // EIP-7702 데모 지원 네트워크 (기본값: 홀스키)
    holesky, // Holesky 테스트넷 (EIP-7702 DeviceManager 배포 예정) - 기본값
    sepolia, // Sepolia 테스트넷
  ],
  ssr: true, // Next.js SSR 지원
}); 