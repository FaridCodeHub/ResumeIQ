BEGIN;

-- Add a professional field classification.
-- The skill category remains broad (technical, soft, tool, etc.).
ALTER TABLE skills
ADD COLUMN professional_field VARCHAR(100);

-- Insert initial skills across different professional backgrounds.
INSERT INTO skills (
    skill_name,
    normalized_name,
    category,
    professional_field,
    description
)
VALUES
-- Technology and IT
('JavaScript', 'javascript', 'technical', 'Technology', 'Programming language for web development.'),
('TypeScript', 'typescript', 'technical', 'Technology', 'Typed superset of JavaScript.'),
('Python', 'python', 'technical', 'Technology', 'General-purpose programming language.'),
('Java', 'java', 'technical', 'Technology', 'Object-oriented programming language.'),
('C++', 'c++', 'technical', 'Technology', 'General-purpose programming language.'),
('SQL', 'sql', 'technical', 'Technology', 'Language for managing relational databases.'),
('HTML', 'html', 'technical', 'Technology', 'Markup language for web pages.'),
('CSS', 'css', 'technical', 'Technology', 'Stylesheet language for web pages.'),
('React', 'react', 'technical', 'Technology', 'JavaScript library for user interfaces.'),
('Node.js', 'nodejs', 'technical', 'Technology', 'JavaScript runtime for server-side development.'),
('REST API Development', 'restapidevelopment', 'technical', 'Technology', 'Designing and developing REST APIs.'),
('Database Management', 'databasemanagement', 'technical', 'Technology', 'Managing and maintaining databases.'),

-- Business and management
('Project Management', 'projectmanagement', 'domain', 'Business', 'Planning and managing projects.'),
('Business Analysis', 'businessanalysis', 'domain', 'Business', 'Analyzing business processes and requirements.'),
('Strategic Planning', 'strategicplanning', 'domain', 'Business', 'Developing long-term organizational strategies.'),
('Operations Management', 'operationsmanagement', 'domain', 'Business', 'Managing business operations and processes.'),
('Business Development', 'businessdevelopment', 'domain', 'Business', 'Identifying and developing business opportunities.'),

-- Finance and accounting
('Financial Analysis', 'financialanalysis', 'domain', 'Finance', 'Evaluating financial data and performance.'),
('Financial Reporting', 'financialreporting', 'domain', 'Finance', 'Preparing and presenting financial reports.'),
('Bookkeeping', 'bookkeeping', 'domain', 'Finance', 'Recording financial transactions.'),
('Budgeting', 'budgeting', 'domain', 'Finance', 'Planning and managing financial budgets.'),
('Tax Preparation', 'taxpreparation', 'domain', 'Finance', 'Preparing tax returns and related documentation.'),
('Auditing', 'auditing', 'domain', 'Finance', 'Examining financial records and controls.'),

-- Healthcare
('Patient Care', 'patientcare', 'domain', 'Healthcare', 'Providing care and support to patients.'),
('Clinical Assessment', 'clinicalassessment', 'domain', 'Healthcare', 'Assessing patient health and clinical conditions.'),
('Medical Documentation', 'medicaldocumentation', 'domain', 'Healthcare', 'Maintaining medical records and documentation.'),
('Medication Administration', 'medicationadministration', 'domain', 'Healthcare', 'Administering prescribed medications.'),

-- Engineering
('Mechanical Design', 'mechanicaldesign', 'technical', 'Engineering', 'Designing mechanical systems and components.'),
('Electrical Engineering', 'electricalengineering', 'technical', 'Engineering', 'Applying electrical engineering principles.'),
('AutoCAD', 'autocad', 'tool', 'Engineering', 'Computer-aided design software.'),
('Quality Control', 'qualitycontrol', 'domain', 'Engineering', 'Maintaining product and process quality.'),

-- Education
('Lesson Planning', 'lessonplanning', 'domain', 'Education', 'Planning educational lessons and activities.'),
('Classroom Management', 'classroommanagement', 'domain', 'Education', 'Managing classroom environments.'),
('Curriculum Development', 'curriculumdevelopment', 'domain', 'Education', 'Designing educational curricula.'),
('Instructional Design', 'instructionaldesign', 'domain', 'Education', 'Designing effective learning experiences.'),

-- Marketing and sales
('Digital Marketing', 'digitalmarketing', 'domain', 'Marketing', 'Promoting products and services through digital channels.'),
('SEO', 'seo', 'technical', 'Marketing', 'Search engine optimization.'),
('Content Marketing', 'contentmarketing', 'domain', 'Marketing', 'Creating content to attract and retain audiences.'),
('Social Media Marketing', 'socialmediamarketing', 'domain', 'Marketing', 'Marketing through social media platforms.'),
('Sales Management', 'salesmanagement', 'domain', 'Sales', 'Managing sales activities and teams.'),
('Lead Generation', 'leadgeneration', 'domain', 'Sales', 'Identifying and attracting potential customers.'),

