# CHAPTER III  
## METHODS OF RESEARCH AND PROCEDURES

## 3.1 Research Methodology

### 3.1.1 Type of Research
This study employed a descriptive–developmental research design. Descriptive–developmental research combines the systematic description of an existing phenomenon with the design and preliminary evaluation of an intervention or system intended to address identified needs (Creswell & Creswell, 2018). In this study, the descriptive component focuses on documenting professors’ current practices, challenges, and expectations regarding online class participation tracking at St. Clare College of Caloocan. The developmental component centers on the design and iterative refinement of ENGAGIUM: Class Participation Tracker for Online Learning, a browser-based tool that assists faculty in monitoring student engagement.

On the descriptive side, the study uses a survey-based approach to (a) validate the problem of subjective and incomplete participation tracking, (b) assess faculty technology acceptance and feasibility perceptions, and (c) establish usability expectations for a participation-tracking system. Descriptive survey designs are appropriate when the goal is to characterize attitudes, perceptions, and self-reported practices of a defined population at a given point in time (Fink, 2017).

On the developmental side, the study follows the development and initial assessment of ENGAGIUM as an instructional support tool. Developmental research in educational technology typically involves designing an artefact, implementing it in a constrained context, and evaluating its performance and perceived usefulness using empirical methods (Richey & Klein, 2014). In this case, the artefact is a class participation tracker that captures participation events (for example, joins, leaves, chat messages, microphone toggles, camera toggles, hand raises, and reactions) and makes them available as structured analytics to instructors.

Together, the descriptive and developmental components are aligned with the study’s overarching objectives: (a) to understand the problem context of online participation tracking, (b) to design and develop a system responsive to that context, and (c) to evaluate the system’s performance, usability, and acceptance among its intended users.

### 3.1.2 System Development Methodology
The system component of the study adopted an Agile Software Development Life Cycle (SDLC) methodology, implemented through iterative sprints covering requirements analysis, design, development, testing, and deployment (Pressman & Maxim, 2020). Agile approaches emphasize incremental delivery, stakeholder feedback, and responsiveness to changing requirements rather than a rigid, linear sequence of phases (Beck et al., 2001). This methodology is appropriate for ENGAGIUM because the technical feasibility of real-time participation tracking and the detailed feature set required continuous refinement based on faculty feedback and experimental prototyping.

At a high level, the Agile process for ENGAGIUM involved the following phases:

- **Requirements Analysis** – Eliciting user needs from the literature on online engagement and fairness, from the problem and objectives stated in Chapters I and II, and from informal consultations with faculty. Requirements focused on automating participation capture, generating transparent reports, and ensuring compliance with data privacy principles.
- **System Design** – Outlining the logical architecture of the tool, including the core modules for class and session management, participation event logging, and reporting. This phase also defined non-functional requirements such as performance, reliability, and privacy constraints.
- **Incremental Development** – Implementing system features in short iterations, starting with foundational capabilities (user accounts, classes, and sessions) and progressing toward real-time participation detection and analytics dashboards. Each iteration produced a working subset of functionality that could be inspected and refined.
- **Testing and Refinement** – Conducting functional testing, planned usability assessment, and accuracy testing of participation detection to identify defects, refine workflows, and align the system with faculty expectations.
- **Preparation for Deployment and Evaluation** – Preparing the prototype for limited evaluation by selected faculty users, including setting up the testing environment, configuring access, and drafting user-facing documentation.
The detailed technical architecture, module-level design, database structures, and implementation specifics of ENGAGIUM are presented in the technical appendices (see Appendix B). In this chapter, the Agile SDLC is discussed only to the extent necessary to clarify how the system was developed in support of the research objectives.

## 3.2 Research Design

The study adopted a descriptive–developmental research design anchored on an Input–Process–Output (IPO) model and informed by the Technology Acceptance Model (TAM).

From a structural viewpoint, the IPO model clarifies how inputs are transformed into outputs through defined processes (Sequeira, 2018). In this study:

**Inputs** include:

