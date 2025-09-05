import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const app = express()

const PORT = process.env.PORT || 4000
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.error('[server] Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'integritest', timestamp: new Date().toISOString() })
})

// Schemas
const InstructorLoginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(4),
})

const StudentAccessSchema = z.object({
  examCode: z.string().min(3),
  fullName: z.string().min(2),
  studentNumber: z.string().min(2),
  faceVerified: z.boolean().optional(),
})

// Routes
app.post('/api/auth/instructor/login', async (req, res) => {
  const parsed = InstructorLoginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload' })
  }
  const { username, password } = parsed.data

  // Lookup instructor
  const { data: instructor, error } = await supabase
    .from('instructors')
    .select('id, username, password_hash')
    .eq('username', username)
    .maybeSingle()

  if (error) return res.status(500).json({ error: 'Database error' })
  if (!instructor) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = await bcrypt.compare(password, instructor.password_hash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  // Issue a lightweight session payload (stateless for now)
  res.json({
    instructor: { id: instructor.id, username },
    loginTime: new Date().toISOString(),
  })
})

app.post('/api/auth/student/access', async (req, res) => {
  const parsed = StudentAccessSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload' })
  }
  const { examCode, fullName, studentNumber, faceVerified } = parsed.data

  // Find exam by code
  const { data: exam, error: examErr } = await supabase
    .from('exams')
    .select('id, code, title, duration, questions')
    .eq('code', examCode)
    .maybeSingle()

  if (examErr) return res.status(500).json({ error: 'Database error' })
  if (!exam) return res.status(404).json({ error: 'Exam not found' })

  // Upsert student session or record
  const { error: studentErr } = await supabase.from('students').upsert(
    {
      student_number: studentNumber,
      full_name: fullName,
      last_login_at: new Date().toISOString(),
    },
    { onConflict: 'student_number' },
  )
  if (studentErr) return res.status(500).json({ error: 'Database error' })

  // Optionally log analytics event
  await supabase.from('events').insert({
    type: 'student_login',
    payload: { examCode, fullName, faceVerified: Boolean(faceVerified) },
    created_at: new Date().toISOString(),
  })

  res.json({
    student: { fullName, studentNumber },
    exam: {
      code: exam.code,
      title: exam.title,
      duration: exam.duration,
      questions: exam.questions,
    },
  })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${PORT}`)
})

