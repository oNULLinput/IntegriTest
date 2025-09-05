const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Student login (access exam with exam code)
router.post('/student/login', async (req, res) => {
  try {
    const { examCode, fullName, studentNumber, faceVerified } = req.body;

    // Validate required fields
    if (!examCode || !fullName || !studentNumber) {
      return res.status(400).json({ 
        error: 'Exam code, full name, and student number are required' 
      });
    }

    if (!faceVerified) {
      return res.status(400).json({ 
        error: 'Face verification is required' 
      });
    }

    // Check if exam exists and is active
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('exam_code', examCode)
      .eq('is_active', true)
      .single();

    if (examError || !exam) {
      return res.status(404).json({ 
        error: 'Invalid exam code or exam is not active' 
      });
    }

    // Check if student already has an active attempt
    const { data: existingAttempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', exam.id)
      .eq('student_number', studentNumber)
      .eq('status', 'in_progress')
      .single();

    if (existingAttempt && !attemptError) {
      return res.status(400).json({ 
        error: 'You already have an active exam attempt' 
      });
    }

    // Create or find student record
    let { data: student, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('email', `${studentNumber}@student.local`)
      .single();

    if (studentError && studentError.code === 'PGRST116') {
      // Student doesn't exist, create new one
      const { data: newStudent, error: createError } = await supabase
        .from('users')
        .insert([{
          email: `${studentNumber}@student.local`,
          name: fullName,
          role: 'student',
          password_hash: 'student_no_password' // Students don't use passwords
        }])
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: 'Failed to create student record' });
      }
      student = newStudent;
    } else if (studentError) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Create exam attempt
    const { data: attempt, error: attemptCreateError } = await supabase
      .from('exam_attempts')
      .insert([{
        user_id: student.id,
        exam_id: exam.id,
        student_number: studentNumber,
        status: 'in_progress',
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (attemptCreateError) {
      return res.status(500).json({ error: 'Failed to create exam attempt' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: student.id, 
        role: 'student',
        attemptId: attempt.id,
        examId: exam.id
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: student.id,
        name: student.name,
        role: student.role
      },
      exam: {
        id: exam.id,
        title: exam.title,
        duration_minutes: exam.duration_minutes,
        total_questions: exam.total_questions
      },
      attempt: {
        id: attempt.id,
        started_at: attempt.started_at
      }
    });

  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Instructor login
router.post('/instructor/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    // Find instructor by username (using email field)
    const { data: instructor, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', username)
      .eq('role', 'instructor')
      .single();

    if (error || !instructor) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, instructor.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: instructor.id, 
        role: 'instructor',
        username: instructor.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        role: instructor.role
      }
    });

  } catch (error) {
    console.error('Instructor login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new instructor (for setup)
router.post('/instructor/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ 
        error: 'Username, password, and name are required' 
      });
    }

    // Check if instructor already exists
    const { data: existingInstructor, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', username)
      .eq('role', 'instructor')
      .single();

    if (existingInstructor && !checkError) {
      return res.status(400).json({ 
        error: 'Instructor already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create instructor
    const { data: instructor, error: createError } = await supabase
      .from('users')
      .insert([{
        email: username,
        password_hash: passwordHash,
        name: name,
        role: 'instructor'
      }])
      .select()
      .single();

    if (createError) {
      return res.status(500).json({ error: 'Failed to create instructor' });
    }

    res.json({
      success: true,
      message: 'Instructor created successfully',
      user: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        role: instructor.role
      }
    });

  } catch (error) {
    console.error('Instructor registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;