# 🔴 보안 취약점 분석 보고서

## 프로젝트 개요

본 프로젝트는 **학교 커뮤니티 플랫폼의 보안 취약점**을 연구하기 위해 의도적으로 취약한 버전과 안전한 버전을 비교 분석하는 탐구 프로젝트입니다.

- **취약 버전**: `dam-school-acc/school-community-vulnerable`
- **안전 버전**: `dam-school-acc/school-community`

---

## 📋 발견된 주요 보안 취약점

### 1️⃣ SQL Injection (SQLi) 취약점

#### 문제 코드 (취약 버전)
```javascript
// ❌ 위험: 사용자 입력을 직접 쿼리에 포함
const query = `SELECT * FROM schools WHERE school_name LIKE '%${keyword}%'`;
```

#### 공격 시나리오
```
입력: %' OR '1'='1
실행: SELECT * FROM schools WHERE school_name LIKE '%%' OR '1'='1%'
결과: 모든 학교 정보가 노출됨
```

#### 개선 코드 (안전 버전)
```javascript
// ✅ 안전: 매개변수화 쿼리 사용
const query = `SELECT * FROM schools WHERE school_name ILIKE $1`;
const result = await pool.query(query, [`%${keyword}%`]);
```

#### 영향도
- **심각도**: 🔴 **CRITICAL**
- **영향 범위**: 데이터 조회, 수정, 삭제 (전체 데이터베이스 접근 가능)
- **OWASP 순위**: A03:2021 - Injection

---

### 2️⃣ 평문 비밀번호 저장

#### 문제 코드 (취약 버전)
```javascript
// ❌ 위험: 비밀번호를 평문으로 저장
const query = `
  INSERT INTO users (..., password)
  VALUES (..., '${password}')
`;
```

#### 문제점
- 데이터베이스가 해킹되면 모든 사용자의 비밀번호 노출
- 비밀번호 재사용으로 다른 서비스도 위험 (예: 이메일, 기타 앱)
- 법적 문제 (개인정보보호 위반)

#### 개선 코드 (안전 버전)
```javascript
// ✅ 안전: bcrypt로 비밀번호 해싱
const hashedPassword = await bcrypt.hash(password, 10);
const query = `
  INSERT INTO users (..., password)
  VALUES (..., $3)
`;
await pool.query(query, [..., hashedPassword]);

// 로그인 시 비교
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

#### 영향도
- **심각도**: 🔴 **CRITICAL**
- **영향 범위**: 모든 사용자 계정
- **OWASP 순위**: A02:2021 - Cryptographic Failures

---

### 3️⃣ XSS (Cross-Site Scripting) 취약점

#### 문제 코드 (취약 버전)
```javascript
// ❌ 위험: 입력값 검증 없음
const { title, content } = req.body;
const query = `
  INSERT INTO posts (title, content, ...)
  VALUES ('${title}', '${content}', ...)
`;
```

#### 공격 시나리오
```
입력: <img src=x onerror="alert('XSS')">
결과: 게시글 조회 시 JavaScript 실행
피해: 세션 탈취, 악성 코드 주입
```

#### 개선 코드 (안전 버전)
```javascript
// ✅ 안전: 입력값 검증 + 매개변수화
const { title, content } = req.body;

if (!title || !content) {
  return res.status(400).json({ message: '입력값 누락' });
}

const query = `
  INSERT INTO posts (title, content, ...)
  VALUES ($1, $2, ...)
`;
await pool.query(query, [title, content, ...]);
```

#### 프론트엔드에서의 추가 방지
```javascript
// ✅ 안전: HTML 엔티티 인코딩
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