-- Design and creative
('UI Design', 'uidesign', 'domain', 'Design', 'Designing user interfaces.'),
('UX Design', 'uxdesign', 'domain', 'Design', 'Designing user experiences.'),
('Graphic Design', 'graphicdesign', 'domain', 'Design', 'Creating visual communication materials.'),
('Adobe Photoshop', 'adobephotoshop', 'tool', 'Design', 'Image editing and graphic design software.'),
('Figma', 'figma', 'tool', 'Design', 'Collaborative interface design software.'),

-- Human resources
('Recruitment', 'recruitment', 'domain', 'Human Resources', 'Finding and hiring suitable candidates.'),
('Talent Acquisition', 'talentacquisition', 'domain', 'Human Resources', 'Strategic sourcing and hiring of talent.'),
('Employee Relations', 'employeerelations', 'domain', 'Human Resources', 'Managing workplace relationships.'),

-- Legal and administration
('Contract Management', 'contractmanagement', 'domain', 'Legal', 'Managing business and legal contracts.'),
('Legal Research', 'legalresearch', 'domain', 'Legal', 'Researching laws and legal precedents.'),
('Office Administration', 'officeadministration', 'domain', 'Administration', 'Managing administrative office activities.'),

-- Hospitality
('Customer Service', 'customerservice', 'soft', 'Hospitality', 'Supporting customers and resolving their concerns.'),
('Hotel Operations', 'hoteloperations', 'domain', 'Hospitality', 'Managing hotel operations and services.'),
('Food Safety', 'foodsafety', 'domain', 'Hospitality', 'Maintaining food hygiene and safety standards.'),

-- Languages and communication
('English', 'english', 'language', 'General', 'English language proficiency.'),
('Bengali', 'bengali', 'language', 'General', 'Bengali language proficiency.'),
('Arabic', 'arabic', 'language', 'General', 'Arabic language proficiency.'),
('Written Communication', 'writtencommunication', 'soft', 'General', 'Communicating clearly through writing.'),
('Verbal Communication', 'verbalcommunication', 'soft', 'General', 'Communicating effectively through speech.'),

-- Transferable professional skills
('Leadership', 'leadership', 'soft', 'General', 'Guiding and motivating individuals or teams.'),
('Teamwork', 'teamwork', 'soft', 'General', 'Working effectively with others.'),
('Problem Solving', 'problemsolving', 'soft', 'General', 'Identifying and resolving problems.'),
('Critical Thinking', 'criticalthinking', 'soft', 'General', 'Evaluating information logically.'),
('Time Management', 'timemanagement', 'soft', 'General', 'Managing time and priorities effectively.'),
('Adaptability', 'adaptability', 'soft', 'General', 'Adjusting effectively to changing situations.'),
('Attention to Detail', 'attentiontodetail', 'soft', 'General', 'Maintaining accuracy and noticing important details.')

ON CONFLICT (normalized_name) DO NOTHING;


-- Add alternative names for existing skills.
INSERT INTO skill_aliases (
    skill_id,
    alias_name,
    normalized_alias
)
SELECT
    s.skill_id,
    aliases.alias_name,
    LOWER(REGEXP_REPLACE(TRIM(aliases.alias_name), '[[:space:]_.-]+', '', 'g'))
FROM (
    VALUES
        ('JavaScript', 'JS'),
        ('JavaScript', 'ECMAScript'),
        ('TypeScript', 'TS'),
        ('Python', 'Python Programming'),
        ('C++', 'CPP'),
        ('SQL', 'Structured Query Language'),
        ('HTML', 'HyperText Markup Language'),
        ('CSS', 'Cascading Style Sheets'),
        ('React', 'ReactJS'),
        ('Node.js', 'NodeJS'),
        ('REST API Development', 'RESTful API'),
        ('Project Management', 'Project Planning'),
        ('Financial Analysis', 'Finance Analysis'),
        ('Bookkeeping', 'Book Keeping'),
        ('Digital Marketing', 'Online Marketing'),
        ('SEO', 'Search Engine Optimization'),
        ('UI Design', 'User Interface Design'),
        ('UX Design', 'User Experience Design'),
        ('Graphic Design', 'Visual Design'),
        ('Adobe Photoshop', 'Photoshop'),
        ('Customer Service', 'Client Support'),
        ('Recruitment', 'Hiring'),
        ('Teamwork', 'Team Collaboration'),
        ('Problem Solving', 'Problem-Solving'),
        ('Time Management', 'Time-Management'),
        ('Written Communication', 'Writing Skills'),
        ('Verbal Communication', 'Oral Communication')
) AS aliases(skill_name, alias_name)
JOIN skills s
    ON s.normalized_name = LOWER(
        REGEXP_REPLACE(TRIM(aliases.skill_name), '[[:space:]_.-]+', '', 'g')
    )
ON CONFLICT (normalized_alias) DO NOTHING;

COMMIT;