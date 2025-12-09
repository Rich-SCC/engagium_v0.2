# **CHAPTER 3 – METHODOLOGY**

---

# **3.1 Research Methodology**

## **3.1.1 Type of Research**

This study employs a **Descriptive-Developmental Research Design** combining both descriptive and design science methodologies. The descriptive component involves gathering perceptions and evaluations from faculty respondents through survey instruments to assess the usability and effectiveness of the developed system. The developmental component encompasses the systematic design, implementation, and evaluation of the Engagium system—a browser-based participation tracking tool for online learning environments.

The descriptive method is utilized to collect quantitative data regarding faculty perceptions of the system's functionality, ease of use, and perceived utility in managing student participation during synchronous online classes. This approach enables the researcher to systematically document user experiences and identify patterns in system usage and acceptance.

The design science approach guides the system development process, emphasizing the creation of a technological artifact (the Engagium system) to address the identified problem of inefficient participation monitoring in virtual classrooms. This methodology aligns with established information systems research paradigms that prioritize the construction and evaluation of innovative solutions to real-world problems.

## **3.1.2 System Development Methodology**

The development of the Engagium system followed an **Agile Software Development Life Cycle (SDLC)** methodology characterized by iterative and incremental development practices. Agile methodologies emphasize flexibility, continuous improvement, and rapid response to changing requirements—qualities particularly suited to this research project where technical challenges and user needs evolved during development.

The selection of Agile was justified by several project-specific factors: (1) **evolving requirements** regarding participation metrics and detection mechanisms that required adaptive planning; (2) **technical uncertainty** due to the absence of official Google Meet APIs, necessitating experimental exploration of DOM-based detection strategies; (3) **risk mitigation** through early and frequent delivery of working components; and (4) **continuous validation** through demonstrations to potential users, ensuring alignment with instructor needs.

### **3.1.2.1 Development Phases**

The Agile SDLC implementation consisted of five sequential phases with iterative refinement (see Appendix B for detailed phase diagram):

#### **Phase 1: Requirements Analysis**

The initial phase focused on problem identification and stakeholder analysis, establishing:

- **Primary Problem**: Instructors lack real-time visibility into student participation during synchronous Google Meet sessions
- **Functional Requirements**: Automatic detection of join/leave events, timestamp recording, attendance calculation, roster management, participant matching, and web-based data visualization
- **Non-Functional Requirements**: Maintaining browser performance, ensuring data security, operating reliably during network interruptions, and respecting user privacy
- **Technical Constraints**: Absence of public Google Meet API necessitated DOM-based detection; Chrome Manifest V3 restrictions required careful extension architecture planning

#### **Phase 2: System Design**

The design phase established a **three-tier architecture**: (1) **Presentation Layer** comprising browser extension interface and React-based dashboard; (2) **Application Layer** using Node.js/Express RESTful API with Socket.io for real-time communication; and (3) **Data Layer** utilizing PostgreSQL relational database with normalized schema.

Database design employed entity-relationship modeling to identify core entities (Users, Classes, Students, Sessions, Attendance Records, Participation Logs). The extension architecture utilized a modular detector pattern separating concerns for different event types. API design followed RESTful principles with resource-based endpoints organized by functional domains.

#### **Phase 3: Incremental Development**

Development proceeded through seven iterative cycles (detailed in Appendix B):

**Iterations 1-2**: Established foundational infrastructure (database, authentication) and core CRUD operations for class and student management

**Iterations 3-4**: Developed browser extension core functionality (Google Meet detection, participant tracking, DOM observation) and attendance tracking with a two-table model supporting precise duration calculations

**Iterations 5-6**: Integrated WebSocket communication for real-time updates and expanded participation detection to include chat, reactions, hand raises, and microphone toggles

**Iteration 7**: System refinement focusing on error handling, user feedback mechanisms, and documentation

#### **Phase 4: Testing**

Multiple testing strategies were employed:

- **Functional Testing**: Verification of API endpoints, frontend workflows, and extension behaviors
- **Integration Testing**: Validation of data flow across system components
- **System Testing**: End-to-end verification of complete user workflows
- **Accuracy Testing**: Controlled validation of detection accuracy through comparison with manually recorded ground truth
- **Usability Testing**: User experience evaluation through standardized instruments

#### **Phase 5: Deployment**

The deployment architecture supports both local development and testing environments. The backend is deployed as a Node.js application with PostgreSQL connectivity. The frontend is built as a static React application. The browser extension is distributed as an unpacked Chrome extension for research evaluation purposes.

## **3.1.3 Research Locale**

The study was conducted at **St. Clare College of Caloocan (SCCC)**, a private higher education institution located in General Luis Street, Caloocan City. The institution implements a **blended learning structure**, alternating weekly between face-to-face and online synchronous sessions. Google Meet serves as the primary video conferencing platform for online classes.

The study specifically focuses on the **Institute of Computer Studies faculty**, who regularly handle multiple online classes per week and rely on participation as a significant component of course assessment. The instructional environment is characterized by medium-sized classes (20–40 students per session), frequent synchronous discussions, and varied forms of student engagement (microphone input, chat, reactions).

## **3.1.4 Target Respondents**

The target respondents consist of **10–20 faculty members** from the Institute of Computer Studies and selected instructors from other departments who conduct synchronous online classes using Google Meet. Inclusion criteria require that participants:

1. Have taught at least **five (5)** online sessions during Academic Year 2025–2026
2. Use Google Meet as their primary synchronous teaching platform
3. Have practical experience monitoring student engagement online
4. Voluntarily consent to participate in the survey and, if applicable, prototype testing

This ensures that respondents possess sufficient contextual experience to provide informed evaluations of the system's functionality and practical utility.

## **3.1.5 Sampling Technique**

This study employed **purposive sampling**, a non-probability sampling technique in which participants are selected based on specific characteristics relevant to the research objectives. Faculty members who actively use Google Meet for synchronous online instruction were deliberately selected, as they represent the target user population for whom the Engagium system was designed.

Purposive sampling was selected because only instructors familiar with synchronous online teaching could meaningfully assess the feasibility and usefulness of Engagium. The technique ensures that respondents possess context-specific knowledge relevant to the system's intended use. While this approach limits statistical generalizability, it enhances the relevance and depth of insights regarding the system's practical applicability in authentic online teaching contexts.

## **3.1.6 Data Sources**

### **3.1.6.1 System Data Sources**

The Engagium system generates multiple data streams that serve as primary data sources for assessing system functionality and accuracy:

- **Attendance Data**: Automatically captured timestamps recording participant join and leave events during Google Meet sessions. Each attendance interval includes participant identifiers, session identifiers, and precise temporal data stored in the PostgreSQL database.

- **Participation Logs**: System-generated records of student interaction events, including chat messages, reactions (thumbs up, applause, etc.), hand raises, and microphone toggle actions. Each log entry is timestamped and associated with a specific student and session.

- **Session Metadata**: Information about class sessions, including session start time, end time, duration, associated class identifier, and instructor identifier.

- **System Performance Metrics**: Technical data regarding system responsiveness, error rates, and synchronization latency between extension and backend components.

These system-generated data sources enable objective evaluation of the system's technical performance, detection accuracy, and operational reliability.

### **3.1.6.2 Research Data Sources**

In addition to system-generated data, the study collects evaluative data from human respondents:

- **Survey Responses**: Collected using the **ENGAGIUM Chapter 3 Survey Questionnaire (Revised & Expanded)** with six sections covering: (1) demographics, (2) current participation-tracking challenges, (3) Technology Acceptance Model (TAM) constructs, (4) usability expectations, (5) data privacy expectations, and (6) open-ended qualitative feedback. Expected number of respondents: 10–20 faculty members.

- **Qualitative Feedback**: Open-ended responses capture nuanced concerns and feature suggestions not measurable by Likert scales. These responses provide contextual depth to quantitative findings and identify unanticipated issues or user needs.

## **3.1.7 Research Instruments**

### **3.1.7.1 Survey Questionnaire**

A structured survey questionnaire was developed to assess faculty perceptions of the Engagium system. The instrument consists of six sections:

- **Section A: Demographics** (5 items) – Department, teaching experience, weekly online class frequency, device usage
- **Section 1: Problem Validation** (10 items) – Current participation-tracking challenges
- **Section 2: Technology Acceptance** (20 items) – Perceived usefulness, perceived ease of use, behavioral intention to use, and feasibility constraints based on TAM
- **Section 3: Usability Expectations** (15 items) – Dashboard interface preferences, report features, and tracking options
- **Section 4: Data Privacy Expectations** (5 items) – Privacy compliance and data security concerns
- **Section 5: Qualitative Inputs** (3 open-ended) – Challenges, desired features, and concerns
- **Section 6: Consent for Follow-up** (3 items) – Willingness to participate in interviews or prototype testing

The questionnaire employs a **5-point Likert scale** (1 = Strongly Disagree to 5 = Strongly Agree) for quantitative items, supplemented by open-ended questions to capture qualitative insights.

### **3.1.7.2 System Evaluation Instruments**

The **System Usability Scale (SUS)**, a widely validated 10-item questionnaire developed by John Brooke (1986), will be administered to provide a standardized measure of system usability. The SUS yields a score ranging from 0 to 100, with scores above 68 considered above average usability. This instrument enables benchmarking of the Engagium system against established usability norms and provides a quantitative measure of overall user experience quality.

### **3.1.7.3 Instrument Validation**

Prior to distribution, the survey questionnaire underwent **content validation** through expert review. Three faculty members with expertise in educational technology, research methodology, and online teaching workflows reviewed the instrument to assess the clarity, relevance, and appropriateness of items:

1. One IT professor with educational technology expertise
2. One research methods professor familiar with survey design
3. One faculty member with extensive online teaching experience

Feedback from reviewers was incorporated through iterative revision, ensuring that questions accurately measure the intended constructs and are comprehensible to the target respondent population.

