BEGIN;

-- 1. Insert sample job descriptions
WITH inserted_jobs AS (
    INSERT INTO job_descriptions (
        job_title,
        company,
        description
    )
    VALUES
    (
        'Frontend Developer',
        'Tech Solutions',
        'We are looking for a Frontend Developer skilled in React, JavaScript, TypeScript, HTML, and CSS. The candidate should be able to build responsive user interfaces, integrate REST APIs, and work collaboratively with a development team.'
    ),
    (
        'Backend Developer',
        'Digital Systems',
        'We are looking for a Backend Developer with experience in Node.js, Python, SQL, and REST API Development. The candidate should understand database management, backend architecture, problem solving, and teamwork.'
    ),
    (
        'Full Stack Developer',
        'Innovation Labs',
        'We are looking for a Full Stack Developer who can build modern applications using React, Node.js, JavaScript, TypeScript, SQL, and REST APIs. Experience with frontend development, backend services, and database management is preferred.'
    )
    RETURNING job_id, job_title
),

-- 2. Define the skill requirements for each job
skill_map(job_title, skill_name, requirement_type) AS (
    VALUES
    ('Frontend Developer', 'React', 'required'),
    ('Frontend Developer', 'JavaScript', 'required'),
    ('Frontend Developer', 'TypeScript', 'required'),
    ('Frontend Developer', 'HTML', 'required'),
    ('Frontend Developer', 'CSS', 'required'),
    ('Frontend Developer', 'REST API Development', 'preferred'),
    ('Frontend Developer', 'Teamwork', 'preferred'),

    ('Backend Developer', 'Node.js', 'required'),
    ('Backend Developer', 'Python', 'required'),
    ('Backend Developer', 'SQL', 'required'),
    ('Backend Developer', 'REST API Development', 'required'),
    ('Backend Developer', 'Database Management', 'preferred'),
    ('Backend Developer', 'Problem Solving', 'preferred'),

    ('Full Stack Developer', 'React', 'required'),
    ('Full Stack Developer', 'Node.js', 'required'),
    ('Full Stack Developer', 'JavaScript', 'required'),
    ('Full Stack Developer', 'TypeScript', 'preferred'),
    ('Full Stack Developer', 'SQL', 'required'),
    ('Full Stack Developer', 'REST API Development', 'required'),
    ('Full Stack Developer', 'Database Management', 'preferred')
)

-- 3. Connect jobs with existing skills
INSERT INTO job_skills (
    job_id,
    skill_id,
    requirement_type
)
SELECT
    ij.job_id,
    s.skill_id,
    sm.requirement_type
FROM inserted_jobs ij
JOIN skill_map sm
    ON sm.job_title = ij.job_title
JOIN skills s
    ON s.skill_name = sm.skill_name
WHERE s.is_active = TRUE;

COMMIT;