-- Engagium demo seed data
-- Creates a single instructor with 3 classes and 7 days of analytics-friendly data.
-- Safe to re-run: deletes existing demo instructor and all cascading data first.

BEGIN;

-- Reset only this demo user tree so the script stays deterministic.
DELETE FROM users
WHERE email = 'engagium.scc@gmail.com';

CREATE TEMP TABLE tmp_seed_user (
  user_id UUID PRIMARY KEY
);

INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role
)
VALUES (
  'engagium.scc@gmail.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Demo',
  'Instructor',
  'instructor'
)
RETURNING id;

INSERT INTO tmp_seed_user (user_id)
SELECT id
FROM users
WHERE email = 'engagium.scc@gmail.com';

CREATE TEMP TABLE tmp_seed_classes (
  class_key TEXT PRIMARY KEY,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  section TEXT NOT NULL,
  description TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  meeting_slug TEXT NOT NULL
);

INSERT INTO tmp_seed_classes (class_key, class_name, subject, section, description, start_time, end_time, meeting_slug)
VALUES
  ('C1', 'Applied Statistics', 'Mathematics', 'A', 'Introductory applied statistics with problem-solving drills.', '08:30', '11:20', 'stats-a'),
  ('C2', 'Software Engineering Studio', 'Computer Science', 'B', 'Collaborative engineering lab with standups and code critiques.', '11:00', '14:10', 'se-studio-b'),
  ('C3', 'Communication Research Methods', 'Communication', 'C', 'Research design workshops and guided presentations.', '14:00', '17:00', 'comm-research-c');

CREATE TEMP TABLE tmp_classes (
  class_key TEXT PRIMARY KEY,
  class_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  start_minutes INTEGER NOT NULL
);