Pilot testing was conducted with 3–5 faculty members not included in the final sample to identify ambiguous wording and technical issues with survey administration. Pilot participants provided feedback on question clarity and survey completion time, leading to final refinements before full deployment.

## **3.1.8 Ethical Considerations**

This study adheres to ethical principles governing human subjects research and data privacy:

### **Informed Consent**

All faculty participants received comprehensive information about the study's purpose, procedures, potential risks and benefits, and their rights as research participants. A digital consent form was embedded at the beginning of the online survey, requiring explicit opt-in acknowledgment before proceeding to the questionnaire. The consent form included:

- Study objectives and procedures
- Voluntary nature of participation
- Right to withdraw at any time without consequence
- Confidentiality and anonymization measures
- Contact information for the researcher
- Acknowledgment that participation does not affect employment status or professional evaluation

Participation was entirely voluntary, with no consequences for declining or withdrawing from the study.

### **Privacy and Data Protection**

The study complies with **Republic Act No. 10173** (Data Privacy Act of 2012) and related regulations governing the collection, processing, and storage of personal information. Specific privacy protections include:

- **Data Minimization**: Only data necessary for research objectives is collected. The system does not record audio, video, or chat content—only metadata indicating that interactions occurred.

- **Anonymization**: Survey responses are anonymized, with no personally identifiable information linked to individual responses in data analysis and reporting.

- **Secure Storage**: All data (system logs, survey responses, attendance records) is stored in encrypted databases with access restricted to the researcher. JWT (JSON Web Token) authentication ensures that only authorized users can access system data.

- **Confidentiality**: Individual faculty names and specific institutional details are not disclosed in research publications unless explicit permission is obtained.

### **Participant Rights**

Participants were informed of their rights to:
- Access their own data collected by the system
- Request correction of inaccurate information
- Withdraw consent and have their data removed from the study
- Receive information about research findings upon completion

### **Minimal Risk**

The study poses minimal risk to participants. The system functions as a productivity tool without intrusive monitoring or evaluation of teaching quality. Faculty maintain full control over their class data and can discontinue system use at any time.

## **3.1.9 Testing Environment**

The Engagium system was developed and tested in environments representative of typical instructor use cases:

### **Hardware Specifications**

Development and initial testing were conducted on laptops with the following specifications:

- **Processor**: Intel Core i5 or AMD Ryzen 5 (or higher)
- **RAM**: 8–16 GB
- **Operating System**: Windows 11
- **Additional Testing**: macOS Ventura for cross-platform compatibility verification

Testing was extended to multiple devices to ensure consistent performance across typical instructor hardware configurations.

### **Software Environment**

The system requires the following software environment:

- **Browser**: Google Chrome version 120 or higher (required for Chrome Extension Manifest V3 compatibility)
- **Operating System**: Compatible with Windows 10/11, macOS, and Linux distributions supporting Chrome
- **Internet Connection**: Stable broadband connection (minimum 5 Mbps recommended) for real-time synchronization
- **Google Meet Access**: Valid Google account with access to Google Meet video conferencing

### **Development Environment**

The development environment consisted of:

- **Node.js**: Version 18.x or higher for backend server execution
- **PostgreSQL**: Version 14 or higher for database management
- **Code Editor**: Visual Studio Code for development and debugging
- **Version Control**: Git for source code management

### **Testing Scenarios**

Functional testing encompassed multiple scenarios simulating realistic classroom conditions:

- **Typical Class Sessions**: 20-40 participants, 60-90 minute duration
- **Network Variability**: Testing under different connection conditions to validate offline synchronization
- **Concurrent Sessions**: Multiple instructors running sessions simultaneously to test backend scalability
- **Participant Behavior**: Simulated join/leave patterns, chat activity, and interaction events

---

# **3.2 Research Design**

## **3.2.1 Conceptual Framework of the Study**

The conceptual framework for this study integrates principles from **Technology Acceptance Theory** and **Design Science Research** to guide both system development and evaluation.

### **Technology Acceptance Perspective**

The evaluation component draws upon the **Technology Acceptance Model (TAM)**, which posits that user acceptance of information systems is primarily determined by two constructs:

1. **Perceived Usefulness (PU)**: The degree to which an individual believes that using the system will enhance their job performance—in this case, the efficiency and effectiveness of participation monitoring and attendance tracking.

2. **Perceived Ease of Use (PEOU)**: The degree to which an individual believes that using the system will be free of effort.

According to TAM, these perceptions influence **Behavioral Intention to Use**, which predicts actual system usage. The survey instrument is designed to measure faculty perceptions along these dimensions, enabling assessment of the system's likely adoption and continued use.

### **Design Science Research Framework**

From a design science perspective, the study follows a problem-solving paradigm consisting of:

1. **Problem Identification**: Recognition of inefficiencies in participation tracking within online learning environments
2. **Artifact Design**: Creation of the Engagium system as a technological solution
3. **Artifact Evaluation**: Assessment of the system's utility, quality, and efficacy through technical testing and user evaluation
4. **Communication**: Dissemination of findings through thesis documentation and potential publication

This framework positions the Engagium system as a **design artifact**—a purposefully constructed tool intended to address an identified organizational or educational need.

### **Conceptual Model Diagram**

The conceptual model illustrates the Input-Process-Output (IPO) framework underlying the Engagium system's operation and evaluation. The **problem domain** identifies key challenges in online participation monitoring that the system addresses. The **design artifact** (Engagium system) transforms various participation **inputs** (join/leave events, chat messages, reactions, hand raises, microphone toggles) through systematic **processes** (detection, matching, storage, calculation, real-time broadcast) into meaningful **outputs** (attendance records, duration totals, participation analytics, live feed updates).

These outputs are then evaluated through the **Technology Acceptance Model (TAM)** framework, which assesses three key constructs: **Perceived Usefulness** (efficiency improvement and time savings), **Perceived Ease of Use** (minimal learning curve and intuitive interface), and **Behavioral Intention to Use** (adoption likelihood and continued usage intent). Evaluation results inform **system refinement and iteration** through a continuous feedback loop, aligning with the Agile SDLC methodology described in Section 3.1.2.

**Figure 3.2: Conceptual Framework of the Study**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CONCEPTUAL FRAMEWORK - ENGAGIUM                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│  PROBLEM DOMAIN     │
│                     │
│ • Manual attendance │
│   tracking burden   │
│ • Limited real-time │
│   participation     │
│   visibility        │
│ • Engagement gaps   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DESIGN ARTIFACT: ENGAGIUM SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐                  │
│  │   INPUTS     │      │  PROCESSES   │      │   OUTPUTS    │                  │
│  │              │      │              │      │              │                  │
│  │ • Join/Leave │─────►│ • Detection  │─────►│ • Attendance │                  │
│  │   Events     │      │ • Matching   │      │   Records    │                  │
│  │ • Chat       │─────►│ • Storage    │─────►│ • Duration   │                  │
│  │   Messages   │      │ • Calculation│      │   Totals     │                  │
│  │ • Reactions  │─────►│ • Analysis   │─────►│ • Participation                 │
│  │ • Hand Raises│      │ • Real-time  │      │   Analytics  │                  │
│  │ • Mic Toggles│      │   Broadcast  │      │ • Live Feed  │                  │
│  └──────────────┘      └──────────────┘      └──────┬───────┘                  │
│                                                      │                          │
└──────────────────────────────────────────────────────┼──────────────────────────┘
                                                       │
                                                       ▼
                           ┌────────────────────────────────────┐
                           │   EVALUATION (TAM Framework)       │
                           │                                    │
                           │  ┌──────────────────────────────┐  │
                           │  │ Perceived Usefulness (PU)    │  │
                           │  │ • Efficiency improvement     │  │
                           │  │ • Time savings               │  │
                           │  └──────────────┬───────────────┘  │
                           │                 │                  │
                           │  ┌──────────────▼───────────────┐  │
                           │  │ Perceived Ease of Use (PEOU) │  │
                           │  │ • Minimal learning curve     │  │
                           │  │ • Intuitive interface        │  │
                           │  └──────────────┬───────────────┘  │
                           │                 │                  │
                           │                 ▼                  │
                           │  ┌──────────────────────────────┐  │
                           │  │ Behavioral Intention to Use  │  │
                           │  │ • Adoption likelihood        │  │
                           │  │ • Continued usage intent     │  │
                           │  └──────────────────────────────┘  │
                           └────────────────────────────────────┘
                                           │
                                           │ Feedback Loop
                                           ▼
                           ┌────────────────────────────────────┐
                           │   System Refinement & Iteration    │
                           └────────────────────────────────────┘
```

## **3.2.2 Study Flow**

The overall study follows a sequential process:

**Figure 3.3: Research Study Flow Diagram**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           RESEARCH STUDY FLOW                                   │
└────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────┐
    │ Phase 1: SYSTEM DEVELOPMENT              │
    │ • Agile iterative development            │
    │ • 7 development iterations               │
    │ • Feature implementation                 │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ Phase 2: INTERNAL TESTING                │
    │ • Functional testing                     │
    │ • Integration testing                    │
    │ • Performance validation                 │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ Phase 3: PILOT DEPLOYMENT                │
    │ • Small faculty group testing            │
    │ • Real classroom environment             │
    │ • Issue identification                   │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ Phase 4: REFINEMENT                      │
    │ • Bug fixes                              │
    │ • Usability improvements                 │
    │ • Feature adjustments                    │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ Phase 5: EVALUATION STUDY                │
    │ • Survey distribution                    │
    │ • Faculty system usage                   │
    │ • Data collection                        │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ Phase 6: DATA ANALYSIS                   │
    │ • Descriptive statistics                 │
    │ • Usability metrics                      │
    │ • Accuracy assessment                    │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────┐
    │ Phase 7: REPORTING                       │
    │ • Findings synthesis                     │
    │ • Thesis documentation                   │
    │ • Conclusions & recommendations          │
    └──────────────────────────────────────────┘
```

1. **Phase 1: System Development** – The Engagium system is designed and implemented through iterative Agile development cycles (detailed in Section 3.1.2).

