# 🔴 학교 커뮤니티 - 취약 버전 (교육용)

**⚠️ 이 버전은 보안 탐구 목적으로 의도적인 취약점이 포함되어 있습니다.**

## 프로젝트 목표

본 프로젝트는 **웹 애플리케이션의 일반적인 보안 취약점을 실습**하고, **안전한 버전과 비교**하여 보안 개선 방법을 학습하는 탐구 프로젝트입니다.

- 📚 보안 취약점의 원인 이해
- 🔍 취약점의 실제 영향 파악
- 🛡️ 개선 방법 학습

---

## 🚨 포함된 취약점

| 취약점 | 심각도 | 설명 |
|--------|--------|------|
| SQL Injection | 🔴 CRITICAL | 매개변수화 없는 쿼리 |
| 평문 비밀번호 | 🔴 CRITICAL | 해싱 없는 비밀번호 저장 |
| XSS (Cross-Site Scripting) | 🔴 CRITICAL | 입력값 검증 부재 |
| 접근 제어 부재 | 🟠 HIGH | 모든 사용자가 모든 게시글 접근 |
| CORS 제한 없음 | 🟠 HIGH | 모든 출처에서 요청 허용 |
| 정보 공개 | 🟡 MEDIUM | 에러 정보 및 버전 노출 |

---

## 📖 사용 방법

### 1단계: 환경 설정

```bash
cd backend
npm install
```

### 2단계: .env 파일 생성

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
```

### 3단계: 데이터베이스 초기화

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  school_code VARCHAR(50),
  grade INT,
  class_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  school_name VARCHAR(100) NOT NULL,
  school_code VARCHAR(50) UNIQUE NOT NULL,
  location VARCHAR(100)
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  username VARCHAR(100) NOT NULL,
  school_code VARCHAR(50),
  grade INT,
  class_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4단계: 서버 실행

```bash
npm start
```

### 5단계: 프론트엔드 접속

```
http://localhost:5000
```

---

## 🔬 취약점 테스트 시나리오

### 시나리오 1: SQL Injection 테스트

**테스트 방법:**
1. 프론트엔드 열기
2. 개발자 도구(F12) > Network 탭 열기
3. 요청 수정 후 전송:

```json
{
  "email": "admin@test.com",
  "password": "' OR '1'='1"
}
```

**예상 결과:**
- 취약 버전: 로그인 성공 (평문 비교로 인한 공격 성공)
- 안전 버전: 로그인 실패 (해시 비교로 인한 공격 방어)

### 시나리오 2: XSS 테스트

**테스트 방법:**
1. 게시글 작성란에 다음 입력:
```html
<img src=x onerror="alert('XSS 공격 성공!')">
```

2. 작성하기 클릭

**예상 결과:**
- 취약 버전: JavaScript 실행 (팝업 나타남)
- 안전 버전: HTML 엔티티로 변환되어 텍스트로 표시

### 시나리오 3: SQL Injection with UNION

**테스트 방법:**
학교 검색에서:
```
' UNION SELECT * FROM users --
```

**예상 결과:**
- 취약 버전: 사용자 테이블의 데이터 노출 (평문 비밀번호 포함!)
- 안전 버전: 검색 결과 없음

---

## 📊 보안 분석 보고서

자세한 분석은 **[SECURITY_ANALYSIS.md](SECURITY_ANALYSIS.md)** 참고

### 핵심 개선 사항

1. **매개변수화 쿼리 사용**
2. **bcrypt를 이용한 비밀번호 해싱**
3. **입력값 검증 및 HTML 엔티티 인코딩**
4. **접근 제어 (학년/반 기반 필터링)**
5. **CORS 화이트리스트 설정**
6. **에러 정보 숨김**

---

## 🔗 안전한 버전과의 비교

### 저장소 비교

| 구분 | 취약 버전 | 안전 버전 |
|------|---------|---------|
| 저장소 | `school-community-vulnerable` | `school-community` |
| SQL Injection | ❌ 없음 | ✅ 매개변수화 |
| 비밀번호 해싱 | ❌ 평문 | ✅ bcrypt |
| 입력 검증 | ❌ 없음 | ✅ 있음 |
| 접근 제어 | ❌ 없음 | ✅ 반별 필터링 |

### 코드 비교 예제

**취약한 코드:**
```javascript
const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
```

**안전한 코드:**
```javascript
const query = `SELECT * FROM users WHERE email = $1`;
const user = await pool.query(query, [email]);
const isValid = await bcrypt.compare(password, user.rows[0].password);
```

---

## 📚 학습 자료

### 참고할 보안 표준
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Node.js 보안 가이드](https://nodejs.org/en/docs/guides/security/)

### 추가 학습 주제
- [ ] Authentication & Authorization (인증 & 인가)
- [ ] Encryption & Hashing (암호화 & 해싱)
- [ ] Secure Coding Practices (안전한 코딩)
- [ ] OWASP Security Guidelines

---

## 🎓 탐구 결론

이 프로젝트를 통해 다음을 학습할 수 있습니다:

1. **보안의 중요성**: 작은 실수가 큰 피해를 초래
2. **방어 깊이 (Defense in Depth)**: 다층 보안 필요
3. **개발 단계 보안**: 처음부터 보안을 고려해야 함

---

## ⚠️ 중요 사항

- **교육용으로만 사용하세요**
- **절대 프로덕션 환경에 배포하지 마세요**
- **실제 공격에 사용하지 마세요**
- **타인의 시스템에 테스트하지 마세요**

---

## 📝 탐구 보고서 작성 가이드

이 프로젝트를 토대로 탐구 보고서를 작성할 때:

### 보고서 구성
1. **서론**: 연구 배경 및 목표
2. **이론**: 보안 취약점의 개념
3. **방법**: 테스트 환경 및 절차
4. **결과**: 발견된 취약점 및 영향도
5. **개선방안**: 각 취약점의 해결 방법
6. **결론**: 학습한 내용 및 시사점

### 첨부 자료
- 취약 코드 vs 안전 코드 비교
- 공격 시나리오별 테스트 결과
- 보안 체크리스트
- 참고 자료 목록

---

**Happy Learning! 🚀**

이 취약한 버전을 통해 보안의 중요성을 배우고, 미래에는 더 안전한 소프트웨어를 개발하세요!