- Faculty characteristics (e.g., department, years of teaching experience, workload in online classes).
- Baseline data on current participation tracking practices and perceived challenges.
- Faculty perceptions based on TAM constructs such as perceived usefulness, perceived ease of use, and behavioral intention to use an automated tracker (Davis, 1989; Venkatesh & Davis, 2000).
- System-generated participation data from the ENGAGIUM prototype (e.g., logs of joins, leaves, chat events, and reactions) during controlled or pilot sessions.

**Processes** involve:

- Administration of a structured survey questionnaire to capture faculty practices, acceptance, and expectations.
- Planned administration of the System Usability Scale (SUS) to evaluate perceived usability of the prototype (Brooke, 1996).
- Accuracy testing procedures that compare system-detected participation events with human-coded ground truth.
- Statistical and qualitative analyses of collected data, including descriptive statistics, SUS scoring, accuracy metrics, and thematic analysis of open-ended responses.

**Outputs** consist of:

- Empirical description of current participation tracking difficulties among faculty.
- Measures of faculty acceptance and perceived feasibility of ENGAGIUM.
- Usability scores and interpretations for the system, once the SUS is administered.
- Accuracy indicators (e.g., precision, recall, and F1 scores) for participation detection.
- The final ENGAGIUM prototype and recommendations for institutional adoption and further development.
The Technology Acceptance Model (TAM) provides the primary theoretical lens for interpreting faculty attitudes toward ENGAGIUM. TAM posits that perceived usefulness (PU) and perceived ease of use (PEOU) are key determinants of users’ behavioral intention to adopt a technology (Davis, 1989). Extended TAM studies in educational settings highlight that when instructors perceive a tool as helpful for improving performance and easy to use, they are more likely to adopt it (Quiban, 2024; Porto, 2025). In this study, TAM constructs are operationalized through the survey’s technology acceptance section, which measures perceived usefulness, perceived ease of use, and behavioral intention to use an automated participation tracker.

Conceptually, TAM is embedded within the IPO framework: TAM-related perceptions are part of the Inputs, while the influence of these perceptions on the Outputs—such as adoption intention and reported satisfaction—are examined through the data analysis procedures. This combined IPO–TAM research design ensures that both the process of system adoption and the resulting outcomes are systematically described and interpreted.

## 3.3 Research Locale

The study was conducted at St. Clare College of Caloocan, a higher education institution in the Philippines offering senior high school and tertiary programs. The institution adopts a blended learning modality in which classes alternate between online and in-person sessions. Synchronous online classes are primarily conducted through platforms such as Google Meet and Zoom.

This blended context creates specific challenges for participation tracking. During face-to-face meetings, instructors may use informal observation or paper-based records; during online sessions, participation is dispersed across multiple modalities such as microphone use, chat contributions, and reaction icons. Inconsistent tools and modes of delivery contribute to fragmented engagement records and perceived grading subjectivity, as outlined in Chapter I.

The research focused on faculty members who conduct or have recently conducted online or blended classes within St. Clare College of Caloocan. All survey responses and, in future phases, any prototype evaluations are constrained to this institutional context to maintain alignment with the study's objectives and delimitations.

## 3.4 Target Respondents

The target respondents for the survey are faculty members of St. Clare College of Caloocan who teach or have taught online or blended classes using platforms such as Google Meet or Zoom. ENGAGIUM is designed as a professor-side tool, and therefore only faculty members serve as respondents and evaluators in this study.

The study aims to include approximately 30 to 50 faculty respondents. As of the current stage, around 30 valid responses have been collected, with ongoing efforts to increase participation toward a maximum of 50. This range is considered sufficient for descriptive analyses of faculty practices and perceptions within the institution (Fink, 2017).

Faculty respondents may come from various departments (e.g., Senior High School, Institute of Computer Studies, and other academic units), provided that they:

