-- Migration: 005_seed.sql
-- Description: Seed the database with engineering branches and subjects for semesters 1-8.

-- =========================================================================
-- 1. Seed Engineering Branches
-- =========================================================================

INSERT INTO public.branches (id, name, code) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Computer Science', 'CS'),
  ('a1000000-0000-0000-0000-000000000002', 'Information Technology', 'IT'),
  ('a1000000-0000-0000-0000-000000000003', 'Artificial Intelligence', 'AI'),
  ('a1000000-0000-0000-0000-000000000004', 'Data Science', 'DS'),
  ('a1000000-0000-0000-0000-000000000005', 'Mechanical', 'ME'),
  ('a1000000-0000-0000-0000-000000000006', 'Civil', 'CE'),
  ('a1000000-0000-0000-0000-000000000007', 'Electrical', 'EE'),
  ('a1000000-0000-0000-0000-000000000008', 'Electronics', 'EC')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name;

-- =========================================================================
-- 2. Seed Subjects for Semesters 1-8
-- =========================================================================

-- We use block syntax to insert subjects for each branch.
-- Common first-year subjects (Semesters 1 and 2) are mapped across branches.

INSERT INTO public.subjects (name, code, branch_id, semester) VALUES
  -- ----------------------------------------------------
  -- Computer Science (CS)
  -- ----------------------------------------------------
  -- Semester 1
  ('Engineering Mathematics I', 'CS-101', 'a1000000-0000-0000-0000-000000000001', 1),
  ('Engineering Physics', 'CS-102', 'a1000000-0000-0000-0000-000000000001', 1),
  ('Basic Electrical & Electronics', 'CS-103', 'a1000000-0000-0000-0000-000000000001', 1),
  -- Semester 2
  ('Engineering Mathematics II', 'CS-201', 'a1000000-0000-0000-0000-000000000001', 2),
  ('Computer Programming in C', 'CS-202', 'a1000000-0000-0000-0000-000000000001', 2),
  ('Engineering Chemistry', 'CS-203', 'a1000000-0000-0000-0000-000000000001', 2),
  -- Semester 3
  ('Data Structures and Algorithms', 'CS-301', 'a1000000-0000-0000-0000-000000000001', 3),
  ('Discrete Mathematics', 'CS-302', 'a1000000-0000-0000-0000-000000000001', 3),
  ('Object-Oriented Programming', 'CS-303', 'a1000000-0000-0000-0000-000000000001', 3),
  -- Semester 4
  ('Database Management Systems', 'CS-401', 'a1000000-0000-0000-0000-000000000001', 4),
  ('Computer Organization & Architecture', 'CS-402', 'a1000000-0000-0000-0000-000000000001', 4),
  ('Operating Systems', 'CS-403', 'a1000000-0000-0000-0000-000000000001', 4),
  -- Semester 5
  ('Theory of Computation', 'CS-501', 'a1000000-0000-0000-0000-000000000001', 5),
  ('Computer Networks', 'CS-502', 'a1000000-0000-0000-0000-000000000001', 5),
  ('Design and Analysis of Algorithms', 'CS-503', 'a1000000-0000-0000-0000-000000000001', 5),
  -- Semester 6
  ('Compiler Design', 'CS-601', 'a1000000-0000-0000-0000-000000000001', 6),
  ('Software Engineering', 'CS-602', 'a1000000-0000-0000-0000-000000000001', 6),
  ('Artificial Intelligence', 'CS-603', 'a1000000-0000-0000-0000-000000000001', 6),
  -- Semester 7
  ('Cryptography & Network Security', 'CS-701', 'a1000000-0000-0000-0000-000000000001', 7),
  ('Cloud Computing', 'CS-702', 'a1000000-0000-0000-0000-000000000001', 7),
  -- Semester 8
  ('Big Data Analytics', 'CS-801', 'a1000000-0000-0000-0000-000000000001', 8),
  ('Distributed Systems', 'CS-802', 'a1000000-0000-0000-0000-000000000001', 8),

  -- ----------------------------------------------------
  -- Information Technology (IT)
  -- ----------------------------------------------------
  -- Semester 1
  ('Engineering Mathematics I', 'IT-101', 'a1000000-0000-0000-0000-000000000002', 1),
  ('Engineering Physics', 'IT-102', 'a1000000-0000-0000-0000-000000000002', 1),
  -- Semester 2
  ('Computer Programming in C', 'IT-201', 'a1000000-0000-0000-0000-000000000002', 2),
  ('Engineering Chemistry', 'IT-202', 'a1000000-0000-0000-0000-000000000002', 2),
  -- Semester 3
  ('Data Structures', 'IT-301', 'a1000000-0000-0000-0000-000000000002', 3),
  ('Discrete Structures', 'IT-302', 'a1000000-0000-0000-0000-000000000002', 3),
  -- Semester 4
  ('Database Management Systems', 'IT-401', 'a1000000-0000-0000-0000-000000000002', 4),
  ('Web Technology', 'IT-402', 'a1000000-0000-0000-0000-000000000002', 4),
  -- Semester 5
  ('Operating Systems', 'IT-501', 'a1000000-0000-0000-0000-000000000002', 5),
  ('Computer Networks', 'IT-502', 'a1000000-0000-0000-0000-000000000002', 5),
  -- Semester 6
  ('Information Security', 'IT-601', 'a1000000-0000-0000-0000-000000000002', 6),
  ('Software Engineering Practices', 'IT-602', 'a1000000-0000-0000-0000-000000000002', 6),
  -- Semester 7
  ('Cloud Services & Virtualization', 'IT-701', 'a1000000-0000-0000-0000-000000000002', 7),
  ('Internet of Things', 'IT-702', 'a1000000-0000-0000-0000-000000000002', 7),
  -- Semester 8
  ('Mobile Computing', 'IT-801', 'a1000000-0000-0000-0000-000000000002', 8),

  -- ----------------------------------------------------
  -- Artificial Intelligence (AI)
  -- ----------------------------------------------------
  -- Semester 3
  ('Introduction to AI', 'AI-301', 'a1000000-0000-0000-0000-000000000003', 3),
  ('Python for AI', 'AI-302', 'a1000000-0000-0000-0000-000000000003', 3),
  -- Semester 4
  ('Machine Learning Foundations', 'AI-401', 'a1000000-0000-0000-0000-000000000003', 4),
  ('Linear Algebra for AI', 'AI-402', 'a1000000-0000-0000-0000-000000000003', 4),
  -- Semester 5
  ('Neural Networks & Deep Learning', 'AI-501', 'a1000000-0000-0000-0000-000000000003', 5),
  ('Natural Language Processing', 'AI-502', 'a1000000-0000-0000-0000-000000000003', 5),
  -- Semester 6
  ('Computer Vision', 'AI-601', 'a1000000-0000-0000-0000-000000000003', 6),
  ('Reinforcement Learning', 'AI-602', 'a1000000-0000-0000-0000-000000000003', 6),
  -- Semester 7
  ('AI Ethics and Safety', 'AI-701', 'a1000000-0000-0000-0000-000000000003', 7),
  -- Semester 8
  ('Generative AI and LLMs', 'AI-801', 'a1000000-0000-0000-0000-000000000003', 8),

  -- ----------------------------------------------------
  -- Data Science (DS)
  -- ----------------------------------------------------
  -- Semester 3
  ('Statistics for Data Science', 'DS-301', 'a1000000-0000-0000-0000-000000000004', 3),
  ('Data Wrangling & Exploration', 'DS-302', 'a1000000-0000-0000-0000-000000000004', 3),
  -- Semester 4
  ('Probability & Random Variables', 'DS-401', 'a1000000-0000-0000-0000-000000000004', 4),
  ('R Programming', 'DS-402', 'a1000000-0000-0000-0000-000000000004', 4),
  -- Semester 5
  ('Data Mining & Analytics', 'DS-501', 'a1000000-0000-0000-0000-000000000004', 5),
  ('Data Visualization Tools', 'DS-502', 'a1000000-0000-0000-0000-000000000004', 5),
  -- Semester 6
  ('Predictive Modeling', 'DS-601', 'a1000000-0000-0000-0000-000000000004', 6),
  ('Time Series Analysis', 'DS-602', 'a1000000-0000-0000-0000-000000000004', 6),
  -- Semester 7
  ('Business Intelligence Systems', 'DS-701', 'a1000000-0000-0000-0000-000000000004', 7),
  -- Semester 8
  ('Ethics in Data Science', 'DS-801', 'a1000000-0000-0000-0000-000000000004', 8),

  -- ----------------------------------------------------
  -- Mechanical Engineering (ME)
  -- ----------------------------------------------------
  -- Semester 3
  ('Thermodynamics', 'ME-301', 'a1000000-0000-0000-0000-000000000005', 3),
  ('Strength of Materials', 'ME-302', 'a1000000-0000-0000-0000-000000000005', 3),
  -- Semester 4
  ('Fluid Mechanics', 'ME-401', 'a1000000-0000-0000-0000-000000000005', 4),
  ('Kinematics of Machinery', 'ME-402', 'a1000000-0000-0000-0000-000000000005', 4),
  -- Semester 5
  ('Dynamics of Machinery', 'ME-501', 'a1000000-0000-0000-0000-000000000005', 5),
  ('Heat and Mass Transfer', 'ME-502', 'a1000000-0000-0000-0000-000000000005', 5),
  -- Semester 6
  ('Design of Machine Elements', 'ME-601', 'a1000000-0000-0000-0000-000000000005', 6),
  ('CAD/CAM', 'ME-602', 'a1000000-0000-0000-0000-000000000005', 6),
  -- Semester 7
  ('Automobile Engineering', 'ME-701', 'a1000000-0000-0000-0000-000000000005', 7),
  -- Semester 8
  ('Power Plant Engineering', 'ME-801', 'a1000000-0000-0000-0000-000000000005', 8),

  -- ----------------------------------------------------
  -- Civil Engineering (CE)
  -- ----------------------------------------------------
  -- Semester 3
  ('Surveying', 'CE-301', 'a1000000-0000-0000-0000-000000000006', 3),
  ('Building Materials & Construction', 'CE-302', 'a1000000-0000-0000-0000-000000000006', 3),
  -- Semester 4
  ('Structural Analysis I', 'CE-401', 'a1000000-0000-0000-0000-000000000006', 4),
  ('Concrete Technology', 'CE-402', 'a1000000-0000-0000-0000-000000000006', 4),
  -- Semester 5
  ('Structural Analysis II', 'CE-501', 'a1000000-0000-0000-0000-000000000006', 5),
  ('Geotechnical Engineering I', 'CE-502', 'a1000000-0000-0000-0000-000000000006', 5),
  -- Semester 6
  ('Transportation Engineering', 'CE-601', 'a1000000-0000-0000-0000-000000000006', 6),
  ('Environmental Engineering', 'CE-602', 'a1000000-0000-0000-0000-000000000006', 6),
  -- Semester 7
  ('Water Resources Engineering', 'CE-701', 'a1000000-0000-0000-0000-000000000006', 7),
  -- Semester 8
  ('Construction Management', 'CE-801', 'a1000000-0000-0000-0000-000000000006', 8),

  -- ----------------------------------------------------
  -- Electrical Engineering (EE)
  -- ----------------------------------------------------
  -- Semester 3
  ('Network Analysis & Synthesis', 'EE-301', 'a1000000-0000-0000-0000-000000000007', 3),
  ('Electrical Machines I', 'EE-302', 'a1000000-0000-0000-0000-000000000007', 3),
  -- Semester 4
  ('Electrical Machines II', 'EE-401', 'a1000000-0000-0000-0000-000000000007', 4),
  ('Electromagnetic Fields', 'EE-402', 'a1000000-0000-0000-0000-000000000007', 4),
  -- Semester 5
  ('Power Systems I', 'EE-501', 'a1000000-0000-0000-0000-000000000007', 5),
  ('Control Systems', 'EE-502', 'a1000000-0000-0000-0000-000000000007', 5),
  -- Semester 6
  ('Power Systems II', 'EE-601', 'a1000000-0000-0000-0000-000000000007', 6),
  ('Power Electronics', 'EE-602', 'a1000000-0000-0000-0000-000000000007', 6),
  -- Semester 7
  ('High Voltage Engineering', 'EE-701', 'a1000000-0000-0000-0000-000000000007', 7),
  -- Semester 8
  ('Utilization of Electrical Energy', 'EE-801', 'a1000000-0000-0000-0000-000000000007', 8),

  -- ----------------------------------------------------
  -- Electronics Engineering (EC)
  -- ----------------------------------------------------
  -- Semester 3
  ('Electronic Devices & Circuits', 'EC-301', 'a1000000-0000-0000-0000-000000000008', 3),
  ('Signals & Systems', 'EC-302', 'a1000000-0000-0000-0000-000000000008', 3),
  -- Semester 4
  ('Analog Circuits', 'EC-401', 'a1000000-0000-0000-0000-000000000008', 4),
  ('Digital System Design', 'EC-402', 'a1000000-0000-0000-0000-000000000008', 4),
  -- Semester 5
  ('Microprocessors & Microcontrollers', 'EC-501', 'a1000000-0000-0000-0000-000000000008', 5),
  ('Analog & Digital Communication', 'EC-502', 'a1000000-0000-0000-0000-000000000008', 5),
  -- Semester 6
  ('Antenna and Wave Propagation', 'EC-601', 'a1000000-0000-0000-0000-000000000008', 6),
  ('VLSI Design', 'EC-602', 'a1000000-0000-0000-0000-000000000008', 6),
  -- Semester 7
  ('Embedded Systems', 'EC-701', 'a1000000-0000-0000-0000-000000000008', 7),
  -- Semester 8
  ('Radar and Navigation Systems', 'EC-801', 'a1000000-0000-0000-0000-000000000008', 8)
ON CONFLICT (code) DO NOTHING;
