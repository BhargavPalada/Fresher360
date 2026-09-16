Fresher360 

Functional Requirements Document (FRD) 

 

Document Information 

Details 

Project 

Fresher360 

Document Type 

Functional Requirements Document 

Development Team 

2 Developers 

Development Period 

14-Sep-2026 to 2-Oct-2026 

UAT 

3-Oct-2026 

 

 

1. Document Purpose 

This document defines the functional requirements for the Fresher360 MVP. 

The MVP will cover: 

Authentication and role-based access 

Task assignment and management 

Fresher task management 

LMS learning workflow 

Learning material 

Quiz assessment 

Topic unlocking based on assessment result 

2. MVP Scope 

ID 

Feature 

MVP Scope 

US-01 

Authentication & Access 

Login and role-based access 

US-02 

Task Assignment 

Create and assign tasks 

US-03 

Task Management 

View All Tasks with search/filter 

US-04 

Task Management 

Edit Task 

US-05 

Fresher Task Management 

View My Tasks 

US-06 

Fresher Task Management 

Update Task Status 

US-07 

LMS 

learning workflow and learning material 

US-08 

LMS Assessment 

Quiz assessment, scoring and unlock 

INT-01 

Integration 

End-to-end integration and stabilization 

UAT-01 

UAT 

BA UAT and defect validation 

 

 

 

 

Images for references 

 

 

LMS admin view  

 

 

LMS User/Fresher view  

 

 
 

 

 

 

Fresher view (Dashboard isn’t required at this stage. Instead of dashboard we will go-ahead with LMS ) 

 

3. User Roles 

The MVP will support the following roles: 

Role 

Description 

ADMIN 

Manages tasks and LMS content 

User 

Views assigned tasks, updates task status and completes LMS learning 

 

The role will be maintained in the backend. 

The user will not select the role during login. 

4. Authentication & Access 

4.1 MVP Login Mechanism 

For the MVP demo, pre-created user accounts will be used. 

User 

Role 

Admin 

ADMIN 

User 

USER 

 

4.2 Login Flow 

User enters Email ID and Password. 

Frontend sends the credentials to the backend. 

Backend validates the credentials. 

System identifies the user's role from the user record. 

Based on the role, the appropriate application access is provided. 

User is redirected to the respective application view. 

4.3 Example 

User Login 
↓ 
Email + Password 
↓ 
Authentication 
↓ 
Role = User 
↓ 
Fresher Application View 

Admin Login 
↓ 
Email + Password 
↓ 
Authentication 
↓ 
Role = ADMIN 
↓ 
Admin Application View 

5. Admin View 

After successful Admin login, the Admin will have access to: 

Assign Task 

All Tasks 

LMS 

Dashboard is not included in the MVP. 

6. Task Assignment 

6.1 Description 

Admin can create and assign tasks to one or more freshers. 

6.2 Task Fields 

Field 

Values / Requirement 

Task Title 

Mandatory 

Category 

Documentation / Technical / Training / Functional 

Priority 

Task priority 

Due Date 

Task due date 

Status 

Pending / In Progress / Completed 

Assign to Fresher 

One or multiple freshers 

Comments 

Text field 

 

Status 

🟠 Pending 

🔵 In Progress 

🟢 Completed 

6.3 Task Assignment Flow 

Assign Task 
↓ 
Enter Task Details 
↓ 
Select Fresher(s) 
↓ 
Task is created 
↓ 
Task becomes visible to the selected Fresher(s) 

7. All Tasks – Admin 

Admin can view all tasks assigned to all freshers. 

7.1 Admin Capabilities 

View all tasks 

Search tasks 

Search freshers 

Filter by Fresher 

Filter by Category 

Filter by Priority 

Filter by Status 

View task details 

Edit task details 

7.2 Editable Fields 

Admin can edit: 

Task Title 

Description 

Category 

Priority 

Due Date 

Status 

Assigned Fresher(s) 

Comments 

Admin has full control over task details. 

8. Fresher View – My Tasks 

After Fresher login, the Fresher can access: 

My Tasks 

LMS 

The Fresher can view only the tasks assigned to them. 

8.1 Task Information 

Fresher can view: 

Task Title 

Description 

Category 

Priority 

Status 

Due Date 

Completion Summary 

9. Fresher Task Permissions 

The Fresher can edit only the Status and write their overview in completion summary of an assigned task. 

9.2 Restricted Fields 

The Fresher cannot edit: 

Task Title 

Description 

Category 

Priority 

Due Date 

Assigned Fresher(s) 

10. Task Document Upload 

The document upload option will be available within the task flow for Documentation tasks in Fresher view My task section  

10.1 Business Rule 

When: 

Category = Documentation 

the Fresher should see an Upload Document option while viewing the assigned task. 

10.2 Supported Formats 

PDF 

DOC 

DOCX 

10.3 Example 

Documentation Task 
↓ 
View Task 
↓ 
Upload Document 
↓ 
Select PDF/DOC/DOCX 

For the following categories, the Upload Document option will not be available: 

Technical 

Training 

Functional 

11. LMS – Admin View 

