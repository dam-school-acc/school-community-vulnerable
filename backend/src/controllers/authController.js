const pool = require('../config/db');

// 🚨 취약점 1: SQL Injection (매개변수화 없음)
exports.searchSchools = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    // ❌ 위험: 사용자 입력을 직접 쿼리에 포함
    const query = `SELECT * FROM schools WHERE school_name LIKE '%${keyword}%'`;
    console.log('실행 쿼리:', query);
    
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('학교 검색 에러:', error);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 🚨 취약점 2: 평문 비밀번호 저장
exports.register = async (req, res) => {
  try {
    const { email, password, username, school_code, grade, class_number } = req.body;

    // ❌ 위험: 비밀번호 해싱 없이 평문으로 저장
    const query = `
      INSERT INTO users (email, password, username, school_code, grade, class_number)
      VALUES ('${email}', '${password}', '${username}', '${school_code}', ${grade}, ${class_number})
      RETURNING id, email, username, school_code, grade, class_number
    `;
    
    const result = await pool.query(query);
    res.status(201).json({ 
      message: '회원가입 완료',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('가입 에러:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
};

// 🚨 취약점 3: SQL Injection + 평문 비밀번호
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // ❌ 위험: 사용자 입력을 직접 쿼리에 포함 + 평문 비교
    const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    console.log('로그인 쿼리:', query);
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = result.rows[0];
    res.status(200).json({
      message: '로그인 성공',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        school_code: user.school_code,
        grade: user.grade,
        class_number: user.class_number
      }
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ message: '서버 오류', error: error.message });
  }
};
