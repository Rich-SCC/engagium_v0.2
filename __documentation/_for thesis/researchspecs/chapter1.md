# Chapter I

## Problem and Its Background

### Background of the Study
The global transition to online and blended learning has profoundly reshaped higher education, especially synchronous instruction delivered through platforms such as Google Meet and Zoom. These tools ensured instructional continuity but exposed persistent difficulties in monitoring student engagement during live sessions. Studies confirm that student participation is a key determinant of academic success, as it enhances collaboration, motivation, and deeper comprehension (Martin & Bolliger, 2018). Yet, in virtual classrooms, participation can appear in multiple forms-speaking, chatting, raising a hand, reacting, or toggling the microphone-that instructors often fail to capture consistently (Simon et al., 2025).

Recent research emphasizes that participation, when properly monitored and acknowledged, directly contributes to improved performance and sustained motivation in online learning (Fu et al., 2024; Karmini, Yudabakti, Seniwati, Makulua, & Burnama, 2024). The challenge lies in the absence of tools that fairly represent student contributions across modalities. At St. Clare College of Caloocan, professors who conduct blended classes still need a consistent way to capture engagement during synchronous online meetings. Without reliable data, instructors may unintentionally overlook students who participate through less visible means, such as chat messages or reactions, resulting in perceptions of bias and inequitable grading.
To address this instructional gap, the researchers propose ENGAGIUM: Class Participation Tracker for Online Learning, a web-based system with a Google Meet extension and a Zoom integration pathway (via Zoom Apps SDK) designed to assist professors in monitoring synchronous participation objectively. ENGAGIUM automatically captures participation events such as microphone activity, chat interactions, reactions, and hand-raise actions, then visualizes them through instructor-facing dashboards and reports, subject to platform-level capability boundaries. By transforming participation into measurable data, the system promotes transparency, fairness, and more consistent grading in virtual classrooms.

Therefore, this study aims to design and develop ENGAGIUM, integrating educational theory and technology to create an equitable, data-driven approach to participation assessment in synchronous online and blended learning environments.

### Statement of the Problem

#### General Problem
How can professors of St. Clare College of Caloocan fairly and consistently track student participation during synchronous online class sessions conducted through Google Meet and Zoom?

#### Specific Problem
1.	What challenges do professors encounter in capturing and consolidating student participation from live Google Meet and Zoom class sessions?
2.	How can a system be designed to automatically recognize and categorize participation events such as join/leave, chat, reactions, hand raises, and microphone activity?
3.	How can the system generate instructor-facing participation summaries and class-level reports that professors can use for grading and feedback?
4.	How can the system minimize grading bias by replacing manual observation with recorded participation data and session logs?
5.	How can the developed system be integrated into the current workflow through a Google Meet extension and a Zoom integration pathway?
6.	How can the usability, reliability, and accuracy of the system be evaluated in terms of event capture, data recording, and dashboard reporting?

### Objective of the Study

#### General Objective
To design, develop, and evaluate a class participation tracker that enables professors of St. Clare College of Caloocan to monitor student engagement during synchronous online class sessions fairly, efficiently, and transparently.

#### Specific Objectives
1.	To develop a browser-based system integrated with Google Meet and Zoom that automatically captures and records synchronous participation data.
2.	To create an instructor-facing interface that presents summarized engagement statistics through dashboards and downloadable reports.
3.	To support meeting-driven session creation, tracking, and closure for live class sessions.
4.	To reduce grading bias by providing professors with objective, quantifiable participation records.
5.	To preserve privacy by storing only participation metadata and text-based content, excluding audio and video recordings.
6.	To evaluate the system's performance, usability, and reliability using standard software assessment criteria.

### Significance of the Study
The proposed study holds relevance for several educational stakeholders:

1.	Professors. ENGAGIUM provides instructors with an automated, data-driven mechanism for assessing participation, reducing the workload associated with manual tracking, and supporting more consistent grading in synchronous classes.
2.	Students. The system provides a fairer basis for recognizing visible and less visible forms of participation, which may improve transparency in participation-based grading even if students do not directly log in to the system.
3.	Institution. The system supports the college's goals of digital transformation and instructional transparency while keeping data collection limited to participation metadata and text-based content in line with privacy requirements.
4.	Future Researchers. ENGAGIUM can serve as a basis for further studies on automated engagement tracking, meeting-side participation capture, and privacy-aware educational analytics.