2. **Phase 2: Internal Testing** – The researcher conducts comprehensive functional and integration testing to ensure system stability and accuracy.

3. **Phase 3: Pilot Deployment** – A small group of faculty participants (pilot testers) use the system in authentic teaching contexts to identify usability issues and technical defects.

4. **Phase 4: Refinement** – Based on pilot feedback, system improvements are implemented.

5. **Phase 5: Evaluation Study** – The survey questionnaire is distributed to faculty respondents during a two-week data collection period. Simultaneously, selected faculty participants (3–5 volunteers) use the system in actual online teaching sessions to generate real-world usage data. System logs and survey responses are collected for analysis.

6. **Phase 6: Data Analysis** – Collected data is analyzed using appropriate statistical techniques (described in Section 3.4).

7. **Phase 7: Reporting** – Findings are synthesized and documented in the thesis manuscript.

## **3.2.3 Variables of the Study**

This descriptive research does not manipulate independent variables or employ experimental controls. Rather, it measures faculty perceptions of system characteristics as dependent variables, including:

- **Perceived Usefulness**: Faculty beliefs regarding the system's ability to enhance participation monitoring efficiency
- **Perceived Ease of Use**: Faculty perceptions of the effort required to learn and use the system
- **Behavioral Intention to Use**: Faculty willingness to adopt and continue using the system
- **System Usability**: Overall user experience quality as measured by the System Usability Scale
- **Satisfaction**: Faculty contentment with system features and performance

Demographic characteristics (teaching experience, technological proficiency, weekly online class frequency) may be analyzed as moderating factors influencing perceptions.

---

# **3.3 Data Gathering Procedure**

## **3.3.1 Pre-Survey Preparation**

The survey questionnaire was finalized following expert review and pilot testing (as described in Section 3.1.7.3). Google Forms was configured to host the questionnaire, with settings configured to ensure:

- One response per participant (email collection enabled)
- Anonymized data storage (email addresses stored separately from responses)
- Required consent acknowledgment before accessing survey items
- Progress indicators for respondent orientation

Prior to distribution, the researcher obtained necessary approvals from the Institute of Computer Studies department head and secured institutional permission to invite faculty participation. The study protocol was reviewed to ensure compliance with institutional policies and the Data Privacy Act of 2012.

## **3.3.2 Survey Distribution**

The survey was distributed electronically to approximately 15–20 eligible faculty members via institutional email during the first quarter of Academic Year 2025–2026. The invitation email included:

1. A brief explanation of the study's purpose and significance
2. A link to the online questionnaire (Google Forms)
3. An estimated completion time of 15–20 minutes
4. Assurance of confidentiality and data anonymization
5. Contact information for questions or concerns
6. A statement emphasizing voluntary participation

Reminder emails were sent seven days after the initial invitation to encourage participation. The survey remained open for two weeks to allow sufficient response time. Responses were automatically collected and stored in Google Forms' secure database with encryption in transit.

## **3.3.3 System Testing Procedure**

### **3.3.3.1 Functional Testing**

Functional testing verified that each system component operates according to specifications:

- **Participation Detection Testing**: The browser extension was tested for accurate detection of participant join/leave events, chat messages, reactions, hand raises, and microphone toggles. Test cases included both typical user actions and edge cases (e.g., rapid join/leave cycles, concurrent events).

- **Data Synchronization Testing**: The synchronization mechanism between the extension's IndexedDB storage and the backend database was validated under various network conditions, including simulated connection loss and restoration.

- **Session Lifecycle Testing**: Complete session workflows (session creation, activation, event logging, session termination, attendance calculation) were executed to ensure proper state transitions and data integrity.

- **Dashboard Functionality Testing**: All dashboard features (class creation, student roster import, session viewing, live feed updates, attendance reports) were tested for correct operation and responsiveness.

### **3.3.3.2 Usability Testing**

Usability testing involved 3–5 faculty participants performing representative tasks while the researcher observed and recorded completion times, errors, and subjective feedback. Participants were asked to complete the following tasks:

1. Install the browser extension and authenticate using provided credentials
2. Create a class and import a sample student roster via CSV
3. Initiate a session during a live Google Meet class
4. Monitor the live participation feed during the session
5. End the session and view the generated attendance report

The System Usability Scale (SUS) was administered post-test to quantify overall usability perceptions. Task completion rates, error frequencies, and time-on-task metrics were recorded to identify usability issues requiring refinement.

### **3.3.3.3 Accuracy Testing**

Accuracy testing compared system-detected participation events against manually recorded ground truth data. During controlled test sessions with 20–30 simulated participants, a human observer documented actual participant join/leave times and interaction events using timestamped manual logs. These manual records were then compared with system-generated logs to calculate:

- **Precision**: Percentage of detected events that were genuine (avoiding false positives)
- **Recall**: Percentage of actual events successfully detected (avoiding false negatives)
- **F1 Score**: Harmonic mean of precision and recall

Discrepancies were analyzed to identify systematic errors or detection failures. Accuracy metrics were calculated separately for different event types (attendance, chat, reactions, hand raises, microphone toggles) to assess detection reliability across participation modalities.

## **3.3.4 Data Collection Timeline**

The study follows a phased timeline spanning Academic Year 2025-2026:

| **Phase** | **Activity** | **Timeline** | **Duration** |
|-----------|--------------|--------------|--------------|
| Phase 1 | System Development (7 iterations) | June 2025 – October 2025 | 5 months |
| Phase 2 | Internal Testing & Refinement | November 2025 | 1 month |
| Phase 3 | Instrument Validation & Pilot Testing | December 2025 | 3 weeks |
| Phase 4 | Survey Distribution | January 2026 | 2 weeks |
| Phase 5 | Usability & Accuracy Testing | January 2026 – February 2026 | 4 weeks |
| Phase 6 | Data Analysis | February 2026 – March 2026 | 6 weeks |
| Phase 7 | Thesis Documentation & Reporting | March 2026 – April 2026 | 6 weeks |

This timeline allows for thorough system development, comprehensive testing, adequate data collection periods, and systematic analysis before final thesis submission.

## **3.3.5 Data Handling and Storage**

All collected data is managed in accordance with ethical and legal standards:

- **System-Generated Data**: Attendance records, participation logs, and session metadata are stored in a PostgreSQL database hosted on a local secure server. Database access is restricted through role-based access controls, with only the researcher possessing administrative privileges.

- **Survey Data**: Survey responses are stored on Google Forms' secure servers with encryption in transit and at rest. Upon completion of data collection, responses were exported to CSV format and stored locally on an encrypted drive accessible only to the researcher. Email addresses collected for participation verification were stored separately from response data to maintain anonymization.

- **Data Retention**: Data will be retained for three years following study completion to support verification of findings and potential follow-up research. After this period, all personally identifiable information will be permanently deleted.

- **Backup Procedures**: Regular automated backups are performed to prevent data loss due to hardware failure or other technical issues.

---

# **3.4 Statistical Treatment**

The analysis of collected data employs both descriptive and inferential statistical techniques appropriate to the research design and data characteristics.

## **3.4.1 Descriptive Statistics**

Descriptive statistics summarize the characteristics of the respondent population and provide an overview of survey responses:

- **Frequency Counts and Percentages**: Demographic variables (department, years of teaching experience, weekly online class frequency, device usage) are summarized using frequency distributions and percentages to characterize the sample composition.

- **Measures of Central Tendency**: Mean, median, and mode are calculated for Likert-scale variables to identify typical response patterns across survey items.

- **Measures of Dispersion**: Standard deviation and range are computed to assess the variability of responses, indicating consensus or divergence in faculty perceptions.

## **3.4.2 Likert Scale Analysis**

Survey items utilizing a 5-point Likert scale (1 = Strongly Disagree, 5 = Strongly Agree) are analyzed by calculating the **weighted mean** for each item and for composite constructs (perceived usefulness, perceived ease of use, behavioral intention to use). Weighted means are interpreted using the standard verbal interpretation scale (see Appendix A for detailed interpretation table):

- **4.21\u20135.00**: Strongly Agree / Very High
- **3.41\u20134.20**: Agree / High
- **2.61\u20133.40**: Neutral / Moderate
- **1.81\u20132.60**: Disagree / Low
- **1.00\u20131.80**: Strongly Disagree / Very Low

## **3.4.3 Technology Acceptance Model (TAM) Analysis**

TAM constructs are assessed by computing subscale means:

- **Perceived Usefulness (PU)**: Mean of 5 items measuring beliefs about system effectiveness
- **Perceived Ease of Use (PEOU)**: Mean of 5 items measuring perceived effort required
- **Behavioral Intention to Use (BI)**: Mean of 5 items measuring adoption willingness
- **Feasibility Constraints (FC)**: Mean of 5 items assessing practical barriers

Subscale scores are interpreted using the same 5-point scale interpretation. Relationships between TAM constructs may be explored through correlation analysis to assess whether perceived ease of use influences perceived usefulness and behavioral intention.

## **3.4.4 System Usability Scale (SUS) Scoring**

The System Usability Scale yields a single usability score ranging from 0 to 100. The scoring methodology is detailed in Appendix A. The resulting score is interpreted as follows:

- **Above 68**: Above average usability
- **68**: Average usability (50th percentile)
- **Below 68**: Below average usability

Scores above 80 are considered excellent, indicating high user satisfaction and system usability. The SUS score provides a standardized benchmark for comparing Engagium against industry norms.

## **3.4.5 Accuracy Metrics**

For system accuracy evaluation (comparing detected events to ground truth), the following metrics are calculated (detailed formulas in Appendix A):

- **Precision**: Proportion of detected events that were actual events (measures false positive rate)
- **Recall (Sensitivity)**: Proportion of actual events that were successfully detected (measures false negative rate)
- **F1 Score**: Harmonic mean of precision and recall, providing a balanced accuracy measure

Accuracy metrics are computed separately for each participation type (attendance, chat, reactions, hand raises, microphone toggles) to identify detection strengths and weaknesses across different event categories.

