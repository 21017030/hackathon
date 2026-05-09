import axios from 'axios';

// 백엔드 API 기본 설정 (baseURL: 로컬 개발 서버)
const client = axios.create({
  baseURL: 'http://localhost:8000',
});

export default client;
