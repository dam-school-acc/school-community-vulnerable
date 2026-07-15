const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 🚨 취약점 6: CORS 제한 없음 (모든 출처 허용)
app.use(cors());
app.use(express.json());

// 🚨 취약점 7: 에러 정보 노출 (자세한 에러 메시지)
app.use((err, req, res, next) => {
  console.error('에러 발생:', err);
  res.status(500).json({ 
    message: '서버 에러',
    error: err.message,
    stack: err.stack // ❌ 위험: 스택 트레이스 노출
  });
});

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// 🚨 취약점 8: 정보 공개 (버전 정보 노출)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    version: '1.0.0-vulnerable',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚨 취약한 서버가 포트 ${PORT}에서 실행 중입니다...`);
  console.log('경고: 이 버전은 의도적으로 보안 취약점이 포함되어 있습니다.');
  console.log('교육용으로만 사용하세요!');
});

module.exports = app;