## **3.4.6 System Performance Metrics**

Technical performance is assessed using:

- **Response Time**: Average latency between event detection in the extension and display in the dashboard, measured in milliseconds
- **Uptime**: Percentage of time the backend server remains operational during testing periods
- **Data Loss Rate**: Percentage of events that fail to synchronize from the extension to the backend, calculated from sync queue logs
- **Error Rate**: Frequency of application errors or exceptions per user session or per transaction

## **3.4.7 Qualitative Data Analysis**

Open-ended survey responses are analyzed using **thematic analysis**:

1. **Initial Coding**: Responses are read iteratively to identify recurring concepts and patterns
2. **Theme Development**: Related codes are grouped into broader themes representing common concerns, suggestions, or experiences
3. **Theme Refinement**: Themes are reviewed for coherence and distinctiveness
4. **Interpretation**: Themes are analyzed in relation to quantitative findings to provide contextual depth

Representative quotations are selected to illustrate key themes in the results chapter. Thematic analysis follows an inductive approach, allowing themes to emerge from the data rather than imposing predetermined categories.

## **3.4.8 Reliability Testing**

The internal consistency of multi-item scales (perceived usefulness subscale, perceived ease of use subscale, behavioral intention subscale) is assessed using **Cronbach's Alpha (α)**. A coefficient of α ≥ 0.70 is considered acceptable, indicating that items within a scale reliably measure the same underlying construct. Items with low item-total correlations (<0.30) are flagged for potential removal or revision in future research.

## **3.4.9 Method-Problem Mapping**

To demonstrate how the methodology addresses the study's research problems, Table 3.1 maps each specific problem to the corresponding methodological approach:

**Table 3.1: Method-Problem Mapping Matrix**

| **Specific Problem** | **Methodology Component** | **Data Source** | **Analysis Method** |
|----------------------|---------------------------|-----------------|---------------------|
| **SP1**: Challenges in capturing and recording participation across platforms | System Development (Extension architecture, DOM-based detection) | System logs, accuracy testing | Precision, recall, F1 score |
| **SP2**: Automatic recognition and categorization of participation forms | System Development (Modular detector pattern for chat, reactions, hand raises, mic toggles) | System logs, participation data | Event type classification accuracy |
| **SP3**: Generation of comprehensive participation reports | System Development (Dashboard analytics, report generation) | Usability testing, survey responses | Task completion rates, SUS scores, perceived usefulness |
| **SP4**: Minimizing grading bias through data-driven tracking | System Development (Objective timestamped logs, fuzzy name matching) | System logs, survey responses | Perceived fairness items, qualitative feedback |
| **SP5**: Integration with existing platforms (Google Meet) | System Development (Browser extension, API integration) | Functional testing, integration testing | System performance metrics, error rates |
| **SP6**: Evaluation of usability, effectiveness, accuracy, reliability | Research Design (Survey, TAM, SUS, accuracy testing) | Survey responses, system logs, usability testing | Descriptive statistics, TAM analysis, SUS scoring, accuracy metrics |

This mapping ensures that each research problem is systematically addressed through appropriate methodological strategies and that evaluation approaches align with the study's objectives.

---

# **3.5 System Design Overview**

This section presents the technical methodology underlying the Engagium system, detailing its architecture, module organization, data flow mechanisms, and technology selections. The system design reflects a three-tier architecture integrating a browser extension for client-side event detection, a backend API for data management and business logic, and a web-based dashboard for instructor interaction and data visualization.

## **3.5.1 System Architecture Overview**

### **3.5.1.1 Architectural Pattern**

The Engagium system employs a **three-tier client-server architecture** consisting of:

1. **Presentation Tier**: Comprises the browser extension interface (popup and options pages) and the React-based web dashboard. These components provide user interaction capabilities and data visualization.

2. **Application Tier**: Consists of a Node.js/Express RESTful API server integrated with Socket.io for bidirectional real-time communication. This tier handles business logic, authentication, data validation, and event broadcasting.

3. **Data Tier**: Utilizes PostgreSQL as the relational database management system, storing persistent data including user accounts, class rosters, session records, attendance data, and participation logs.

This separation of concerns enhances maintainability, scalability, and testability by isolating presentation logic, business logic, and data management into distinct layers.

### **3.5.1.2 High-Level Component Interaction**

**Figure 3.4: High-Level System Architecture and Component Interaction**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENGAGIUM SYSTEM ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────┐                      ┌──────────────────────┐
   │   GOOGLE MEET TAB    │                      │   INSTRUCTOR'S       │
   │   (Meeting Session)  │                      │   WEB BROWSER        │
   │                      │                      │                      │
   │  ┌────────────────┐  │                      │  ┌────────────────┐  │
   │  │ Content Scripts│  │                      │  │ React Dashboard│  │
   │  │                │  │                      │  │                │  │
   │  │ • Participant  │  │                      │  │ • Live Feed    │  │
   │  │   Detector     │  │                      │  │ • Sessions     │  │
   │  │ • Chat Monitor │  │                      │  │ • Analytics    │  │
   │  │ • Reaction     │  │                      │  │ • Class Mgmt   │  │
   │  │   Detector     │  │                      │  │                │  │
   │  │ • Hand Raise   │  │                      │  └───────┬────────┘  │
   │  │   Detector     │  │                      │          │           │
   │  │ • Mic Toggle   │  │                      │          │ HTTP/WS   │
   │  │   Detector     │  │                      │          │           │
   │  └───────┬────────┘  │                      └──────────┼───────────┘
   │          │           │                                 │
   └──────────┼───────────┘                                 │
              │ Chrome Message Passing                      │
              ▼                                             │
   ┌──────────────────────┐                                 │
   │   SERVICE WORKER     │                                 │
   │   (Background)       │                                 │
   │                      │                                 │
   │ • Session Manager    │                                 │
   │ • API Client         │                                 │
   │ • Socket Client      │                                 │
   │ • Sync Queue         ├─────────────────────────────────┤
   │ • IndexedDB Storage  │     HTTP REST API + WebSocket   │
   │                      │                                 │
   └──────────┬───────────┘                                 │
              │                                             │
              │ X-Extension-Token           JWT Bearer Token│
              │                                             │
              └─────────────────────┬───────────────────────┘
                                    │
                                    ▼
              ┌─────────────────────────────────────────────┐
              │              BACKEND SERVER                  │
              │              (Node.js + Express)             │
              │                                              │
              │  ┌────────────┐  ┌────────────────────────┐ │
              │  │ REST API   │  │    Socket.io Server    │ │
              │  │            │  │                        │ │
              │  │ /auth      │  │ Rooms:                 │ │
              │  │ /classes   │  │ • instructor:{userId}  │ │
              │  │ /sessions  │  │ • session:{sessionId}  │ │
              │  │ /students  │  │                        │ │
              │  │ /particip. │  │ Events:                │ │
              │  └─────┬──────┘  │ • session:started      │ │
              │        │         │ • session:ended        │ │
              │        │         │ • participation:logged │ │
              │        │         │ • attendance:updated   │ │
              │        │         └───────────┬────────────┘ │
              │        │                     │              │
              │        └──────────┬──────────┘              │
              │                   │                         │
              │         ┌─────────▼─────────┐               │
              │         │   Controllers &   │               │
              │         │     Services      │               │
              │         └─────────┬─────────┘               │
              │                   │                         │
              └───────────────────┼─────────────────────────┘
                                  │
                                  ▼
              ┌─────────────────────────────────────────────┐
              │              POSTGRESQL DATABASE             │
              │                                              │
              │  ┌─────────┐ ┌─────────┐ ┌───────────────┐  │
              │  │  users  │ │ classes │ │   students    │  │
              │  └─────────┘ └─────────┘ └───────────────┘  │
              │  ┌─────────┐ ┌─────────────────────────────┐│
              │  │sessions │ │ attendance_records/intervals││
              │  └─────────┘ └─────────────────────────────┘│
              │  ┌───────────────────┐ ┌─────────────────┐  │
              │  │ participation_logs│ │ notifications   │  │
              │  └───────────────────┘ └─────────────────┘  │
              │                                              │
              └──────────────────────────────────────────────┘