WITH inserted_classes AS (
  INSERT INTO classes (
    instructor_id,
    name,
    subject,
    section,
    description,
    schedule,
    status
  )
  SELECT
    su.user_id,
    sc.class_name,
    sc.subject,
    sc.section,
    sc.description,
    jsonb_build_array(
      jsonb_build_object(
        'days', jsonb_build_array('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        'startTime', sc.start_time,
        'endTime', sc.end_time
      )
    ),
    'active'
  FROM tmp_seed_user su
  CROSS JOIN tmp_seed_classes sc
  RETURNING id, name
)
INSERT INTO tmp_classes (class_key, class_id, class_name, start_minutes)
SELECT
  sc.class_key,
  ic.id,
  sc.class_name,
  (split_part(sc.start_time, ':', 1)::INTEGER * 60) + split_part(sc.start_time, ':', 2)::INTEGER
FROM inserted_classes ic
JOIN tmp_seed_classes sc ON sc.class_name = ic.name;

INSERT INTO session_links (
  class_id,
  link_url,
  link_type,
  label,
  is_primary
)
SELECT
  c.class_id,
  'https://meet.google.com/' || sc.meeting_slug,
  'google_meet',
  sc.class_name || ' Main Room',
  true
FROM tmp_classes c
JOIN tmp_seed_classes sc ON sc.class_key = c.class_key;

CREATE TEMP TABLE tmp_seed_student_names (
  student_no INTEGER PRIMARY KEY,
  full_name TEXT NOT NULL
);

INSERT INTO tmp_seed_student_names (student_no, full_name)
VALUES
  (1, 'Alex Rivera'),
  (2, 'Bianca Santos'),
  (3, 'Carlo Mendoza'),
  (4, 'Diane Flores'),
  (5, 'Ethan Cruz'),
  (6, 'Frances Lim'),
  (7, 'Gian Dela Pena'),
  (8, 'Hannah Reyes'),
  (9, 'Ian Navarro'),
  (10, 'Julia Ramos');

CREATE TEMP TABLE tmp_students (
  class_key TEXT NOT NULL,
  student_no INTEGER NOT NULL,
  student_id_uuid UUID NOT NULL,
  full_name TEXT NOT NULL,
  PRIMARY KEY (class_key, student_no)
);

WITH inserted_students AS (
  INSERT INTO students (
    class_id,
    full_name,
    student_id
  )
  SELECT
    c.class_id,
    ssn.full_name,
    c.class_key || '-S' || LPAD(ssn.student_no::TEXT, 3, '0')
  FROM tmp_classes c
  CROSS JOIN tmp_seed_student_names ssn
  RETURNING id, class_id, full_name, student_id
)
INSERT INTO tmp_students (class_key, student_no, student_id_uuid, full_name)
SELECT
  c.class_key,
  RIGHT(i.student_id, 3)::INTEGER,
  i.id,
  i.full_name
FROM inserted_students i
JOIN tmp_classes c ON c.class_id = i.class_id;

CREATE TEMP TABLE tmp_sessions (
  session_id UUID PRIMARY KEY,
  class_id UUID NOT NULL,
  class_key TEXT NOT NULL,
  day_date DATE NOT NULL,
  fragment_no INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL
);

WITH base_days AS (
  SELECT
    day_index,
    (CURRENT_DATE - (6 - day_index))::DATE AS day_date
  FROM generate_series(0, 6) AS day_index
),
session_blueprint AS (
  SELECT
    c.class_id,
    c.class_key,
    c.class_name,
    b.day_index,
    b.day_date,
    (1 + ((b.day_index + RIGHT(c.class_key, 1)::INTEGER) % 3)) AS fragment_count,
    c.start_minutes
  FROM tmp_classes c
  CROSS JOIN base_days b
),
expanded_sessions AS (
  SELECT
    sb.class_id,
    sb.class_key,
    sb.class_name,
    sb.day_index,
    sb.day_date,
    g.fragment_no,
    (
      (sb.day_date::TIMESTAMPTZ)
      + ((sb.start_minutes + (g.fragment_no - 1) * 55 + ((sb.day_index + RIGHT(sb.class_key, 1)::INTEGER) % 11)) * INTERVAL '1 minute')
    ) AS started_at,
    (35 + ((sb.day_index * g.fragment_no + RIGHT(sb.class_key, 1)::INTEGER * 7) % 21)) AS duration_minutes
  FROM session_blueprint sb
  CROSS JOIN LATERAL generate_series(1, sb.fragment_count) AS g(fragment_no)
),
inserted_sessions AS (
  INSERT INTO sessions (
    class_id,
    title,
    meeting_link,
    started_at,
    ended_at,
    status
  )
  SELECT
    es.class_id,
    es.class_name || ' | Day ' || (es.day_index + 1)::TEXT || ' | Fragment ' || es.fragment_no::TEXT,
    'https://meet.google.com/' || LOWER(es.class_key) || '-fragment-' || es.day_index::TEXT || '-' || es.fragment_no::TEXT,
    es.started_at,
    es.started_at + (es.duration_minutes * INTERVAL '1 minute'),
    'ended'::session_status
  FROM expanded_sessions es
  ORDER BY es.class_key, es.day_date, es.fragment_no
  RETURNING id, class_id, started_at, ended_at
)
INSERT INTO tmp_sessions (session_id, class_id, class_key, day_date, fragment_no, started_at, ended_at, duration_minutes)
SELECT
  i.id,
  i.class_id,
  c.class_key,
  i.started_at::DATE,
  ROW_NUMBER() OVER (PARTITION BY c.class_key, i.started_at::DATE ORDER BY i.started_at),
  i.started_at,
  i.ended_at,
  GREATEST(1, FLOOR(EXTRACT(EPOCH FROM (i.ended_at - i.started_at)) / 60)::INTEGER)
FROM inserted_sessions i
JOIN tmp_classes c ON c.class_id = i.class_id;

CREATE TEMP TABLE tmp_attendance (
  session_id UUID NOT NULL,
  student_id UUID NOT NULL,
  participant_name TEXT NOT NULL,
  status TEXT NOT NULL,
  first_joined_at TIMESTAMPTZ,
  last_left_at TIMESTAMPTZ,
  total_duration_minutes INTEGER NOT NULL,
  seed_value INTEGER NOT NULL,
  PRIMARY KEY (session_id, student_id)
);

WITH attendance_blueprint AS (
  SELECT
    s.session_id,
    st.student_id_uuid AS student_id,
    st.full_name AS participant_name,
    s.started_at,
    s.ended_at,
    s.duration_minutes AS session_minutes,
    ABS(HASHTEXT(s.session_id::TEXT || st.student_id_uuid::TEXT)) AS seed_value
  FROM tmp_sessions s
  JOIN tmp_students st ON st.class_key = s.class_key
),
attendance_scored AS (
  SELECT
    ab.*,
    CASE
      WHEN (ab.seed_value % 11) IN (0, 7) THEN 'absent'
      WHEN (ab.seed_value % 11) IN (3, 8) THEN 'late'
      ELSE 'present'
    END AS attendance_status,
    CASE
      WHEN (ab.seed_value % 11) IN (3, 8) THEN 7 + (ab.seed_value % 8)
      ELSE (ab.seed_value % 4)
    END AS join_offset_minutes,
    CASE
      WHEN (ab.seed_value % 11) IN (0, 7) THEN 0
      WHEN (ab.seed_value % 11) IN (3, 8) THEN 1 + ((ab.seed_value / 3) % 6)
      ELSE (ab.seed_value % 6)
    END AS early_leave_minutes
  FROM attendance_blueprint ab
)
INSERT INTO tmp_attendance (
  session_id,
  student_id,
  participant_name,
  status,
  first_joined_at,
  last_left_at,
  total_duration_minutes,
  seed_value
)
SELECT
  session_id,
  student_id,
  participant_name,
  attendance_status,
  CASE
    WHEN attendance_status = 'absent' THEN NULL
    ELSE started_at + (join_offset_minutes * INTERVAL '1 minute')
  END,
  CASE
    WHEN attendance_status = 'absent' THEN NULL
    ELSE ended_at - (early_leave_minutes * INTERVAL '1 minute')
  END,
  CASE
    WHEN attendance_status = 'absent' THEN 0
    ELSE GREATEST(8, session_minutes - join_offset_minutes - early_leave_minutes)
  END,
  seed_value
FROM attendance_scored;

INSERT INTO attendance_records (
  session_id,
  student_id,
  participant_name,
  status,
  total_duration_minutes,
  first_joined_at,
  last_left_at
)
SELECT
  ta.session_id,
  ta.student_id,
  ta.participant_name,
  ta.status,
  ta.total_duration_minutes,
  ta.first_joined_at,
  ta.last_left_at
FROM tmp_attendance ta;

WITH interval_seed AS (
  SELECT
    ta.*,
    (
      ta.status <> 'absent'
      AND ta.total_duration_minutes >= 28
      AND (ta.seed_value % 3) = 0
    ) AS has_break,
    GREATEST(8, FLOOR(ta.total_duration_minutes * 0.55)::INTEGER) AS first_leg_minutes
  FROM tmp_attendance ta
  WHERE ta.status <> 'absent'
),
interval_rows AS (
  SELECT
    session_id,
    student_id,
    participant_name,
    first_joined_at AS joined_at,
    CASE
      WHEN has_break THEN first_joined_at + (first_leg_minutes * INTERVAL '1 minute')
      ELSE last_left_at
    END AS left_at
  FROM interval_seed

  UNION ALL

  SELECT
    session_id,
    student_id,
    participant_name,
    (first_joined_at + (first_leg_minutes * INTERVAL '1 minute') + ((2 + (seed_value % 4)) * INTERVAL '1 minute')) AS joined_at,
    last_left_at AS left_at
  FROM interval_seed
  WHERE has_break
)
INSERT INTO attendance_intervals (
  session_id,
  student_id,
  participant_name,
  joined_at,
  left_at
)
SELECT
  ir.session_id,
  ir.student_id,
  ir.participant_name,
  ir.joined_at,
  CASE
    WHEN ir.left_at < ir.joined_at THEN ir.joined_at + INTERVAL '1 minute'
    ELSE ir.left_at
  END
FROM interval_rows ir;

WITH active_attendees AS (
  SELECT *
  FROM tmp_attendance
  WHERE status <> 'absent'
),
manual_rows AS (
  SELECT
    aa.session_id,
    aa.student_id,
    'manual_entry'::interaction_type AS interaction_type,
    CASE WHEN aa.status = 'late' THEN 'Late arrival check-in' ELSE 'Present check-in' END AS interaction_value,
    aa.first_joined_at + INTERVAL '2 minute' AS timestamp,
    jsonb_build_object(
      'participant_name', aa.participant_name,
      'source', 'seed',
      'status', aa.status,
      'source_event_id', 'manual-' || aa.session_id::TEXT || '-' || aa.student_id::TEXT
    ) AS additional_data
  FROM active_attendees aa
),
chat_rows AS (
  SELECT
    aa.session_id,
    aa.student_id,
    'chat'::interaction_type AS interaction_type,
    CASE (g.seq % 5)
      WHEN 0 THEN 'Can you clarify that part?'
      WHEN 1 THEN 'Got it, thanks!'
      WHEN 2 THEN 'I have a question on the example.'
      WHEN 3 THEN 'Answer: option B based on the formula.'
      ELSE 'Sharing my notes in chat.'
    END AS interaction_value,
    aa.first_joined_at + ((3 + g.seq * (2 + (aa.seed_value % 4))) * INTERVAL '1 minute') AS timestamp,
    jsonb_build_object(
      'participant_name', aa.participant_name,
      'source', 'seed',
      'source_event_id', 'chat-' || aa.session_id::TEXT || '-' || aa.student_id::TEXT || '-' || g.seq::TEXT
    ) AS additional_data
  FROM active_attendees aa
  CROSS JOIN LATERAL generate_series(1, 1 + (aa.seed_value % 4)) AS g(seq)
),
reaction_rows AS (
  SELECT
    aa.session_id,
    aa.student_id,
    'reaction'::interaction_type AS interaction_type,
    CASE (g.seq % 4)
      WHEN 0 THEN 'thumbs_up'
      WHEN 1 THEN 'clap'
      WHEN 2 THEN 'heart'
      ELSE 'laugh'
    END AS interaction_value,
    aa.first_joined_at + ((6 + g.seq * (3 + (aa.seed_value % 3))) * INTERVAL '1 minute') AS timestamp,
    jsonb_build_object(
      'participant_name', aa.participant_name,
      'source', 'seed',
      'source_event_id', 'reaction-' || aa.session_id::TEXT || '-' || aa.student_id::TEXT || '-' || g.seq::TEXT
    ) AS additional_data
  FROM active_attendees aa
  CROSS JOIN LATERAL generate_series(1, (aa.seed_value % 3)) AS g(seq)
),
hand_rows AS (
  SELECT
    aa.session_id,
    aa.student_id,
    'hand_raise'::interaction_type AS interaction_type,
    'Question raised' AS interaction_value,
    aa.first_joined_at + ((9 + g.seq * (4 + (aa.seed_value % 2))) * INTERVAL '1 minute') AS timestamp,
    jsonb_build_object(
      'participant_name', aa.participant_name,
      'source', 'seed',
      'source_event_id', 'hand-' || aa.session_id::TEXT || '-' || aa.student_id::TEXT || '-' || g.seq::TEXT
    ) AS additional_data
  FROM active_attendees aa
  CROSS JOIN LATERAL generate_series(1, ((aa.seed_value / 5) % 3)) AS g(seq)
),
camera_rows AS (
  SELECT
    aa.session_id,
    aa.student_id,
    'camera_toggle'::interaction_type AS interaction_type,
    CASE WHEN (aa.seed_value % 2) = 0 THEN 'camera_off' ELSE 'camera_on' END AS interaction_value,
    aa.first_joined_at + ((12 + (aa.seed_value % 9)) * INTERVAL '1 minute') AS timestamp,
    jsonb_build_object(
      'participant_name', aa.participant_name,
      'source', 'seed',
      'source_event_id', 'camera-' || aa.session_id::TEXT || '-' || aa.student_id::TEXT
    ) AS additional_data
  FROM active_attendees aa
  WHERE (aa.seed_value % 2) = 0
),
mic_rows AS (
  SELECT
    aa.session_id,
    aa.student_id,
    'mic_toggle'::interaction_type AS interaction_type,
    'muted' AS interaction_value,
    aa.first_joined_at + ((14 + g.seq * (5 + (aa.seed_value % 3))) * INTERVAL '1 minute') AS timestamp,
    jsonb_build_object(
      'participant_name', aa.participant_name,
      'source', 'seed',
      'speakingAction', 'stop',
      'isMuted', 'true',
      'speakingDurationSeconds', 20 + ((aa.seed_value + g.seq * 17) % 180),
      'source_event_id', 'mic-' || aa.session_id::TEXT || '-' || aa.student_id::TEXT || '-' || g.seq::TEXT
    ) AS additional_data
  FROM active_attendees aa
  CROSS JOIN LATERAL generate_series(1, 1 + (aa.seed_value % 2)) AS g(seq)
),
all_logs AS (
  SELECT * FROM manual_rows
  UNION ALL
  SELECT * FROM chat_rows
  UNION ALL
  SELECT * FROM reaction_rows
  UNION ALL
  SELECT * FROM hand_rows
  UNION ALL
  SELECT * FROM camera_rows
  UNION ALL
  SELECT * FROM mic_rows
)
INSERT INTO participation_logs (
  session_id,
  student_id,
  interaction_type,
  interaction_value,
  timestamp,
  additional_data
)
SELECT
  al.session_id,
  al.student_id,
  al.interaction_type,
  al.interaction_value,
  LEAST(
    al.timestamp,
    ts.ended_at - INTERVAL '1 minute'
  ) AS timestamp,
  al.additional_data
FROM all_logs al
JOIN tmp_sessions ts ON ts.session_id = al.session_id
ORDER BY al.session_id, al.student_id, al.timestamp;

COMMIT;

-- Quick verification snapshot
SELECT
  u.email,
  COUNT(DISTINCT c.id) AS class_count,
  COUNT(DISTINCT s.id) AS session_count,
  COUNT(DISTINCT st.id) AS student_count,
  COUNT(DISTINCT ar.id) AS attendance_record_count,
  COUNT(DISTINCT pl.id) AS participation_log_count
FROM users u
LEFT JOIN classes c ON c.instructor_id = u.id
LEFT JOIN sessions s ON s.class_id = c.id
LEFT JOIN students st ON st.class_id = c.id
LEFT JOIN attendance_records ar ON ar.session_id = s.id
LEFT JOIN participation_logs pl ON pl.session_id = s.id
WHERE u.email = 'demo.instructor@engagium.local'
GROUP BY u.email;