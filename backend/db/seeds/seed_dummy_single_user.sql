-- Engagium demo seed data
-- Creates a single instructor with 3 classes and 30 days of analytics-friendly data.
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
  schedule_days TEXT[] NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  meeting_slug TEXT NOT NULL
);

INSERT INTO tmp_seed_classes (class_key, class_name, subject, section, description, schedule_days, start_time, end_time, meeting_slug)
VALUES
  ('C1', 'Applied Statistics', 'Mathematics', 'A', 'Introductory applied statistics with problem-solving drills.', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], '08:30', '11:00', 'stats-a'),
  ('C2', 'Software Engineering Studio', 'Computer Science', 'B', 'Collaborative engineering lab with standups and code critiques.', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], '12:00', '14:00', 'se-studio-b'),
  ('C3', 'Communication Research Methods', 'Communication', 'C', 'Research design workshops and guided presentations.', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], '14:30', '17:00', 'comm-research-c');

CREATE TEMP TABLE tmp_classes (
  class_key TEXT PRIMARY KEY,
  class_id UUID NOT NULL,
  class_name TEXT NOT NULL,
  schedule_days TEXT[] NOT NULL,
  start_minutes INTEGER NOT NULL,
  end_minutes INTEGER NOT NULL
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
        'days', to_jsonb(sc.schedule_days),
        'startTime', sc.start_time,
        'endTime', sc.end_time
      )
    ),
    'active'
  FROM tmp_seed_user su
  CROSS JOIN tmp_seed_classes sc
  RETURNING id, name
)
INSERT INTO tmp_classes (class_key, class_id, class_name, schedule_days, start_minutes, end_minutes)
SELECT
  sc.class_key,
  ic.id,
  sc.class_name,
  sc.schedule_days,
  (split_part(sc.start_time, ':', 1)::INTEGER * 60) + split_part(sc.start_time, ':', 2)::INTEGER,
  (split_part(sc.end_time, ':', 1)::INTEGER * 60) + split_part(sc.end_time, ':', 2)::INTEGER
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