```

The system's operational flow involves multiple components interacting through defined protocols:

**Extension Component**: The Chrome browser extension operates within the context of Google Meet sessions. Content scripts inject into the Google Meet page and observe DOM (Document Object Model) changes to detect participation events such as participant arrivals, departures, chat messages, reactions, and hand raises. Detected events are communicated via message passing to the extension's service worker (background script).

**Service Worker**: This persistent background component coordinates extension activities. It maintains an authenticated connection to the backend API, manages local data storage using IndexedDB for offline resilience, and implements a synchronization queue to ensure event delivery even during network interruptions. The service worker also establishes a WebSocket connection via Socket.io to receive real-time notifications from the backend.

**Backend API Server**: The Express-based server exposes RESTful endpoints organized by resource domains (authentication, classes, students, sessions, participation). It validates incoming requests, enforces authorization policies, executes business logic, and persists data to the PostgreSQL database. Following database writes, the server emits WebSocket events to notify connected clients (dashboards and extensions) of state changes.

**Web Dashboard**: The React-based frontend application provides instructors with a graphical interface for system interaction. Instructors authenticate via login, manage class rosters, initiate and monitor sessions, view real-time participation feeds, and access attendance reports. The dashboard subscribes to WebSocket events, enabling live updates without manual page refreshes.

**Database**: PostgreSQL stores all persistent application data. The schema is normalized to third normal form (3NF) to minimize redundancy and ensure data integrity. Foreign key constraints enforce referential integrity, and database triggers automatically maintain timestamp fields.

### **3.5.1.3 Communication Protocols**

**HTTP/HTTPS**: RESTful API communication between the extension/dashboard and the backend server uses HTTPS to ensure encrypted data transmission. Standard HTTP methods (GET, POST, PUT, DELETE) map to CRUD operations on resources.

**WebSocket (Socket.io)**: Real-time bidirectional communication is facilitated by Socket.io, which abstracts WebSocket connections with fallback mechanisms for environments that block WebSocket protocols. The server implements a room-based architecture where clients subscribe to specific rooms (e.g., `instructor:{userId}`, `session:{sessionId}`) to receive targeted event notifications.

**Chrome Extension Messaging**: Internal communication within the extension uses Chrome's message passing API. Content scripts send messages to the service worker, which processes them and may forward data to the backend API.

## **3.5.2 Module Descriptions**

The system is organized into five primary modules, each encapsulating specific functional responsibilities.

### **3.5.2.1 Authentication and Authorization Module**

This module secures system access and enforces permission controls.

#### **Dual Authentication System**

The system implements distinct authentication mechanisms for the web dashboard and the browser extension:

**Web Dashboard Authentication (JWT)**: Instructors authenticate via username and password. Upon successful verification, the server generates two JSON Web Tokens (JWT):

- **Access Token**: Short-lived (15-minute expiration) token included in API request headers. Contains the user's ID and role.
- **Refresh Token**: Long-lived (7-day expiration) token stored in the database and sent to the client. Used to obtain new access tokens without re-authentication.

Password security is enforced through bcrypt hashing with salting, preventing plaintext password storage.

**Extension Authentication (Extension Tokens)**: Due to the extension's distributed nature and potential for prolonged offline periods, it uses a separate long-lived token system. Instructors generate an extension token through the dashboard Settings page. This token is stored in Chrome's secure storage and included in API requests from the extension. Extension tokens do not expire automatically but can be manually revoked by the user, invalidating all subsequent requests.

**Figure 3.5: Dual Authentication System Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DUAL AUTHENTICATION FLOWS                                │
└─────────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════╗    ╔═══════════════════════════════════╗
║   WEB DASHBOARD AUTHENTICATION    ║    ║   EXTENSION AUTHENTICATION        ║
║            (JWT Flow)             ║    ║       (Extension Token)           ║
╚═══════════════════════════════════╝    ╚═══════════════════════════════════╝

┌──────────────────┐                     ┌──────────────────┐
│ Login Form       │                     │ Options Page     │
│ • Username       │                     │ • "Generate      │
│ • Password       │                     │    Token" Button │
└────────┬─────────┘                     └────────┬─────────┘
         │                                        │
         │ POST /auth/login                       │ POST /auth/extension-token
         ▼                                        ▼
┌──────────────────────────────────────────────────────────────┐
│               BACKEND AUTHENTICATION SERVICE                  │
├──────────────────────────────────────────────────────────────┤
│  • Verify credentials              • Verify JWT              │
│  • Generate tokens                 • Generate long-lived     │
│  • Store refresh token             • Store in DB             │
└────────┬────────────────────────────────────┬────────────────┘
         │                                    │
         ▼                                    ▼
┌──────────────────┐                 ┌──────────────────┐
│ Returns:         │                 │ Returns:         │
│ • Access Token   │                 │ • Extension      │
│   (15 min)       │                 │   Token          │
│ • Refresh Token  │                 │   (no expiry)    │
│   (7 days)       │                 │                  │
└────────┬─────────┘                 └────────┬─────────┘
         │                                    │
         │ Store in memory/cookies            │ Store in Chrome Storage
         ▼                                    ▼
┌──────────────────┐                 ┌──────────────────┐
│ API Requests:    │                 │ API Requests:    │
│ Authorization:   │                 │ X-Extension-     │
│ Bearer <JWT>     │                 │ Token: <token>   │
└────────┬─────────┘                 └────────┬─────────┘
         │                                    │
         └────────────────┬───────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────┐
         │    flexibleAuth Middleware         │
         │  • Accepts JWT OR Extension Token  │
         │  • Validates token                 │
         │  • Extracts user ID                │
         │  • Attaches to request object      │
         └────────────────┬───────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────┐
         │      Protected API Endpoints       │
         │  • /api/classes/*                  │
         │  • /api/sessions/*                 │
         │  • /api/participation/*            │
         └────────────────────────────────────┘
```

#### **Authorization Middleware**

The backend employs middleware functions that verify tokens and enforce role-based access controls. Routes are protected to ensure that users can only access data belonging to them (e.g., instructors can only view their own classes and sessions). The `flexibleAuth` middleware accepts either JWT access tokens or extension tokens, enabling both the dashboard and extension to interact with the same API endpoints.

### **3.5.2.2 Class and Student Management Module**

This module enables instructors to organize their courses and maintain student rosters.

#### **Class Management**

Instructors create class records representing their courses. Each class contains:

- **Basic Information**: Class name, section identifier, and academic term
- **Schedule Information**: Meeting days and times stored as JSON structures, allowing flexible recurring schedules
- **Student Roster**: Association with enrolled students

CRUD operations (Create, Read, Update, Delete) are supported through RESTful endpoints (`/api/classes`). Foreign key constraints ensure that deleting a class cascades to associated sessions and attendance records, maintaining database integrity.

#### **Student Management**

Students are represented as entities associated with specific classes. Each student record includes:

- **Identifying Information**: Student ID number, full name
- **Contact Information**: Email address (optional)

Instructors can manually add individual students or bulk-import rosters via CSV file upload. The CSV import functionality parses uploaded files, validates data formats, and inserts records in a transactional manner to prevent partial imports upon error.

#### **Name Matching Algorithm**

A fuzzy matching algorithm correlates detected participant names (as they appear in Google Meet) with enrolled student names. The algorithm:

1. Normalizes names by converting to lowercase and removing extraneous whitespace
2. Computes similarity scores using string comparison heuristics
3. Applies a threshold to determine matches
4. Flags ambiguous matches for instructor review

This approach accommodates variations in name formatting (e.g., "John Doe" vs. "Doe, John") and minor typographical differences.

### **3.5.2.3 Session Management Module**

Sessions represent individual class meetings and serve as the context for attendance and participation tracking.

#### **Session Lifecycle**

A session progresses through defined states:

- **Scheduled**: Session created but not yet started
- **Active**: Session currently in progress; events are being logged
- **Ended**: Session concluded; attendance calculations finalized

Instructors initiate sessions from the dashboard or extension upon entering a Google Meet session. The system records the start timestamp and activates event logging. When the instructor ends the session, the system:

1. Records the end timestamp
2. Closes all open attendance intervals (sets `left_at` for participants still present)
3. Calculates total attendance duration for each participant
4. Marks absent students (enrolled students with no attendance records)
5. Transitions session status to "Ended"

#### **Session Metadata**

Each session record includes:

- **Identifiers**: Unique session ID, associated class ID, instructor ID
- **Temporal Data**: Start time, end time, duration
- **External References**: Google Meet URL or meeting code (optional, for reference)

### **3.5.2.4 Attendance Tracking Module**

This module captures precise attendance information through a dual-table design.

#### **Two-Table Attendance Model**

**Figure 3.6: Two-Table Attendance Tracking Model**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      TWO-TABLE ATTENDANCE DATA MODEL                             │
└─────────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════╗
║           ATTENDANCE_RECORDS (Summary Table)              ║
╠═══════════════════════════════════════════════════════════╣
║  PK: id (UUID)                                            ║
║  FK: student_id    ──────┐                                ║
║  FK: session_id    ──────┼────┐                           ║
║  status (ENUM: Present/Absent/Excused)                    ║
║  total_duration_seconds (CALCULATED)                      ║
║  created_at, updated_at                                   ║
║                                                           ║
║  UNIQUE CONSTRAINT: (student_id, session_id)             ║
╚═══════════════════════════════════════════════════════════╝
                              │        │
                              │        │ One-to-Many
                              │        │ Relationship
                              │        ▼
             ╔════════════════════════════════════════════════════════════╗
             ║      ATTENDANCE_INTERVALS (Detail Table)                  ║
             ╠════════════════════════════════════════════════════════════╣
             ║  PK: id (UUID)                                            ║
             ║  FK: session_id ◄──────────────────────────────────┘      ║
             ║  participant_name (as detected in Google Meet)            ║
             ║  joined_at (TIMESTAMP)                                    ║
             ║  left_at (TIMESTAMP, NULL if still present)               ║
             ║  duration_seconds (calculated: left_at - joined_at)       ║
             ║  created_at                                               ║
             ╚════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXAMPLE DATA SCENARIO                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Student: John Doe leaves and rejoins session twice:

 ATTENDANCE_INTERVALS:
 ┌────────────────┬──────────────┬────────────┬──────────────┬──────────┐
 │ participant    │ joined_at    │ left_at    │ duration_sec │ session  │
 ├────────────────┼──────────────┼────────────┼──────────────┼──────────┤
 │ John Doe       │ 14:00:00     │ 14:25:00   │ 1500         │ sess-123 │
 │ John Doe       │ 14:30:00     │ 14:50:00   │ 1200         │ sess-123 │
 │ John Doe       │ 14:55:00     │ 15:00:00   │  300         │ sess-123 │
 └────────────────┴──────────────┴────────────┴──────────────┴──────────┘
                                                    │
                                        Sum of durations
                                                    ▼
 ATTENDANCE_RECORDS:
 ┌────────────┬──────────┬─────────┬────────────────────┐
 │ student_id │ session  │ status  │ total_duration_sec │
 ├────────────┼──────────┼─────────┼────────────────────┤
 │ std-456    │ sess-123 │ Present │ 3000 (50 minutes)  │
 └────────────┴──────────┴─────────┴────────────────────┘