- Have conducted at least one online or blended class using synchronous platforms during the relevant academic year.
- Are currently employed as full-time or part-time faculty members at St. Clare College of Caloocan.
- Are willing to participate voluntarily and provide informed consent.
No students are directly surveyed or interviewed in this study. Student-related data appear only as anonymized participation events (e.g., counts of chat messages or reactions) generated by the system, in line with the study's privacy constraints.

## 3.5 Sampling Technique

The study used purposive sampling to select faculty respondents. Purposive sampling is a non-probability technique in which participants are chosen because they possess specific characteristics relevant to the research objectives (Etikan, Musa, & Alkassim, 2016). In this case, the inclusion criteria focused on professors who have recent experience with online or blended teaching and who are potential users of ENGAGIUM.

Purposive sampling is appropriate for technology acceptance and usability studies in educational settings where the goal is to obtain informed perspectives from individuals who can meaningfully evaluate the proposed system (Richey & Klein, 2014). Since the study is bounded within a single institution and focuses on system development and preliminary evaluation rather than statistical generalization to all higher education faculty, purposive sampling provides a practical and methodologically sound approach.

Faculty were invited through institutional channels (e.g., internal communication platforms or email announcements). Participation was entirely voluntary, and respondents could withdraw at any time without penalty. The sampling frame was restricted to St. Clare College of Caloocan to ensure that findings remain directly relevant to the institution's context and potential adoption decisions.

## 3.6 Data Sources

The study draws on two main categories of data: system-generated data and research data obtained through surveys and planned evaluation instruments.

### 3.6.1 System-Generated Data

System-generated data refer to data automatically recorded by the ENGAGIUM prototype during controlled or pilot evaluations. Consistent with the system's privacy-by-design principles, these data are limited to non-identifying participation metadata and do not include audio or video content.

The primary types of system-generated data include:

- **Attendance and session logs** – Records of when participants join and leave a class session, represented as time-stamped events and derived attendance durations.
- **Participation logs** – Records of engagement events such as:
  - Chat messages sent during a session.
  - Microphone toggles or speaking activity indications.
  - Camera toggles, where applicable.
  - Hand-raise actions and reaction icons.
- **Session metadata** – Information such as session identifiers, approximate duration, and class identifiers associated with the recording.
- **System performance indicators** (if collected) – Basic metrics such as event throughput or error logs, used only for internal technical evaluation and not linked to individual users.
All system-generated data are stored and analyzed at an aggregated or coded level, focusing on counts and patterns of events rather than identifying specific students, in line with data minimization principles (Foronda et al., 2023; Sancon, 2023).

### 3.6.2 Research Data

Research data collected for the study include:

- **Survey Responses** (Likert-Scale Items) – Data from the faculty survey questionnaire covering:
  - Current practices and challenges in participation tracking.
  - Technology acceptance constructs (perceived usefulness, perceived ease of use, behavioral intention, and feasibility constraints) grounded in TAM (Davis, 1989; Quiban, 2024).
  - Usability expectations regarding dashboards, reports, and tracking options.
  - Data privacy and ethical expectations.
- **Open-Ended** Feedback – Narrative responses describing faculty’s biggest challenges in tracking participation, desired features for an automated tracker, and concerns about automated assessment systems.
- **Planned SUS** Scores – Scores from the System Usability Scale (SUS) to be administered once the ENGAGIUM prototype is ready for faculty testing. SUS is a standardized 10-item instrument widely used to assess perceived usability of interactive systems (Brooke, 1996; Bangor, Kortum, & Miller, 2008).
- **Accuracy Testing** Results – Metrics derived from comparing system-detected participation events with manually coded ground truth in controlled sessions.
These research data provide the basis for describing the problem context, evaluating the prototype system, and interpreting faculty acceptance and perceptions of fairness and usability.

## 3.7 Research Instruments

To systematically gather data aligned with the study objectives, several research instruments are used or planned: a structured survey questionnaire, the System Usability Scale (SUS), an accuracy testing checklist, and validation tools for assessing instrument quality.

### 3.7.1 Survey Questionnaire

