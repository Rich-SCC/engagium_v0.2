# **CHAPTER 3 – METHODOLOGY**

---

# **3.1 Research Methodology**

## **3.1.1 Type of Research**

This study employs a **Descriptive-Developmental Research Design** combining both descriptive and design science methodologies. The descriptive component involves gathering perceptions and evaluations from faculty respondents through survey instruments to assess the usability and effectiveness of the developed system. The developmental component encompasses the systematic design, implementation, and evaluation of the Engagium system—a browser-based participation tracking tool for online learning environments.

The descriptive method is utilized to collect quantitative data regarding faculty perceptions of the system's functionality, ease of use, and perceived utility in managing student participation during synchronous online classes. This approach enables the researcher to systematically document user experiences and identify patterns in system usage and acceptance.

The design science approach guides the system development process, emphasizing the creation of a technological artifact (the Engagium system) to address the identified problem of inefficient participation monitoring in virtual classrooms. This methodology aligns with established information systems research paradigms that prioritize the construction and evaluation of innovative solutions to real-world problems.

## **3.1.2 System Development Methodology**

### **3.1.2.1 Overview of Agile Approach**

The development of the Engagium system followed an **Agile Software Development Life Cycle (SDLC)** methodology characterized by iterative and incremental development practices. Agile methodologies emphasize flexibility, continuous improvement, and rapid response to changing requirements—qualities particularly suited to exploratory research and development projects where technical challenges and user needs may evolve during the development process.

Unlike traditional waterfall approaches that require complete specification upfront, Agile allows for adaptive planning and evolutionary development. This iterative nature proved essential for the Engagium project, as the Google Meet platform's dynamic interface required experimental approaches and continuous refinement of detection mechanisms.

### **3.1.2.2 Phases of Development**

The Agile SDLC implementation for Engagium consisted of the following phases:

**Figure 3.1: Agile SDLC Phases for Engagium Development**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AGILE SDLC PHASES - ENGAGIUM                              │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │ PHASE 1         │
    │ Requirements    │
    │ Analysis        │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ PHASE 2         │
    │ System Design   │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐      ╔═════════════════╗
    │ PHASE 3         │◄────►║ Iterative       ║
    │ Incremental     │      ║ Refinement      ║
    │ Development     │      ║ (7 Iterations)  ║
    └────────┬────────┘      ╚═════════════════╝
             │                       ▲
             │                       │
             │                       │ Feedback Loop
             ▼                       │
    ┌─────────────────┐             │
    │ PHASE 4         │─────────────┘
    │ Testing         │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ PHASE 5         │
    │ Deployment      │
    └─────────────────┘