```

The attendance tracking mechanism employs two related tables:

**Attendance Records Table**: Stores one record per student per session, representing the student's overall attendance status. Fields include:

- Student identifier and session identifier (composite unique constraint)
- Attendance status (Present, Absent, Excused)
- Total duration in seconds
- Timestamps for record creation and updates

**Attendance Intervals Table**: Stores individual join/leave intervals for each participant. Fields include:

- Participant name (as detected in Google Meet)
- Session identifier
- Join timestamp (`joined_at`)
- Leave timestamp (`left_at`)—NULL if participant is still present
- Duration in seconds (calculated upon leaving or session end)

This dual-table structure supports scenarios where participants leave and rejoin multiple times during a session. The total duration is computed by summing all interval durations.

#### **Attendance Calculation Logic**

Upon session end, the system:

1. Retrieves all intervals for the session
2. For each interval with NULL `left_at`, sets `left_at` to session end time
3. Calculates each interval's duration: `left_at - joined_at`
4. Groups intervals by participant and sums durations
5. Matches participant names to enrolled students
6. Creates or updates attendance records with total durations
7. Marks enrolled students with no intervals as Absent

#### **Real-Time Attendance Display**

While a session is active, the dashboard displays current attendance status. The extension detects join events and immediately sends notifications to the backend, which broadcasts updates to the dashboard via WebSocket. Instructors can observe participant arrivals in near-real-time, providing situational awareness during class.

### **3.5.2.5 Participation Logging Module**

Beyond attendance, the system captures interaction events indicating student engagement.

#### **Interaction Event Types**

The system detects and logs the following participation events:

- **Chat Messages**: Student posts a text message in the Google Meet chat panel
- **Reactions**: Student activates emoji reactions (thumbs up, applause, heart, etc.)
- **Hand Raises**: Student uses the "Raise Hand" feature to signal a desire to speak
- **Microphone Toggles**: Student unmutes their microphone (interpreted as verbal participation)

Each event is timestamped and associated with the participant and session.

#### **Detection Mechanisms**

Content scripts employ multiple detection strategies:

**DOM Observation**: MutationObservers monitor specific regions of the Google Meet interface (e.g., the chat panel, participant list, reaction overlays) for DOM changes indicating events.

**Toast Notification Monitoring**: Google Meet displays brief toast notifications for certain events (e.g., "Alice raised their hand"). Content scripts observe these notifications as a secondary detection signal.

**ARIA Attribute Inspection**: Accessibility attributes (ARIA labels) provide stable selectors less susceptible to UI redesigns compared to CSS class names, enhancing detection reliability.

#### **Deduplication Logic**

To prevent duplicate logs from multiple detection sources, the extension implements local deduplication. A short-term memory cache (e.g., last 5 seconds) tracks recent events. Identical events detected within this window are ignored, ensuring each genuine event is logged once.

#### **Participation Data Utilization**

Participation logs provide instructors with:

- **Engagement Insights**: Identification of students who actively contribute versus passive attendees
- **Analytics**: Quantification of interaction frequency per student or per session
- **Reporting**: Exportable participation summaries for assessment or documentation purposes

### **3.5.2.6 Real-Time Communication Module**

This module enables instantaneous data propagation between system components.

#### **WebSocket Architecture**

The system employs Socket.io to implement WebSocket-based real-time communication. The backend server maintains persistent connections with authenticated clients (dashboards and extensions).

#### **Room-Based Broadcasting**

Clients subscribe to specific "rooms" upon connection:

- **Instructor Room** (`instructor:{userId}`): Receives events relevant to a specific instructor, such as session lifecycle notifications or global alerts.
- **Session Room** (`session:{sessionId}`): Receives events specific to an active session, such as participant join/leave events and participation logs.

This targeted broadcasting ensures clients receive only relevant data, optimizing bandwidth and reducing unnecessary processing.

#### **Event Types**

Common real-time events include:

- `session:started` – Broadcast when a session begins
- `session:ended` – Broadcast when a session concludes
- `attendance:updated` – Broadcast when a participant joins or leaves
- `participation:logged` – Broadcast when an interaction event is detected

#### **Client-Side Event Handling**

The React dashboard implements a WebSocket context provider that manages Socket.io connection lifecycle and event subscriptions. Upon navigating to a page (e.g., Live Feed for a session), the dashboard joins the appropriate room and registers event handlers that update the UI state, triggering re-renders to display new data without page reloads.

## **3.5.3 Data Flow Summary**

Understanding the movement of data through the system clarifies operational dynamics. The following diagrams illustrate five critical data flow scenarios.

### **3.5.3.1 Session Initiation Flow**

**Figure 3.7: Session Initiation Data Flow**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SESSION INITIATION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Instructor   │
│ navigates to │
│ Google Meet  │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ Content Script                 │
│ • Detects Google Meet page     │
│ • Displays extension badge     │
└──────┬─────────────────────────┘
       │
       │ Instructor clicks "Start Session"
       ▼
┌────────────────────────────────┐
│ Extension Popup                │
│ • Shows active classes         │
│ • Instructor selects class     │
└──────┬─────────────────────────┘
       │
       │ User action: Start Session
       ▼
┌────────────────────────────────┐
│ Service Worker                 │
│ • Captures class_id            │
│ • Captures meeting_url         │
│ • Generates session data       │
└──────┬─────────────────────────┘
       │
       │ POST /api/sessions
       │ { class_id, meeting_url, started_at }
       ▼
┌────────────────────────────────┐
│ Backend API                    │
│ • Validates request            │
│ • Authenticates token          │
│ • Executes session controller  │
└──────┬─────────────────────────┘
       │
       │ INSERT INTO sessions
       ▼
┌────────────────────────────────┐
│ PostgreSQL Database            │
│ • Creates session record       │
│ • Sets status = 'active'       │
│ • Returns session_id           │
└──────┬─────────────────────────┘
       │
       │ Session created
       ▼
┌────────────────────────────────┐
│ Backend API                    │
│ • Emits Socket.io event        │
│ • Event: 'session:started'     │
│ • Room: instructor:{userId}    │
└──────┬─────────────────────────┘
       │
       ├──────────────┬─────────────────┐
       │              │                 │
       ▼              ▼                 ▼
┌──────────┐  ┌──────────────┐  ┌─────────────┐
│ Service  │  │ Dashboard    │  │ Any other   │
│ Worker   │  │ (if open)    │  │ connected   │
│ receives │  │ receives     │  │ clients     │
│ confirm. │  │ event        │  └─────────────┘
└──────────┘  └──────┬───────┘
                     │
                     │ Updates UI state
                     ▼
              ┌──────────────┐
              │ Live Feed    │
              │ page shows   │
              │ "Session     │
              │  Active"     │
              └──────────────┘
```

The session initiation process follows seven sequential steps:

1. Instructor navigates to a Google Meet session
2. Extension content script detects the Google Meet page
3. Instructor clicks "Start Session" in the extension popup
4. Service worker sends a POST request to `/api/sessions` with class ID and meeting URL
5. Backend creates a session record (status: Active) in the database
6. Backend emits `session:started` event to the instructor's room
7. Dashboard (if open) receives the event and updates the UI to reflect the active session

### **3.5.3.2 Participant Detection Flow**

**Figure 3.8: Participant Join/Leave Detection Flow**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       PARTICIPANT DETECTION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ Participant      │
│ joins Google     │
│ Meet session     │
└────────┬─────────┘
         │
         │ DOM Change Event
         ▼
┌────────────────────────────────────┐
│ Content Script                     │
│ • MutationObserver detects change  │
│ • Observes People Panel            │
│ • Extracts participant name        │
│ • Records timestamp                │
└────────┬───────────────────────────┘
         │
         │ chrome.runtime.sendMessage()
         │ { type: 'PARTICIPANT_JOINED',
         │   name, timestamp }
         ▼
┌────────────────────────────────────┐
│ Service Worker                     │
│ • Receives participant event       │
│ • Validates session is active      │
│ • Prepares API payload             │
└────────┬───────────────────────────┘
         │
         │ POST /api/sessions/:id/participants
         │ { participant_name, joined_at }
         ▼
┌────────────────────────────────────┐
│ Backend Participation Controller   │
│ • Validates session_id             │
│ • Checks session status = 'active' │
│ • Processes join event             │
└────────┬───────────────────────────┘
         │
         │ INSERT INTO attendance_intervals
         ▼
┌────────────────────────────────────┐
│ PostgreSQL Database                │
│ • Creates interval record          │
│   - participant_name               │
│   - joined_at (timestamp)          │
│   - left_at (NULL)                 │
│   - session_id                     │
└────────┬───────────────────────────┘
         │
         │ Interval created successfully
         ▼
┌────────────────────────────────────┐
│ Backend API                        │
│ • Emits Socket.io event            │
│ • Event: 'attendance:updated'      │
│ • Room: session:{sessionId}        │
│ • Payload: { participant, action } │
└────────┬───────────────────────────┘
         │
         │ Real-time broadcast
         ▼