The primary instrument for descriptive data collection is a researcher-developed survey questionnaire administered to faculty respondents. The questionnaire is structured as follows:

- **Respondent Profile (Demographic Information)** – Items on department affiliation, years of teaching experience, number of online classes per day and per week, and primary device used for online teaching. These variables contextualize the findings and allow for subgroup comparisons where appropriate (Fink, 2017).

- **Section 1: Problem Validation – Current Practices and Difficulties** – Likert-scale items (1 = Strongly Disagree to 5 = Strongly Agree) probing respondents' difficulty in monitoring different forms of participation, challenges in tracking microphone and reaction-based engagement, perceived subjectivity in grading, and the perceived need for more objective tracking mechanisms.

- **Section 2: Technology Acceptance and Feasibility (TAM-Based)** – Items operationalizing key TAM constructs:
  - **Perceived Usefulness** (5 items) – Extent to which an automated participation-tracking tool is seen as improving grading fairness, reducing manual effort, and providing better engagement insights (Davis, 1989; Venkatesh & Davis, 2000).
  - **Perceived Ease of Use** (5 items) – Comfort with browser-based tools, perceived ease of learning new tools, and preference for minimal setup.
  - **Behavioral Intention to Use** (5 items) – Willingness to adopt ENGAGIUM if it proves accurate, reliable, and workload-reducing.
  - **Feasibility Constraints** (5 items) – Self-reported device capability, internet stability, and familiarity with online teaching platforms that may affect adoption.
- **Section 3: Usability Expectations for ENGAGIUM** – Items assessing expectations regarding:
  - Dashboard and Interface (e.g., simplicity, at-a-glance summaries, graphical visualizations).
  - Report Preferences (e.g., downloadable formats, highlighting top or low participants, session-by-session comparisons).
  - Tracking Options (e.g., enabling or disabling certain participation types, adjustable weightings, manual adjustment of scores).
- **Section 4: Data Privacy and Ethical Expectations** – Items measuring expectations about data minimization, assurances against audio/video storage, transparency of scoring logic, compliance with the Data Privacy Act of 2012 (RA 10173), and clarity of consent procedures (Foronda et al., 2023; Miano, 2025).

- **Section 5: Open-Ended Questions** – Short-answer questions asking about the biggest challenges in tracking participation, desired features of the tool, and any concerns about automated participation assessment.

- **Section 6: Post-Study Participation and Follow-Up Consent** – Items asking whether respondents are willing to be contacted for follow-up interviews, prototype testing, and notifications regarding future beta releases.

This questionnaire provides comprehensive baseline data on the problem context, faculty attitudes toward ENGAGIUM, and design expectations that guide subsequent system development and evaluation.

### 3.7.2 System Usability Scale (SUS)

For usability evaluation in later stages, the study plans to use the System Usability Scale (SUS) developed by Brooke (1996). SUS is a standardized 10-item instrument rated on a five-point Likert scale (Strongly Disagree to Strongly Agree) and has been widely validated across diverse software and hardware systems (Bangor et al., 2008). It yields a single composite usability score ranging from 0 to 100, where higher scores indicate better perceived usability.

SUS is appropriate for ENGAGIUM because it:

- Provides a quick yet reliable measure of overall usability.
- Enables comparison with established benchmarks and interpretive ranges (e.g., "OK," "Good," "Excellent") (Bangor et al., 2008).
- Requires minimal time from respondents, making it suitable for busy faculty.

Details on SUS scoring procedures and interpretation ranges are presented in Appendix G, together with sample computations to be applied once evaluation data are collected.

### 3.7.3 Accuracy Testing Checklist

To evaluate the reliability of ENGAGIUM's participation detection, the study employs a researcher-developed accuracy testing checklist. In controlled or pilot sessions, a human observer (or annotated recording) produces a ground-truth log of participation events, which is then compared to the system's automatically recorded events.

The checklist includes the following elements:

- Identification of the session, date, and duration.
- A list of observed events, categorized by type:
  - Student joins and leaves.
  - Chat messages.
  - Microphone-related participation.
  - Camera toggles, where applicable.
  - Hand raises and reactions.