```

#### **Phase 1: Requirements Analysis**

The initial phase focused on comprehensive problem identification and stakeholder analysis. Through preliminary research and informal consultations, the following core requirements were established:

- **Primary Problem**: Instructors conducting synchronous online classes via Google Meet lack real-time visibility into student participation and face challenges with manual attendance tracking.

- **Functional Requirements**: The system must automatically detect participant join/leave events, record precise timestamps, calculate attendance duration, allow instructor management of class rosters, match detected participants to enrolled students, and provide a web-based dashboard for data visualization.

- **Non-Functional Requirements**: The system must maintain browser performance, ensure data security through encryption and authentication, operate reliably during network interruptions, and respect user privacy by avoiding audio or video recording.

- **Technical Constraints**: The absence of a public Google Meet API necessitated DOM-based detection strategies. Chrome Manifest V3 restrictions on background script execution required careful architectural planning for the browser extension component.

#### **Phase 2: System Design**

The design phase established a three-tier architecture comprising:

1. **Presentation Layer**: Browser extension interface (popup and options pages) and React-based web dashboard
2. **Application Layer**: Node.js/Express RESTful API with Socket.io integration for real-time communication
3. **Data Layer**: PostgreSQL relational database with normalized schema

Database design employed entity-relationship modeling to identify core entities (Users, Classes, Students, Sessions, Attendance Records, Participation Logs) and their relationships. The extension architecture utilized a modular detector pattern to separate concerns for different event types (participant detection, chat monitoring, reaction tracking).

API design followed RESTful principles with resource-based endpoints organized by functional domains (`/api/auth/*`, `/api/classes/*`, `/api/sessions/*`, `/api/participation/*`). Real-time event broadcasting was implemented using Socket.io's room-based architecture to enable targeted updates per instructor and per session.

#### **Phase 3: Incremental Development**

Development proceeded through seven iterative cycles, each delivering functional increments:

**Iteration 1** established the foundational infrastructure: PostgreSQL database implementation, Express server configuration, and JWT-based authentication system.

**Iteration 2** implemented core CRUD (Create, Read, Update, Delete) operations for class management, student roster management, and session lifecycle handling. CSV import functionality was added to facilitate bulk student enrollment.

**Iteration 3** developed the browser extension core functionality, including Google Meet session detection, participant tracking through DOM observation, and extension-backend communication protocols.

**Iteration 4** introduced attendance tracking capabilities with a two-table model (attendance records and attendance intervals) to support precise duration calculations for participants with multiple join/leave events. A fuzzy matching algorithm was implemented to correlate detected participant names with enrolled student records.

**Iteration 5** integrated WebSocket communication via Socket.io to enable real-time event broadcasting from the extension to the dashboard, providing instructors with live participation updates.

**Iteration 6** expanded participation detection beyond attendance to include chat messages, reactions, hand raises, and microphone toggle events, creating a comprehensive participation profile for each student.

**Iteration 7** focused on system refinement: improved error handling, enhanced user feedback mechanisms, and comprehensive documentation preparation.

#### **Phase 4: Testing**

The testing phase employed multiple testing strategies:

- **Functional Testing**: Manual verification of all API endpoints, frontend workflows, and extension behaviors using developer tools and API testing clients (Postman, Thunder Client).

- **Integration Testing**: Validation of data flow across system components, ensuring proper synchronization between extension, backend, and dashboard.

- **System Testing**: End-to-end verification of complete user workflows, from session initiation through attendance report generation.

- **Accuracy Testing** (planned): Controlled validation of participation detection accuracy through comparison of system-generated logs against manually recorded ground truth data.

- **Usability Testing** (planned): Evaluation of user experience through standardized instruments and task-based observation.

#### **Phase 5: Deployment**

The deployment architecture supports both local development and production environments. The backend is deployed as a Node.js application with PostgreSQL database connectivity. The frontend is built as a static React application served via web server. The browser extension is distributed as an unpacked Chrome extension for testing purposes, with plans for Chrome Web Store publication pending further validation.

### **3.1.2.3 Rationale for Using Agile**

The selection of Agile methodology was justified by several project-specific factors:

1. **Evolving Requirements**: Initial requirements regarding participation metrics and detection mechanisms became progressively refined through iterative testing and feedback, necessitating an adaptive development approach.

2. **Technical Uncertainty**: The absence of official APIs for Google Meet required experimental exploration of DOM structures and detection strategies. Agile's iterative cycles enabled rapid prototyping and course correction when initial approaches proved infeasible.

3. **Risk Mitigation**: Early and frequent delivery of working software allowed for timely identification of technical risks, particularly regarding the stability of DOM-based detection methods and extension performance impacts.

4. **Stakeholder Feedback**: Regular demonstrations of functional increments to potential users facilitated continuous validation of feature utility and usability, ensuring alignment with actual instructor needs.

5. **Maintainability**: Incremental development with continuous documentation maintained code quality and system comprehensibility throughout the development process.

## **3.1.3 Research Locale**

**[PLACEHOLDER: Specify the institution name, type (e.g., private university, state college), and relevant contextual information about the online learning environment. Include details about the department or college where the study will be conducted, and any relevant characteristics of the online teaching environment (e.g., frequency of online classes, typical class sizes, Google Meet as the primary video conferencing platform).]**

Example format: *The study was conducted at [Institution Name], a [type of institution] located in [location]. Specifically, the research focused on the [Department/College Name], where faculty members regularly conduct synchronous online classes using Google Meet as the primary video conferencing platform. The institution has been utilizing online learning modalities since [year], with approximately [X] faculty members engaged in blended or fully online instruction.*

## **3.1.4 Target Respondents**

**[PLACEHOLDER: Describe the target population of faculty respondents. Specify the number of participants, selection criteria, and relevant demographic characteristics.]**

Example format: *The target respondents for this study consisted of [N] college faculty members from [institution name] who regularly conduct online classes using Google Meet. Inclusion criteria required that participants: (1) have conducted at least [X] online class sessions in the current academic term, (2) utilize Google Meet as their primary video conferencing platform, (3) have basic technological proficiency with browser-based tools, and (4) voluntarily consent to participate in the system evaluation. Faculty from various disciplines were included to ensure diverse perspectives on the system's applicability across different teaching contexts.*

## **3.1.5 Sampling Technique**

**[PLACEHOLDER: Specify the sampling method and provide justification for the approach.]**

Example format: *This study employed **purposive sampling**, a non-probability sampling technique in which participants are selected based on specific characteristics relevant to the research objectives. Faculty members who actively use Google Meet for synchronous online instruction were deliberately selected, as they represent the target user population for whom the Engagium system was designed. This sampling approach ensures that respondents possess the contextual experience necessary to provide informed evaluations of the system's functionality and utility.*

*Purposive sampling was deemed appropriate given the specialized nature of the study population and the need for respondents with direct experience in online teaching. While this approach limits statistical generalizability, it enhances the relevance and depth of insights regarding the system's practical applicability in authentic online teaching contexts.*

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

- **Survey Responses**: **[PLACEHOLDER: Describe survey data collection, including the number of respondents, timeframe, and key measurement domains (e.g., perceived usefulness, ease of use, satisfaction).]**

- **Qualitative Feedback**: **[PLACEHOLDER: If applicable, describe any open-ended feedback mechanisms, such as comment fields in surveys or informal interviews.]**

## **3.1.7 Research Instruments**

### **3.1.7.1 Survey Questionnaire**

**[PLACEHOLDER: Provide detailed description of the survey instrument structure, including:]**

- **Number of sections and items**: Specify how many parts the questionnaire contains and the number of questions in each section.
- **Measurement scale**: Describe the scale used (e.g., 5-point Likert scale ranging from Strongly Disagree to Strongly Agree).
- **Domains measured**: Identify the constructs being assessed (e.g., system usability, perceived usefulness, ease of learning, satisfaction, intention to use).
- **Question types**: Indicate the mix of closed-ended and open-ended items.

Example format: *A structured survey questionnaire was developed to assess faculty perceptions of the Engagium system. The instrument consists of [X] sections measuring: (1) demographic information, (2) prior experience with online teaching and participation tracking, (3) system usability (based on [standard instrument if applicable]), (4) perceived usefulness and effectiveness, and (5) overall satisfaction and intention to continue use. The questionnaire employs a [X]-point Likert scale for quantitative items, supplemented by open-ended questions to capture qualitative insights.*

### **3.1.7.2 System Evaluation Instruments**

**[PLACEHOLDER: If standardized evaluation instruments such as the System Usability Scale (SUS) or Computer System Usability Questionnaire (CSUQ) are employed, describe them here. If not using standardized instruments, this subsection may be omitted or noted as not applicable.]**

Example format: *The **System Usability Scale (SUS)**, a widely validated 10-item questionnaire developed by John Brooke (1986), may be administered to provide a standardized measure of system usability. The SUS yields a score ranging from 0 to 100, with scores above 68 considered above average usability. This instrument enables benchmarking of the Engagium system against established usability norms.*

### **3.1.7.3 Instrument Validation**

**[PLACEHOLDER: Describe the validation process for the survey instrument.]**

Example format: *Prior to distribution, the survey questionnaire underwent **content validation** through expert review. [Number] faculty members with expertise in educational technology and research methodology reviewed the instrument to assess the clarity, relevance, and appropriateness of items. Feedback from reviewers was incorporated through iterative revision, ensuring that questions accurately measure the intended constructs and are comprehensible to the target respondent population.*

*Pilot testing was conducted with [N] faculty members not included in the final sample to identify ambiguous wording and technical issues with survey administration. Pilot participants provided feedback on question clarity and survey completion time, leading to final refinements before full deployment.*

## **3.1.8 Ethical Considerations**

This study adheres to ethical principles governing human subjects research and data privacy:

### **Informed Consent**

All faculty participants received comprehensive information about the study's purpose, procedures, potential risks and benefits, and their rights as research participants. **[PLACEHOLDER: Specify the informed consent process—e.g., digital consent form, opt-in mechanism, opportunity to withdraw.]** Participation was entirely voluntary, with no consequences for declining or withdrawing from the study.

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

**[PLACEHOLDER: Specify the hardware used for development and testing, if relevant to reproducibility.]**

Example format: *Development and initial testing were conducted on [specify computer type, e.g., laptop/desktop] with [processor specifications], [RAM amount], and [operating system]. Testing was extended to multiple devices to ensure cross-platform compatibility, including Windows and macOS environments.*

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

5. **Phase 5: Evaluation Study** – **[PLACEHOLDER: Describe the planned evaluation phase, including survey distribution, system usage period, and data collection timeline.]**

6. **Phase 6: Data Analysis** – Collected data is analyzed using appropriate statistical techniques (described in Section 3.4).

7. **Phase 7: Reporting** – Findings are synthesized and documented in the thesis manuscript.

## **3.2.3 Variables of the Study**

**[PLACEHOLDER: If the study employs an experimental or quasi-experimental design with independent and dependent variables, specify them here. If the study is purely descriptive, this section may note that no experimental manipulation is involved.]**

Example format for a descriptive study: *This descriptive research does not manipulate independent variables or employ experimental controls. Rather, it measures faculty perceptions of system characteristics as dependent variables, including perceived usefulness, perceived ease of use, system reliability, and satisfaction. Demographic characteristics (e.g., teaching experience, technological proficiency) may be analyzed as moderating factors influencing perceptions.*

---

# **3.3 Data Gathering Procedure**

## **3.3.1 Pre-Survey Preparation**

**[PLACEHOLDER: Describe the preparatory steps taken before survey distribution.]**

Example format: *The survey questionnaire was finalized following expert review and pilot testing (as described in Section 3.1.7.3). An online survey platform [specify if using Google Forms, SurveyMonkey, Qualtrics, etc.] was configured to host the questionnaire. Prior to distribution, the researcher obtained necessary approvals from [institutional ethics board, if applicable] and secured permission from [department head, dean, or relevant authority] to invite faculty participation.*

## **3.3.2 Survey Distribution**

**[PLACEHOLDER: Describe how, when, and to whom the survey was distributed.]**

Example format: *The survey was distributed electronically to [N] faculty members via institutional email on [date]. The invitation email included: (1) a brief explanation of the study's purpose, (2) a link to the online questionnaire, (3) an estimated completion time of [X] minutes, (4) assurance of confidentiality, and (5) contact information for questions. Reminder emails were sent [X] days after the initial invitation to encourage participation. The survey remained open for [X] weeks, from [start date] to [end date]. Responses were automatically collected and stored in the survey platform's secure database.*

## **3.3.3 System Testing Procedure**

### **3.3.3.1 Functional Testing**

Functional testing verified that each system component operates according to specifications:

- **Participation Detection Testing**: The browser extension was tested for accurate detection of participant join/leave events, chat messages, reactions, hand raises, and microphone toggles. Test cases included both typical user actions and edge cases (e.g., rapid join/leave cycles, concurrent events).

- **Data Synchronization Testing**: The synchronization mechanism between the extension's IndexedDB storage and the backend database was validated under various network conditions, including simulated connection loss and restoration.

- **Session Lifecycle Testing**: Complete session workflows (session creation, activation, event logging, session termination, attendance calculation) were executed to ensure proper state transitions and data integrity.

- **Dashboard Functionality Testing**: All dashboard features (class creation, student roster import, session viewing, live feed updates, attendance reports) were tested for correct operation and responsiveness.

### **3.3.3.2 Usability Testing**

**[PLACEHOLDER: Describe planned usability testing procedures if applicable.]**

Example format: *Usability testing involved [N] faculty participants performing representative tasks while the researcher observed and recorded completion times, errors, and subjective feedback. Tasks included: (1) installing and authenticating the extension, (2) creating a class and importing students, (3) starting and monitoring a session, (4) viewing attendance reports. The System Usability Scale (SUS) was administered post-test to quantify overall usability perceptions.*

### **3.3.3.3 Accuracy Testing**

**[PLACEHOLDER: Describe planned accuracy validation procedures if applicable.]**

Example format: *Accuracy testing compared system-detected participation events against manually recorded ground truth data. During controlled test sessions, a human observer documented actual participant join/leave times and interaction events. These manual records were then compared with system logs to calculate precision (percentage of detected events that were genuine) and recall (percentage of actual events successfully detected). Discrepancies were analyzed to identify systematic errors or detection failures.*

## **3.3.4 Data Collection Timeline**

**[PLACEHOLDER: Provide a timeline or Gantt chart showing key data collection milestones.]**

Example format:

| **Phase** | **Activity** | **Timeline** |
|-----------|--------------|--------------|
| Phase 1 | System Development | [Month Year] – [Month Year] |
| Phase 2 | Internal Testing | [Month Year] – [Month Year] |
| Phase 3 | Pilot Deployment | [Month Year] – [Month Year] |
| Phase 4 | System Refinement | [Month Year] |
| Phase 5 | Survey Distribution | [Month Year] |
| Phase 6 | Data Analysis | [Month Year] |
| Phase 7 | Thesis Writing | [Month Year] – [Month Year] |

## **3.3.5 Data Handling and Storage**

All collected data is managed in accordance with ethical and legal standards:

- **System-Generated Data**: Attendance records, participation logs, and session metadata are stored in a PostgreSQL database hosted on [local server / secure cloud infrastructure]. Database access is restricted through role-based access controls, with only the researcher possessing administrative privileges.

- **Survey Data**: **[PLACEHOLDER: Describe where survey responses are stored and how they are secured.]** Example: *Survey responses are stored on [platform name]'s secure servers with encryption in transit and at rest. Upon completion of data collection, responses were exported and stored locally on an encrypted drive accessible only to the researcher.*

- **Data Retention**: Data will be retained for [specify duration, e.g., three years] following study completion to support verification of findings and potential follow-up research. After this period, all personally identifiable information will be permanently deleted.

- **Backup Procedures**: Regular automated backups are performed to prevent data loss due to hardware failure or other technical issues.

---

# **3.4 Statistical Treatment**

The analysis of collected data employs both descriptive and inferential statistical techniques appropriate to the research design and data characteristics.

## **3.4.1 Descriptive Statistics**

Descriptive statistics summarize the characteristics of the respondent population and provide an overview of survey responses:

- **Frequency Counts and Percentages**: Demographic variables (e.g., **[PLACEHOLDER: age range, years of teaching experience, discipline]**) are summarized using frequency distributions and percentages to characterize the sample composition.

- **Measures of Central Tendency**: Mean, median, and mode are calculated for ordinal and interval-level variables to identify typical response patterns.

- **Measures of Dispersion**: Standard deviation and range are computed to assess the variability of responses across survey items.

## **3.4.2 Likert Scale Analysis**

**[PLACEHOLDER: Describe how Likert scale responses will be analyzed.]**

Example format: *Survey items utilizing a 5-point Likert scale (1 = Strongly Disagree, 5 = Strongly Agree) are analyzed by calculating the **weighted mean** for each item and for composite constructs (e.g., overall perceived usefulness, overall ease of use). Weighted means are interpreted using the following scale:*

| **Mean Range** | **Interpretation** |
|----------------|--------------------|
| 4.21 – 5.00 | Strongly Agree / Very High |
| 3.41 – 4.20 | Agree / High |
| 2.61 – 3.40 | Neutral / Moderate |
| 1.81 – 2.60 | Disagree / Low |
| 1.00 – 1.80 | Strongly Disagree / Very Low |

## **3.4.3 Reliability Testing**

**[PLACEHOLDER: If reliability analysis is performed, describe it here.]**

Example format: *The internal consistency of multi-item scales (e.g., perceived usefulness subscale, ease of use subscale) is assessed using **Cronbach's Alpha (α)**. A coefficient of α ≥ 0.70 is considered acceptable, indicating that items within a scale reliably measure the same underlying construct. Items with low item-total correlations (<0.30) are flagged for potential removal or revision in future research.*

## **3.4.4 System Evaluation Metrics**

### **System Usability Scale (SUS) Scoring**

**[PLACEHOLDER: If SUS is used, describe scoring methodology.]**

Example format: *The System Usability Scale yields a single usability score ranging from 0 to 100. Scores are calculated by: (1) subtracting 1 from odd-numbered item scores, (2) subtracting even-numbered item scores from 5, (3) summing converted scores, and (4) multiplying by 2.5. The resulting score is interpreted as follows:*

- **Above 68**: Above average usability
- **68**: Average usability
- **Below 68**: Below average usability

*Scores above 80 are considered excellent, indicating high user satisfaction and system usability.*

### **Accuracy Metrics**

For system accuracy evaluation (comparing detected events to ground truth):

- **Precision**: The proportion of detected events that were actual events.
  
  $$\text{Precision} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Positives}}$$

- **Recall (Sensitivity)**: The proportion of actual events that were successfully detected.
  
  $$\text{Recall} = \frac{\text{True Positives}}{\text{True Positives} + \text{False Negatives}}$$

- **F1 Score**: The harmonic mean of precision and recall, providing a balanced accuracy measure.
  
  $$F1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

### **System Performance Metrics**

Technical performance is assessed using:

- **Response Time**: Average latency between event detection in the extension and display in the dashboard, measured in milliseconds.

- **Uptime**: Percentage of time the backend server remains operational during testing periods.

- **Data Loss Rate**: Percentage of events that fail to synchronize from the extension to the backend, calculated from sync queue logs.

- **Error Rate**: Frequency of application errors or exceptions per user session or per transaction.

## **3.4.5 Qualitative Data Analysis**

**[PLACEHOLDER: If open-ended survey responses or interview data are collected, describe the qualitative analysis approach.]**

Example format: *Open-ended survey responses are analyzed using **thematic analysis**. Responses are coded inductively to identify recurring themes, patterns, and categories. Common themes are grouped and summarized to provide qualitative context complementing quantitative findings. Representative quotations are selected to illustrate key themes in the results chapter.*

---

**[END OF CHAPTER 3 PART 1: Sections 3.1–3.4]**

**Note**: Section 3.5 (System Design Overview) is provided as a separate document due to length constraints.