┌────────────────────────────────────┐
│ Dashboard (Live Feed Page)         │
│ • Subscribed to session room       │
│ • Receives event via WebSocket     │
│ • Updates participant list         │
│ • Shows: "John Doe joined"         │
│ • Updates attendance count         │
└────────────────────────────────────┘
```

The participant detection mechanism follows seven steps:

1. A participant joins the Google Meet session
2. Content script detects the participant's appearance in the People Panel (DOM change)
3. Content script sends a message to the service worker with participant details
4. Service worker sends a POST request to `/api/sessions/:id/participants` with participant name and timestamp
5. Backend creates an attendance interval record (joined_at set, left_at NULL)
6. Backend emits `attendance:updated` event to the session's room
7. Dashboard receives the event and displays the new participant in the Live Feed

### **3.5.3.3 Interaction Event Flow**

**Figure 3.9: Participation Interaction Event Flow**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      PARTICIPATION INTERACTION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ Participant      │
│ performs action: │
│ • Sends chat     │
│ • Raises hand    │
│ • Reacts         │
│ • Unmutes mic    │
└────────┬─────────┘
         │
         │ DOM Event / UI Change
         ▼
┌────────────────────────────────────┐
│ Content Script Detector Module     │
│ • Chat Monitor observes chat panel │
│ • Hand Raise detector watches ARIA │
│ • Reaction detector sees overlays  │
│ • Mic detector monitors toggles    │
└────────┬───────────────────────────┘
         │
         │ Event detected
         ▼
┌────────────────────────────────────┐
│ Local Deduplication Cache          │
│ • Check last 5 seconds             │
│ • Prevent duplicate logging        │
│ • Compare event signature          │
└────────┬───────────────────────────┘
         │
         │ If NEW event (not duplicate)
         ▼
┌────────────────────────────────────┐
│ Service Worker                     │
│ • Receives interaction event       │
│ • Validates session active         │
│ • Prepares participation log       │
└────────┬───────────────────────────┘
         │
         │ POST /api/participation/log
         │ { session_id, participant_name,
         │   interaction_type, timestamp }
         ▼
┌────────────────────────────────────┐
│ Backend Participation Controller   │
│ • Validates session & participant  │
│ • Processes interaction type       │
└────────┬───────────────────────────┘
         │
         │ INSERT INTO participation_logs
         ▼
┌────────────────────────────────────┐
│ PostgreSQL Database                │
│ • Creates participation log        │
│   - participant_name               │
│   - interaction_type (ENUM)        │
│   - timestamp                      │
│   - session_id                     │
└────────┬───────────────────────────┘
         │
         │ Log created
         ▼
┌────────────────────────────────────┐
│ Backend API                        │
│ • Emits Socket.io event            │
│ • Event: 'participation:logged'    │
│ • Room: session:{sessionId}        │
│ • Payload: { participant,          │
│             interaction_type }     │
└────────┬───────────────────────────┘
         │
         │ Real-time broadcast
         ▼
┌────────────────────────────────────┐
│ Dashboard (Live Feed Page)         │
│ • Receives WebSocket event         │
│ • Updates interaction feed         │
│ • Displays: "Alice sent a chat"    │
│ • Shows interaction icon/badge     │
│ • Updates engagement metrics       │
└────────────────────────────────────┘
```

The interaction logging process follows eight steps with built-in deduplication:

1. A participant sends a chat message (or performs another interaction)
2. Content script's chat monitor detector observes the new message DOM element
3. Content script checks local deduplication cache
4. If event is new, service worker is notified
5. Service worker sends a POST request to `/api/participation/log` with event details
6. Backend creates a participation log record
7. Backend emits `participation:logged` event to the session's room
8. Dashboard receives the event and updates the interaction feed

### **3.5.3.4 Session Termination Flow**

**Figure 3.10: Session Termination and Attendance Calculation Flow**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     SESSION TERMINATION & CALCULATION FLOW                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ Instructor       │
│ clicks "End      │
│ Session" button  │
└────────┬─────────┘
         │
         │ From extension popup or dashboard
         ▼
┌────────────────────────────────────┐
│ Service Worker / Dashboard         │
│ • Sends end session request        │
└────────┬───────────────────────────┘
         │
         │ PUT /api/sessions/:id/end
         ▼
┌────────────────────────────────────┐
│ Backend Session Controller         │
│ • Validates session exists         │
│ • Checks instructor authorization  │
│ • Initiates end session logic      │
└────────┬───────────────────────────┘
         │
         │ Execute attendance calculation
         ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                    ATTENDANCE CALCULATION LOGIC                                 │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Step 1: Close Open Intervals                                                  │
│  ┌──────────────────────────────────────────────────────────┐                 │
│  │ UPDATE attendance_intervals                                │                 │
│  │ SET left_at = session.ended_at                             │                 │
│  │ WHERE session_id = :id AND left_at IS NULL                 │                 │
│  └──────────────────────────────────────────────────────────┘                 │
│                          ▼                                                      │
│  Step 2: Calculate Duration for Each Interval                                  │
│  ┌──────────────────────────────────────────────────────────┐                 │
│  │ UPDATE attendance_intervals                                │                 │
│  │ SET duration_seconds =                                     │                 │
│  │     EXTRACT(EPOCH FROM (left_at - joined_at))              │                 │
│  │ WHERE session_id = :id                                     │                 │
│  └──────────────────────────────────────────────────────────┘                 │
│                          ▼                                                      │
│  Step 3: Group Intervals by Participant                                        │
│  ┌──────────────────────────────────────────────────────────┐                 │
│  │ SELECT participant_name,                                   │                 │
│  │        SUM(duration_seconds) as total_duration             │                 │
│  │ FROM attendance_intervals                                  │                 │
│  │ WHERE session_id = :id                                     │                 │
│  │ GROUP BY participant_name                                  │                 │
│  └──────────────────────────────────────────────────────────┘                 │
│                          ▼                                                      │
│  Step 4: Match Participants to Students                                        │
│  ┌──────────────────────────────────────────────────────────┐                 │
│  │ • Fuzzy name matching algorithm                            │                 │
│  │ • Normalize names (lowercase, trim)                        │                 │
│  │ • Calculate similarity scores                              │                 │
│  │ • Link participant → student_id                            │                 │
│  └──────────────────────────────────────────────────────────┘                 │
│                          ▼                                                      │
│  Step 5: Create/Update Attendance Records                                      │
│  ┌──────────────────────────────────────────────────────────┐                 │
│  │ INSERT INTO attendance_records                             │                 │
│  │   (student_id, session_id, status, total_duration_seconds) │                 │
│  │ VALUES (:student_id, :session_id, 'Present', :duration)    │                 │
│  │ ON CONFLICT (student_id, session_id)                       │                 │
│  │   DO UPDATE SET total_duration_seconds = :duration         │                 │
│  └──────────────────────────────────────────────────────────┘                 │
│                          ▼                                                      │
│  Step 6: Mark Absent Students                                                  │
│  ┌──────────────────────────────────────────────────────────┐                 │
│  │ INSERT INTO attendance_records                             │                 │
│  │   (student_id, session_id, status, total_duration_seconds) │                 │
│  │ SELECT s.id, :session_id, 'Absent', 0                      │                 │
│  │ FROM students s                                            │                 │
│  │ WHERE s.class_id = :class_id                               │                 │
│  │   AND NOT EXISTS (                                         │                 │
│  │     SELECT 1 FROM attendance_records ar                    │                 │
│  │     WHERE ar.student_id = s.id                             │                 │
│  │       AND ar.session_id = :session_id                      │                 │
│  │   )                                                        │                 │
│  └──────────────────────────────────────────────────────────┘                 │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
         │
         │ Update session status
         ▼
┌────────────────────────────────────┐
│ UPDATE sessions                    │
│ SET status = 'ended',              │
│     ended_at = NOW()               │
│ WHERE id = :session_id             │
└────────┬───────────────────────────┘
         │
         │ Session ended
         ▼
┌────────────────────────────────────┐
│ Backend API                        │
│ • Emits Socket.io event            │
│ • Event: 'session:ended'           │
│ • Room: session:{sessionId}        │
│ • Payload: { session, summary }    │
└────────┬───────────────────────────┘
         │
         │ Real-time broadcast
         ▼