- Corresponding system-detected events for each category.
- Markers for true positives (events both observed and detected), false positives (events detected by the system but not observed), and false negatives (observed events not detected by the system).

From these data, precision, recall, and F1 score are calculated to quantify detection performance:

- **Precision**: proportion of detected events that are correct.
- **Recall**: proportion of actual events that the system correctly detects.
- **F1 Score**: harmonic mean of precision and recall (Powers, 2011).
The detailed formulas and example computations for these metrics are described in Appendix G. This instrument ensures that the developmental evaluation of ENGAGIUM includes not only user perceptions but also objective measures of detection accuracy.

### 3.7.4 Instrument Validation

All instruments undergo content validation and pilot testing before full deployment.

**Content Validation** by Experts – At least three experts are invited to review the survey questionnaire and accuracy checklist:
- One expert in educational technology or instructional design.
- One expert in research methods or educational measurement.
- One subject-matter expert familiar with online and blended teaching in higher education.
These experts evaluate the instruments’ clarity, relevance, and alignment with the study objectives. Their feedback informs revisions to item wording, ordering, and coverage (Lynn, 1986).

**Pilot Testing** – A small pilot group (e.g., 5–10 faculty members who meet the inclusion criteria but are not part of the main sample) completes the survey. Pilot responses are used to:
- Identify ambiguous or confusing items.
- Estimate completion time.
- Provide early indications of internal consistency for multi-item scales (e.g., perceived usefulness and perceived ease of use).
Where sample size permits, reliability indices such as Cronbach's alpha are computed for key scales to assess internal consistency (Taber, 2018). The computation procedure for Cronbach's alpha is outlined in Appendix G. Only validated and refined versions of the instruments are used for the main data collection.

## 3.8 Data Gathering Procedure

The data gathering procedure follows a structured, stepwise process from coordination with the institution to data consolidation. The procedure covers both the survey phase and the planned evaluation of the ENGAGIUM prototype.

**1. Coordination with Institutional Authorities**

The researchers first coordinate with relevant administrative offices or program heads at St. Clare College of Caloocan to seek permission to conduct the study. This includes presenting the research objectives, providing draft instruments, and assuring adherence to institutional data privacy and research ethics guidelines.

**2. Identification and Recruitment of Eligible Faculty**

Based on institutional records or program lists, faculty members who conduct or have recently conducted online or blended classes are identified. Invitations are sent through official communication channels, briefly explaining the study purpose, the voluntary nature of participation, and approximate time required to complete the survey.

**3. Informed Consent**

Before accessing the questionnaire, prospective participants are presented with an informed consent statement that explains:

- The purpose of the study.
- What participation entails (e.g., completing a survey, possible follow-up interview, potential prototype testing).
- Risks and benefits (minimal risk, potential to improve participation tracking tools).
- Data privacy measures, including the non-collection of sensitive personal information and event-level collection that excludes audio and video.
- The right to withdraw at any time without penalty.

Only those who explicitly agree to the consent statement proceed with the survey.

**4. Administration of the Survey Questionnaire**

The validated survey questionnaire is administered, preferably via an online form to facilitate data capture and minimize physical contact. Respondents complete sections on demographic information, current practices, technology acceptance, usability expectations, data privacy concerns, and open-ended questions. They may optionally indicate willingness to participate in follow-up interviews or prototype testing and provide contact information for that specific purpose.

**5. Compilation and Preliminary Cleaning of Survey Data**

Completed survey responses are downloaded, checked for completeness, and screened for inconsistencies (e.g., straight-lining responses, missing sections). Incomplete responses that lack substantial sections may be excluded from certain analyses following predetermined criteria.

**6. Planned Prototype Deployment and SUS Administration**

Once a stable prototype of ENGAGIUM is available, a subset of consenting faculty are invited to participate in a usability and feasibility evaluation. This phase, which may involve live or simulated sessions, follows these steps:

- Researchers provide installation and usage instructions for the tool.
- Faculty use ENGAGIUM in a controlled or real online class session, subject to institutional and ethical guidelines.
- After the session, participants complete the SUS questionnaire and may provide additional feedback on usability and perceived usefulness.

**7. Accuracy Testing Sessions**

In selected sessions, accuracy testing is conducted by:

Manually recording participation events or annotating session recordings, with student identities anonymized or coded.
- Extracting system-generated logs from ENGAGIUM for the same sessions.
- Using the accuracy testing checklist to compare ground truth with system detection and compute precision, recall, and F1 scores.

**8. Data Consolidation and Secure Storage**

All data (survey responses, SUS scores, system logs, accuracy results, and qualitative feedback) are compiled into a secure, access-controlled repository. Identifiers, if any, are separated from response data, and student-related data are kept only in anonymized or aggregated form.

**9. Data Analysis and Interpretation**

Data are analyzed using the statistical and analytic techniques described in Section 3.9. Findings are interpreted in light of the study's objectives, TAM constructs, and ethical considerations.

Throughout these steps, communication with participants emphasizes voluntary participation, confidentiality, and the right to decline further involvement at any stage.

## 3.9 Data Analysis Techniques

The study employs both quantitative and qualitative data analysis methods to address its research questions and objectives. Quantitative analyses are used for survey responses, SUS scores, and accuracy metrics, while qualitative analysis is applied to open-ended responses.

### 3.9.1 Descriptive Statistics

Descriptive statistics are used to summarize respondents' profiles, current practices, and attitudes toward participation tracking and ENGAGIUM. These include:

- **Frequency counts and percentages** – To describe categorical data such as department, years of teaching experience, device type, and response distributions for individual Likert-scale items (Fink, 2017).
- **Measures of central tendency and dispersion** – To summarize Likert-scale responses for each construct (e.g., perceived usefulness, perceived ease of use, behavioral intention, feasibility, usability expectations, and privacy concerns). Means and standard deviations are computed for each item and for composite constructs.

For ease of interpretation, Likert scale responses (1–5) are typically classified into interpretation ranges, such as:

- 1.00–1.80: Very Low / Strongly Disagree
- 1.81–2.60: Low / Disagree
- 2.61–3.40: Moderate / Neutral
- 3.41–4.20: High / Agree
- 4.21–5.00: Very High / Strongly Agree

The specific interpretation table and its justification are described in Appendix G. These descriptive statistics directly address research objectives concerning current practices, perceived needs, and acceptance levels.

### 3.9.2 SUS Score Computation

For sessions where SUS is administered, SUS scores are computed using the standard procedure (Brooke, 1996; Bangor et al., 2008):

1. For each of the 10 items, responses are on a 1–5 scale.
2. For **odd-numbered items** (1, 3, 5, 7, 9), the adjusted score is computed as:

   $$X_{\text{odd}} = \text{response} - 1$$

3. For **even-numbered items** (2, 4, 6, 8, 10), the adjusted score is:

   $$X_{\text{even}} = 5 - \text{response}$$

4. The adjusted scores for all 10 items are summed and then multiplied by 2.5 to produce a score between 0 and 100:

   $$\text{SUS score} = \left(\sum_{i=1}^{10} X_i\right) \times 2.5$$

Average SUS scores across respondents are computed and interpreted using established categories, where scores around 68 are considered average, scores above 80.3 are considered excellent, and scores below 50 indicate poor usability (Bangor et al., 2008). These interpretations provide a clear, standardized view of ENGAGIUM’s perceived usability.

Detailed derivations, examples, and interpretation tables are presented in Appendix G.

### 3.9.3 Accuracy Metrics

To evaluate ENGAGIUM's detection accuracy, precision, recall, and F1 score are computed for each relevant event category (e.g., joins/leaves, chat messages, reactions) and, where feasible, at the level of individual sessions.

The metrics are defined as follows (Powers, 2011):