WITH seed_timezone AS (
  SELECT 'Asia/Manila'::TEXT AS schedule_tz
),
local_today AS (
  SELECT
    st.schedule_tz,
    (NOW() AT TIME ZONE st.schedule_tz)::DATE AS today_local
  FROM seed_timezone st
),
session_blueprint AS (
  SELECT
    c.class_id,
    c.class_key,
    c.class_name,
    lt.schedule_tz,
    b.day_index,
    b.day_date,
    RIGHT(c.class_key, 1)::INTEGER AS class_no,
    (1 + ((b.day_index + RIGHT(c.class_key, 1)::INTEGER) % 3)) AS fragment_count,
    c.start_minutes,
    c.end_minutes,
    GREATEST(5, 5 + ((b.day_index + RIGHT(c.class_key, 1)::INTEGER) % 6)) AS early_buffer_minutes,
    GREATEST(6, 6 + ((b.day_index * 2 + RIGHT(c.class_key, 1)::INTEGER) % 7)) AS overtime_buffer_minutes
  FROM tmp_classes c
  CROSS JOIN local_today lt
  CROSS JOIN LATERAL (
    SELECT COALESCE(
      ARRAY_AGG(DISTINCT normalized_days.day_num) FILTER (WHERE normalized_days.day_num IS NOT NULL),
      ARRAY[]::INTEGER[]
    ) AS schedule_day_numbers
    FROM (
      SELECT CASE LOWER(TRIM(schedule_day))
        WHEN 'monday' THEN 1
        WHEN 'mon' THEN 1
        WHEN 'tuesday' THEN 2
        WHEN 'tue' THEN 2
        WHEN 'tues' THEN 2
        WHEN 'wednesday' THEN 3
        WHEN 'wed' THEN 3
        WHEN 'thursday' THEN 4
        WHEN 'thu' THEN 4
        WHEN 'thurs' THEN 4
        WHEN 'friday' THEN 5
        WHEN 'fri' THEN 5
        WHEN 'saturday' THEN 6
        WHEN 'sat' THEN 6
        WHEN 'sunday' THEN 7
        WHEN 'sun' THEN 7
        ELSE NULL
      END AS day_num
      FROM unnest(c.schedule_days) AS schedule_day
    ) normalized_days
  ) day_map
  CROSS JOIN LATERAL (
    SELECT
      ROW_NUMBER() OVER (ORDER BY selected_days.day_date) - 1 AS day_index,
      selected_days.day_date
    FROM (
      SELECT recent_days.day_date
      FROM (
        SELECT (lt.today_local - day_offset)::DATE AS day_date
        FROM generate_series(0, 365) AS day_offset
      ) recent_days
      WHERE COALESCE(array_length(day_map.schedule_day_numbers, 1), 0) = 0
        OR EXTRACT(ISODOW FROM recent_days.day_date)::INTEGER = ANY(day_map.schedule_day_numbers)
      ORDER BY recent_days.day_date DESC
      LIMIT 30
    ) selected_days
  ) b
),
session_plan AS (
  SELECT
    sb.*,
    GREATEST(0, (sb.end_minutes - sb.start_minutes) + sb.early_buffer_minutes + sb.overtime_buffer_minutes) AS available_minutes,
    CASE
      WHEN sb.fragment_count = 1 THEN 0
      ELSE 5 + ((sb.day_index + sb.class_no) % 4)
    END AS gap_minutes
  FROM session_blueprint sb
),
expanded_sessions AS (
  SELECT
    sp.class_id,
    sp.class_key,
    sp.class_name,
    sp.schedule_tz,
    sp.day_index,
    sp.day_date,
    sp.fragment_count,
    sp.class_no,
    sp.gap_minutes,
    GREATEST(
      18,
      FLOOR((sp.available_minutes - (sp.gap_minutes * (sp.fragment_count - 1)))::NUMERIC / sp.fragment_count)::INTEGER
    ) AS step_minutes,
    g.fragment_no,
    (
      GREATEST(0, sp.start_minutes - sp.early_buffer_minutes)
      + ((g.fragment_no - 1) * GREATEST(
          18,
          FLOOR((sp.available_minutes - (sp.gap_minutes * (sp.fragment_count - 1)))::NUMERIC / sp.fragment_count)::INTEGER
        ))
    ) AS fragment_start_minutes
  FROM session_plan sp
  CROSS JOIN LATERAL generate_series(1, sp.fragment_count) AS g(fragment_no)
),
timed_sessions AS (
  SELECT
    es.class_id,
    es.class_key,
    es.class_name,
    es.schedule_tz,
    es.day_index,
    es.day_date,
    es.fragment_no,
    LEAST(
      es.step_minutes - 1,
      GREATEST(
        18,
        es.step_minutes - es.gap_minutes - 2 + ((es.day_index + es.fragment_no + es.class_no) % 5)
      )
    ) AS duration_minutes,
    make_timestamptz(
      EXTRACT(YEAR FROM es.day_date)::INTEGER,
      EXTRACT(MONTH FROM es.day_date)::INTEGER,
      EXTRACT(DAY FROM es.day_date)::INTEGER,
      FLOOR(es.fragment_start_minutes / 60)::INTEGER,
      MOD(es.fragment_start_minutes, 60)::INTEGER,
      0,
      es.schedule_tz
    ) AS started_at
  FROM expanded_sessions es
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
    ts.class_id,
    TRIM(TO_CHAR(ts.started_at AT TIME ZONE ts.schedule_tz, 'FMMonth FMDD, YYYY'))
      || ' '
      || LOWER(TO_CHAR(ts.started_at AT TIME ZONE ts.schedule_tz, 'FMMM:MIAM'))
      || '-'
      || LOWER(TO_CHAR((ts.started_at + (ts.duration_minutes * INTERVAL '1 minute')) AT TIME ZONE ts.schedule_tz, 'FMMM:MIAM'))
      || ' - Meet Session',
    'https://meet.google.com/' || LOWER(ts.class_key) || '-fragment-' || ts.day_index::TEXT || '-' || ts.fragment_no::TEXT,
    ts.started_at,
    ts.started_at + (ts.duration_minutes * INTERVAL '1 minute'),
    'ended'::session_status
  FROM timed_sessions ts
  ORDER BY ts.class_key, ts.day_date, ts.fragment_no
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
chat_rows AS (
  SELECT
    aa.session_id,
    aa.student_id,
    'chat'::interaction_type AS interaction_type,
    'activity' AS interaction_value,
    aa.first_joined_at + ((3 + g.seq * (2 + (aa.seed_value % 4))) * INTERVAL '1 minute') AS timestamp,
    jsonb_build_object(
      'participant_name', aa.participant_name,
      'source', 'chat_text_toast',
      'hasContent', false,
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
    CASE (g.seq % 9)
      WHEN 0 THEN '💖'
      WHEN 1 THEN '👍'
      WHEN 2 THEN '🎉'
      WHEN 3 THEN '👏'
      WHEN 4 THEN '😂'
      WHEN 5 THEN '😮'
      WHEN 6 THEN '😢'
      WHEN 7 THEN '🤔'
      ELSE '👎'
    END AS interaction_value,
    aa.first_joined_at + ((6 + g.seq * (3 + (aa.seed_value % 3))) * INTERVAL '1 minute') AS timestamp,
    jsonb_build_object(
      'participant_name', aa.participant_name,
      'source', 'reaction_toast',
      'reaction', CASE (g.seq % 9)
        WHEN 0 THEN '💖'
        WHEN 1 THEN '👍'
        WHEN 2 THEN '🎉'
        WHEN 3 THEN '👏'
        WHEN 4 THEN '😂'
        WHEN 5 THEN '😮'
        WHEN 6 THEN '😢'
        WHEN 7 THEN '🤔'
        ELSE '👎'
      END,
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
    NULL::TEXT AS interaction_value,
    aa.first_joined_at + ((9 + g.seq * (4 + (aa.seed_value % 2))) * INTERVAL '1 minute') AS timestamp,
    jsonb_build_object(
      'participant_name', aa.participant_name,
      'source', 'people_panel',
      'handState', 'raised',
      'queuePosition', 1 + ((aa.seed_value + g.seq) % 6),
      'source_event_id', 'hand-' || aa.session_id::TEXT || '-' || aa.student_id::TEXT || '-' || g.seq::TEXT
    ) AS additional_data
  FROM active_attendees aa
  CROSS JOIN LATERAL generate_series(1, ((aa.seed_value / 5) % 3)) AS g(seq)
),
mic_windows AS (
  SELECT
    aa.session_id,
    aa.student_id,
    aa.participant_name,
    g.seq,
    aa.first_joined_at + ((12 + g.seq * (5 + (aa.seed_value % 3))) * INTERVAL '1 minute') AS started_at,
    20 + ((aa.seed_value + g.seq * 17) % 180) AS speaking_duration_seconds
  FROM active_attendees aa
  CROSS JOIN LATERAL generate_series(1, 1 + (aa.seed_value % 2)) AS g(seq)
),
mic_rows_start AS (
  SELECT
    mw.session_id,
    mw.student_id,
    'mic_toggle'::interaction_type AS interaction_type,
    'unmuted' AS interaction_value,
    mw.started_at AS timestamp,
    jsonb_build_object(
      'participant_name', mw.participant_name,
      'source', 'people_panel',
      'isMuted', false,
      'micState', 'on',
      'speakingAction', 'start',
      'source_event_id', 'mic-' || mw.session_id::TEXT || '-' || mw.student_id::TEXT || '-' || mw.seq::TEXT || '-start'
    ) AS additional_data
  FROM mic_windows mw
),
mic_rows_stop AS (
  SELECT
    mw.session_id,
    mw.student_id,
    'mic_toggle'::interaction_type AS interaction_type,
    'muted' AS interaction_value,
    mw.started_at + (mw.speaking_duration_seconds * INTERVAL '1 second') AS timestamp,
    jsonb_build_object(
      'participant_name', mw.participant_name,
      'source', 'people_panel',
      'isMuted', true,
      'micState', 'off',
      'speakingAction', 'stop',
      'speakingStartedAt', mw.started_at,
      'speakingEndedAt', mw.started_at + (mw.speaking_duration_seconds * INTERVAL '1 second'),
      'speakingDurationSeconds', mw.speaking_duration_seconds,
      'source_event_id', 'mic-' || mw.session_id::TEXT || '-' || mw.student_id::TEXT || '-' || mw.seq::TEXT || '-stop'
    ) AS additional_data
  FROM mic_windows mw
),
all_logs AS (
  SELECT * FROM chat_rows
  UNION ALL
  SELECT * FROM reaction_rows
  UNION ALL
  SELECT * FROM hand_rows
  UNION ALL
  SELECT * FROM mic_rows_start
  UNION ALL
  SELECT * FROM mic_rows_stop
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
WHERE u.email = 'engagium.scc@gmail.com'
GROUP BY u.email;