postsList.innerHTML = posts.map(post => `
  <div class="post-item">
    <div class="post-title">${escapeHtml(post.title)}</div>
    <div class="post-content">${escapeHtml(post.content)}</div>
  </div>
`).join('');
```

#### 영향도
- **심각도**: 🔴 **CRITICAL**
- **영향 범위**: 사용자 세션, 데이터 탈취
- **OWASP 순위**: A03:2021 - Injection

---

### 4️⃣ 접근 제어 부재 (Access Control Missing)

#### 문제 코드 (취약 버전)
```javascript
// ❌ 위험: 모든 게시글 반환 (반별 필터링 없음)
exports.getPosts = async (req, res) => {
  const query = `SELECT * FROM posts ORDER BY created_at DESC`;
  const result = await pool.query(query);
  res.status(200).json(result.rows);
};
```

#### 문제점
- 로그인하지 않은 사용자도 모든 게시글 조회 가능
- 다른 반의 개인정보 노출
- 게시글 수정/삭제 인증 없음

#### 개선 코드 (안전 버전)
```javascript
// ✅ 안전: 사용자의 반에 해당하는 게시글만 반환
exports.getPosts = async (req, res) => {
  const { school_code, grade, class_number } = req.query;
  
  if (!school_code || !grade || !class_number) {
    return res.status(400).json({ message: '학교/학년/반 정보 필요' });
  }

  const query = `
    SELECT * FROM posts 
    WHERE school_code = $1 AND grade = $2 AND class_number = $3
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [school_code, grade, class_number]);
  res.status(200).json(result.rows);
};
```

#### 영향도
- **심각도**: 🟠 **HIGH**
- **영향 범위**: 정보 공개, 프라이버시 침해
- **OWASP 순위**: A01:2021 - Broken Access Control

---

### 5️⃣ CORS 제한 없음

#### 문제 코드 (취약 버전)
```javascript
// ❌ 위험: 모든 출처에서 요청 허용
app.use(cors());
```

#### 공격 시나리오
```
공격자 웹사이트: example-hack.com
사용자가 방문 → 백그라운드 요청 → 우리 서버로 자동 요청
→ 개인정보 탈취, 게시글 생성 등
```

#### 개선 코드 (안전 버전)
```javascript
// ✅ 안전: 신뢰하는 출처만 허용
const cors = require('cors');

app.use(cors({
  origin: ['https://school-community.com', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 영향도
- **심각도**: 🟠 **HIGH**
- **영향 범위**: CSRF 공격, 권한 없는 요청
- **OWASP 순위**: A01:2021 - Broken Access Control

---

### 6️⃣ 민감한 정보 노출 (Information Disclosure)

#### 문제 코드 (취약 버전)
```javascript
// ❌ 위험: 스택 트레이스 노출
app.use((err, req, res, next) => {
  res.status(500).json({ 
    message: '서버 에러',
    error: err.message,
    stack: err.stack // 파일 경로, 함수명 노출!
  });
});

// ❌ 위험: 버전 정보 노출
app.get('/api/health', (req, res) => {
  res.json({ 
    version: '1.0.0-vulnerable',
    timestamp: new Date().toISOString()
  });
});
```

#### 공격자가 알 수 있는 정보
- 사용된 라이브러리 버전 (취약점 검색)
- 파일 시스템 경로 (디렉토리 구조)
- 사용된 기술 스택

#### 개선 코드 (안전 버전)
```javascript
// ✅ 안전: 일반적인 에러 메시지만 반환
app.use((err, req, res, next) => {
  console.error('에러 발생:', err); // 서버 로그에만 기록
  res.status(500).json({ 
    message: '서버 오류 발생',
    // 스택 트레이스 노출 안함
  });
});

// ✅ 안전: 헬스체크는 최소 정보만
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

#### 영향도
- **심각도**: 🟡 **MEDIUM**
- **영향 범위**: 추가 공격의 정보 수집 단계
- **OWASP 순위**: A01:2021 - Broken Access Control

---

## 📊 취약점 비교 요약표

| # | 취약점 | 취약 버전 | 안전 버전 | 심각도 |
|---|--------|---------|---------|--------|
| 1 | SQL Injection | ❌ 미흡 | ✅ 매개변수화 | 🔴 CRITICAL |
| 2 | 평문 비밀번호 | ❌ 평문 저장 | ✅ bcrypt 해싱 | 🔴 CRITICAL |
| 3 | XSS | ❌ 검증 없음 | ✅ 입력 검증 | 🔴 CRITICAL |
| 4 | 접근 제어 | ❌ 없음 | ✅ 반별 필터링 | 🟠 HIGH |
| 5 | CORS | ❌ 무제한 | ✅ 화이트리스트 | 🟠 HIGH |
| 6 | 정보 노출 | ❌ 노출 | ✅ 숨김 | 🟡 MEDIUM |

---

## 🛡️ 보안 개선 체크리스트

### 입력 검증 (Input Validation)
- [ ] 모든 사용자 입력 검증
- [ ] 길이 제한 설정
- [ ] 화이트리스트 기반 필터링

### 데이터베이스 보안
- [ ] 매개변수화 쿼리 사용
- [ ] 최소 권한 원칙 적용 (DB 사용자)
- [ ] 정기적인 백업

### 인증 & 인가
- [ ] 비밀번호 해싱 (bcrypt, scrypt)
- [ ] JWT 토큰 사용
- [ ] 세션 관리
- [ ] 역할 기반 접근 제어 (RBAC)

### 통신 보안
- [ ] HTTPS 사용
- [ ] CORS 설정
- [ ] Content Security Policy (CSP)

### 로깅 & 모니터링
- [ ] 보안 이벤트 로깅
- [ ] 에러 로그 (클라이언트에 노출 X)
- [ ] 정기적인 보안 감시

---

## 🔍 테스트 시나리오

### 시나리오 1: SQL Injection 테스트
```
학교 검색 필드에 입력: ' OR '1'='1
취약 버전 결과: 모든 학교 나열
안전 버전 결과: "검색 결과 없음"
```

### 시나리오 2: 비밀번호 해킹 테스트
```
데이터베이스 접근 후:
취약 버전: 비밀번호가 평문으로 보임 (password123)
안전 버전: bcrypt 해시로 보여짐 ($2a$10$...)
```

### 시나리오 3: XSS 테스트
```
게시글 제목: <img src=x onerror="alert('XSS')">
취약 버전: JavaScript 실행됨 (팝업 나타남)
안전 버전: HTML 엔티티로 변환되어 텍스트로 표시됨
```

---

## 📚 참고 자료

- **OWASP Top 10 2021**: https://owasp.org/Top10/
- **CWE/SANS Top 25**: https://cwe.mitre.org/top25/
- **Node.js 보안 체크리스트**: https://nodejs.org/en/docs/guides/security/
- **PostgreSQL 보안**: https://www.postgresql.org/docs/current/sql-syntax.html

---

## 🎓 탐구 결론

### 주요 발견 사항
1. **매개변수화 쿼리**가 SQL Injection을 효과적으로 방지
2. **비밀번호 해싱**은 보안의 기본 필수 요소
3. **입력값 검증**은 XSS, SQLi 모두 방지 가능
4. **접근 제어**는 정보 유출 방지의 핵심

### 배운 점
- 보안은 하나의 기능이 아니라 **전반적인 설계 원칙**
- 개발 단계에서부터 보안을 고려해야 함
- 정기적인 보안 감시와 업데이트 필수

---

**⚠️ 주의**: 이 취약한 버전은 **교육 목적으로만** 사용하세요. 실제 프로덕션 환경에서는 안전 버전을 사용하세요!