- **True Positive (TP)** – An event that was both observed in the ground truth and detected by the system.
- **False Positive (FP)** – An event detected by the system but not present in the ground truth.
- **False Negative (FN)** – An event present in the ground truth but not detected by the system.

From these counts:

**Precision (P)**

$$P = \frac{TP}{TP + FP}$$

This measures the proportion of detected events that are correct.

**Recall (R)**

$$R = \frac{TP}{TP + FN}$$

This measures the proportion of actual events that the system successfully detects.

**F1 Score (F1)**

$$F1 = 2 \times \frac{P \times R}{P + R}$$

This is the harmonic mean of precision and recall, providing a single performance index that balances both dimensions.

For each event type, precision, recall, and F1 scores are interpreted to determine whether detection performance is acceptable for classroom use, recognizing that some trade-offs between false positives and false negatives may be inevitable. Full computation examples are documented in Appendix G.

### 3.9.4 Qualitative Thematic Analysis

Open-ended responses from the survey and any follow-up interviews (if conducted) are analyzed using qualitative thematic analysis as described by Braun and Clarke (2006). This method involves:

1. **Familiarization** – Reading and re-reading responses to gain an overall sense of the data.
2. **Initial Coding** – Generating initial codes that capture meaningful features of the text (e.g., “difficulty tracking quiet students,” “concerns about data privacy,” “desire for flexible reporting”).
3. **Searching for Themes** – Collating codes into candidate themes that reflect broader patterns (e.g., “perceived fairness,” “workload reduction,” “technical constraints”).
4. **Reviewing Themes** – Refining themes to ensure they accurately represent the coded data and the full data set.
5. **Defining and Naming Themes** – Finalizing theme definitions and naming them in a way that clearly conveys their essence.
6. **Producing the Narrative** – Selecting illustrative quotes and integrating thematic findings with quantitative results in the discussion chapters.
Thematic analysis provides nuanced insights into faculty perceptions, concerns, and suggestions that may not be fully captured by Likert-scale measures, thereby enriching the interpretation of the quantitative findings.

## 3.10 Ethical Considerations

The study adheres to ethical principles and to the requirements of the Philippine Data Privacy Act of 2012 (Republic Act 10173). The following ethical safeguards are observed:

**Informed Consent**

All prospective participants are provided with clear information about the study's purpose, procedures, risks, and benefits. They are informed that participation is voluntary and that they may withdraw at any time without consequences. Consent is obtained before any data collection.

**Confidentiality and Anonymity**

Survey responses are collected in a manner that avoids unnecessary personally identifiable information. Where contact details are collected for follow-up participation (e.g., prototype testing), such information is stored separately from survey response data. In reporting, only aggregated results and anonymized quotations are presented, ensuring that individual faculty members and classes cannot be identified.

**Data Privacy and Data Minimization**

ENGAGIUM is designed to collect only event-level metadata—such as timestamps of joins/leaves and types of participation events—and text-based chat content when necessary for participation counts. The system does not store audio or video recordings of sessions. This data minimization approach is consistent with ethical recommendations for educational analytics and Philippine privacy guidelines, which stress collecting only data necessary for the stated purpose (Foronda et al., 2023; Miano, 2025).

**Voluntary Participation and Right to Withdraw**

Faculty members choose whether to complete the survey, participate in prototype testing, or engage in follow-up interviews. They may decline to answer particular questions or withdraw from any stage of the study without penalty. This right is clearly communicated in the consent materials.

**Secure Data Handling**

All digital data (survey files, logs, analysis outputs) are stored in password-protected repositories accessible only to the research team. Backups, if any, follow the same confidentiality standards. Data will be retained only for the duration necessary to complete the study and required academic documentation, after which personally identifiable components, if any, will be securely deleted.

**Non-Maleficence and Minimal Risk**

The study is classified as minimal risk, as participation mainly involves completing questionnaires and, where applicable, using a classroom support tool during routine teaching activities. No experimental manipulation of grades or official records is performed. The system is used for research and development, and any use of participation analytics for formal grading is at the discretion of faculty and outside the scope of the study.