Admin can access the LMS tab and view/manage the pre-configured learning content. 

11.1 MVP Topics 

1. QET & QE 

2. TS Roles & Responsibilities, EOS Overview 

11.2 Admin Capabilities 

View learning material 

Add/edit text-based learning material 

View pre-configured quiz questions 

View the passing score 

11.3 MVP LMS Scope 

Item 

MVP Requirement 

Topics 

2 

Learning Material 

Text only 

Quiz 

Pre-configured 

Questions 

Hard-coded 

Number of Questions 

5 

Passing Score 

80% 

Topic Order 

Hard-coded 

Unlocking Sequence 

Hard-coded 

PDF/DOC/PPT Upload 

Not required 

Dynamic LMS Configuration 

Not required 

Q&A Assessment 

Not required 

 

12. LMS – Fresher View 

The Fresher can access the LMS and complete the learning topics. 

12.1 Initial State 

Topic 

Status 

QET & QE 

🔓 Unlocked 

TS Roles & Responsibilities, EOS Overview 

🔒 Locked 

 

13. LMS Learning Workflow 

The learning workflow will be sequential. 

Topic 1 – QET & QE 

QET & QE 
↓ 
View Learning Material 
↓ 
Complete Learning 
↓ 
Take Quiz 
↓ 
Submit Assessment 
↓ 
System calculates score 

If Fresher Passes 

If the Fresher achieves 80% or above: 

Assessment is Passed 
↓ 
QET & QE is marked Completed 
↓ 
Next topic is Unlocked 

Topic 2 

TS Roles & Responsibilities, EOS Overview 

changes from: 

🔒 Locked → 🔓 Unlocked 

The Fresher can then open the topic and continue the learning journey. 

14. LMS Assessment 

For the MVP demo: 

Each assessment will contain 5 pre-configured questions. 

Each question will carry 1 mark. 

Total assessment marks will be 5. 

The correct answer for each question will be pre-configured by the developer. 

The Fresher will select an answer for each question and submit the assessment. 

The system will automatically compare the Fresher's answers with the pre-configured correct answers and calculate the score. 

A Fresher must answer at least 4 out of 5 questions correctly to pass. 

The passing criteria and unlocking logic will be hard-coded for the MVP. 

80% is the equivalent percentage of 4 out of 5, but the primary passing criterion will be 4 correct answers out of 5. 

14.1 Assessment Evaluation 

Correct Answers 

Score 

Result 

5/5 

100% 

Pass 

4/5 

80% 

Pass 

3/5 

60% 

Fail 

2/5 

40% 

Fail 

1/5 

20% 

Fail 

0/5 

0% 

Fail 

 

14.2 Assessment Result – Pass 

If the Fresher answers 4 or more questions correctly: 

Assessment Passed 
↓ 
Current Topic = Completed 
↓ 
Next Topic = Unlocked 

14.3 Assessment Result – Fail 

If the Fresher answers less than 4 questions correctly: 

Assessment Failed 
↓ 
Current Topic remains Incomplete 
↓ 
Next Topic remains Locked 

14.4 Question and Answer Configuration – MVP 

Example: 

Question 

Correct Answer 

Marks 

Question 1 

Option A 

1 

Question 2 

Option C 

1 

Question 3 

Option B 

1 

Question 4 

Option D 

1 

Question 5 

Option A 

1 

 

The correct answer will not be displayed to the Fresher. 

The Admin does not need to configure the correct answers through the application during the MVP. 

Future Enhancement: Admin can be provided with an interface to add/edit questions, options and correct answers. 

15. Learning Material Approach 

For the MVP demo, learning material will be provided as  text-based content. 

The MVP will not require: 

PDF upload for LMS learning material 

DOC/DOCX upload for LMS learning material 

PPT upload 

Dynamic LMS content builder 

Dynamic assessment configuration 

The learning content and assessment questions can be pre-configured for the MVP demo. 

Important distinction: PDF/DOC/DOCX upload is still applicable to Documentation tasks under Task Management. It is only LMS learning material that is text-only for the MVP. 

16. End-to-End Application Navigation 

Admin 

Login 
↓ 
Admin View 
↓ 
Assign Task / All Tasks / LMS 

Fresher 

Login 
↓ 
Fresher View 
↓ 
My Tasks / LMS 

 

17. Sprint Plan 

Sprint 1 – Authentication + Task Assignment 

14-Sep-2026 to 18-Sep-2026 

Owner 

ID 

Tasks 

Dev 1 

US-01 

Login UI + validation; role-based UI/routing 

Dev 2 

US-01 

Authentication API + roles 

Dev 1 

US-02 

Create/Assign Task UI + validation 

Dev 2 

US-02 

Task + assignment APIs and database 

Both 

— 

18-Sep: Integration and basic testing 

 

Sprint Outcome 

Admin/Fresher login works and Admin can create and assign tasks. 

Sprint 2 – Task Management + Fresher 

21-Sep-2026 to 25-Sep-2026 

Owner 

ID 

Tasks 

Dev 1 

US-03 

All Tasks table + search/filter 

Dev 2 

US-03 