┌────────────────────────────────────┐
│ Dashboard                          │
│ • Receives session:ended event     │
│ • Transitions to post-session view │
│ • Displays final attendance summary│
│ • Shows total participants         │
│ • Enables report generation        │
└────────────────────────────────────┘
```

The session termination process executes a comprehensive six-step attendance calculation:

1. Instructor clicks "End Session" in the extension popup or dashboard
2. Request sent to PUT `/api/sessions/:id/end`
3. Backend sets session end time and status to "Ended"
4. Backend executes attendance calculation logic:
   - Closes open intervals
   - Calculates total durations
   - Updates attendance records
   - Marks absent students
5. Backend emits `session:ended` event
6. Dashboard receives event and transitions to post-session state, displaying final attendance summary

### **3.5.3.5 Offline Synchronization Flow**

**Figure 3.11: Offline-First Synchronization Mechanism**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       OFFLINE SYNCHRONIZATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ Participation    │
│ event occurs     │
│ (join, chat,     │
│ reaction, etc.)  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Service Worker                     │
│ • Receives event from content      │
│ • Checks network connectivity      │
└────────┬───────────────────────────┘
         │
         ├─────────── Network Available? ──────────┐
         │                                          │
        YES                                        NO
         │                                          │
         ▼                                          ▼
┌─────────────────────┐              ┌──────────────────────────────┐
│ ONLINE PATH         │              │ OFFLINE PATH                 │
│                     │              │                              │
│ POST to backend API │              │ Store in IndexedDB           │
│ • Immediate sync    │              │ • Queue event with metadata  │
│ • Get response      │              │ • Mark status: 'pending'     │
│ • Update UI         │              │ • Store timestamp            │
└─────────────────────┘              └────────┬─────────────────────┘
                                              │
                                              │ Event queued locally
                                              ▼
                          ┌────────────────────────────────────────┐
                          │ IndexedDB: Sync Queue Table            │
                          ├────────────────────────────────────────┤
                          │ { id, event_type, payload, status,    │
                          │   timestamp, retry_count }             │
                          └────────────────────────────────────────┘
                                              │
                                              │ Periodic connectivity check
                                              │ (every 30 seconds)
                                              ▼
                          ┌────────────────────────────────────────┐
                          │ Service Worker Background Task         │
                          │ • Check navigator.onLine               │
                          │ • Ping backend health endpoint         │
                          └────────┬───────────────────────────────┘
                                   │
                                   │ Connection restored!
                                   ▼
                          ┌────────────────────────────────────────┐
                          │ Sync Queue Processing                  │
                          │ • Retrieve pending events (status =    │
                          │   'pending')                           │
                          │ • Sort by timestamp (chronological)    │
                          └────────┬───────────────────────────────┘
                                   │
                                   │ For each pending event:
                                   ▼
                          ┌────────────────────────────────────────┐
                          │ Send Event to Backend                  │
                          │ • POST to appropriate endpoint         │
                          │ • Include original timestamp           │
                          │ • Wait for acknowledgment              │
                          └────────┬───────────────────────────────┘
                                   │
                          ┌────────┴─────────┐
                          │                  │
                     SUCCESS              FAILURE
                          │                  │
                          ▼                  ▼
         ┌──────────────────────────┐  ┌────────────────────────┐
         │ Update Queue Record      │  │ Increment retry_count  │
         │ • Set status: 'synced'   │  │ • Keep status: 'pending'│
         │ • Set synced_at timestamp│  │ • Retry later          │
         └────────┬─────────────────┘  └────────────────────────┘
                  │
                  │ After all events processed
                  ▼
         ┌──────────────────────────┐
         │ Clean Up Synced Events   │
         │ • DELETE FROM queue      │
         │   WHERE status = 'synced'│
         │   AND synced_at < NOW()  │
         │   - INTERVAL '7 days'    │
         └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              KEY BENEFITS                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ • Zero data loss during network interruptions                                   │
│ • Events timestamped at detection time (accurate temporal data)                 │
│ • Automatic retry with exponential backoff                                      │
│ • Chronological synchronization preserves event sequence                        │
│ • Extension remains functional offline                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

1. Extension detects an event while offline (no network connectivity)
2. Service worker stores the event in IndexedDB sync queue with a timestamp and status (pending)
3. Service worker periodically checks network connectivity
4. Upon reconnection, service worker retrieves pending events from IndexedDB
5. Service worker sends queued events to the backend in chronological order
6. Backend processes events and acknowledges successful receipt
7. Service worker marks events as synchronized and removes them from the queue

This offline-first approach ensures data integrity even in unreliable network conditions, preventing event loss during connectivity disruptions.

## **3.5.4 Technology Stack Overview**

The selection of technologies reflects considerations of performance, ecosystem maturity, and development efficiency.

### **3.5.4.1 Frontend Technologies**

**React 18.2**: Chosen for its component-based architecture, facilitating modular UI development and code reuse across dashboard and extension interfaces. The virtual DOM enables efficient UI updates critical for real-time data displays.

**Vite**: Utilized as the build tool for both the frontend and extension due to its fast hot module replacement (HMR) during development and optimized production bundling. Vite's native ES module support reduces build complexity compared to traditional bundlers.

**Tailwind CSS 3.3**: Employed for utility-first styling, enabling rapid UI prototyping without writing custom CSS. Tailwind's responsive design utilities simplify mobile-responsive layout implementation.

**React Query (TanStack Query) 4.24**: Manages server state, providing automatic caching, background refetching, and synchronization. This reduces boilerplate code for data fetching and improves user experience through optimistic updates.

**React Router DOM 6.8**: Implements client-side routing, enabling single-page application (SPA) navigation without full page reloads. Protected routes enforce authentication requirements for restricted pages.

### **3.5.4.2 Backend Technologies**

**Node.js 18.x**: Selected as the runtime environment due to JavaScript language unification across frontend, backend, and extension (reducing context switching for developers). Node's asynchronous, event-driven architecture efficiently handles concurrent WebSocket connections.

**Express 4.18**: Provides a minimal, flexible web application framework for building the RESTful API. Express middleware architecture simplifies the implementation of cross-cutting concerns such as authentication, logging, and error handling.

**Socket.io 4.6**: Implements WebSocket communication with automatic fallback to HTTP long-polling when WebSocket protocols are unavailable. Socket.io's room abstraction simplifies targeted event broadcasting.

**jsonwebtoken 9.0**: Facilitates JWT generation and verification for stateless authentication. JWTs encode user identity and permissions, eliminating the need for server-side session storage.

**bcrypt 5.1**: Performs password hashing using the bcrypt algorithm with configurable salt rounds. This cryptographic approach protects user passwords even if the database is compromised.

**pg (node-postgres) 8.8**: Provides a non-blocking PostgreSQL client for Node.js, enabling database queries within asynchronous workflows. Connection pooling optimizes resource utilization.

### **3.5.4.3 Database Technologies**

**PostgreSQL 14+**: Selected for its robust ACID (Atomicity, Consistency, Isolation, Durability) compliance, ensuring data integrity for attendance records. PostgreSQL's support for complex queries with JOINs enables efficient analytics and reporting. The JSONB data type accommodates semi-structured data (e.g., class schedules) within a relational framework.

**ENUM Types**: PostgreSQL's native ENUM types enforce type safety for categorical fields (e.g., `user_role`, `session_status`, `interaction_type`), preventing invalid values and enhancing data quality.

**Foreign Key Constraints with Cascading**: Referential integrity is enforced through foreign keys. Cascade rules ensure that deleting a parent record (e.g., a class) automatically deletes dependent records (e.g., sessions, attendance), preventing orphaned data.

**Database Triggers**: Automatic timestamp updates (`updated_at`) are managed via triggers, reducing application logic complexity and ensuring consistency.

### **3.5.4.4 Extension Technologies**

**Chrome Extension Manifest V3**: Google's latest extension platform, required for all new Chrome extensions as of 2023. Manifest V3 introduces service workers (replacing persistent background pages), enhancing extension performance and security through reduced memory footprint and stricter permission models.

**IndexedDB (via idb 7.1.1)**: Provides client-side persistent storage with larger capacity than localStorage. Used to store session data and event queues locally, enabling offline functionality and synchronization upon reconnection.

**Content Scripts**: JavaScript modules injected into web pages (Google Meet) that interact with the page's DOM. Content scripts operate in an isolated JavaScript context, preventing conflicts with page scripts while enabling DOM observation.

### **3.5.4.5 Rationale Summary**

The technology choices collectively prioritize:

- **Developer Productivity**: Unified JavaScript ecosystem reduces cognitive load and accelerates development.
- **Performance**: Asynchronous I/O (Node.js), virtual DOM (React), and efficient build tools (Vite) ensure responsive user experiences.
- **Scalability**: Stateless authentication (JWT), WebSocket connection management (Socket.io), and database connection pooling support growing user bases.
- **Reliability**: Offline-first architecture (IndexedDB), transactional database operations (PostgreSQL ACID compliance), and graceful error handling enhance system robustness.
- **Security**: HTTPS encryption, bcrypt password hashing, token-based authentication, and input validation protect user data and prevent common vulnerabilities (SQL injection, XSS, CSRF).

## **3.5.5 System Limitations**

As a research prototype, the Engagium system is subject to inherent limitations that constrain its applicability and performance.

### **3.5.5.1 Platform Dependency**

The system is specifically designed for **Google Meet** and **Google Chrome browser**. Compatibility with other video conferencing platforms (Zoom, Microsoft Teams) or browsers (Firefox, Safari) is not supported. This limitation arises from:

- **Proprietary DOM Structures**: Each platform employs unique interface implementations, requiring platform-specific detection logic.
- **Extension API Differences**: Firefox and Safari use different extension APIs (WebExtensions API with variations), necessitating separate extension codebases.

Generalization to other platforms would require substantial redevelopment and maintenance effort.

### **3.5.5.2 Detection Accuracy Constraints**

Participation detection relies on observing DOM elements and interface changes in Google Meet. This approach is inherently fragile:

- **UI Updates**: Google periodically modifies its interface design. Changes to DOM structure, CSS classes, or ARIA attributes can break detection mechanisms, requiring maintenance updates.
- **False Negatives**: Rapid or simultaneous events may occasionally be missed if DOM observations do not capture transient elements.
- **False Positives**: Rare UI anomalies or unexpected DOM states might trigger spurious event detections.

The system prioritizes minimizing false negatives (missing actual events) over avoiding false positives, as underreporting participation is more detrimental than occasional overreporting.

### **3.5.5.3 Privacy and Ethical Boundaries**

The system is designed with strict privacy constraints:

- **No Content Recording**: The system logs metadata (e.g., "a chat message was sent") but does not record message content, audio, or video. This design respects user privacy but limits the depth of interaction analysis.
- **Name-Only Identification**: Participant identification relies on display names in Google Meet. Participants using pseudonyms or altered names may not match student roster entries, complicating attendance correlation.
- **Informed Consent Requirement**: Ethical use mandates that all class participants are informed of the tracking system and consent to its operation, potentially limiting spontaneous deployment.

### **3.5.5.4 Scalability Constraints**

As a prototype developed for research and thesis demonstration, the system has not been optimized for large-scale deployment:

- **Concurrent Session Limits**: Backend performance under high concurrent session loads (e.g., hundreds of simultaneous classes) has not been stress-tested.
- **Database Indexing**: While basic indexes exist, comprehensive optimization for large data volumes (e.g., millions of participation logs) has not been implemented.
- **Single Server Deployment**: The system assumes a single-server deployment without load balancing or distributed database configurations, limiting horizontal scalability.

### **3.5.5.5 Feature Completeness**

Certain desirable features remain unimplemented or partially implemented:

- **Advanced Analytics**: While basic attendance and participation data are logged, sophisticated analytics (e.g., engagement trend analysis, predictive modeling) are not yet developed.
- **Export Functionality**: Attendance report export is limited; comprehensive CSV/Excel export with customizable formats is planned but not complete.
- **Mobile Support**: The dashboard is desktop-oriented; mobile-responsive optimization is partial, and the extension (by nature) does not support mobile browsers.
- **Multi-Language Support**: The interface is English-only; internationalization (i18n) has not been implemented.

### **3.5.5.6 Technical Debt**

As a rapidly developed prototype, certain areas of technical debt exist:

- **Automated Testing**: Unit and integration tests are largely absent. Functional validation has been manual, increasing the risk of regressions during updates.
- **Error Recovery**: While basic error handling exists, comprehensive fault tolerance and graceful degradation under edge cases require further development.
- **Code Documentation**: Inline code comments and API documentation are incomplete in some modules, potentially complicating future maintenance.

### **3.5.5.7 Security Considerations**

While fundamental security measures are implemented (HTTPS, JWT, bcrypt, input validation), the system has not undergone formal security auditing. Potential vulnerabilities include:

- **Token Storage**: Extension tokens are long-lived and stored locally, presenting a risk if a user's device is compromised.
- **Rate Limiting**: API rate limiting is basic; sophisticated attack mitigation (e.g., CAPTCHA, IP blacklisting) is not implemented.
- **Dependency Vulnerabilities**: Third-party npm packages may contain security vulnerabilities requiring regular updates and audits.