**Institutional Alignment**

The researchers commit to aligning the study with institutional research ethics policies and to seeking appropriate administrative or committee approvals as required by St. Clare College of Caloocan. Should a formal ethics committee be established or required, the research protocol and instruments will be submitted for review.

By integrating these ethical considerations into both the research procedures and system design, the study aims to ensure that ENGAGIUM supports fair and transparent participation tracking while respecting the rights and privacy of all individuals involved.

---

## Bibliography for Chapter III

Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the system usability scale. International Journal of Human–Computer Interaction, 24(6), 574–594. https://doi.org/10.1080/10447310802205776

Beck, K., Beedle, M., van Bennekum, A., Cockburn, A., Cunningham, W., Fowler, M., Grenning, J., Highsmith, J., Hunt, A., Jeffries, R., Kern, J., Marick, B., Martin, R. C., Mellor, S., Schwaber, K., Sutherland, J., & Thomas, D. (2001). Manifesto for Agile Software Development. http://agilemanifesto.org/

Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. Qualitative Research in Psychology, 3(2), 77–101. https://doi.org/10.1191/1478088706qp063oa

Brooke, J. (1996). SUS: A “quick and dirty” usability scale. In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & A. L. McClelland (Eds.), Usability evaluation in industry (pp. 189–194). Taylor & Francis.

Creswell, J. W., & Creswell, J. D. (2018). Research design: Qualitative, quantitative, and mixed methods approaches (5th ed.). SAGE.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319–340. https://doi.org/10.2307/249008

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. American Journal of Theoretical and Applied Statistics, 5(1), 1–4. https://doi.org/10.11648/j.ajtas.20160501.11

Fink, A. (2017). How to conduct surveys: A step-by-step guide (6th ed.). SAGE.

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO) – IMRAD. SSRN Electronic Journal. https://doi.org/10.2139/ssrn.4621933

Lynn, M. R. (1986). Determination and quantification of content validity. Nursing Research, 35(6), 382–386. https://doi.org/10.1097/00006199-198611000-00017

Miano, L. C. (2025). Awareness on data privacy vis-à-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. Edelweiss Applied Science and Technology, 9(1), 302–315. https://doi.org/10.55214/25768484.v9i1.4130

Powers, D. M. W. (2011). Evaluation: From precision, recall and F‑measure to ROC, informedness, markedness and correlation. Journal of Machine Learning Technologies, 2(1), 37–63.

Pressman, R. S., & Maxim, B. R. (2020). Software engineering: A practitioner’s approach (9th ed.). McGraw‑Hill.

Porto, A. E. (2025). Adopting e‑learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. Review of Social Sciences, 5(1). https://doi.org/10.18533/rss.v5i1.143

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the Extended Technology Acceptance Model (ETAM). Journal of Innovative Technology Convergence, 6(1), 1–14. https://doi.org/10.69478/jitc2024v6n2a01

Richey, R. C., & Klein, J. D. (2014). Design and development research. In J. M. Spector, M. D. Merrill, J. Elen, & M. J. Bishop (Eds.), Handbook of research on educational communications and technology (4th ed., pp. 141–150). Springer. https://doi.org/10.1007/978-1-4614-3185-5_12

Sancon, R. J. S. (2023). Data privacy best practices of a local higher educational institution: A model for governance. International Multidisciplinary Research Journal. https://doi.org/10.54476/ioer-imrj/688585

Sequeira, A. H. (2018). Introduction to concepts of teaching and learning. In Introduction to educational research methods (pp. 1–10). Lulu Press.

Taber, K. S. (2018). The use of Cronbach’s alpha when developing and reporting research instruments in science education. Research in Science Education, 48(6), 1273–1296. https://doi.org/10.1007/s11165-016-9602-2

Venkatesh, V., & Davis, F. D. (2000). A theoretical extension of the Technology Acceptance Model: Four longitudinal field studies. Management Science, 46(2), 186–204. https://doi.org/10.1287/mnsc.46.2.186.11926