By offering measurable, transparent, and secure participation data, ENGAGIUM advances the pedagogical use of technology to enhance teaching and learning experiences in online contexts.

### Scope and Delimitation
The study focuses on the design, development, and evaluation of ENGAGIUM, a professor-facing class participation tracker for synchronous online sessions conducted through Google Meet and Zoom.

#### Scope:

- Tracks real-time participation events such as join/leave activity, microphone activity, chat messages, reaction use, and hand-raise actions.
- Generates instructor-facing dashboards and participation summaries for individual classes.
- Uses a Google Meet extension and a Zoom integration pathway (Zoom Apps SDK bridge) for online class participation tracking.
- Stores participation metadata and text-based content only, excluding audio and video recordings.
- Supports meeting-driven session creation, tracking, and closure for professor-owned classes.
- Utilizes the Agile Software Development Life Cycle (SDLC) methodology for iterative design, testing, and improvement.
- The development and evaluation will take place during Academic Year 2025-2026.

#### Delimitations:

- The system does not monitor participation during asynchronous or face-to-face sessions.
- Its accuracy depends on stable internet connectivity and access permissions of integrated platforms.
- It is designed for faculty use; students do not have direct system accounts or dashboards.
- Google Meet tracking is limited to desktop browser use and platform access restrictions.
- Zoom support depends on platform access and account permissions.
- Mobile device use is not a target platform for Google Meet tracking.
- The evaluation phase will focus on functionality, reliability, and usability within the research setting rather than production-scale deployment.

These boundaries ensure that the study remains achievable within the given timeframe while addressing its primary objective-enhancing fairness in participation tracking for online learning.

### Definition of Terms

- **Blended Learning:** A teaching approach combining face-to-face and online instruction.
- **Browser Extension:** A lightweight software component added to a web browser to introduce new functionalities, such as automated participation tracking.
- **Class Participation:** Observable actions of student engagement during class, including speaking, messaging, and reacting in online sessions.
- **Community of Inquiry Framework:** A model of online learning emphasizing social, cognitive, and teaching presence as essential to meaningful education (Garrison, Anderson, & Archer, 2000).
- **Constructivist Learning Theory:** A theory stating that learners build knowledge through interaction and active involvement (Vygotsky, 1978).
- **Dashboard:** A visual interface displaying real-time summaries of collected participation data.
- **Engagement:** The degree of attention, curiosity, and involvement that students demonstrate during learning activities.
- **Fairness:** Equal recognition and assessment of all student participation regardless of the medium used.
- **Participation Event:** A recorded instance of engagement, such as using the microphone, posting in chat, or sending a reaction.
- **Transparency:** The visibility and verifiability of participation records and grading criteria for both instructors and students.
- **Usability:** The degree to which users can effectively and efficiently use a system to achieve specific goals.

## References

Fu, P., Gao, C., Chen, X., Zhang, Z., Chen, J., & Yang, D. (2024). Proactive personality and its impact on online learning engagement through positive emotions and learning motivation. *Scientific Reports, 14*(1), 28144. https://doi.org/10.1038/s41598-024-79776-3

Garrison, D. R., Anderson, T., & Archer, W. (2000). Critical inquiry in a text-based environment: Computer conferencing in higher education. *The Internet and Higher Education, 2*(2-3), 87-105. https://doi.org/10.1016/S1096-7516(00)00016-6

Karmini, N. W., Yudabakti, I. M., Seniwati, D. N., Makulua, K., & Burnama, N. (2024). The effect of student participation through the use of online learning platforms in improving student learning outcomes. *International Journal of Language and Ubiquitous Learning, 2*(1). https://doi.org/10.70177/ijlul.v2i1.752

Martin, F., & Bolliger, D. U. (2018). Engagement matters: Student perceptions on the importance of engagement strategies in the online learning environment. *Online Learning, 22*(1). https://doi.org/10.24059/olj.v22i1.1092

Simon, P. D., Jiang, J., & Fryer, L. K. (2025). Assessment of class participation in online and offline learning environments: A qualitative investigation of teachers' best practices and challenges. *Higher Education Research & Development, 44*(5), 1191-1208. https://doi.org/10.1080/07294360.2025.2462024

Vygotsky, L. S. (1978). *Mind in society: The development of higher psychological processes*. Harvard University Press.