Get Tasks API + filtering 

Dev 1 

US-04 

Edit Task UI + validation 

Dev 2 

US-04 

Update Task API 

Dev 1 

US-05 

My Tasks UI + details 

Dev 2 

US-05 

My Tasks API + authorization 

Dev 1 

US-06 

Status update UI + API integration 

Dev 2 

US-06 

Status update API + validation 

Both 

— 

25-Sep: Integration and fixes 

 

Sprint Outcome 

Admin task management and Fresher My Tasks/status flow are functional. 

Sprint 3 – LMS 

28-Sep-2026 to 30-Sep-2026 

Owner 

ID 

Tasks 

Dev 1 

US-07 

LMS UI: QET Ops + learning workflow 

Dev 2 

US-07 

LMS APIs + database structure 

Dev 1 

US-08 

Learning Material + Assessment/Quiz UI 

Dev 2 

US-08 

Assessment API, scoring and unlock logic 

 

Sprint Outcome 

Fresher can access QET Ops learning material, complete the quiz and unlock the next topic after passing. 

18. Integration, Testing and Demo Readiness 

Date 

Owner 

Activity 

1-Oct 

Both 

End-to-end frontend/backend integration; role access; LMS unlock testing 

2-Oct 

Both 

System testing, critical bug fixing and code freeze 

3-Oct 

BA + Both 

UAT, defect validation and fixes 

4-Oct 

Both 

Demo data, demo accounts, final UI/API verification; no new features 

5-Oct 

Both 

MVP Demo 

 

19. Demo Flow 

The MVP demo will demonstrate the core task and LMS journey. 

Admin 

1. Admin Login 

2. Admin View 

3. Assign Task 

4. Create and assign task 

5. Open All Tasks 

6. Search/filter tasks 

7. Edit task 

8. Open LMS 

9. Select QET Ops 

10. Open QET & QE 

11. Show Learning Material 

12. Show Assessment/Quiz 

Fresher 

13. Login as Fresher 

14. Open My Tasks 

15. View assigned task 

16. Update task status 

17. Open LMS 

18. Open QET & QE 

19. Read/complete learning material 

20. Take and submit quiz 

21. Show passing score 

22. Show EOS Overview and Role in TS changing from Locked → Unlocked 

20. Features Deferred After MVP 

The following features are not part of the MVP: 

Dashboard 

Multiple team management UI 

LMS workflow builder/configuration screen 

Q&A assessment/manual evaluation 

Certificates 

Advanced reports and analytics 

Export functionality 

Dynamic LMS document upload 

Admin-driven user onboarding 

Password reset 

SSO/MFA integration 

21. Future Login Enhancement 

The MVP will use pre-created accounts. 

For the production version, Admin-driven onboarding can be introduced. 

Future Flow 

Admin 
↓ 
Add Fresher 
↓ 
Enter User Details 
↓ 
Create Account 
↓ 
Send Invitation 
↓ 
Fresher Sets Password 
↓ 
First Login 

Future capabilities may include: 

Add/Edit/Deactivate users 

Team assignment 

Email invitation 

First-time password setup 

Password reset 

Role-based authorization 

Account activation/deactivation 

SSO/MFA integration, if required 

 

22. Planned Technology Stack 

Layer 

Technology 

Frontend 

React + TypeScript 

UI 

MUI 

State Management 

Redux Toolkit 

API Communication 

REST API 

Backend 

Node.js + Express  

Database 

PostgreSQL 

 

23. Functional Acceptance Criteria 

Authentication 

Admin can log in using valid credentials. 

Fresher can log in using valid credentials. 

System identifies the user's role from the backend. 

User does not select a role during login. 

Admin receives Admin access. 

Fresher receives Fresher access. 

Task Management 

Admin can create a task. 

Admin can assign a task to one or more freshers. 

Admin can view all tasks. 

Admin can search and filter tasks. 

Admin can edit task details. 

Fresher can view assigned tasks. 

Fresher can update only task status. 

Documentation tasks provide an Upload Document option. 

PDF, DOC and DOCX formats are supported. 

LMS 

Admin can access the LMS. 

Fresher can access the LMS. 

QET & QE topic is initially unlocked. 

TS Roles & Responsibilities, EOS Overview is initially locked. 

Learning material is available. 

Fresher can complete the quiz. 

Quiz contains five questions. 

Passing score is 80%. 

Passing the assessment marks the current topic as Completed. 

Passing the assessment unlocks the next topic. 

TS Roles & Responsibilities, EOS Overview changes from Locked → Unlocked after successful completion. 

24. Final MVP Definition 

The Fresher360 MVP is considered demo-ready when the following core journey works end-to-end: 

Admin/Fresher Login 
↓ 
Role-Based Access 
↓ 
Task Assignment and Management 
↓ 
Fresher My Tasks 
↓ 
Task Status Update 
↓ 
LMS 
 
↓ 
QET & QE Learning Material 
↓ 
Quiz Assessment 
↓ 
Pass 80% ≥ 
↓ 
QET & QE Completed 
↓ 
EOS Overview and Role in TS: Locked Unlocked → 

 

 