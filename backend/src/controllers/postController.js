const pool = require('../config/db');

// 🚨 취약점 4: XSS (Cross-Site Scripting) - 입력값 검증 없음
exports.getPosts = async (req, res) => {
  try {
    // ❌ 위험: 모든 게시글 반환 (접근 제어 없음)
    const query = `SELECT * FROM posts ORDER BY created_at DESC`;
    const result = await pool.query(query);
    
    // ❌ 위험: XSS 방지 처리 없음
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: '게시글 조회 실패' });
  }
};

// 🚨 취약점 5: SQL Injection + XSS + 접근 제어 없음
exports.createPost = async (req, res) => {
  try {
    const { title, content, username, school_code, grade, class_number } = req.body;

    // ❌ 위험: 매개변수화 없음 + 입력값 검증 없음
    const query = `
      INSERT INTO posts (title, content, username, school_code, grade, class_number)
      VALUES ('${title}', '${content}', '${username}', '${school_code}', ${grade}, ${class_number})
      RETURNING *
    `;
    
    const result = await pool.query(query);
    res.status(201).json({ 
      message: '게시글 작성 완료',
      post: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: '게시글 작성 실패', error: error.message });
  }
};
