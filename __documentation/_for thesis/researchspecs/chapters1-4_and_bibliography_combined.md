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
---
# Chapter II

## Related Literature and Studies
### A. Related Literature

#### 1. Foreign Literature

##### Theoretical Foundations of Motivation and Engagement
The study of student participation and engagement in online learning is grounded in several psychological and educational theories. Self-Determination Theory (SDT), as synthesized in contemporary literature, emphasizes that motivation arises when three basic psychological needs-autonomy, competence, and relatedness-are met (Ryan & Deci, 2017). Within virtual classrooms, these needs influence how learners choose to engage in discussions, respond to tasks, and maintain active presence. Howard et al. (2021) confirm through meta-analysis that students who perceive higher autonomy and competence exhibit stronger engagement and persistence across learning contexts.
Contemporary studies on online learning grounded in constructivist and inquiry-based pedagogy emphasize social interaction and collaboration as core conditions for deeper cognitive processing (Martin & Bolliger, 2018; Bergdahl et al., 2024). These frameworks collectively guide the pedagogical rationale for ENGAGIUM, which encourages active participation through interactive tracking and feedback mechanisms that recognize all student contributions.
Talosa et al. (2025) add that teacher self-efficacy and blended delivery competence significantly determine engagement outcomes in higher education. This reinforces the need for digital tools that support both instructors and learners in maintaining interaction and motivation throughout hybrid modes of instruction.

##### Online Participation and Engagement
Recent international literature underlines participation as a central indicator of learning quality in digital classrooms. Oshodi (2024) assessed participation metrics in e-classrooms and reported that consistent instructor feedback and visible acknowledgment of student input directly increase attendance and engagement. Prasetyanto, Rizki, and Sunitiyoso (2022) examined post-pandemic online participation intentions among Indonesian students and found that convenience and perceived teacher responsiveness drive continued willingness to attend online classes.
Samnidze et al. (2023) identified technical readiness, social comfort, and instructor presence as the strongest determinants of active online participation. Bergdahl, Nouri, and Fors (2024) analyzed higher education engagement using learning analytics and noted that engagement is multidimensional-encompassing cognitive focus, behavioral participation, and emotional investment. Their findings emphasize that systematic tracking of participation data can reveal patterns that traditional manual observation may overlook.
Wongthong (2024) confirmed that synchronous platforms affect both student and parent perceptions of learning satisfaction, indicating that class participation is not just an academic metric but also a measure of institutional credibility and teaching quality.

##### Challenges in Monitoring Online Participation
Despite the pedagogical benefits of engagement, researchers highlight persistent barriers to accurately monitoring it in virtual environments. Donelan et al. (2025) noted that many students remain passive in synchronous sessions because of anxiety, unstable internet, or lack of opportunities to contribute. Simon et al. (2025) similarly reported that teachers face challenges in applying consistent criteria when evaluating participation across online and offline modalities.
Hamad (2022) and Kabir and Mondal (2025) found that connectivity constraints, device access, and learner readiness continue to shape participation quality in online classes. These findings justify ENGAGIUM's automated design, which captures multiple forms of participation to mitigate subjectivity.

##### Technology-Supported Participation Tracking
Technological advancement has enabled new forms of participation analytics. Gan and Ouh (2023) presented a framework for integrating real-time participation tracking through digital tools, demonstrating that automation improves grading efficiency and fairness. Marquez et al. (2023) established that feedback frequency and data-driven participation scoring positively influence academic performance and student motivation.
Kaliisa et al. (2023) reviewed learning analytics dashboards and found that visualization tools enhance learners' self-awareness of participation but warned of potential data overload and interpretive bias. The VEMETER project (2025) introduced a participation evaluation tool capable of tracking and quantifying interaction frequency in virtual classes. Its results confirmed that automated participation metrics can increase teacher objectivity.
Further, Svabensky et al. (2024) assessed fairness concerns in model-based analytics and emphasized the need for transparent criteria. This supports ENGAGIUM's focus on clear participation records and visible metrics for instructors. Collectively, these systems provide proof that automated participation tracking and data visualization can transform how engagement is evaluated in online classrooms.

##### Fairness and Data Ethics in Educational Technology
Automation in participation tracking necessitates ethical safeguards. Svabensky et al. (2024) examined fairness risks in predictive educational models and underscored the need for transparent and explainable evaluation criteria. Funa and Gabay (2024) proposed policy guidelines for AI use in education, stressing data minimization, informed consent, and bias prevention.
In the context of privacy legislation, Foronda et al. (2023) analyzed the implementation of the Philippine Data Privacy Act of 2012 in organizational settings, outlining compliance challenges applicable to academic institutions. Miano (2025) found that many state universities in the Philippines lack standardized data privacy protocols, making ethical system design essential. These studies reinforce the principle that participation-tracking tools must collect only necessary data-a practice reflected in ENGAGIUM's scope.

#### 2. Local Literature

##### Post-Pandemic Engagement and Motivation in the Philippine Context
Filipino educators continue to face the challenge of sustaining student engagement after the shift to blended and flexible learning. Jopson et al. (2024) documented the lived experiences of college students adapting to hybrid instruction and found that engagement levels fluctuate depending on instructional mode and feedback visibility. Students often perceive online participation as undervalued compared to face-to-face interaction, underscoring the need for equitable digital participation assessment tools.
Ayog and Oliva (2023) studied writing competency and participation in Filipino classes, reporting that participation improved when students received structured recognition for their contributions. Their findings imply that digital participation trackers could reinforce participation by providing immediate acknowledgment.
In a complementary study, Aquino (2023) examined physical education participation in a state university and found that motivation depends on visibility of effort and instructor feedback-paralleling the same engagement mechanics needed in virtual settings. Together, these studies reveal that sustained engagement in Philippine higher education hinges on fairness, visibility, and feedback-three factors embedded in the ENGAGIUM system's design.

##### Learning Analytics and LMS-Based Engagement
Local initiatives on educational analytics provide further support for automating participation evaluation. Rogers, Mercado, and Decano (2024) used Moodle interaction data to study correlations between online activity and academic performance. They concluded that frequency of participation and diversity of interactions predict higher achievement, validating the premise of data-driven engagement analysis.
Similarly, Cruz, Bautista, and Ramos (2025) leveraged predictive analytics on learning management system (LMS) logs at Centro Escolar University and found that participation patterns, such as discussion post frequency and chat involvement, significantly affect academic outcomes. Their work demonstrates that Philippine institutions are beginning to use engagement data as an academic performance indicator-a concept that ENGAGIUM advances by shifting this process to real-time participation capture.

##### Data Ethics and Institutional Privacy Compliance
Responsible data management has become a major theme in Philippine educational technology. Foronda, Javier, Vigonte, and Abante (2023) reviewed the implementation of the Data Privacy Act of 2012 (RA 10173) in local organizations and highlighted weak enforcement of data minimization and consent protocols. Miano (2025) confirmed this trend in a study of a state university, where most staff lacked awareness of privacy standards in data handling.
Sancon (2023) proposed a model for institutional data governance that can serve as a template for academic technology projects. These local works collectively emphasize that educational systems must ensure compliance with privacy legislation-a requirement explicitly integrated into ENGAGIUM's security and compliance features as outlined in its software requirement specification.

##### Technology Acceptance and Faculty Readiness
Adoption of new classroom technology also depends on user acceptance. Porto (2025) found that organizational culture and faculty attitude strongly influence e-learning technology adoption. Quiban (2024) extended the Technology Acceptance Model (TAM) for LMS use in Philippine universities and concluded that perceived usefulness and ease of use directly affect adoption intent.
Alejandro, Sanchez, Sumalinog, Mananay, and Goles (2024) examined pre-service teachers' acceptance of AI applications in education and noted that trust and ethical awareness determine user willingness to engage with AI-assisted systems. Cervantes and Navarro (2025) confirmed similar findings among business students, stressing the need for transparency in algorithmic decisions.
These insights guide ENGAGIUM's user interface design and feature transparency-ensuring that professors perceive the system as both useful and ethically sound.

### B. Related Studies

#### 1. Foreign Studies

##### System Prototypes and Implementation Efforts
Several international prototypes have explored the automation of participation tracking in online learning. Gan and Ouh (2023) developed a system presented at the IEEE TALE Conference that automatically measures class participation through digital event logs and visual dashboards. Their findings demonstrated that technology-enhanced participation tracking improved fairness in grading and reduced instructor bias. Similarly, the VEMETER project (2025) introduced a virtual class participation evaluator capable of monitoring reaction frequency, speaking turns, and chat activity. Results confirmed that automated metrics could reflect true engagement levels more accurately than manual observation.
Marquez, Lazcano, Bada, and Arroyo-Barriguete (2023) investigated how systematic feedback and participation monitoring affect academic performance. They observed a direct positive relationship between recorded participation data and students' sense of inclusion, suggesting that visibility of contributions enhances motivation. These studies validate the practicality of systems like ENGAGIUM, which combine real-time detection and structured visualization of participation data for educational decision-making.

##### Learning Analytics Applications
The role of learning analytics has expanded from simple reporting to deeper analysis of participation patterns. Kaliisa, Misiejuk, Lopez-Pernas, Khalil, and Saqr (2024) evaluated the effectiveness of learning analytics dashboards on students' motivation and self-regulation. Their review found that dashboards can improve participation awareness but may overwhelm users if not properly designed. This highlights the importance of clarity and usability-two priorities of ENGAGIUM's interface.
Bergdahl, Nouri, and Fors (2024) noted that analytics can uncover hidden engagement patterns that instructors may miss during manual observation. Svabensky et al. (2024) stressed the importance of explainable and fair analytics to prevent unfair evaluation. These findings underscore ENGAGIUM's commitment to transparent participation reporting.

##### AI and Bias Evaluation
As analytics tools increasingly support educational decision-making, ethical considerations emerge. Loureiro, Bettencourt, Raposo-Rivas, and Ocana (2022) analyzed participation visualization tools and argued that student data must be contextualized rather than used for surveillance. Funa (2025) expanded this perspective by outlining policy recommendations for AI in education, including bias mitigation and privacy protection mechanisms. Both studies underline that ethical governance should be integrated into software design-a guideline observed in ENGAGIUM's focus on limited data collection and transparent participation records.
These foreign studies collectively provide the technological and ethical foundations of ENGAGIUM's proposed system. They prove that automation and analytics can meaningfully quantify participation without compromising fairness or privacy when properly implemented.

#### 2. Local Studies

##### Real-Time Participation Analytics in Philippine Higher Education
Empirical research in Philippine higher education demonstrates growing readiness for real-time participation analytics. Rogers, Mercado, and Decano (2024) examined Moodle interaction logs and reported that frequency and diversity of participation predict better course outcomes. Their findings confirm that engagement data, when systematically collected, carry significant academic value. Similarly, Cruz et al. (2025) used predictive analytics on LMS datasets at a Philippine university and found that discussion and chat activities strongly correlate with final grades. These studies show that automatically captured participation data can function as valid indicators of student engagement and performance-core to the participation model that ENGAGIUM seeks to implement.
Beyond correlation, these works highlight the emerging research culture around participation data as a pedagogical resource. The integration of LMS analytics into course evaluation reflects a growing shift toward evidence-based teaching and automated performance tracking in local institutions. ENGAGIUM builds upon these empirical efforts by capturing real-time participation signals from synchronous platforms and converting them into transparent, instructor-accessible engagement metrics.

##### Human-Centered Dashboard Design
Design-oriented studies in the Philippines emphasize usability and participatory development of learning analytics tools. Revano and Garcia (2021) from FEU Institute of Technology created a human-centered analytics dashboard for higher education using participatory design principles. They reported higher faculty acceptance when dashboards prioritized clarity, visual simplicity, and actionable summaries. This demonstrates that usability and interpretability are crucial for adoption among instructors.
The study's findings directly inform ENGAGIUM's interface design, which aims to balance analytic depth with simplicity. By offering intuitive visualization and configurable reporting, ENGAGIUM aligns with the participatory design ethos proven effective in local contexts.

##### Technology Acceptance and Predictive Systems
Local research also underscores the role of perceived usefulness and institutional culture in technology adoption. Quiban (2024) and Porto (2025) extended the Technology Acceptance Model (TAM) to local higher education institutions and found that ease of use, perceived utility, and supportive culture drive adoption. Alejandro et al. (2024) and Cervantes & Navarro (2025) further identified trust and ethical transparency as determinants of willingness to adopt AI-enhanced learning tools.
These insights complement empirical analytics studies by Rogers et al. (2024) and Cruz et al. (2025), whose models link online engagement with performance. Together, they show that analytics systems succeed when they are reliable, practical, and ethically transparent-principles central to ENGAGIUM's faculty workflow and reporting framework.

##### Data Privacy and System Governance
Data governance remains a recurring concern in Philippine educational technology. Foronda et al. (2023) reviewed implementation of the Data Privacy Act (RA 10173) and found weak institutional practices in consent and data minimization. Miano (2025) confirmed low awareness of privacy standards among staff in state universities, while Sancon (2023) proposed a governance model emphasizing transparency and role-based control.
These studies collectively justify ENGAGIUM's privacy-centric architecture, which limits collection to event metadata, requires informed consent, and enforces access restrictions based on user role. By embedding privacy by design, ENGAGIUM operationalizes local data protection requirements within its system specification.

### C. Synthesis of the Literature and Studies
Across both foreign and local literature, three recurring research gaps emerge. First, there remains an absence of localized, real-time participation tracking systems that can integrate directly with synchronous learning platforms such as Zoom or Google Meet. While several international prototypes have demonstrated the feasibility of automated engagement analytics, Philippine studies have so far relied mainly on retrospective LMS logs. This limits their capacity to capture live, multimodal participation events that occur during online classes.
Second, there is limited empirical evaluation of fairness, transparency, and usability in existing automated engagement tools. Many studies acknowledge the promise of analytics dashboards but stop short of assessing how these tools affect perception of equity in participation grading or instructor decision-making. Ethical issues surrounding bias, interpretability, and informed consent remain underexplored, particularly in local higher education contexts where data privacy compliance is still inconsistent.
Third, the linkage between educational data mining and classroom-level analytics is insufficient. Although institutional databases and LMS records provide rich information, few systems in Philippine higher education connect these data streams to real-time classroom engagement or instructor-facing dashboards. As a result, participation metrics often remain fragmented, delaying feedback and reducing their pedagogical usefulness.
ENGAGIUM addresses these gaps through three practical design commitments. It integrates automation by capturing live participation through a Google Meet extension and a Zoom integration pathway, reducing additional instructor workload. It supports fairer participation assessment through clear records and simplified professor-facing dashboards. Finally, it follows privacy-compliant handling under RA 10173 through data minimization, consent-based collection, and role-based access control. Together, these features position ENGAGIUM as a localized, ethical, and practical solution for participation tracking in Philippine higher education.

## References

Alejandro, I. M. V., Sanchez, J. M. P., Sumalinog, G. G., Mananay, J. A., Goles, C. E., & Fernandez, C. B. (2024). Pre-service teachers' technology acceptance of artificial intelligence (AI) applications in education. *STEM Education, 4*(4), 445-465. https://doi.org/10.3934/steme.2024024

Aquino, J. M. D. (2023). Assessing the role of recreational activities in physical education participation of college students in one state university in Laguna Philippines. *International Journal of Multidisciplinary Sciences, 1*(2), 190-204. https://doi.org/10.37329/ijms.v1i2.2506

Ayog, J. T., & Oliva, E. R. A. (2023). Writing competency and student participation in Filipino class: The mediating effect of reading strategy. *Asian Journal of Education and Social Studies, 49*(4), 84-94. https://doi.org/10.9734/ajess/2023/v49i41190

Bergdahl, N., Bond, M., Sjoberg, J., Dougherty, M., & Oxley, E. (2024). Unpacking student engagement in higher education learning analytics: A systematic review. *International Journal of Educational Technology in Higher Education, 21*(1). https://doi.org/10.1186/s41239-024-00493-y

Cervantes, J., & Navarro, E. (2025). Business students' perceptions of AI in higher education: An analysis using the Technology Acceptance Model. *Journal of Interdisciplinary Perspectives, 3*(6). https://doi.org/10.69569/jip.2025.194

Cruz, J. H., Florentino, M. C. A., Lacatan, L. L., & Peralta, R. L. (2025). Leveraging predictive analytics on LMS logs to examine the impact of engagement on academic performance among college students enrolled in Centro Escolar University. *International Journal of Research and Scientific Innovation, 12*(1), 563-573. https://doi.org/10.51244/ijrsi.2025.12010051

Donelan, H., Kear, K., Rosewell, J., Okada, A., Sheehy, K., Amor, K., Edwards, C., Mooney, A., Cuffe, P., & Elder, T. (2025). Synchronous online learning: Why some students don't actively participate. *Online Learning, 29*(3). https://doi.org/10.24059/olj.v29i3.4641

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO)-IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Funa, A. A., & Gabay, R. A. E. (2024). Policy guidelines and recommendations on AI use in teaching and learning: A meta-synthesis study. *Social Sciences & Humanities Open, 11*, 101221. https://doi.org/10.1016/j.ssaho.2024.101221

Gan, B., & Ouh, E. L. (2023). Class participation: Using technology to enhance efficiency and fairness. *IEEE TALE 2023*, 1-8. https://doi.org/10.1109/TALE56641.2023.10398380

Hamad, W. (2022). Understanding the foremost challenges in the transition to online teaching and learning during COVID-19 pandemic: A systematic literature review. *Journal of Educational Technology and Online Learning, 5*(2), 393-410. https://doi.org/10.31681/jetol.1055695

Howard, J. L., Bureau, J. S., Guay, F., Chong, J. X. Y., & Ryan, R. M. (2021). Student motivation and associated outcomes: A meta-analysis from Self-Determination Theory. *Perspectives on Psychological Science, 16*(6), 1300-1323. https://doi.org/10.1177/1745691620966789

Jopson, A. A. E., et al. (2024). The lived experiences of college students in adapting the blended learning. *BAHANDIAN, Institutional Repository of Central Philippine University*. https://hdl.handle.net/20.500.12852/3309

Kabir, R., & Mondal, M. S. H. (2025). Perceived benefits or barriers? The online learning experience of Bangladeshi undergraduate students. *Malaysian Online Journal of Educational Sciences, 13*(2), 53-63. https://doi.org/10.22452/mojes.vol13no2.5

Kaliisa, R., Misiejuk, K., Lopez-Pernas, S., Khalil, M., & Saqr, M. (2023). Have learning analytics dashboards lived up to the hype? A systematic review of impact on students' achievement, motivation, participation and attitude. *arXiv*. https://doi.org/10.48550/arxiv.2312.15042

Marquez, J., Lazcano, L., Bada, C., & Arroyo-Barriguete, J. L. (2023). Class participation and feedback as enablers of student academic performance. *SAGE Open, 13*(2). https://doi.org/10.1177/21582440231177298

Martin, F., & Bolliger, D. U. (2018). Engagement matters: Student perceptions on the importance of engagement strategies in the online learning environment. *Online Learning, 22*(1). https://doi.org/10.24059/olj.v22i1.1092

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Oshodi, O. (2024). Assessment of students' attendance, participation and classroom involvement in e-classroom. *International Conference on Education Research, 1*(1), 442-448. https://doi.org/10.34190/icer.1.1.3192

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Prasetyanto, D., Rizki, M., & Sunitiyoso, Y. (2022). Online learning participation intention after COVID-19 pandemic in Indonesia: Do students still make trips for online class? *Sustainability, 14*(4), 1982. https://doi.org/10.3390/su14041982

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)*, 1-5. https://doi.org/10.1109/HNICEM54116.2021.9731917

Rogers, J. K. B., Mercado, T. C. R., & Decano, R. S. (2024). Moodle interactions and academic performance: Educational data mining in a Philippine university. *Journal of Education and Learning (EduLearn), 19*(1), 542-550. https://doi.org/10.11591/edulearn.v19i1.21549

Ryan, R. M., & Deci, E. L. (2017). *Self-determination theory: Basic psychological needs in motivation, development, and wellness*. The Guilford Press. https://doi.org/10.1521/978.14625/28806

Samnidze, N., Didmanidze, I., Diasamidze, M., Akhvlediani, D., & Kirvalidze, N. (2023). Critical factors influencing classroom participation in online learning. *Platforms, 1*(1), 26-33. https://doi.org/10.3390/platforms1010004

Sancon, R. J. S. (2023). Data privacy best practices of a local higher educational institution: A model for governance. *International Multidisciplinary Research Journal*. https://doi.org/10.54476/ioer-imrj/688585

Simon, P. D., Jiang, J., & Fryer, L. K. (2025). Assessment of class participation in online and offline learning environments: A qualitative investigation of teachers' best practices and challenges. *Higher Education Research & Development, 44*(5), 1191-1208. https://doi.org/10.1080/07294360.2025.2462024

Svabensky, V., Verger, M., Rodrigo, M. M. T., Monterozo, C. J. G., Baker, R. S., Saavedra, M. Z. N. L., Lalle, S., & Shimada, A. (2024). Evaluating algorithmic bias in models for predicting academic performance of Filipino students. *arXiv*. https://doi.org/10.48550/arxiv.2405.09821

Talosa, A. D., Acidera, R. A., Tamanu, M. J. M., & Sumer, J. J. M. (2025). Knowledge, self-efficacy and effectiveness in leveraging blended delivery system: A study of higher education teachers. *International Journal of Instruction, 18*(2), 709-726. https://doi.org/10.29333/iji.2025.18238a

VEMETER. (2025). A tool for evaluating participation levels in virtual class sessions. *IEEE EDUCON Conference Proceedings*. https://doi.org/10.1109/EDUCON62633.2025.11016534

Wongthong, P. (n.d.). Influence of synchronous online learning on students' and parents' perceptions: A case study of a demonstration school. https://eric.ed.gov/?q=source%3a%22Journal+of+Educators+Online%22&ff1=eduGrade+4&id=EJ1462234
---

# CHAPTER III

## METHODS OF RESEARCH AND PROCEDURES

---

## 3.1 Research Methodology

### 3.1.1 Type of Research

This study employed a **quantitative-descriptive research methodology**. The quantitative component focused on measuring faculty perceptions through structured survey responses, while the descriptive component focused on presenting the current conditions of participation tracking in synchronous online classes, including the challenges encountered in monitoring different forms of student engagement (Creswell & Creswell, 2018).

This approach enabled the systematic description of the instructional problem using measurable indicators and the evaluation of user perceptions of the proposed solution within an educational context.

---

### 3.1.2 Pre-Production and Post-Production Survey Phases

The methodology was implemented through two structured survey phases aligned with the objectives of the study.

The **pre-production survey** served as a requirements-gathering instrument to establish baseline data on current participation-tracking practices, perceived limitations of manual monitoring, technology acceptance, usability expectations, and ethical considerations.

The **post-production survey** functioned as an outcome-evaluation instrument administered after exposure to the developed prototype. It assessed user experience in terms of usability, perceived effectiveness, reliability, and intention to adopt the system.

---

### 3.1.3 Methodological Rationale

The use of a two-phase survey design ensured that the study remained **evidence-based throughout its progression**, from problem validation to post-production evaluation. This structure ensured alignment between the needs identified during pre-production and the evaluative criteria applied during post-production.

---

## 3.2 Research Design

### 3.2.1 Sequential Survey Design

The study adopted a **sequential two-phase survey design**, structured within a quantitative-descriptive methodology. Data collection was conducted in two stages (Fink, 2017):
(1) identification and validation of the instructional problem, and
(2) evaluation of the developed intervention.

This design ensured that the system was both **grounded in actual faculty needs** and **assessed using relevant usability and performance indicators**.

---

### 3.2.2 Pre-Production Survey Focus

During the pre-production phase, faculty respondents provided data regarding their current practices in monitoring participation in online and blended classes. The survey included variables related to respondent profile, participation-monitoring challenges, acceptance-related perceptions, usability expectations, and data privacy concerns.

The findings from this phase were used to guide the refinement of study priorities and the development focus of the proposed system.

---

### 3.2.3 Post-Production Survey Focus

During the post-production phase, faculty respondents who completed prototype exposure criteria evaluated the developed prototype after sufficient exposure. The evaluation included standardized usability measurement through the System Usability Scale (SUS), along with additional indicators such as perceived effectiveness, system reliability, interface clarity, report interpretability, and overall satisfaction.

Open-ended responses were also collected to capture detailed feedback and suggestions for improvement.

---

### 3.2.4 Conceptual Considerations

The research design was guided by established perspectives in educational technology, particularly the view that **perceived usefulness and perceived ease of use influence technology adoption** (Quiban, 2024; Porto, 2025). These concepts informed the interpretation of faculty responses, especially in evaluating acceptance and usability, without introducing technical system-level discussion into the chapter.

---

### 3.2.5 Variables of the Study

The study measured the following variables across the two survey phases:

Pre-Production Variables:

* Participation-tracking challenges
* Perceived usefulness
* Perceived ease of use
* Behavioral intention to use
* Usability expectations
* Data privacy concerns

Post-Production Variables:

* System usability (SUS score)
* Perceived effectiveness
* System reliability
* Interface clarity
* Report usability
* User satisfaction
* Adoption intention

---

## 3.3 Research Locale

The study was conducted at **St. Clare College of Caloocan**, where faculty members implement a blended learning approach combining synchronous online sessions and face-to-face instruction. The institution’s reliance on online platforms for synchronous classes provided an appropriate context for examining participation-tracking challenges and evaluating the proposed system.

---

## 3.4 Target Respondents

The respondents of the study consisted of **faculty members of St. Clare College of Caloocan** who have experience conducting synchronous online classes using digital platforms.

These respondents were selected because they are directly involved in monitoring student participation and are therefore capable of providing relevant insights regarding both the existing challenges and the usability of the proposed system.

---

## 3.5 Sampling Technique

The study employed **purposive sampling**, wherein participants were selected based on specific criteria relevant to the research objectives (Etikan, Musa, & Alkassim, 2016).

The criteria included:

* Active involvement in synchronous online teaching
* Experience in assessing student participation
* Willingness to participate in both survey phases

This sampling approach ensured that respondents possessed the necessary experience to provide meaningful and contextually valid data.

---

## 3.6 Data Sources

The study utilized **primary data sources** collected through structured survey instruments.

These included:

* Responses from the pre-production survey, which provided baseline data on participation-tracking practices, challenges, and expectations
* Responses from the post-production survey, which evaluated the usability and effectiveness of the developed system
* Qualitative feedback obtained from open-ended survey items

For data handling, any contact details collected for follow-up communication in the pre-production phase were optional and stored separately from survey rating data to preserve confidentiality during analysis.

These data sources formed the basis for both quantitative and qualitative analysis.

---

## 3.7 Research Instruments

### 3.7.1 Pre-Production Survey Instrument

The pre-production survey was designed to gather baseline information relevant to the study. It consisted of structured sections including respondent profile, problem validation, technology acceptance, usability expectations, and data privacy considerations.

The instrument utilized a **five-point Likert scale** to measure levels of agreement, along with open-ended questions to capture additional insights (Fink, 2017).

---

### 3.7.2 Post-Production Survey Instrument

The post-production survey was developed to evaluate the system after prototype exposure. It included structured items assessing perceived effectiveness, system performance, interface clarity, report usability, and overall satisfaction.

Open-ended questions were included to identify user experiences, encountered issues, and suggested improvements.

---

### 3.7.3 System Usability Scale (SUS)

The **System Usability Scale (SUS)** was used as a structured instrument for measuring perceived system usability in post-production evaluation, consistent with common usability assessment practice in educational technology studies (Revano & Garcia, 2021). It consists of a ten-item questionnaire with alternating positive and negative statements rated on a five-point scale.

SUS scores were computed and transformed into a scale from 0 to 100, providing a reliable measure of overall usability. These scores were interpreted using established usability benchmarks and qualitative descriptors.

---

## 3.8 Data Gathering

Data gathering was conducted in two major phases using structured survey instruments and standardized procedures.

During the **pre-production phase**, the survey was administered to eligible faculty respondents following institutional coordination. Respondents were provided with an informed consent statement detailing the purpose of the study, voluntary participation, confidentiality, and data handling procedures. Only those who consented proceeded with the survey.

During the **post-production phase**, respondents who were exposed to the developed prototype completed the evaluation survey. Respondents were given sufficient time to interact with the system prior to evaluation to ensure informed responses.

---

## 3.9 Statistical Treatment

### 3.9.1 Quantitative Analysis

Descriptive statistical methods were used to analyze quantitative data (Fink, 2017).

* **Frequency counts and percentages** were used for categorical data such as respondent profiles
* **Weighted means** were computed for non-SUS Likert-scale responses to determine the overall level of agreement across measured constructs

For the post-production phase, weighted means were used to summarize researcher-made Likert constructs related to system effectiveness, performance, interface evaluation, and satisfaction.

---

### 3.9.2 SUS Scoring and Interpretation

SUS responses were scored using the standard Brooke computation method and converted into a 0-100 scale. The resulting scores were interpreted using established usability categories to determine the overall acceptability of the system.

---

### 3.9.3 Qualitative Analysis

Responses from open-ended questions were analyzed using **thematic grouping** to identify recurring patterns, concerns, and suggestions. This served as a supplementary interpretive layer to support the primary quantitative-descriptive findings.

---

### 3.9.4 Comparative Interpretation of Findings

Findings from the pre-production and post-production phases were comparatively analyzed to determine whether the concerns identified during the initial phase were addressed by the developed system. This comparison served as the basis for conclusions and recommendations.

---

## 3.10 Ethical Considerations

The study adhered to established ethical standards in data collection and research conduct.

Participation was **voluntary**, and respondents were informed of their right to withdraw at any time without consequence. Prior to participation, respondents were provided with a clear **informed consent statement** outlining the purpose of the study, data usage, and confidentiality measures.

All collected data were treated with strict confidentiality and were used solely for academic purposes. No personally identifiable information was disclosed in the reporting of results.

The study adhered to the provisions of the **Data Privacy Act of 2012**, ensuring that only necessary data were collected and that respondents were fully informed about how their data would be handled and protected (Foronda et al., 2023; Miano, 2025).

---

## References for Chapter III (2016-Present)

Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE.

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. *American Journal of Theoretical and Applied Statistics, 5*(1), 1-4. https://doi.org/10.11648/j.ajtas.20160501.11

Fink, A. (2017). *How to conduct surveys: A step-by-step guide* (6th ed.). SAGE.

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO) - IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the Extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. In *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)* (pp. 1-5). https://doi.org/10.1109/HNICEM54116.2021.9731917

---

# CHAPTER IV
## SUMMARY OF FINDINGS, CONCLUSIONS AND RECOMMENDATIONS

---

## 4.1 Summary of Findings

### 4.1.1 Findings Relative to the Statement of the Problem

This study was guided by the general problem of how professors can fairly and consistently track participation during synchronous online classes conducted through Google Meet and Zoom. Based on the two-phase survey process and prototype evaluation, the findings indicate that ENGAGIUM addressed the core instructional need by providing structured, data-driven participation records and reducing dependence on purely manual observation.

Relative to the specific problems stated in Chapter I, the findings may be summarized as follows:

1. Faculty respondents confirmed persistent challenges in capturing participation across multiple channels during live sessions, particularly while simultaneously delivering instruction.
2. The developed system was able to operationalize participation recognition through event-based tracking categories and centralized logging for instructor review.
3. The dashboard and reporting views were perceived as useful for participation summaries and grading support, with respondents rating interface-related constructs positively.
4. The shift from manual observation to recorded participation logs improved perceived fairness and transparency of grading decisions.
5. Integration into existing workflow was feasible within the study context, with post-production respondents reporting actual use during live sessions.
6. Evaluation results showed generally positive usability and effectiveness outcomes, with identified areas for refinement concentrated on navigation clarity, real-time responsiveness, and reporting options.

### 4.1.2 Pre-Production Findings 

Pre-production results (N = 32) validated the instructional and operational burden of manual participation tracking. Problem Validation produced an overall mean of 3.29 (Moderate/Neutral), indicating that while not all indicators were equally severe, the aggregate pattern still reflected meaningful classroom management difficulty.

The highest-rated concerns were the time and effort required for manual recording (PV6, mean = 3.62), the need for a more structured and objective method (PV9, mean = 3.91), and the difficulty of maintaining consistent records across sessions (PV10, mean = 3.58). These findings establish that the issue is not merely technical convenience, but instructional consistency and grading credibility.

Technology acceptance indicators were uniformly high to very high: Perceived Usefulness (overall mean = 4.34), Perceived Ease of Use (4.31), Behavioral Intention (4.44), and Feasibility Constraints (4.10). Usability expectations were likewise strong, with Dashboard and Interface Expectations (4.46), Report Preferences (4.36), and Tracking Options (4.28) all in the Very High/Strongly Agree range. Data Privacy Expectations also showed high salience (overall mean = 4.36), especially for transparency, legal compliance, and consent procedures.

Open-ended pre-production responses reinforced these quantitative findings. Recurring themes included real-time monitoring burden, connectivity-related disruptions, and difficulty tracking participation in larger or multiple sections. Respondents also emphasized demand for live summaries, filterable reports, export options, and support for diverse participation modalities.

These findings indicate a clear instructional need for a more structured, transparent, and less burdensome participation-tracking approach.

### 4.1.3 Post-Production Findings 

Post-production findings (N = 13) indicate that ENGAGIUM was perceived as effective and usable in practical class contexts. Perceived Effectiveness reached an overall mean of 4.06 (High/Agree), with respondents indicating that the system improved participation tracking accuracy and reduced manual monitoring requirements.

System Performance and Reliability yielded an overall mean of 3.82 (High/Agree). While this confirms acceptable operational performance, the item means suggest room for improvement in real-time accuracy and event consistency under varying conditions. Interface and Dashboard Evaluation was rated positively (overall mean = 4.05), indicating that users generally understood summaries, charts, and navigation, but still observed opportunities for clearer visual cues and report interpretation.

Overall Satisfaction and Adoption produced an aggregate mean of 4.10 (High/Agree), with willingness to use the system in actual classes receiving one of the strongest endorsements (SAT2, mean = 4.23). The System Usability Scale (SUS) mean score was 72.88 (SD = 8.09), above the common benchmark of 68, indicating better-than-average usability and acceptable readiness for continued use with targeted refinements.

Post-production thematic feedback aligned with these ratings. Respondents most frequently appreciated reduced manual checking and better visibility of participation types, while the most common issues involved label clarity, navigation flow, occasional update delays, and requests for additional report export options.

These post-production findings suggest that ENGAGIUM was accepted as a practical response to the participation-tracking difficulties identified during the pre-production phase, while still leaving room for refinement in usability and responsiveness.

### 4.1.4 Comparative Analysis 

Comparative interpretation shows that the primary pre-production needs were substantially addressed by the developed system. In the pre-production phase, respondents expressed strong demand for objective tracking, integrated summaries, and reduced manual workload. In the post-production phase, these same dimensions were reflected in favorable effectiveness, interface, and satisfaction ratings.

The comparison also indicates that remaining concerns shifted in nature. Prior to development, concerns were centered on the absence of a reliable tracking mechanism and the burden of fragmented observation. After prototype use, concerns were more focused on optimization issues, such as interface cues, responsiveness in weaker connectivity contexts, and richer reporting controls. This pattern suggests that the study progressed from validating the need for automation to identifying practical improvements for broader implementation.

Overall, the two-phase design confirms alignment between identified needs and delivered outcomes: the system addressed core participation-tracking problems while generating actionable feedback for the next development cycle.

### 4.1.5 Ethical and Practical Considerations 

Findings from both phases indicate that ethical and practical considerations were central to faculty acceptance. Pre-production respondents strongly emphasized privacy compliance, transparent scoring logic, and informed data collection procedures. Post-production feedback further highlighted that trust in participation records depends not only on technical capture, but also on clarity of interpretation and consistency of reporting.

In this context, ENGAGIUM's approach of limiting collection to participation metadata and text-based interaction records aligns with the study's privacy commitments and the Data Privacy Act of 2012. No audio or video recording was required for the participation workflow evaluated in this study.

Practical constraints, however, remained evident. Internet stability, platform-side behavior changes, and interface interpretation issues can influence perceived reliability in real classroom use. These constraints do not negate system value, but they underscore the need for incremental hardening, clearer onboarding, and sustained governance practices as implementation scales.

### 4.1.6 Zoom Integration Limitations

Although the study framework included Google Meet and Zoom as target synchronous environments, implementation and evaluation depth were uneven across platforms. Post-production usage context showed universal Google Meet exposure among respondents, while Zoom exposure was partial and based on a multi-select item. This indicates that core evaluation evidence is strongest for Google Meet-centered usage scenarios within the current research setting.

Zoom-side implementation feasibility is affected by both technical and economic factors, including platform policy boundaries, account-level permissions, and potential development or maintenance costs associated with sustained integration support. As detailed in Appendix B (Section B.5, Zoom Bridge Architecture), the current Zoom Apps SDK pathway reliably supports joins/leaves, reactions, and hand-raise related events, but does not expose chat content, chat activity indicators, or real-time mic-state signals in the same manner as the Google Meet extension flow. As a result, Zoom integration in this phase should be interpreted as exploratory and constrained, rather than equivalent in maturity to Google Meet deployment.

This limitation is consistent with the study delimitations and should be considered when interpreting generalizability of findings across synchronous platforms.

---

## 4.2 Conclusions

### 4.2.1 Conclusions Relative to the General and Specific Objectives

The study concludes that ENGAGIUM met its general objective of designing, developing, and evaluating a participation-tracking system that supports fairer and more consistent monitoring in synchronous online classes. The results demonstrate that the system can capture meaningful participation indicators, present usable summaries for instructors, and reduce dependence on manual logging.

Relative to the specific objectives, the study concludes that:

1. Automated participation capture through extension-supported workflow was feasible in the target instructional context.
2. Instructor-facing dashboards and summaries were perceived as useful for class monitoring and participation-based grading.
3. Meeting-driven session use was practical for prototype exposure and post-production evaluation.
4. The use of recorded participation data improved perceived fairness and grading transparency.
5. The privacy-oriented data scope was consistent with the study's ethical requirements.
6. Evaluation outputs provided measurable evidence of usability and effectiveness, while identifying specific areas requiring refinement.

### 4.2.2 Conclusions on System Effectiveness and Adoption Readiness

ENGAGIUM demonstrated positive effectiveness and acceptable usability for early-stage institutional use. High post-production means across effectiveness, interface quality, and satisfaction, together with a SUS mean of 72.88, indicate that respondents generally considered the system practical and beneficial.

However, adoption readiness should be interpreted as conditional rather than final. The system appears suitable for controlled implementation and iterative expansion, provided that improvements are made in navigation clarity, reporting flexibility, and consistency of real-time updates under variable connectivity conditions.

Therefore, the system is best characterized as functionally viable and pedagogically valuable, with clear potential for wider deployment after targeted enhancement.

### 4.2.3 Conclusions on Study Scope and Limitations

The conclusions of this study are bounded by the defined scope, respondent profile, and implementation context. Findings are strongest for synchronous classes using Google Meet within the participating institutional setting. Zoom-related findings, while informative, remain limited in comparative depth and should not be treated as equivalent evidence of full cross-platform maturity.

This conclusion is also consistent with the architecture-level constraints documented in Appendix B (especially Sections B.5 and B.9), which describe the split integration model and the current Zoom bridge capability boundaries.

The post-production sample size and prototype-stage constraints also limit broad statistical generalization. Nevertheless, the convergence of quantitative ratings, SUS outcomes, and thematic responses supports the validity of the study's central claim: automated, privacy-aware participation tracking can improve fairness and instructional efficiency in synchronous online teaching.

---

## 4.3 Recommendations

### 4.3.1 For Institutional Implementation

For institutional use, a phased rollout is recommended. Initial deployment may prioritize departments with frequent synchronous classes and instructors already using participation-based grading. During this phase, institutions should establish clear implementation protocols for class setup, session closure, report use, and technical support escalation.

A structured orientation for faculty users is also recommended to standardize interpretation of participation metrics and prevent inconsistent grading practices across courses.

### 4.3.2 For System Improvement

System enhancement should prioritize the issues consistently identified in post-production feedback:

1. Improve dashboard label clarity, filter flow, and navigation cues for faster interpretation.
2. Strengthen real-time event synchronization, especially in low or unstable bandwidth contexts.
3. Expand reporting controls, including clearer report fields and additional export presets.
4. Add lightweight onboarding elements (guided walkthroughs, in-context hints, and quick-start references).
5. Enhance participant highlight and session-comparison views to support instructional decision-making.

These refinements should be validated through iterative usability testing before large-scale deployment.

### 4.3.3 For Policy, Ethics, and Data Governance

Institutions adopting ENGAGIUM should formalize governance mechanisms aligned with RA 10173. Recommended measures include written consent workflows, role-based access control, retention and deletion policies, and periodic privacy compliance review.

In addition, transparent communication of scoring logic and participation criteria should be embedded in faculty practice to sustain trust among instructors and students. Ethical use should emphasize support for instructional fairness rather than punitive surveillance.

### 4.3.4 For Zoom Integration Feasibility and Cost Constraints

Future Zoom integration work should begin with a dedicated feasibility track that separately evaluates technical compatibility, policy constraints, and total cost of ownership. A staged strategy is recommended:

This recommendation should be implemented alongside the technical baseline already documented in Appendix B (Section B.5), so planning decisions remain aligned with actual SDK capabilities and known capture gaps.

1. Conduct a platform capability audit and permissions mapping.
2. Define a minimum viable Zoom feature set equivalent to core Google Meet functions.
3. Estimate recurring costs for maintenance, updates, and compliance overhead.
4. Pilot with a small faculty cohort before institutional scaling.

This approach will help institutions avoid overcommitting resources before platform-level viability is fully established.

### 4.3.5 For Future Research

Future studies may extend this work through broader and more diverse samples, longer implementation windows, and cross-platform comparative evaluation. Recommended research directions include:

1. Longitudinal studies on whether participation analytics influence grading consistency and learner outcomes over multiple terms.
2. Comparative studies across different disciplines, class sizes, and instructional modalities.
3. Expanded reliability validation of post-production constructs with larger respondent pools.
4. Evaluation of onboarding interventions and interface redesign on adoption speed and user confidence.
5. Investigation of fairness perception from the student perspective alongside instructor assessments.

These directions can strengthen the evidence base for institutional policy, technical refinement, and sustainable deployment of participation-tracking systems in higher education.
---

# Bibliography

Alejandro, I. M. V., Sanchez, J. M. P., Sumalinog, G. G., Mananay, J. A., Goles, C. E., & Fernandez, C. B. (2024). Pre-service teachers' technology acceptance of artificial intelligence (AI) applications in education. *STEM Education, 4*(4), 445-465. https://doi.org/10.3934/steme.2024024

Aquino, J. M. D. (2023). Assessing the role of recreational activities in physical education participation of college students in one state university in Laguna Philippines. *International Journal of Multidisciplinary Sciences, 1*(2), 190-204. https://doi.org/10.37329/ijms.v1i2.2506

Ayog, J. T., & Oliva, E. R. A. (2023). Writing competency and student participation in Filipino class: The mediating effect of reading strategy. *Asian Journal of Education and Social Studies, 49*(4), 84-94. https://doi.org/10.9734/ajess/2023/v49i41190

Bergdahl, N., Bond, M., Sjoberg, J., Dougherty, M., & Oxley, E. (2024). Unpacking student engagement in higher education learning analytics: A systematic review. *International Journal of Educational Technology in Higher Education, 21*(1). https://doi.org/10.1186/s41239-024-00493-y

Cervantes, J., & Navarro, E. (2025). Business students' perceptions of AI in higher education: An analysis using the Technology Acceptance Model. *Journal of Interdisciplinary Perspectives, 3*(6). https://doi.org/10.69569/jip.2025.194

Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE.

Cruz, J. H., Florentino, M. C. A., Lacatan, L. L., & Peralta, R. L. (2025). Leveraging predictive analytics on LMS logs to examine the impact of engagement on academic performance among college students enrolled in Centro Escolar University. *International Journal of Research and Scientific Innovation, 12*(1), 563-573. https://doi.org/10.51244/ijrsi.2025.12010051

Donelan, H., Kear, K., Rosewell, J., Okada, A., Sheehy, K., Amor, K., Edwards, C., Mooney, A., Cuffe, P., & Elder, T. (2025). Synchronous online learning: Why some students don't actively participate. *Online Learning, 29*(3). https://doi.org/10.24059/olj.v29i3.4641

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. *American Journal of Theoretical and Applied Statistics, 5*(1), 1-4. https://doi.org/10.11648/j.ajtas.20160501.11

Fink, A. (2017). *How to conduct surveys: A step-by-step guide* (6th ed.). SAGE.

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO)-IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Fu, P., Gao, C., Chen, X., Zhang, Z., Chen, J., & Yang, D. (2024). Proactive personality and its impact on online learning engagement through positive emotions and learning motivation. *Scientific Reports, 14*(1), 28144. https://doi.org/10.1038/s41598-024-79776-3

Funa, A. A., & Gabay, R. A. E. (2024). Policy guidelines and recommendations on AI use in teaching and learning: A meta-synthesis study. *Social Sciences & Humanities Open, 11*, 101221. https://doi.org/10.1016/j.ssaho.2024.101221

Gan, B., & Ouh, E. L. (2023). Class participation: Using technology to enhance efficiency and fairness. *IEEE TALE 2023*, 1-8. https://doi.org/10.1109/TALE56641.2023.10398380

Garrison, D. R., Anderson, T., & Archer, W. (2000). Critical inquiry in a text-based environment: Computer conferencing in higher education. *The Internet and Higher Education, 2*(2-3), 87-105. https://doi.org/10.1016/S1096-7516(00)00016-6

Hamad, W. (2022). Understanding the foremost challenges in the transition to online teaching and learning during COVID-19 pandemic: A systematic literature review. *Journal of Educational Technology and Online Learning, 5*(2), 393-410. https://doi.org/10.31681/jetol.1055695

Howard, J. L., Bureau, J. S., Guay, F., Chong, J. X. Y., & Ryan, R. M. (2021). Student motivation and associated outcomes: A meta-analysis from Self-Determination Theory. *Perspectives on Psychological Science, 16*(6), 1300-1323. https://doi.org/10.1177/1745691620966789

Jopson, A. A. E., et al. (2024). The lived experiences of college students in adapting the blended learning. *BAHANDIAN, Institutional Repository of Central Philippine University*. https://hdl.handle.net/20.500.12852/3309

Kabir, R., & Mondal, M. S. H. (2025). Perceived benefits or barriers? The online learning experience of Bangladeshi undergraduate students. *Malaysian Online Journal of Educational Sciences, 13*(2), 53-63. https://doi.org/10.22452/mojes.vol13no2.5

Kaliisa, R., Misiejuk, K., Lopez-Pernas, S., Khalil, M., & Saqr, M. (2023). Have learning analytics dashboards lived up to the hype? A systematic review of impact on students' achievement, motivation, participation and attitude. *arXiv*. https://doi.org/10.48550/arxiv.2312.15042

Karmini, N. W., Yudabakti, I. M., Seniwati, D. N., Makulua, K., & Burnama, N. (2024). The effect of student participation through the use of online learning platforms in improving student learning outcomes. *International Journal of Language and Ubiquitous Learning, 2*(1). https://doi.org/10.70177/ijlul.v2i1.752

Marquez, J., Lazcano, L., Bada, C., & Arroyo-Barriguete, J. L. (2023). Class participation and feedback as enablers of student academic performance. *SAGE Open, 13*(2). https://doi.org/10.1177/21582440231177298

Martin, F., & Bolliger, D. U. (2018). Engagement matters: Student perceptions on the importance of engagement strategies in the online learning environment. *Online Learning, 22*(1). https://doi.org/10.24059/olj.v22i1.1092

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Oshodi, O. (2024). Assessment of students' attendance, participation and classroom involvement in e-classroom. *International Conference on Education Research, 1*(1), 442-448. https://doi.org/10.34190/icer.1.1.3192

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Prasetyanto, D., Rizki, M., & Sunitiyoso, Y. (2022). Online learning participation intention after COVID-19 pandemic in Indonesia: Do students still make trips for online class? *Sustainability, 14*(4), 1982. https://doi.org/10.3390/su14041982

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. In *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)* (pp. 1-5). https://doi.org/10.1109/HNICEM54116.2021.9731917

Rogers, J. K. B., Mercado, T. C. R., & Decano, R. S. (2024). Moodle interactions and academic performance: Educational data mining in a Philippine university. *Journal of Education and Learning (EduLearn), 19*(1), 542-550. https://doi.org/10.11591/edulearn.v19i1.21549

Ryan, R. M., & Deci, E. L. (2017). *Self-determination theory: Basic psychological needs in motivation, development, and wellness*. The Guilford Press. https://doi.org/10.1521/978.14625/28806

Samnidze, N., Didmanidze, I., Diasamidze, M., Akhvlediani, D., & Kirvalidze, N. (2023). Critical factors influencing classroom participation in online learning. *Platforms, 1*(1), 26-33. https://doi.org/10.3390/platforms1010004

Sancon, R. J. S. (2023). Data privacy best practices of a local higher educational institution: A model for governance. *International Multidisciplinary Research Journal*. https://doi.org/10.54476/ioer-imrj/688585

Simon, P. D., Jiang, J., & Fryer, L. K. (2025). Assessment of class participation in online and offline learning environments: A qualitative investigation of teachers' best practices and challenges. *Higher Education Research & Development, 44*(5), 1191-1208. https://doi.org/10.1080/07294360.2025.2462024

Svabensky, V., Verger, M., Rodrigo, M. M. T., Monterozo, C. J. G., Baker, R. S., Saavedra, M. Z. N. L., Lalle, S., & Shimada, A. (2024). Evaluating algorithmic bias in models for predicting academic performance of Filipino students. *arXiv*. https://doi.org/10.48550/arxiv.2405.09821

Talosa, A. D., Acidera, R. A., Tamanu, M. J. M., & Sumer, J. J. M. (2025). Knowledge, self-efficacy and effectiveness in leveraging blended delivery system: A study of higher education teachers. *International Journal of Instruction, 18*(2), 709-726. https://doi.org/10.29333/iji.2025.18238a

VEMETER. (2025). A tool for evaluating participation levels in virtual class sessions. *IEEE EDUCON Conference Proceedings*. https://doi.org/10.1109/EDUCON62633.2025.11016534

Vygotsky, L. S. (1978). *Mind in society: The development of higher psychological processes*. Harvard University Press.

Wongthong, P. (n.d.). Influence of synchronous online learning on students' and parents' perceptions: A case study of a demonstration school. https://eric.ed.gov/?q=source%3a%22Journal+of+Educators+Online%22&ff1=eduGrade+4&id=EJ1462234

---
## Source: chapter2.md
# Chapter II

## Related Literature and Studies
### A. Related Literature

#### 1. Foreign Literature

##### Theoretical Foundations of Motivation and Engagement
The study of student participation and engagement in online learning is grounded in several psychological and educational theories. Self-Determination Theory (SDT), as synthesized in contemporary literature, emphasizes that motivation arises when three basic psychological needs-autonomy, competence, and relatedness-are met (Ryan & Deci, 2017). Within virtual classrooms, these needs influence how learners choose to engage in discussions, respond to tasks, and maintain active presence. Howard et al. (2021) confirm through meta-analysis that students who perceive higher autonomy and competence exhibit stronger engagement and persistence across learning contexts.
Contemporary studies on online learning grounded in constructivist and inquiry-based pedagogy emphasize social interaction and collaboration as core conditions for deeper cognitive processing (Martin & Bolliger, 2018; Bergdahl et al., 2024). These frameworks collectively guide the pedagogical rationale for ENGAGIUM, which encourages active participation through interactive tracking and feedback mechanisms that recognize all student contributions.
Talosa et al. (2025) add that teacher self-efficacy and blended delivery competence significantly determine engagement outcomes in higher education. This reinforces the need for digital tools that support both instructors and learners in maintaining interaction and motivation throughout hybrid modes of instruction.

##### Online Participation and Engagement
Recent international literature underlines participation as a central indicator of learning quality in digital classrooms. Oshodi (2024) assessed participation metrics in e-classrooms and reported that consistent instructor feedback and visible acknowledgment of student input directly increase attendance and engagement. Prasetyanto, Rizki, and Sunitiyoso (2022) examined post-pandemic online participation intentions among Indonesian students and found that convenience and perceived teacher responsiveness drive continued willingness to attend online classes.
Samnidze et al. (2023) identified technical readiness, social comfort, and instructor presence as the strongest determinants of active online participation. Bergdahl, Nouri, and Fors (2024) analyzed higher education engagement using learning analytics and noted that engagement is multidimensional-encompassing cognitive focus, behavioral participation, and emotional investment. Their findings emphasize that systematic tracking of participation data can reveal patterns that traditional manual observation may overlook.
Wongthong (2024) confirmed that synchronous platforms affect both student and parent perceptions of learning satisfaction, indicating that class participation is not just an academic metric but also a measure of institutional credibility and teaching quality.

##### Challenges in Monitoring Online Participation
Despite the pedagogical benefits of engagement, researchers highlight persistent barriers to accurately monitoring it in virtual environments. Donelan et al. (2025) noted that many students remain passive in synchronous sessions because of anxiety, unstable internet, or lack of opportunities to contribute. Simon et al. (2025) similarly reported that teachers face challenges in applying consistent criteria when evaluating participation across online and offline modalities.
Hamad (2022) and Kabir and Mondal (2025) found that connectivity constraints, device access, and learner readiness continue to shape participation quality in online classes. These findings justify ENGAGIUM's automated design, which captures multiple forms of participation to mitigate subjectivity.

##### Technology-Supported Participation Tracking
Technological advancement has enabled new forms of participation analytics. Gan and Ouh (2023) presented a framework for integrating real-time participation tracking through digital tools, demonstrating that automation improves grading efficiency and fairness. Marquez et al. (2023) established that feedback frequency and data-driven participation scoring positively influence academic performance and student motivation.
Kaliisa et al. (2023) reviewed learning analytics dashboards and found that visualization tools enhance learners' self-awareness of participation but warned of potential data overload and interpretive bias. The VEMETER project (2025) introduced a participation evaluation tool capable of tracking and quantifying interaction frequency in virtual classes. Its results confirmed that automated participation metrics can increase teacher objectivity.
Further, Svabensky et al. (2024) assessed fairness concerns in model-based analytics and emphasized the need for transparent criteria. This supports ENGAGIUM's focus on clear participation records and visible metrics for instructors. Collectively, these systems provide proof that automated participation tracking and data visualization can transform how engagement is evaluated in online classrooms.

##### Fairness and Data Ethics in Educational Technology
Automation in participation tracking necessitates ethical safeguards. Svabensky et al. (2024) examined fairness risks in predictive educational models and underscored the need for transparent and explainable evaluation criteria. Funa and Gabay (2024) proposed policy guidelines for AI use in education, stressing data minimization, informed consent, and bias prevention.
In the context of privacy legislation, Foronda et al. (2023) analyzed the implementation of the Philippine Data Privacy Act of 2012 in organizational settings, outlining compliance challenges applicable to academic institutions. Miano (2025) found that many state universities in the Philippines lack standardized data privacy protocols, making ethical system design essential. These studies reinforce the principle that participation-tracking tools must collect only necessary data-a practice reflected in ENGAGIUM's scope.

#### 2. Local Literature

##### Post-Pandemic Engagement and Motivation in the Philippine Context
Filipino educators continue to face the challenge of sustaining student engagement after the shift to blended and flexible learning. Jopson et al. (2024) documented the lived experiences of college students adapting to hybrid instruction and found that engagement levels fluctuate depending on instructional mode and feedback visibility. Students often perceive online participation as undervalued compared to face-to-face interaction, underscoring the need for equitable digital participation assessment tools.
Ayog and Oliva (2023) studied writing competency and participation in Filipino classes, reporting that participation improved when students received structured recognition for their contributions. Their findings imply that digital participation trackers could reinforce participation by providing immediate acknowledgment.
In a complementary study, Aquino (2023) examined physical education participation in a state university and found that motivation depends on visibility of effort and instructor feedback-paralleling the same engagement mechanics needed in virtual settings. Together, these studies reveal that sustained engagement in Philippine higher education hinges on fairness, visibility, and feedback-three factors embedded in the ENGAGIUM system's design.

##### Learning Analytics and LMS-Based Engagement
Local initiatives on educational analytics provide further support for automating participation evaluation. Rogers, Mercado, and Decano (2024) used Moodle interaction data to study correlations between online activity and academic performance. They concluded that frequency of participation and diversity of interactions predict higher achievement, validating the premise of data-driven engagement analysis.
Similarly, Cruz, Bautista, and Ramos (2025) leveraged predictive analytics on learning management system (LMS) logs at Centro Escolar University and found that participation patterns, such as discussion post frequency and chat involvement, significantly affect academic outcomes. Their work demonstrates that Philippine institutions are beginning to use engagement data as an academic performance indicator-a concept that ENGAGIUM advances by shifting this process to real-time participation capture.

##### Data Ethics and Institutional Privacy Compliance
Responsible data management has become a major theme in Philippine educational technology. Foronda, Javier, Vigonte, and Abante (2023) reviewed the implementation of the Data Privacy Act of 2012 (RA 10173) in local organizations and highlighted weak enforcement of data minimization and consent protocols. Miano (2025) confirmed this trend in a study of a state university, where most staff lacked awareness of privacy standards in data handling.
Sancon (2023) proposed a model for institutional data governance that can serve as a template for academic technology projects. These local works collectively emphasize that educational systems must ensure compliance with privacy legislation-a requirement explicitly integrated into ENGAGIUM's security and compliance features as outlined in its software requirement specification.

##### Technology Acceptance and Faculty Readiness
Adoption of new classroom technology also depends on user acceptance. Porto (2025) found that organizational culture and faculty attitude strongly influence e-learning technology adoption. Quiban (2024) extended the Technology Acceptance Model (TAM) for LMS use in Philippine universities and concluded that perceived usefulness and ease of use directly affect adoption intent.
Alejandro, Sanchez, Sumalinog, Mananay, and Goles (2024) examined pre-service teachers' acceptance of AI applications in education and noted that trust and ethical awareness determine user willingness to engage with AI-assisted systems. Cervantes and Navarro (2025) confirmed similar findings among business students, stressing the need for transparency in algorithmic decisions.
These insights guide ENGAGIUM's user interface design and feature transparency-ensuring that professors perceive the system as both useful and ethically sound.

### B. Related Studies

#### 1. Foreign Studies

##### System Prototypes and Implementation Efforts
Several international prototypes have explored the automation of participation tracking in online learning. Gan and Ouh (2023) developed a system presented at the IEEE TALE Conference that automatically measures class participation through digital event logs and visual dashboards. Their findings demonstrated that technology-enhanced participation tracking improved fairness in grading and reduced instructor bias. Similarly, the VEMETER project (2025) introduced a virtual class participation evaluator capable of monitoring reaction frequency, speaking turns, and chat activity. Results confirmed that automated metrics could reflect true engagement levels more accurately than manual observation.
Marquez, Lazcano, Bada, and Arroyo-Barriguete (2023) investigated how systematic feedback and participation monitoring affect academic performance. They observed a direct positive relationship between recorded participation data and students' sense of inclusion, suggesting that visibility of contributions enhances motivation. These studies validate the practicality of systems like ENGAGIUM, which combine real-time detection and structured visualization of participation data for educational decision-making.

##### Learning Analytics Applications
The role of learning analytics has expanded from simple reporting to deeper analysis of participation patterns. Kaliisa, Misiejuk, Lopez-Pernas, Khalil, and Saqr (2024) evaluated the effectiveness of learning analytics dashboards on students' motivation and self-regulation. Their review found that dashboards can improve participation awareness but may overwhelm users if not properly designed. This highlights the importance of clarity and usability-two priorities of ENGAGIUM's interface.
Bergdahl, Nouri, and Fors (2024) noted that analytics can uncover hidden engagement patterns that instructors may miss during manual observation. Svabensky et al. (2024) stressed the importance of explainable and fair analytics to prevent unfair evaluation. These findings underscore ENGAGIUM's commitment to transparent participation reporting.

##### AI and Bias Evaluation
As analytics tools increasingly support educational decision-making, ethical considerations emerge. Loureiro, Bettencourt, Raposo-Rivas, and Ocana (2022) analyzed participation visualization tools and argued that student data must be contextualized rather than used for surveillance. Funa (2025) expanded this perspective by outlining policy recommendations for AI in education, including bias mitigation and privacy protection mechanisms. Both studies underline that ethical governance should be integrated into software design-a guideline observed in ENGAGIUM's focus on limited data collection and transparent participation records.
These foreign studies collectively provide the technological and ethical foundations of ENGAGIUM's proposed system. They prove that automation and analytics can meaningfully quantify participation without compromising fairness or privacy when properly implemented.

#### 2. Local Studies

##### Real-Time Participation Analytics in Philippine Higher Education
Empirical research in Philippine higher education demonstrates growing readiness for real-time participation analytics. Rogers, Mercado, and Decano (2024) examined Moodle interaction logs and reported that frequency and diversity of participation predict better course outcomes. Their findings confirm that engagement data, when systematically collected, carry significant academic value. Similarly, Cruz et al. (2025) used predictive analytics on LMS datasets at a Philippine university and found that discussion and chat activities strongly correlate with final grades. These studies show that automatically captured participation data can function as valid indicators of student engagement and performance-core to the participation model that ENGAGIUM seeks to implement.
Beyond correlation, these works highlight the emerging research culture around participation data as a pedagogical resource. The integration of LMS analytics into course evaluation reflects a growing shift toward evidence-based teaching and automated performance tracking in local institutions. ENGAGIUM builds upon these empirical efforts by capturing real-time participation signals from synchronous platforms and converting them into transparent, instructor-accessible engagement metrics.

##### Human-Centered Dashboard Design
Design-oriented studies in the Philippines emphasize usability and participatory development of learning analytics tools. Revano and Garcia (2021) from FEU Institute of Technology created a human-centered analytics dashboard for higher education using participatory design principles. They reported higher faculty acceptance when dashboards prioritized clarity, visual simplicity, and actionable summaries. This demonstrates that usability and interpretability are crucial for adoption among instructors.
The study's findings directly inform ENGAGIUM's interface design, which aims to balance analytic depth with simplicity. By offering intuitive visualization and configurable reporting, ENGAGIUM aligns with the participatory design ethos proven effective in local contexts.

##### Technology Acceptance and Predictive Systems
Local research also underscores the role of perceived usefulness and institutional culture in technology adoption. Quiban (2024) and Porto (2025) extended the Technology Acceptance Model (TAM) to local higher education institutions and found that ease of use, perceived utility, and supportive culture drive adoption. Alejandro et al. (2024) and Cervantes & Navarro (2025) further identified trust and ethical transparency as determinants of willingness to adopt AI-enhanced learning tools.
These insights complement empirical analytics studies by Rogers et al. (2024) and Cruz et al. (2025), whose models link online engagement with performance. Together, they show that analytics systems succeed when they are reliable, practical, and ethically transparent-principles central to ENGAGIUM's faculty workflow and reporting framework.

##### Data Privacy and System Governance
Data governance remains a recurring concern in Philippine educational technology. Foronda et al. (2023) reviewed implementation of the Data Privacy Act (RA 10173) and found weak institutional practices in consent and data minimization. Miano (2025) confirmed low awareness of privacy standards among staff in state universities, while Sancon (2023) proposed a governance model emphasizing transparency and role-based control.
These studies collectively justify ENGAGIUM's privacy-centric architecture, which limits collection to event metadata, requires informed consent, and enforces access restrictions based on user role. By embedding privacy by design, ENGAGIUM operationalizes local data protection requirements within its system specification.

### C. Synthesis of the Literature and Studies
Across both foreign and local literature, three recurring research gaps emerge. First, there remains an absence of localized, real-time participation tracking systems that can integrate directly with synchronous learning platforms such as Zoom or Google Meet. While several international prototypes have demonstrated the feasibility of automated engagement analytics, Philippine studies have so far relied mainly on retrospective LMS logs. This limits their capacity to capture live, multimodal participation events that occur during online classes.
Second, there is limited empirical evaluation of fairness, transparency, and usability in existing automated engagement tools. Many studies acknowledge the promise of analytics dashboards but stop short of assessing how these tools affect perception of equity in participation grading or instructor decision-making. Ethical issues surrounding bias, interpretability, and informed consent remain underexplored, particularly in local higher education contexts where data privacy compliance is still inconsistent.
Third, the linkage between educational data mining and classroom-level analytics is insufficient. Although institutional databases and LMS records provide rich information, few systems in Philippine higher education connect these data streams to real-time classroom engagement or instructor-facing dashboards. As a result, participation metrics often remain fragmented, delaying feedback and reducing their pedagogical usefulness.
ENGAGIUM addresses these gaps through three practical design commitments. It integrates automation by capturing live participation through a Google Meet extension and a Zoom integration pathway, reducing additional instructor workload. It supports fairer participation assessment through clear records and simplified professor-facing dashboards. Finally, it follows privacy-compliant handling under RA 10173 through data minimization, consent-based collection, and role-based access control. Together, these features position ENGAGIUM as a localized, ethical, and practical solution for participation tracking in Philippine higher education.

## References

Alejandro, I. M. V., Sanchez, J. M. P., Sumalinog, G. G., Mananay, J. A., Goles, C. E., & Fernandez, C. B. (2024). Pre-service teachers' technology acceptance of artificial intelligence (AI) applications in education. *STEM Education, 4*(4), 445-465. https://doi.org/10.3934/steme.2024024

Aquino, J. M. D. (2023). Assessing the role of recreational activities in physical education participation of college students in one state university in Laguna Philippines. *International Journal of Multidisciplinary Sciences, 1*(2), 190-204. https://doi.org/10.37329/ijms.v1i2.2506

Ayog, J. T., & Oliva, E. R. A. (2023). Writing competency and student participation in Filipino class: The mediating effect of reading strategy. *Asian Journal of Education and Social Studies, 49*(4), 84-94. https://doi.org/10.9734/ajess/2023/v49i41190

Bergdahl, N., Bond, M., Sjoberg, J., Dougherty, M., & Oxley, E. (2024). Unpacking student engagement in higher education learning analytics: A systematic review. *International Journal of Educational Technology in Higher Education, 21*(1). https://doi.org/10.1186/s41239-024-00493-y

Cervantes, J., & Navarro, E. (2025). Business students' perceptions of AI in higher education: An analysis using the Technology Acceptance Model. *Journal of Interdisciplinary Perspectives, 3*(6). https://doi.org/10.69569/jip.2025.194

Cruz, J. H., Florentino, M. C. A., Lacatan, L. L., & Peralta, R. L. (2025). Leveraging predictive analytics on LMS logs to examine the impact of engagement on academic performance among college students enrolled in Centro Escolar University. *International Journal of Research and Scientific Innovation, 12*(1), 563-573. https://doi.org/10.51244/ijrsi.2025.12010051

Donelan, H., Kear, K., Rosewell, J., Okada, A., Sheehy, K., Amor, K., Edwards, C., Mooney, A., Cuffe, P., & Elder, T. (2025). Synchronous online learning: Why some students don't actively participate. *Online Learning, 29*(3). https://doi.org/10.24059/olj.v29i3.4641

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO)-IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Funa, A. A., & Gabay, R. A. E. (2024). Policy guidelines and recommendations on AI use in teaching and learning: A meta-synthesis study. *Social Sciences & Humanities Open, 11*, 101221. https://doi.org/10.1016/j.ssaho.2024.101221

Gan, B., & Ouh, E. L. (2023). Class participation: Using technology to enhance efficiency and fairness. *IEEE TALE 2023*, 1-8. https://doi.org/10.1109/TALE56641.2023.10398380

Hamad, W. (2022). Understanding the foremost challenges in the transition to online teaching and learning during COVID-19 pandemic: A systematic literature review. *Journal of Educational Technology and Online Learning, 5*(2), 393-410. https://doi.org/10.31681/jetol.1055695

Howard, J. L., Bureau, J. S., Guay, F., Chong, J. X. Y., & Ryan, R. M. (2021). Student motivation and associated outcomes: A meta-analysis from Self-Determination Theory. *Perspectives on Psychological Science, 16*(6), 1300-1323. https://doi.org/10.1177/1745691620966789

Jopson, A. A. E., et al. (2024). The lived experiences of college students in adapting the blended learning. *BAHANDIAN, Institutional Repository of Central Philippine University*. https://hdl.handle.net/20.500.12852/3309

Kabir, R., & Mondal, M. S. H. (2025). Perceived benefits or barriers? The online learning experience of Bangladeshi undergraduate students. *Malaysian Online Journal of Educational Sciences, 13*(2), 53-63. https://doi.org/10.22452/mojes.vol13no2.5

Kaliisa, R., Misiejuk, K., Lopez-Pernas, S., Khalil, M., & Saqr, M. (2023). Have learning analytics dashboards lived up to the hype? A systematic review of impact on students' achievement, motivation, participation and attitude. *arXiv*. https://doi.org/10.48550/arxiv.2312.15042

Marquez, J., Lazcano, L., Bada, C., & Arroyo-Barriguete, J. L. (2023). Class participation and feedback as enablers of student academic performance. *SAGE Open, 13*(2). https://doi.org/10.1177/21582440231177298

Martin, F., & Bolliger, D. U. (2018). Engagement matters: Student perceptions on the importance of engagement strategies in the online learning environment. *Online Learning, 22*(1). https://doi.org/10.24059/olj.v22i1.1092

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Oshodi, O. (2024). Assessment of students' attendance, participation and classroom involvement in e-classroom. *International Conference on Education Research, 1*(1), 442-448. https://doi.org/10.34190/icer.1.1.3192

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Prasetyanto, D., Rizki, M., & Sunitiyoso, Y. (2022). Online learning participation intention after COVID-19 pandemic in Indonesia: Do students still make trips for online class? *Sustainability, 14*(4), 1982. https://doi.org/10.3390/su14041982

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)*, 1-5. https://doi.org/10.1109/HNICEM54116.2021.9731917

Rogers, J. K. B., Mercado, T. C. R., & Decano, R. S. (2024). Moodle interactions and academic performance: Educational data mining in a Philippine university. *Journal of Education and Learning (EduLearn), 19*(1), 542-550. https://doi.org/10.11591/edulearn.v19i1.21549

Ryan, R. M., & Deci, E. L. (2017). *Self-determination theory: Basic psychological needs in motivation, development, and wellness*. The Guilford Press. https://doi.org/10.1521/978.14625/28806

Samnidze, N., Didmanidze, I., Diasamidze, M., Akhvlediani, D., & Kirvalidze, N. (2023). Critical factors influencing classroom participation in online learning. *Platforms, 1*(1), 26-33. https://doi.org/10.3390/platforms1010004

Sancon, R. J. S. (2023). Data privacy best practices of a local higher educational institution: A model for governance. *International Multidisciplinary Research Journal*. https://doi.org/10.54476/ioer-imrj/688585

Simon, P. D., Jiang, J., & Fryer, L. K. (2025). Assessment of class participation in online and offline learning environments: A qualitative investigation of teachers' best practices and challenges. *Higher Education Research & Development, 44*(5), 1191-1208. https://doi.org/10.1080/07294360.2025.2462024

Svabensky, V., Verger, M., Rodrigo, M. M. T., Monterozo, C. J. G., Baker, R. S., Saavedra, M. Z. N. L., Lalle, S., & Shimada, A. (2024). Evaluating algorithmic bias in models for predicting academic performance of Filipino students. *arXiv*. https://doi.org/10.48550/arxiv.2405.09821

Talosa, A. D., Acidera, R. A., Tamanu, M. J. M., & Sumer, J. J. M. (2025). Knowledge, self-efficacy and effectiveness in leveraging blended delivery system: A study of higher education teachers. *International Journal of Instruction, 18*(2), 709-726. https://doi.org/10.29333/iji.2025.18238a

VEMETER. (2025). A tool for evaluating participation levels in virtual class sessions. *IEEE EDUCON Conference Proceedings*. https://doi.org/10.1109/EDUCON62633.2025.11016534

Wongthong, P. (n.d.). Influence of synchronous online learning on students' and parents' perceptions: A case study of a demonstration school. https://eric.ed.gov/?q=source%3a%22Journal+of+Educators+Online%22&ff1=eduGrade+4&id=EJ1462234
---
## Source: chapter3.md
# CHAPTER III

## METHODS OF RESEARCH AND PROCEDURES

---

## 3.1 Research Methodology

### 3.1.1 Type of Research

This study employed a **quantitative-descriptive research methodology**. The quantitative component focused on measuring faculty perceptions through structured survey responses, while the descriptive component focused on presenting the current conditions of participation tracking in synchronous online classes, including the challenges encountered in monitoring different forms of student engagement (Creswell & Creswell, 2018).

This approach enabled the systematic description of the instructional problem using measurable indicators and the evaluation of user perceptions of the proposed solution within an educational context.

---

### 3.1.2 Pre-Production and Post-Production Survey Phases

The methodology was implemented through two structured survey phases aligned with the objectives of the study.

The **pre-production survey** served as a requirements-gathering instrument to establish baseline data on current participation-tracking practices, perceived limitations of manual monitoring, technology acceptance, usability expectations, and ethical considerations.

The **post-production survey** functioned as an outcome-evaluation instrument administered after exposure to the developed prototype. It assessed user experience in terms of usability, perceived effectiveness, reliability, and intention to adopt the system.

---

### 3.1.3 Methodological Rationale

The use of a two-phase survey design ensured that the study remained **evidence-based throughout its progression**, from problem validation to post-production evaluation. This structure ensured alignment between the needs identified during pre-production and the evaluative criteria applied during post-production.

---

## 3.2 Research Design

### 3.2.1 Sequential Survey Design

The study adopted a **sequential two-phase survey design**, structured within a quantitative-descriptive methodology. Data collection was conducted in two stages (Fink, 2017):
(1) identification and validation of the instructional problem, and
(2) evaluation of the developed intervention.

This design ensured that the system was both **grounded in actual faculty needs** and **assessed using relevant usability and performance indicators**.

---

### 3.2.2 Pre-Production Survey Focus

During the pre-production phase, faculty respondents provided data regarding their current practices in monitoring participation in online and blended classes. The survey included variables related to respondent profile, participation-monitoring challenges, acceptance-related perceptions, usability expectations, and data privacy concerns.

The findings from this phase were used to guide the refinement of study priorities and the development focus of the proposed system.

---

### 3.2.3 Post-Production Survey Focus

During the post-production phase, faculty respondents who completed prototype exposure criteria evaluated the developed prototype after sufficient exposure. The evaluation included standardized usability measurement through the System Usability Scale (SUS), along with additional indicators such as perceived effectiveness, system reliability, interface clarity, report interpretability, and overall satisfaction.

Open-ended responses were also collected to capture detailed feedback and suggestions for improvement.

---

### 3.2.4 Conceptual Considerations

The research design was guided by established perspectives in educational technology, particularly the view that **perceived usefulness and perceived ease of use influence technology adoption** (Quiban, 2024; Porto, 2025). These concepts informed the interpretation of faculty responses, especially in evaluating acceptance and usability, without introducing technical system-level discussion into the chapter.

---

### 3.2.5 Variables of the Study

The study measured the following variables across the two survey phases:

Pre-Production Variables:

* Participation-tracking challenges
* Perceived usefulness
* Perceived ease of use
* Behavioral intention to use
* Usability expectations
* Data privacy concerns

Post-Production Variables:

* System usability (SUS score)
* Perceived effectiveness
* System reliability
* Interface clarity
* Report usability
* User satisfaction
* Adoption intention

---

## 3.3 Research Locale

The study was conducted at **St. Clare College of Caloocan**, where faculty members implement a blended learning approach combining synchronous online sessions and face-to-face instruction. The institution’s reliance on online platforms for synchronous classes provided an appropriate context for examining participation-tracking challenges and evaluating the proposed system.

---

## 3.4 Target Respondents

The respondents of the study consisted of **faculty members of St. Clare College of Caloocan** who have experience conducting synchronous online classes using digital platforms.

These respondents were selected because they are directly involved in monitoring student participation and are therefore capable of providing relevant insights regarding both the existing challenges and the usability of the proposed system.

---

## 3.5 Sampling Technique

The study employed **purposive sampling**, wherein participants were selected based on specific criteria relevant to the research objectives (Etikan, Musa, & Alkassim, 2016).

The criteria included:

* Active involvement in synchronous online teaching
* Experience in assessing student participation
* Willingness to participate in both survey phases

This sampling approach ensured that respondents possessed the necessary experience to provide meaningful and contextually valid data.

---

## 3.6 Data Sources

The study utilized **primary data sources** collected through structured survey instruments.

These included:

* Responses from the pre-production survey, which provided baseline data on participation-tracking practices, challenges, and expectations
* Responses from the post-production survey, which evaluated the usability and effectiveness of the developed system
* Qualitative feedback obtained from open-ended survey items

For data handling, any contact details collected for follow-up communication in the pre-production phase were optional and stored separately from survey rating data to preserve confidentiality during analysis.

These data sources formed the basis for both quantitative and qualitative analysis.

---

## 3.7 Research Instruments

### 3.7.1 Pre-Production Survey Instrument

The pre-production survey was designed to gather baseline information relevant to the study. It consisted of structured sections including respondent profile, problem validation, technology acceptance, usability expectations, and data privacy considerations.

The instrument utilized a **five-point Likert scale** to measure levels of agreement, along with open-ended questions to capture additional insights (Fink, 2017).

---

### 3.7.2 Post-Production Survey Instrument

The post-production survey was developed to evaluate the system after prototype exposure. It included structured items assessing perceived effectiveness, system performance, interface clarity, report usability, and overall satisfaction.

Open-ended questions were included to identify user experiences, encountered issues, and suggested improvements.

---

### 3.7.3 System Usability Scale (SUS)

The **System Usability Scale (SUS)** was used as a structured instrument for measuring perceived system usability in post-production evaluation, consistent with common usability assessment practice in educational technology studies (Revano & Garcia, 2021). It consists of a ten-item questionnaire with alternating positive and negative statements rated on a five-point scale.

SUS scores were computed and transformed into a scale from 0 to 100, providing a reliable measure of overall usability. These scores were interpreted using established usability benchmarks and qualitative descriptors.

---

## 3.8 Data Gathering

Data gathering was conducted in two major phases using structured survey instruments and standardized procedures.

During the **pre-production phase**, the survey was administered to eligible faculty respondents following institutional coordination. Respondents were provided with an informed consent statement detailing the purpose of the study, voluntary participation, confidentiality, and data handling procedures. Only those who consented proceeded with the survey.

During the **post-production phase**, respondents who were exposed to the developed prototype completed the evaluation survey. Respondents were given sufficient time to interact with the system prior to evaluation to ensure informed responses.

---

## 3.9 Statistical Treatment

### 3.9.1 Quantitative Analysis

Descriptive statistical methods were used to analyze quantitative data (Fink, 2017).

* **Frequency counts and percentages** were used for categorical data such as respondent profiles
* **Weighted means** were computed for non-SUS Likert-scale responses to determine the overall level of agreement across measured constructs

For the post-production phase, weighted means were used to summarize researcher-made Likert constructs related to system effectiveness, performance, interface evaluation, and satisfaction.

---

### 3.9.2 SUS Scoring and Interpretation

SUS responses were scored using the standard Brooke computation method and converted into a 0-100 scale. The resulting scores were interpreted using established usability categories to determine the overall acceptability of the system.

---

### 3.9.3 Qualitative Analysis

Responses from open-ended questions were analyzed using **thematic grouping** to identify recurring patterns, concerns, and suggestions. This served as a supplementary interpretive layer to support the primary quantitative-descriptive findings.

---

### 3.9.4 Comparative Interpretation of Findings

Findings from the pre-production and post-production phases were comparatively analyzed to determine whether the concerns identified during the initial phase were addressed by the developed system. This comparison served as the basis for conclusions and recommendations.

---

## 3.10 Ethical Considerations

The study adhered to established ethical standards in data collection and research conduct.

Participation was **voluntary**, and respondents were informed of their right to withdraw at any time without consequence. Prior to participation, respondents were provided with a clear **informed consent statement** outlining the purpose of the study, data usage, and confidentiality measures.

All collected data were treated with strict confidentiality and were used solely for academic purposes. No personally identifiable information was disclosed in the reporting of results.

The study adhered to the provisions of the **Data Privacy Act of 2012**, ensuring that only necessary data were collected and that respondents were fully informed about how their data would be handled and protected (Foronda et al., 2023; Miano, 2025).

---

## References for Chapter III (2016-Present)

Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE.

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. *American Journal of Theoretical and Applied Statistics, 5*(1), 1-4. https://doi.org/10.11648/j.ajtas.20160501.11

Fink, A. (2017). *How to conduct surveys: A step-by-step guide* (6th ed.). SAGE.

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO) - IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the Extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. In *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)* (pp. 1-5). https://doi.org/10.1109/HNICEM54116.2021.9731917

---
## Source: chapter4.md
# CHAPTER IV
## SUMMARY OF FINDINGS, CONCLUSIONS AND RECOMMENDATIONS

---

## 4.1 Summary of Findings

### 4.1.1 Findings Relative to the Statement of the Problem

This study was guided by the general problem of how professors can fairly and consistently track participation during synchronous online classes conducted through Google Meet and Zoom. Based on the two-phase survey process and prototype evaluation, the findings indicate that ENGAGIUM addressed the core instructional need by providing structured, data-driven participation records and reducing dependence on purely manual observation.

Relative to the specific problems stated in Chapter I, the findings may be summarized as follows:

1. Faculty respondents confirmed persistent challenges in capturing participation across multiple channels during live sessions, particularly while simultaneously delivering instruction.
2. The developed system was able to operationalize participation recognition through event-based tracking categories and centralized logging for instructor review.
3. The dashboard and reporting views were perceived as useful for participation summaries and grading support, with respondents rating interface-related constructs positively.
4. The shift from manual observation to recorded participation logs improved perceived fairness and transparency of grading decisions.
5. Integration into existing workflow was feasible within the study context, with post-production respondents reporting actual use during live sessions.
6. Evaluation results showed generally positive usability and effectiveness outcomes, with identified areas for refinement concentrated on navigation clarity, real-time responsiveness, and reporting options.

### 4.1.2 Pre-Production Findings 

Pre-production results (N = 32) validated the instructional and operational burden of manual participation tracking. Problem Validation produced an overall mean of 3.29 (Moderate/Neutral), indicating that while not all indicators were equally severe, the aggregate pattern still reflected meaningful classroom management difficulty.

The highest-rated concerns were the time and effort required for manual recording (PV6, mean = 3.62), the need for a more structured and objective method (PV9, mean = 3.91), and the difficulty of maintaining consistent records across sessions (PV10, mean = 3.58). These findings establish that the issue is not merely technical convenience, but instructional consistency and grading credibility.

Technology acceptance indicators were uniformly high to very high: Perceived Usefulness (overall mean = 4.34), Perceived Ease of Use (4.31), Behavioral Intention (4.44), and Feasibility Constraints (4.10). Usability expectations were likewise strong, with Dashboard and Interface Expectations (4.46), Report Preferences (4.36), and Tracking Options (4.28) all in the Very High/Strongly Agree range. Data Privacy Expectations also showed high salience (overall mean = 4.36), especially for transparency, legal compliance, and consent procedures.

Open-ended pre-production responses reinforced these quantitative findings. Recurring themes included real-time monitoring burden, connectivity-related disruptions, and difficulty tracking participation in larger or multiple sections. Respondents also emphasized demand for live summaries, filterable reports, export options, and support for diverse participation modalities.

These findings indicate a clear instructional need for a more structured, transparent, and less burdensome participation-tracking approach.

### 4.1.3 Post-Production Findings 

Post-production findings (N = 13) indicate that ENGAGIUM was perceived as effective and usable in practical class contexts. Perceived Effectiveness reached an overall mean of 4.06 (High/Agree), with respondents indicating that the system improved participation tracking accuracy and reduced manual monitoring requirements.

System Performance and Reliability yielded an overall mean of 3.82 (High/Agree). While this confirms acceptable operational performance, the item means suggest room for improvement in real-time accuracy and event consistency under varying conditions. Interface and Dashboard Evaluation was rated positively (overall mean = 4.05), indicating that users generally understood summaries, charts, and navigation, but still observed opportunities for clearer visual cues and report interpretation.

Overall Satisfaction and Adoption produced an aggregate mean of 4.10 (High/Agree), with willingness to use the system in actual classes receiving one of the strongest endorsements (SAT2, mean = 4.23). The System Usability Scale (SUS) mean score was 72.88 (SD = 8.09), above the common benchmark of 68, indicating better-than-average usability and acceptable readiness for continued use with targeted refinements.

Post-production thematic feedback aligned with these ratings. Respondents most frequently appreciated reduced manual checking and better visibility of participation types, while the most common issues involved label clarity, navigation flow, occasional update delays, and requests for additional report export options.

These post-production findings suggest that ENGAGIUM was accepted as a practical response to the participation-tracking difficulties identified during the pre-production phase, while still leaving room for refinement in usability and responsiveness.

### 4.1.4 Comparative Analysis 

Comparative interpretation shows that the primary pre-production needs were substantially addressed by the developed system. In the pre-production phase, respondents expressed strong demand for objective tracking, integrated summaries, and reduced manual workload. In the post-production phase, these same dimensions were reflected in favorable effectiveness, interface, and satisfaction ratings.

The comparison also indicates that remaining concerns shifted in nature. Prior to development, concerns were centered on the absence of a reliable tracking mechanism and the burden of fragmented observation. After prototype use, concerns were more focused on optimization issues, such as interface cues, responsiveness in weaker connectivity contexts, and richer reporting controls. This pattern suggests that the study progressed from validating the need for automation to identifying practical improvements for broader implementation.

Overall, the two-phase design confirms alignment between identified needs and delivered outcomes: the system addressed core participation-tracking problems while generating actionable feedback for the next development cycle.

### 4.1.5 Ethical and Practical Considerations 

Findings from both phases indicate that ethical and practical considerations were central to faculty acceptance. Pre-production respondents strongly emphasized privacy compliance, transparent scoring logic, and informed data collection procedures. Post-production feedback further highlighted that trust in participation records depends not only on technical capture, but also on clarity of interpretation and consistency of reporting.

In this context, ENGAGIUM's approach of limiting collection to participation metadata and text-based interaction records aligns with the study's privacy commitments and the Data Privacy Act of 2012. No audio or video recording was required for the participation workflow evaluated in this study.

Practical constraints, however, remained evident. Internet stability, platform-side behavior changes, and interface interpretation issues can influence perceived reliability in real classroom use. These constraints do not negate system value, but they underscore the need for incremental hardening, clearer onboarding, and sustained governance practices as implementation scales.

### 4.1.6 Zoom Integration Limitations

Although the study framework included Google Meet and Zoom as target synchronous environments, implementation and evaluation depth were uneven across platforms. Post-production usage context showed universal Google Meet exposure among respondents, while Zoom exposure was partial and based on a multi-select item. This indicates that core evaluation evidence is strongest for Google Meet-centered usage scenarios within the current research setting.

Zoom-side implementation feasibility is affected by both technical and economic factors, including platform policy boundaries, account-level permissions, and potential development or maintenance costs associated with sustained integration support. As detailed in Appendix B (Section B.5, Zoom Bridge Architecture), the current Zoom Apps SDK pathway reliably supports joins/leaves, reactions, and hand-raise related events, but does not expose chat content, chat activity indicators, or real-time mic-state signals in the same manner as the Google Meet extension flow. As a result, Zoom integration in this phase should be interpreted as exploratory and constrained, rather than equivalent in maturity to Google Meet deployment.

This limitation is consistent with the study delimitations and should be considered when interpreting generalizability of findings across synchronous platforms.

---

## 4.2 Conclusions

### 4.2.1 Conclusions Relative to the General and Specific Objectives

The study concludes that ENGAGIUM met its general objective of designing, developing, and evaluating a participation-tracking system that supports fairer and more consistent monitoring in synchronous online classes. The results demonstrate that the system can capture meaningful participation indicators, present usable summaries for instructors, and reduce dependence on manual logging.

Relative to the specific objectives, the study concludes that:

1. Automated participation capture through extension-supported workflow was feasible in the target instructional context.
2. Instructor-facing dashboards and summaries were perceived as useful for class monitoring and participation-based grading.
3. Meeting-driven session use was practical for prototype exposure and post-production evaluation.
4. The use of recorded participation data improved perceived fairness and grading transparency.
5. The privacy-oriented data scope was consistent with the study's ethical requirements.
6. Evaluation outputs provided measurable evidence of usability and effectiveness, while identifying specific areas requiring refinement.

### 4.2.2 Conclusions on System Effectiveness and Adoption Readiness

ENGAGIUM demonstrated positive effectiveness and acceptable usability for early-stage institutional use. High post-production means across effectiveness, interface quality, and satisfaction, together with a SUS mean of 72.88, indicate that respondents generally considered the system practical and beneficial.

However, adoption readiness should be interpreted as conditional rather than final. The system appears suitable for controlled implementation and iterative expansion, provided that improvements are made in navigation clarity, reporting flexibility, and consistency of real-time updates under variable connectivity conditions.

Therefore, the system is best characterized as functionally viable and pedagogically valuable, with clear potential for wider deployment after targeted enhancement.

### 4.2.3 Conclusions on Study Scope and Limitations

The conclusions of this study are bounded by the defined scope, respondent profile, and implementation context. Findings are strongest for synchronous classes using Google Meet within the participating institutional setting. Zoom-related findings, while informative, remain limited in comparative depth and should not be treated as equivalent evidence of full cross-platform maturity.

This conclusion is also consistent with the architecture-level constraints documented in Appendix B (especially Sections B.5 and B.9), which describe the split integration model and the current Zoom bridge capability boundaries.

The post-production sample size and prototype-stage constraints also limit broad statistical generalization. Nevertheless, the convergence of quantitative ratings, SUS outcomes, and thematic responses supports the validity of the study's central claim: automated, privacy-aware participation tracking can improve fairness and instructional efficiency in synchronous online teaching.

---

## 4.3 Recommendations

### 4.3.1 For Institutional Implementation

For institutional use, a phased rollout is recommended. Initial deployment may prioritize departments with frequent synchronous classes and instructors already using participation-based grading. During this phase, institutions should establish clear implementation protocols for class setup, session closure, report use, and technical support escalation.

A structured orientation for faculty users is also recommended to standardize interpretation of participation metrics and prevent inconsistent grading practices across courses.

### 4.3.2 For System Improvement

System enhancement should prioritize the issues consistently identified in post-production feedback:

1. Improve dashboard label clarity, filter flow, and navigation cues for faster interpretation.
2. Strengthen real-time event synchronization, especially in low or unstable bandwidth contexts.
3. Expand reporting controls, including clearer report fields and additional export presets.
4. Add lightweight onboarding elements (guided walkthroughs, in-context hints, and quick-start references).
5. Enhance participant highlight and session-comparison views to support instructional decision-making.

These refinements should be validated through iterative usability testing before large-scale deployment.

### 4.3.3 For Policy, Ethics, and Data Governance

Institutions adopting ENGAGIUM should formalize governance mechanisms aligned with RA 10173. Recommended measures include written consent workflows, role-based access control, retention and deletion policies, and periodic privacy compliance review.

In addition, transparent communication of scoring logic and participation criteria should be embedded in faculty practice to sustain trust among instructors and students. Ethical use should emphasize support for instructional fairness rather than punitive surveillance.

### 4.3.4 For Zoom Integration Feasibility and Cost Constraints

Future Zoom integration work should begin with a dedicated feasibility track that separately evaluates technical compatibility, policy constraints, and total cost of ownership. A staged strategy is recommended:

This recommendation should be implemented alongside the technical baseline already documented in Appendix B (Section B.5), so planning decisions remain aligned with actual SDK capabilities and known capture gaps.

1. Conduct a platform capability audit and permissions mapping.
2. Define a minimum viable Zoom feature set equivalent to core Google Meet functions.
3. Estimate recurring costs for maintenance, updates, and compliance overhead.
4. Pilot with a small faculty cohort before institutional scaling.

This approach will help institutions avoid overcommitting resources before platform-level viability is fully established.

### 4.3.5 For Future Research

Future studies may extend this work through broader and more diverse samples, longer implementation windows, and cross-platform comparative evaluation. Recommended research directions include:

1. Longitudinal studies on whether participation analytics influence grading consistency and learner outcomes over multiple terms.
2. Comparative studies across different disciplines, class sizes, and instructional modalities.
3. Expanded reliability validation of post-production constructs with larger respondent pools.
4. Evaluation of onboarding interventions and interface redesign on adoption speed and user confidence.
5. Investigation of fairness perception from the student perspective alongside instructor assessments.

These directions can strengthen the evidence base for institutional policy, technical refinement, and sustainable deployment of participation-tracking systems in higher education.
---
## Source: bibliography.md
# Bibliography

Alejandro, I. M. V., Sanchez, J. M. P., Sumalinog, G. G., Mananay, J. A., Goles, C. E., & Fernandez, C. B. (2024). Pre-service teachers' technology acceptance of artificial intelligence (AI) applications in education. *STEM Education, 4*(4), 445-465. https://doi.org/10.3934/steme.2024024

Aquino, J. M. D. (2023). Assessing the role of recreational activities in physical education participation of college students in one state university in Laguna Philippines. *International Journal of Multidisciplinary Sciences, 1*(2), 190-204. https://doi.org/10.37329/ijms.v1i2.2506

Ayog, J. T., & Oliva, E. R. A. (2023). Writing competency and student participation in Filipino class: The mediating effect of reading strategy. *Asian Journal of Education and Social Studies, 49*(4), 84-94. https://doi.org/10.9734/ajess/2023/v49i41190

Bergdahl, N., Bond, M., Sjoberg, J., Dougherty, M., & Oxley, E. (2024). Unpacking student engagement in higher education learning analytics: A systematic review. *International Journal of Educational Technology in Higher Education, 21*(1). https://doi.org/10.1186/s41239-024-00493-y

Cervantes, J., & Navarro, E. (2025). Business students' perceptions of AI in higher education: An analysis using the Technology Acceptance Model. *Journal of Interdisciplinary Perspectives, 3*(6). https://doi.org/10.69569/jip.2025.194

Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE.

Cruz, J. H., Florentino, M. C. A., Lacatan, L. L., & Peralta, R. L. (2025). Leveraging predictive analytics on LMS logs to examine the impact of engagement on academic performance among college students enrolled in Centro Escolar University. *International Journal of Research and Scientific Innovation, 12*(1), 563-573. https://doi.org/10.51244/ijrsi.2025.12010051

Donelan, H., Kear, K., Rosewell, J., Okada, A., Sheehy, K., Amor, K., Edwards, C., Mooney, A., Cuffe, P., & Elder, T. (2025). Synchronous online learning: Why some students don't actively participate. *Online Learning, 29*(3). https://doi.org/10.24059/olj.v29i3.4641

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. *American Journal of Theoretical and Applied Statistics, 5*(1), 1-4. https://doi.org/10.11648/j.ajtas.20160501.11

Fink, A. (2017). *How to conduct surveys: A step-by-step guide* (6th ed.). SAGE.

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO)-IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Fu, P., Gao, C., Chen, X., Zhang, Z., Chen, J., & Yang, D. (2024). Proactive personality and its impact on online learning engagement through positive emotions and learning motivation. *Scientific Reports, 14*(1), 28144. https://doi.org/10.1038/s41598-024-79776-3

Funa, A. A., & Gabay, R. A. E. (2024). Policy guidelines and recommendations on AI use in teaching and learning: A meta-synthesis study. *Social Sciences & Humanities Open, 11*, 101221. https://doi.org/10.1016/j.ssaho.2024.101221

Gan, B., & Ouh, E. L. (2023). Class participation: Using technology to enhance efficiency and fairness. *IEEE TALE 2023*, 1-8. https://doi.org/10.1109/TALE56641.2023.10398380

Garrison, D. R., Anderson, T., & Archer, W. (2000). Critical inquiry in a text-based environment: Computer conferencing in higher education. *The Internet and Higher Education, 2*(2-3), 87-105. https://doi.org/10.1016/S1096-7516(00)00016-6

Hamad, W. (2022). Understanding the foremost challenges in the transition to online teaching and learning during COVID-19 pandemic: A systematic literature review. *Journal of Educational Technology and Online Learning, 5*(2), 393-410. https://doi.org/10.31681/jetol.1055695

Howard, J. L., Bureau, J. S., Guay, F., Chong, J. X. Y., & Ryan, R. M. (2021). Student motivation and associated outcomes: A meta-analysis from Self-Determination Theory. *Perspectives on Psychological Science, 16*(6), 1300-1323. https://doi.org/10.1177/1745691620966789

Jopson, A. A. E., et al. (2024). The lived experiences of college students in adapting the blended learning. *BAHANDIAN, Institutional Repository of Central Philippine University*. https://hdl.handle.net/20.500.12852/3309

Kabir, R., & Mondal, M. S. H. (2025). Perceived benefits or barriers? The online learning experience of Bangladeshi undergraduate students. *Malaysian Online Journal of Educational Sciences, 13*(2), 53-63. https://doi.org/10.22452/mojes.vol13no2.5

Kaliisa, R., Misiejuk, K., Lopez-Pernas, S., Khalil, M., & Saqr, M. (2023). Have learning analytics dashboards lived up to the hype? A systematic review of impact on students' achievement, motivation, participation and attitude. *arXiv*. https://doi.org/10.48550/arxiv.2312.15042

Karmini, N. W., Yudabakti, I. M., Seniwati, D. N., Makulua, K., & Burnama, N. (2024). The effect of student participation through the use of online learning platforms in improving student learning outcomes. *International Journal of Language and Ubiquitous Learning, 2*(1). https://doi.org/10.70177/ijlul.v2i1.752

Marquez, J., Lazcano, L., Bada, C., & Arroyo-Barriguete, J. L. (2023). Class participation and feedback as enablers of student academic performance. *SAGE Open, 13*(2). https://doi.org/10.1177/21582440231177298

Martin, F., & Bolliger, D. U. (2018). Engagement matters: Student perceptions on the importance of engagement strategies in the online learning environment. *Online Learning, 22*(1). https://doi.org/10.24059/olj.v22i1.1092

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Oshodi, O. (2024). Assessment of students' attendance, participation and classroom involvement in e-classroom. *International Conference on Education Research, 1*(1), 442-448. https://doi.org/10.34190/icer.1.1.3192

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Prasetyanto, D., Rizki, M., & Sunitiyoso, Y. (2022). Online learning participation intention after COVID-19 pandemic in Indonesia: Do students still make trips for online class? *Sustainability, 14*(4), 1982. https://doi.org/10.3390/su14041982

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. In *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)* (pp. 1-5). https://doi.org/10.1109/HNICEM54116.2021.9731917

Rogers, J. K. B., Mercado, T. C. R., & Decano, R. S. (2024). Moodle interactions and academic performance: Educational data mining in a Philippine university. *Journal of Education and Learning (EduLearn), 19*(1), 542-550. https://doi.org/10.11591/edulearn.v19i1.21549

Ryan, R. M., & Deci, E. L. (2017). *Self-determination theory: Basic psychological needs in motivation, development, and wellness*. The Guilford Press. https://doi.org/10.1521/978.14625/28806

Samnidze, N., Didmanidze, I., Diasamidze, M., Akhvlediani, D., & Kirvalidze, N. (2023). Critical factors influencing classroom participation in online learning. *Platforms, 1*(1), 26-33. https://doi.org/10.3390/platforms1010004

Sancon, R. J. S. (2023). Data privacy best practices of a local higher educational institution: A model for governance. *International Multidisciplinary Research Journal*. https://doi.org/10.54476/ioer-imrj/688585

Simon, P. D., Jiang, J., & Fryer, L. K. (2025). Assessment of class participation in online and offline learning environments: A qualitative investigation of teachers' best practices and challenges. *Higher Education Research & Development, 44*(5), 1191-1208. https://doi.org/10.1080/07294360.2025.2462024

Svabensky, V., Verger, M., Rodrigo, M. M. T., Monterozo, C. J. G., Baker, R. S., Saavedra, M. Z. N. L., Lalle, S., & Shimada, A. (2024). Evaluating algorithmic bias in models for predicting academic performance of Filipino students. *arXiv*. https://doi.org/10.48550/arxiv.2405.09821

Talosa, A. D., Acidera, R. A., Tamanu, M. J. M., & Sumer, J. J. M. (2025). Knowledge, self-efficacy and effectiveness in leveraging blended delivery system: A study of higher education teachers. *International Journal of Instruction, 18*(2), 709-726. https://doi.org/10.29333/iji.2025.18238a

VEMETER. (2025). A tool for evaluating participation levels in virtual class sessions. *IEEE EDUCON Conference Proceedings*. https://doi.org/10.1109/EDUCON62633.2025.11016534

Vygotsky, L. S. (1978). *Mind in society: The development of higher psychological processes*. Harvard University Press.

Wongthong, P. (n.d.). Influence of synchronous online learning on students' and parents' perceptions: A case study of a demonstration school. https://eric.ed.gov/?q=source%3a%22Journal+of+Educators+Online%22&ff1=eduGrade+4&id=EJ1462234

---
## Source: chapter3.md
# CHAPTER III

## METHODS OF RESEARCH AND PROCEDURES

---

## 3.1 Research Methodology

### 3.1.1 Type of Research

This study employed a **quantitative-descriptive research methodology**. The quantitative component focused on measuring faculty perceptions through structured survey responses, while the descriptive component focused on presenting the current conditions of participation tracking in synchronous online classes, including the challenges encountered in monitoring different forms of student engagement (Creswell & Creswell, 2018).

This approach enabled the systematic description of the instructional problem using measurable indicators and the evaluation of user perceptions of the proposed solution within an educational context.

---

### 3.1.2 Pre-Production and Post-Production Survey Phases

The methodology was implemented through two structured survey phases aligned with the objectives of the study.

The **pre-production survey** served as a requirements-gathering instrument to establish baseline data on current participation-tracking practices, perceived limitations of manual monitoring, technology acceptance, usability expectations, and ethical considerations.

The **post-production survey** functioned as an outcome-evaluation instrument administered after exposure to the developed prototype. It assessed user experience in terms of usability, perceived effectiveness, reliability, and intention to adopt the system.

---

### 3.1.3 Methodological Rationale

The use of a two-phase survey design ensured that the study remained **evidence-based throughout its progression**, from problem validation to post-production evaluation. This structure ensured alignment between the needs identified during pre-production and the evaluative criteria applied during post-production.

---

## 3.2 Research Design

### 3.2.1 Sequential Survey Design

The study adopted a **sequential two-phase survey design**, structured within a quantitative-descriptive methodology. Data collection was conducted in two stages (Fink, 2017):
(1) identification and validation of the instructional problem, and
(2) evaluation of the developed intervention.

This design ensured that the system was both **grounded in actual faculty needs** and **assessed using relevant usability and performance indicators**.

---

### 3.2.2 Pre-Production Survey Focus

During the pre-production phase, faculty respondents provided data regarding their current practices in monitoring participation in online and blended classes. The survey included variables related to respondent profile, participation-monitoring challenges, acceptance-related perceptions, usability expectations, and data privacy concerns.

The findings from this phase were used to guide the refinement of study priorities and the development focus of the proposed system.

---

### 3.2.3 Post-Production Survey Focus

During the post-production phase, faculty respondents who completed prototype exposure criteria evaluated the developed prototype after sufficient exposure. The evaluation included standardized usability measurement through the System Usability Scale (SUS), along with additional indicators such as perceived effectiveness, system reliability, interface clarity, report interpretability, and overall satisfaction.

Open-ended responses were also collected to capture detailed feedback and suggestions for improvement.

---

### 3.2.4 Conceptual Considerations

The research design was guided by established perspectives in educational technology, particularly the view that **perceived usefulness and perceived ease of use influence technology adoption** (Quiban, 2024; Porto, 2025). These concepts informed the interpretation of faculty responses, especially in evaluating acceptance and usability, without introducing technical system-level discussion into the chapter.

---

### 3.2.5 Variables of the Study

The study measured the following variables across the two survey phases:

Pre-Production Variables:

* Participation-tracking challenges
* Perceived usefulness
* Perceived ease of use
* Behavioral intention to use
* Usability expectations
* Data privacy concerns

Post-Production Variables:

* System usability (SUS score)
* Perceived effectiveness
* System reliability
* Interface clarity
* Report usability
* User satisfaction
* Adoption intention

---

## 3.3 Research Locale

The study was conducted at **St. Clare College of Caloocan**, where faculty members implement a blended learning approach combining synchronous online sessions and face-to-face instruction. The institution’s reliance on online platforms for synchronous classes provided an appropriate context for examining participation-tracking challenges and evaluating the proposed system.

---

## 3.4 Target Respondents

The respondents of the study consisted of **faculty members of St. Clare College of Caloocan** who have experience conducting synchronous online classes using digital platforms.

These respondents were selected because they are directly involved in monitoring student participation and are therefore capable of providing relevant insights regarding both the existing challenges and the usability of the proposed system.

---

## 3.5 Sampling Technique

The study employed **purposive sampling**, wherein participants were selected based on specific criteria relevant to the research objectives (Etikan, Musa, & Alkassim, 2016).

The criteria included:

* Active involvement in synchronous online teaching
* Experience in assessing student participation
* Willingness to participate in both survey phases

This sampling approach ensured that respondents possessed the necessary experience to provide meaningful and contextually valid data.

---

## 3.6 Data Sources

The study utilized **primary data sources** collected through structured survey instruments.

These included:

* Responses from the pre-production survey, which provided baseline data on participation-tracking practices, challenges, and expectations
* Responses from the post-production survey, which evaluated the usability and effectiveness of the developed system
* Qualitative feedback obtained from open-ended survey items

For data handling, any contact details collected for follow-up communication in the pre-production phase were optional and stored separately from survey rating data to preserve confidentiality during analysis.

These data sources formed the basis for both quantitative and qualitative analysis.

---

## 3.7 Research Instruments

### 3.7.1 Pre-Production Survey Instrument

The pre-production survey was designed to gather baseline information relevant to the study. It consisted of structured sections including respondent profile, problem validation, technology acceptance, usability expectations, and data privacy considerations.

The instrument utilized a **five-point Likert scale** to measure levels of agreement, along with open-ended questions to capture additional insights (Fink, 2017).

---

### 3.7.2 Post-Production Survey Instrument

The post-production survey was developed to evaluate the system after prototype exposure. It included structured items assessing perceived effectiveness, system performance, interface clarity, report usability, and overall satisfaction.

Open-ended questions were included to identify user experiences, encountered issues, and suggested improvements.

---

### 3.7.3 System Usability Scale (SUS)

The **System Usability Scale (SUS)** was used as a structured instrument for measuring perceived system usability in post-production evaluation, consistent with common usability assessment practice in educational technology studies (Revano & Garcia, 2021). It consists of a ten-item questionnaire with alternating positive and negative statements rated on a five-point scale.

SUS scores were computed and transformed into a scale from 0 to 100, providing a reliable measure of overall usability. These scores were interpreted using established usability benchmarks and qualitative descriptors.

---

## 3.8 Data Gathering

Data gathering was conducted in two major phases using structured survey instruments and standardized procedures.

During the **pre-production phase**, the survey was administered to eligible faculty respondents following institutional coordination. Respondents were provided with an informed consent statement detailing the purpose of the study, voluntary participation, confidentiality, and data handling procedures. Only those who consented proceeded with the survey.

During the **post-production phase**, respondents who were exposed to the developed prototype completed the evaluation survey. Respondents were given sufficient time to interact with the system prior to evaluation to ensure informed responses.

---

## 3.9 Statistical Treatment

### 3.9.1 Quantitative Analysis

Descriptive statistical methods were used to analyze quantitative data (Fink, 2017).

* **Frequency counts and percentages** were used for categorical data such as respondent profiles
* **Weighted means** were computed for non-SUS Likert-scale responses to determine the overall level of agreement across measured constructs

For the post-production phase, weighted means were used to summarize researcher-made Likert constructs related to system effectiveness, performance, interface evaluation, and satisfaction.

---

### 3.9.2 SUS Scoring and Interpretation

SUS responses were scored using the standard Brooke computation method and converted into a 0-100 scale. The resulting scores were interpreted using established usability categories to determine the overall acceptability of the system.

---

### 3.9.3 Qualitative Analysis

Responses from open-ended questions were analyzed using **thematic grouping** to identify recurring patterns, concerns, and suggestions. This served as a supplementary interpretive layer to support the primary quantitative-descriptive findings.

---

### 3.9.4 Comparative Interpretation of Findings

Findings from the pre-production and post-production phases were comparatively analyzed to determine whether the concerns identified during the initial phase were addressed by the developed system. This comparison served as the basis for conclusions and recommendations.

---

## 3.10 Ethical Considerations

The study adhered to established ethical standards in data collection and research conduct.

Participation was **voluntary**, and respondents were informed of their right to withdraw at any time without consequence. Prior to participation, respondents were provided with a clear **informed consent statement** outlining the purpose of the study, data usage, and confidentiality measures.

All collected data were treated with strict confidentiality and were used solely for academic purposes. No personally identifiable information was disclosed in the reporting of results.

The study adhered to the provisions of the **Data Privacy Act of 2012**, ensuring that only necessary data were collected and that respondents were fully informed about how their data would be handled and protected (Foronda et al., 2023; Miano, 2025).

---

## References for Chapter III (2016-Present)

Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE.

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. *American Journal of Theoretical and Applied Statistics, 5*(1), 1-4. https://doi.org/10.11648/j.ajtas.20160501.11

Fink, A. (2017). *How to conduct surveys: A step-by-step guide* (6th ed.). SAGE.

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO) - IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the Extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. In *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)* (pp. 1-5). https://doi.org/10.1109/HNICEM54116.2021.9731917

---
## Source: chapter4.md
# CHAPTER IV
## SUMMARY OF FINDINGS, CONCLUSIONS AND RECOMMENDATIONS

---

## 4.1 Summary of Findings

### 4.1.1 Findings Relative to the Statement of the Problem

This study was guided by the general problem of how professors can fairly and consistently track participation during synchronous online classes conducted through Google Meet and Zoom. Based on the two-phase survey process and prototype evaluation, the findings indicate that ENGAGIUM addressed the core instructional need by providing structured, data-driven participation records and reducing dependence on purely manual observation.

Relative to the specific problems stated in Chapter I, the findings may be summarized as follows:

1. Faculty respondents confirmed persistent challenges in capturing participation across multiple channels during live sessions, particularly while simultaneously delivering instruction.
2. The developed system was able to operationalize participation recognition through event-based tracking categories and centralized logging for instructor review.
3. The dashboard and reporting views were perceived as useful for participation summaries and grading support, with respondents rating interface-related constructs positively.
4. The shift from manual observation to recorded participation logs improved perceived fairness and transparency of grading decisions.
5. Integration into existing workflow was feasible within the study context, with post-production respondents reporting actual use during live sessions.
6. Evaluation results showed generally positive usability and effectiveness outcomes, with identified areas for refinement concentrated on navigation clarity, real-time responsiveness, and reporting options.

### 4.1.2 Pre-Production Findings 

Pre-production results (N = 32) validated the instructional and operational burden of manual participation tracking. Problem Validation produced an overall mean of 3.29 (Moderate/Neutral), indicating that while not all indicators were equally severe, the aggregate pattern still reflected meaningful classroom management difficulty.

The highest-rated concerns were the time and effort required for manual recording (PV6, mean = 3.62), the need for a more structured and objective method (PV9, mean = 3.91), and the difficulty of maintaining consistent records across sessions (PV10, mean = 3.58). These findings establish that the issue is not merely technical convenience, but instructional consistency and grading credibility.

Technology acceptance indicators were uniformly high to very high: Perceived Usefulness (overall mean = 4.34), Perceived Ease of Use (4.31), Behavioral Intention (4.44), and Feasibility Constraints (4.10). Usability expectations were likewise strong, with Dashboard and Interface Expectations (4.46), Report Preferences (4.36), and Tracking Options (4.28) all in the Very High/Strongly Agree range. Data Privacy Expectations also showed high salience (overall mean = 4.36), especially for transparency, legal compliance, and consent procedures.

Open-ended pre-production responses reinforced these quantitative findings. Recurring themes included real-time monitoring burden, connectivity-related disruptions, and difficulty tracking participation in larger or multiple sections. Respondents also emphasized demand for live summaries, filterable reports, export options, and support for diverse participation modalities.

These findings indicate a clear instructional need for a more structured, transparent, and less burdensome participation-tracking approach.

### 4.1.3 Post-Production Findings 

Post-production findings (N = 13) indicate that ENGAGIUM was perceived as effective and usable in practical class contexts. Perceived Effectiveness reached an overall mean of 4.06 (High/Agree), with respondents indicating that the system improved participation tracking accuracy and reduced manual monitoring requirements.

System Performance and Reliability yielded an overall mean of 3.82 (High/Agree). While this confirms acceptable operational performance, the item means suggest room for improvement in real-time accuracy and event consistency under varying conditions. Interface and Dashboard Evaluation was rated positively (overall mean = 4.05), indicating that users generally understood summaries, charts, and navigation, but still observed opportunities for clearer visual cues and report interpretation.

Overall Satisfaction and Adoption produced an aggregate mean of 4.10 (High/Agree), with willingness to use the system in actual classes receiving one of the strongest endorsements (SAT2, mean = 4.23). The System Usability Scale (SUS) mean score was 72.88 (SD = 8.09), above the common benchmark of 68, indicating better-than-average usability and acceptable readiness for continued use with targeted refinements.

Post-production thematic feedback aligned with these ratings. Respondents most frequently appreciated reduced manual checking and better visibility of participation types, while the most common issues involved label clarity, navigation flow, occasional update delays, and requests for additional report export options.

These post-production findings suggest that ENGAGIUM was accepted as a practical response to the participation-tracking difficulties identified during the pre-production phase, while still leaving room for refinement in usability and responsiveness.

### 4.1.4 Comparative Analysis 

Comparative interpretation shows that the primary pre-production needs were substantially addressed by the developed system. In the pre-production phase, respondents expressed strong demand for objective tracking, integrated summaries, and reduced manual workload. In the post-production phase, these same dimensions were reflected in favorable effectiveness, interface, and satisfaction ratings.

The comparison also indicates that remaining concerns shifted in nature. Prior to development, concerns were centered on the absence of a reliable tracking mechanism and the burden of fragmented observation. After prototype use, concerns were more focused on optimization issues, such as interface cues, responsiveness in weaker connectivity contexts, and richer reporting controls. This pattern suggests that the study progressed from validating the need for automation to identifying practical improvements for broader implementation.

Overall, the two-phase design confirms alignment between identified needs and delivered outcomes: the system addressed core participation-tracking problems while generating actionable feedback for the next development cycle.

### 4.1.5 Ethical and Practical Considerations 

Findings from both phases indicate that ethical and practical considerations were central to faculty acceptance. Pre-production respondents strongly emphasized privacy compliance, transparent scoring logic, and informed data collection procedures. Post-production feedback further highlighted that trust in participation records depends not only on technical capture, but also on clarity of interpretation and consistency of reporting.

In this context, ENGAGIUM's approach of limiting collection to participation metadata and text-based interaction records aligns with the study's privacy commitments and the Data Privacy Act of 2012. No audio or video recording was required for the participation workflow evaluated in this study.

Practical constraints, however, remained evident. Internet stability, platform-side behavior changes, and interface interpretation issues can influence perceived reliability in real classroom use. These constraints do not negate system value, but they underscore the need for incremental hardening, clearer onboarding, and sustained governance practices as implementation scales.

### 4.1.6 Zoom Integration Limitations

Although the study framework included Google Meet and Zoom as target synchronous environments, implementation and evaluation depth were uneven across platforms. Post-production usage context showed universal Google Meet exposure among respondents, while Zoom exposure was partial and based on a multi-select item. This indicates that core evaluation evidence is strongest for Google Meet-centered usage scenarios within the current research setting.

Zoom-side implementation feasibility is affected by both technical and economic factors, including platform policy boundaries, account-level permissions, and potential development or maintenance costs associated with sustained integration support. As detailed in Appendix B (Section B.5, Zoom Bridge Architecture), the current Zoom Apps SDK pathway reliably supports joins/leaves, reactions, and hand-raise related events, but does not expose chat content, chat activity indicators, or real-time mic-state signals in the same manner as the Google Meet extension flow. As a result, Zoom integration in this phase should be interpreted as exploratory and constrained, rather than equivalent in maturity to Google Meet deployment.

This limitation is consistent with the study delimitations and should be considered when interpreting generalizability of findings across synchronous platforms.

---

## 4.2 Conclusions

### 4.2.1 Conclusions Relative to the General and Specific Objectives

The study concludes that ENGAGIUM met its general objective of designing, developing, and evaluating a participation-tracking system that supports fairer and more consistent monitoring in synchronous online classes. The results demonstrate that the system can capture meaningful participation indicators, present usable summaries for instructors, and reduce dependence on manual logging.

Relative to the specific objectives, the study concludes that:

1. Automated participation capture through extension-supported workflow was feasible in the target instructional context.
2. Instructor-facing dashboards and summaries were perceived as useful for class monitoring and participation-based grading.
3. Meeting-driven session use was practical for prototype exposure and post-production evaluation.
4. The use of recorded participation data improved perceived fairness and grading transparency.
5. The privacy-oriented data scope was consistent with the study's ethical requirements.
6. Evaluation outputs provided measurable evidence of usability and effectiveness, while identifying specific areas requiring refinement.

### 4.2.2 Conclusions on System Effectiveness and Adoption Readiness

ENGAGIUM demonstrated positive effectiveness and acceptable usability for early-stage institutional use. High post-production means across effectiveness, interface quality, and satisfaction, together with a SUS mean of 72.88, indicate that respondents generally considered the system practical and beneficial.

However, adoption readiness should be interpreted as conditional rather than final. The system appears suitable for controlled implementation and iterative expansion, provided that improvements are made in navigation clarity, reporting flexibility, and consistency of real-time updates under variable connectivity conditions.

Therefore, the system is best characterized as functionally viable and pedagogically valuable, with clear potential for wider deployment after targeted enhancement.

### 4.2.3 Conclusions on Study Scope and Limitations

The conclusions of this study are bounded by the defined scope, respondent profile, and implementation context. Findings are strongest for synchronous classes using Google Meet within the participating institutional setting. Zoom-related findings, while informative, remain limited in comparative depth and should not be treated as equivalent evidence of full cross-platform maturity.

This conclusion is also consistent with the architecture-level constraints documented in Appendix B (especially Sections B.5 and B.9), which describe the split integration model and the current Zoom bridge capability boundaries.

The post-production sample size and prototype-stage constraints also limit broad statistical generalization. Nevertheless, the convergence of quantitative ratings, SUS outcomes, and thematic responses supports the validity of the study's central claim: automated, privacy-aware participation tracking can improve fairness and instructional efficiency in synchronous online teaching.

---

## 4.3 Recommendations

### 4.3.1 For Institutional Implementation

For institutional use, a phased rollout is recommended. Initial deployment may prioritize departments with frequent synchronous classes and instructors already using participation-based grading. During this phase, institutions should establish clear implementation protocols for class setup, session closure, report use, and technical support escalation.

A structured orientation for faculty users is also recommended to standardize interpretation of participation metrics and prevent inconsistent grading practices across courses.

### 4.3.2 For System Improvement

System enhancement should prioritize the issues consistently identified in post-production feedback:

1. Improve dashboard label clarity, filter flow, and navigation cues for faster interpretation.
2. Strengthen real-time event synchronization, especially in low or unstable bandwidth contexts.
3. Expand reporting controls, including clearer report fields and additional export presets.
4. Add lightweight onboarding elements (guided walkthroughs, in-context hints, and quick-start references).
5. Enhance participant highlight and session-comparison views to support instructional decision-making.

These refinements should be validated through iterative usability testing before large-scale deployment.

### 4.3.3 For Policy, Ethics, and Data Governance

Institutions adopting ENGAGIUM should formalize governance mechanisms aligned with RA 10173. Recommended measures include written consent workflows, role-based access control, retention and deletion policies, and periodic privacy compliance review.

In addition, transparent communication of scoring logic and participation criteria should be embedded in faculty practice to sustain trust among instructors and students. Ethical use should emphasize support for instructional fairness rather than punitive surveillance.

### 4.3.4 For Zoom Integration Feasibility and Cost Constraints

Future Zoom integration work should begin with a dedicated feasibility track that separately evaluates technical compatibility, policy constraints, and total cost of ownership. A staged strategy is recommended:

This recommendation should be implemented alongside the technical baseline already documented in Appendix B (Section B.5), so planning decisions remain aligned with actual SDK capabilities and known capture gaps.

1. Conduct a platform capability audit and permissions mapping.
2. Define a minimum viable Zoom feature set equivalent to core Google Meet functions.
3. Estimate recurring costs for maintenance, updates, and compliance overhead.
4. Pilot with a small faculty cohort before institutional scaling.

This approach will help institutions avoid overcommitting resources before platform-level viability is fully established.

### 4.3.5 For Future Research

Future studies may extend this work through broader and more diverse samples, longer implementation windows, and cross-platform comparative evaluation. Recommended research directions include:

1. Longitudinal studies on whether participation analytics influence grading consistency and learner outcomes over multiple terms.
2. Comparative studies across different disciplines, class sizes, and instructional modalities.
3. Expanded reliability validation of post-production constructs with larger respondent pools.
4. Evaluation of onboarding interventions and interface redesign on adoption speed and user confidence.
5. Investigation of fairness perception from the student perspective alongside instructor assessments.

These directions can strengthen the evidence base for institutional policy, technical refinement, and sustainable deployment of participation-tracking systems in higher education.
---
## Source: bibliography.md
# Bibliography

Alejandro, I. M. V., Sanchez, J. M. P., Sumalinog, G. G., Mananay, J. A., Goles, C. E., & Fernandez, C. B. (2024). Pre-service teachers' technology acceptance of artificial intelligence (AI) applications in education. *STEM Education, 4*(4), 445-465. https://doi.org/10.3934/steme.2024024

Aquino, J. M. D. (2023). Assessing the role of recreational activities in physical education participation of college students in one state university in Laguna Philippines. *International Journal of Multidisciplinary Sciences, 1*(2), 190-204. https://doi.org/10.37329/ijms.v1i2.2506

Ayog, J. T., & Oliva, E. R. A. (2023). Writing competency and student participation in Filipino class: The mediating effect of reading strategy. *Asian Journal of Education and Social Studies, 49*(4), 84-94. https://doi.org/10.9734/ajess/2023/v49i41190

Bergdahl, N., Bond, M., Sjoberg, J., Dougherty, M., & Oxley, E. (2024). Unpacking student engagement in higher education learning analytics: A systematic review. *International Journal of Educational Technology in Higher Education, 21*(1). https://doi.org/10.1186/s41239-024-00493-y

Cervantes, J., & Navarro, E. (2025). Business students' perceptions of AI in higher education: An analysis using the Technology Acceptance Model. *Journal of Interdisciplinary Perspectives, 3*(6). https://doi.org/10.69569/jip.2025.194

Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE.

Cruz, J. H., Florentino, M. C. A., Lacatan, L. L., & Peralta, R. L. (2025). Leveraging predictive analytics on LMS logs to examine the impact of engagement on academic performance among college students enrolled in Centro Escolar University. *International Journal of Research and Scientific Innovation, 12*(1), 563-573. https://doi.org/10.51244/ijrsi.2025.12010051

Donelan, H., Kear, K., Rosewell, J., Okada, A., Sheehy, K., Amor, K., Edwards, C., Mooney, A., Cuffe, P., & Elder, T. (2025). Synchronous online learning: Why some students don't actively participate. *Online Learning, 29*(3). https://doi.org/10.24059/olj.v29i3.4641

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. *American Journal of Theoretical and Applied Statistics, 5*(1), 1-4. https://doi.org/10.11648/j.ajtas.20160501.11

Fink, A. (2017). *How to conduct surveys: A step-by-step guide* (6th ed.). SAGE.

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO)-IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Fu, P., Gao, C., Chen, X., Zhang, Z., Chen, J., & Yang, D. (2024). Proactive personality and its impact on online learning engagement through positive emotions and learning motivation. *Scientific Reports, 14*(1), 28144. https://doi.org/10.1038/s41598-024-79776-3

Funa, A. A., & Gabay, R. A. E. (2024). Policy guidelines and recommendations on AI use in teaching and learning: A meta-synthesis study. *Social Sciences & Humanities Open, 11*, 101221. https://doi.org/10.1016/j.ssaho.2024.101221

Gan, B., & Ouh, E. L. (2023). Class participation: Using technology to enhance efficiency and fairness. *IEEE TALE 2023*, 1-8. https://doi.org/10.1109/TALE56641.2023.10398380

Garrison, D. R., Anderson, T., & Archer, W. (2000). Critical inquiry in a text-based environment: Computer conferencing in higher education. *The Internet and Higher Education, 2*(2-3), 87-105. https://doi.org/10.1016/S1096-7516(00)00016-6

Hamad, W. (2022). Understanding the foremost challenges in the transition to online teaching and learning during COVID-19 pandemic: A systematic literature review. *Journal of Educational Technology and Online Learning, 5*(2), 393-410. https://doi.org/10.31681/jetol.1055695

Howard, J. L., Bureau, J. S., Guay, F., Chong, J. X. Y., & Ryan, R. M. (2021). Student motivation and associated outcomes: A meta-analysis from Self-Determination Theory. *Perspectives on Psychological Science, 16*(6), 1300-1323. https://doi.org/10.1177/1745691620966789

Jopson, A. A. E., et al. (2024). The lived experiences of college students in adapting the blended learning. *BAHANDIAN, Institutional Repository of Central Philippine University*. https://hdl.handle.net/20.500.12852/3309

Kabir, R., & Mondal, M. S. H. (2025). Perceived benefits or barriers? The online learning experience of Bangladeshi undergraduate students. *Malaysian Online Journal of Educational Sciences, 13*(2), 53-63. https://doi.org/10.22452/mojes.vol13no2.5

Kaliisa, R., Misiejuk, K., Lopez-Pernas, S., Khalil, M., & Saqr, M. (2023). Have learning analytics dashboards lived up to the hype? A systematic review of impact on students' achievement, motivation, participation and attitude. *arXiv*. https://doi.org/10.48550/arxiv.2312.15042

Karmini, N. W., Yudabakti, I. M., Seniwati, D. N., Makulua, K., & Burnama, N. (2024). The effect of student participation through the use of online learning platforms in improving student learning outcomes. *International Journal of Language and Ubiquitous Learning, 2*(1). https://doi.org/10.70177/ijlul.v2i1.752

Marquez, J., Lazcano, L., Bada, C., & Arroyo-Barriguete, J. L. (2023). Class participation and feedback as enablers of student academic performance. *SAGE Open, 13*(2). https://doi.org/10.1177/21582440231177298

Martin, F., & Bolliger, D. U. (2018). Engagement matters: Student perceptions on the importance of engagement strategies in the online learning environment. *Online Learning, 22*(1). https://doi.org/10.24059/olj.v22i1.1092

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Oshodi, O. (2024). Assessment of students' attendance, participation and classroom involvement in e-classroom. *International Conference on Education Research, 1*(1), 442-448. https://doi.org/10.34190/icer.1.1.3192

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Prasetyanto, D., Rizki, M., & Sunitiyoso, Y. (2022). Online learning participation intention after COVID-19 pandemic in Indonesia: Do students still make trips for online class? *Sustainability, 14*(4), 1982. https://doi.org/10.3390/su14041982

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. In *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)* (pp. 1-5). https://doi.org/10.1109/HNICEM54116.2021.9731917

Rogers, J. K. B., Mercado, T. C. R., & Decano, R. S. (2024). Moodle interactions and academic performance: Educational data mining in a Philippine university. *Journal of Education and Learning (EduLearn), 19*(1), 542-550. https://doi.org/10.11591/edulearn.v19i1.21549

Ryan, R. M., & Deci, E. L. (2017). *Self-determination theory: Basic psychological needs in motivation, development, and wellness*. The Guilford Press. https://doi.org/10.1521/978.14625/28806

Samnidze, N., Didmanidze, I., Diasamidze, M., Akhvlediani, D., & Kirvalidze, N. (2023). Critical factors influencing classroom participation in online learning. *Platforms, 1*(1), 26-33. https://doi.org/10.3390/platforms1010004

Sancon, R. J. S. (2023). Data privacy best practices of a local higher educational institution: A model for governance. *International Multidisciplinary Research Journal*. https://doi.org/10.54476/ioer-imrj/688585

Simon, P. D., Jiang, J., & Fryer, L. K. (2025). Assessment of class participation in online and offline learning environments: A qualitative investigation of teachers' best practices and challenges. *Higher Education Research & Development, 44*(5), 1191-1208. https://doi.org/10.1080/07294360.2025.2462024

Svabensky, V., Verger, M., Rodrigo, M. M. T., Monterozo, C. J. G., Baker, R. S., Saavedra, M. Z. N. L., Lalle, S., & Shimada, A. (2024). Evaluating algorithmic bias in models for predicting academic performance of Filipino students. *arXiv*. https://doi.org/10.48550/arxiv.2405.09821

Talosa, A. D., Acidera, R. A., Tamanu, M. J. M., & Sumer, J. J. M. (2025). Knowledge, self-efficacy and effectiveness in leveraging blended delivery system: A study of higher education teachers. *International Journal of Instruction, 18*(2), 709-726. https://doi.org/10.29333/iji.2025.18238a

VEMETER. (2025). A tool for evaluating participation levels in virtual class sessions. *IEEE EDUCON Conference Proceedings*. https://doi.org/10.1109/EDUCON62633.2025.11016534

Vygotsky, L. S. (1978). *Mind in society: The development of higher psychological processes*. Harvard University Press.

Wongthong, P. (n.d.). Influence of synchronous online learning on students' and parents' perceptions: A case study of a demonstration school. https://eric.ed.gov/?q=source%3a%22Journal+of+Educators+Online%22&ff1=eduGrade+4&id=EJ1462234

---
## Source: chapter4.md
# CHAPTER IV
## SUMMARY OF FINDINGS, CONCLUSIONS AND RECOMMENDATIONS

---

## 4.1 Summary of Findings

### 4.1.1 Findings Relative to the Statement of the Problem

This study was guided by the general problem of how professors can fairly and consistently track participation during synchronous online classes conducted through Google Meet and Zoom. Based on the two-phase survey process and prototype evaluation, the findings indicate that ENGAGIUM addressed the core instructional need by providing structured, data-driven participation records and reducing dependence on purely manual observation.

Relative to the specific problems stated in Chapter I, the findings may be summarized as follows:

1. Faculty respondents confirmed persistent challenges in capturing participation across multiple channels during live sessions, particularly while simultaneously delivering instruction.
2. The developed system was able to operationalize participation recognition through event-based tracking categories and centralized logging for instructor review.
3. The dashboard and reporting views were perceived as useful for participation summaries and grading support, with respondents rating interface-related constructs positively.
4. The shift from manual observation to recorded participation logs improved perceived fairness and transparency of grading decisions.
5. Integration into existing workflow was feasible within the study context, with post-production respondents reporting actual use during live sessions.
6. Evaluation results showed generally positive usability and effectiveness outcomes, with identified areas for refinement concentrated on navigation clarity, real-time responsiveness, and reporting options.

### 4.1.2 Pre-Production Findings 

Pre-production results (N = 32) validated the instructional and operational burden of manual participation tracking. Problem Validation produced an overall mean of 3.29 (Moderate/Neutral), indicating that while not all indicators were equally severe, the aggregate pattern still reflected meaningful classroom management difficulty.

The highest-rated concerns were the time and effort required for manual recording (PV6, mean = 3.62), the need for a more structured and objective method (PV9, mean = 3.91), and the difficulty of maintaining consistent records across sessions (PV10, mean = 3.58). These findings establish that the issue is not merely technical convenience, but instructional consistency and grading credibility.

Technology acceptance indicators were uniformly high to very high: Perceived Usefulness (overall mean = 4.34), Perceived Ease of Use (4.31), Behavioral Intention (4.44), and Feasibility Constraints (4.10). Usability expectations were likewise strong, with Dashboard and Interface Expectations (4.46), Report Preferences (4.36), and Tracking Options (4.28) all in the Very High/Strongly Agree range. Data Privacy Expectations also showed high salience (overall mean = 4.36), especially for transparency, legal compliance, and consent procedures.

Open-ended pre-production responses reinforced these quantitative findings. Recurring themes included real-time monitoring burden, connectivity-related disruptions, and difficulty tracking participation in larger or multiple sections. Respondents also emphasized demand for live summaries, filterable reports, export options, and support for diverse participation modalities.

These findings indicate a clear instructional need for a more structured, transparent, and less burdensome participation-tracking approach.

### 4.1.3 Post-Production Findings 

Post-production findings (N = 13) indicate that ENGAGIUM was perceived as effective and usable in practical class contexts. Perceived Effectiveness reached an overall mean of 4.06 (High/Agree), with respondents indicating that the system improved participation tracking accuracy and reduced manual monitoring requirements.

System Performance and Reliability yielded an overall mean of 3.82 (High/Agree). While this confirms acceptable operational performance, the item means suggest room for improvement in real-time accuracy and event consistency under varying conditions. Interface and Dashboard Evaluation was rated positively (overall mean = 4.05), indicating that users generally understood summaries, charts, and navigation, but still observed opportunities for clearer visual cues and report interpretation.

Overall Satisfaction and Adoption produced an aggregate mean of 4.10 (High/Agree), with willingness to use the system in actual classes receiving one of the strongest endorsements (SAT2, mean = 4.23). The System Usability Scale (SUS) mean score was 72.88 (SD = 8.09), above the common benchmark of 68, indicating better-than-average usability and acceptable readiness for continued use with targeted refinements.

Post-production thematic feedback aligned with these ratings. Respondents most frequently appreciated reduced manual checking and better visibility of participation types, while the most common issues involved label clarity, navigation flow, occasional update delays, and requests for additional report export options.

These post-production findings suggest that ENGAGIUM was accepted as a practical response to the participation-tracking difficulties identified during the pre-production phase, while still leaving room for refinement in usability and responsiveness.

### 4.1.4 Comparative Analysis 

Comparative interpretation shows that the primary pre-production needs were substantially addressed by the developed system. In the pre-production phase, respondents expressed strong demand for objective tracking, integrated summaries, and reduced manual workload. In the post-production phase, these same dimensions were reflected in favorable effectiveness, interface, and satisfaction ratings.

The comparison also indicates that remaining concerns shifted in nature. Prior to development, concerns were centered on the absence of a reliable tracking mechanism and the burden of fragmented observation. After prototype use, concerns were more focused on optimization issues, such as interface cues, responsiveness in weaker connectivity contexts, and richer reporting controls. This pattern suggests that the study progressed from validating the need for automation to identifying practical improvements for broader implementation.

Overall, the two-phase design confirms alignment between identified needs and delivered outcomes: the system addressed core participation-tracking problems while generating actionable feedback for the next development cycle.

### 4.1.5 Ethical and Practical Considerations 

Findings from both phases indicate that ethical and practical considerations were central to faculty acceptance. Pre-production respondents strongly emphasized privacy compliance, transparent scoring logic, and informed data collection procedures. Post-production feedback further highlighted that trust in participation records depends not only on technical capture, but also on clarity of interpretation and consistency of reporting.

In this context, ENGAGIUM's approach of limiting collection to participation metadata and text-based interaction records aligns with the study's privacy commitments and the Data Privacy Act of 2012. No audio or video recording was required for the participation workflow evaluated in this study.

Practical constraints, however, remained evident. Internet stability, platform-side behavior changes, and interface interpretation issues can influence perceived reliability in real classroom use. These constraints do not negate system value, but they underscore the need for incremental hardening, clearer onboarding, and sustained governance practices as implementation scales.

### 4.1.6 Zoom Integration Limitations

Although the study framework included Google Meet and Zoom as target synchronous environments, implementation and evaluation depth were uneven across platforms. Post-production usage context showed universal Google Meet exposure among respondents, while Zoom exposure was partial and based on a multi-select item. This indicates that core evaluation evidence is strongest for Google Meet-centered usage scenarios within the current research setting.

Zoom-side implementation feasibility is affected by both technical and economic factors, including platform policy boundaries, account-level permissions, and potential development or maintenance costs associated with sustained integration support. As detailed in Appendix B (Section B.5, Zoom Bridge Architecture), the current Zoom Apps SDK pathway reliably supports joins/leaves, reactions, and hand-raise related events, but does not expose chat content, chat activity indicators, or real-time mic-state signals in the same manner as the Google Meet extension flow. As a result, Zoom integration in this phase should be interpreted as exploratory and constrained, rather than equivalent in maturity to Google Meet deployment.

This limitation is consistent with the study delimitations and should be considered when interpreting generalizability of findings across synchronous platforms.

---

## 4.2 Conclusions

### 4.2.1 Conclusions Relative to the General and Specific Objectives

The study concludes that ENGAGIUM met its general objective of designing, developing, and evaluating a participation-tracking system that supports fairer and more consistent monitoring in synchronous online classes. The results demonstrate that the system can capture meaningful participation indicators, present usable summaries for instructors, and reduce dependence on manual logging.

Relative to the specific objectives, the study concludes that:

1. Automated participation capture through extension-supported workflow was feasible in the target instructional context.
2. Instructor-facing dashboards and summaries were perceived as useful for class monitoring and participation-based grading.
3. Meeting-driven session use was practical for prototype exposure and post-production evaluation.
4. The use of recorded participation data improved perceived fairness and grading transparency.
5. The privacy-oriented data scope was consistent with the study's ethical requirements.
6. Evaluation outputs provided measurable evidence of usability and effectiveness, while identifying specific areas requiring refinement.

### 4.2.2 Conclusions on System Effectiveness and Adoption Readiness

ENGAGIUM demonstrated positive effectiveness and acceptable usability for early-stage institutional use. High post-production means across effectiveness, interface quality, and satisfaction, together with a SUS mean of 72.88, indicate that respondents generally considered the system practical and beneficial.

However, adoption readiness should be interpreted as conditional rather than final. The system appears suitable for controlled implementation and iterative expansion, provided that improvements are made in navigation clarity, reporting flexibility, and consistency of real-time updates under variable connectivity conditions.

Therefore, the system is best characterized as functionally viable and pedagogically valuable, with clear potential for wider deployment after targeted enhancement.

### 4.2.3 Conclusions on Study Scope and Limitations

The conclusions of this study are bounded by the defined scope, respondent profile, and implementation context. Findings are strongest for synchronous classes using Google Meet within the participating institutional setting. Zoom-related findings, while informative, remain limited in comparative depth and should not be treated as equivalent evidence of full cross-platform maturity.

This conclusion is also consistent with the architecture-level constraints documented in Appendix B (especially Sections B.5 and B.9), which describe the split integration model and the current Zoom bridge capability boundaries.

The post-production sample size and prototype-stage constraints also limit broad statistical generalization. Nevertheless, the convergence of quantitative ratings, SUS outcomes, and thematic responses supports the validity of the study's central claim: automated, privacy-aware participation tracking can improve fairness and instructional efficiency in synchronous online teaching.

---

## 4.3 Recommendations

### 4.3.1 For Institutional Implementation

For institutional use, a phased rollout is recommended. Initial deployment may prioritize departments with frequent synchronous classes and instructors already using participation-based grading. During this phase, institutions should establish clear implementation protocols for class setup, session closure, report use, and technical support escalation.

A structured orientation for faculty users is also recommended to standardize interpretation of participation metrics and prevent inconsistent grading practices across courses.

### 4.3.2 For System Improvement

System enhancement should prioritize the issues consistently identified in post-production feedback:

1. Improve dashboard label clarity, filter flow, and navigation cues for faster interpretation.
2. Strengthen real-time event synchronization, especially in low or unstable bandwidth contexts.
3. Expand reporting controls, including clearer report fields and additional export presets.
4. Add lightweight onboarding elements (guided walkthroughs, in-context hints, and quick-start references).
5. Enhance participant highlight and session-comparison views to support instructional decision-making.

These refinements should be validated through iterative usability testing before large-scale deployment.

### 4.3.3 For Policy, Ethics, and Data Governance

Institutions adopting ENGAGIUM should formalize governance mechanisms aligned with RA 10173. Recommended measures include written consent workflows, role-based access control, retention and deletion policies, and periodic privacy compliance review.

In addition, transparent communication of scoring logic and participation criteria should be embedded in faculty practice to sustain trust among instructors and students. Ethical use should emphasize support for instructional fairness rather than punitive surveillance.

### 4.3.4 For Zoom Integration Feasibility and Cost Constraints

Future Zoom integration work should begin with a dedicated feasibility track that separately evaluates technical compatibility, policy constraints, and total cost of ownership. A staged strategy is recommended:

This recommendation should be implemented alongside the technical baseline already documented in Appendix B (Section B.5), so planning decisions remain aligned with actual SDK capabilities and known capture gaps.

1. Conduct a platform capability audit and permissions mapping.
2. Define a minimum viable Zoom feature set equivalent to core Google Meet functions.
3. Estimate recurring costs for maintenance, updates, and compliance overhead.
4. Pilot with a small faculty cohort before institutional scaling.

This approach will help institutions avoid overcommitting resources before platform-level viability is fully established.

### 4.3.5 For Future Research

Future studies may extend this work through broader and more diverse samples, longer implementation windows, and cross-platform comparative evaluation. Recommended research directions include:

1. Longitudinal studies on whether participation analytics influence grading consistency and learner outcomes over multiple terms.
2. Comparative studies across different disciplines, class sizes, and instructional modalities.
3. Expanded reliability validation of post-production constructs with larger respondent pools.
4. Evaluation of onboarding interventions and interface redesign on adoption speed and user confidence.
5. Investigation of fairness perception from the student perspective alongside instructor assessments.

These directions can strengthen the evidence base for institutional policy, technical refinement, and sustainable deployment of participation-tracking systems in higher education.
---
## Source: bibliography.md
# Bibliography

Alejandro, I. M. V., Sanchez, J. M. P., Sumalinog, G. G., Mananay, J. A., Goles, C. E., & Fernandez, C. B. (2024). Pre-service teachers' technology acceptance of artificial intelligence (AI) applications in education. *STEM Education, 4*(4), 445-465. https://doi.org/10.3934/steme.2024024

Aquino, J. M. D. (2023). Assessing the role of recreational activities in physical education participation of college students in one state university in Laguna Philippines. *International Journal of Multidisciplinary Sciences, 1*(2), 190-204. https://doi.org/10.37329/ijms.v1i2.2506

Ayog, J. T., & Oliva, E. R. A. (2023). Writing competency and student participation in Filipino class: The mediating effect of reading strategy. *Asian Journal of Education and Social Studies, 49*(4), 84-94. https://doi.org/10.9734/ajess/2023/v49i41190

Bergdahl, N., Bond, M., Sjoberg, J., Dougherty, M., & Oxley, E. (2024). Unpacking student engagement in higher education learning analytics: A systematic review. *International Journal of Educational Technology in Higher Education, 21*(1). https://doi.org/10.1186/s41239-024-00493-y

Cervantes, J., & Navarro, E. (2025). Business students' perceptions of AI in higher education: An analysis using the Technology Acceptance Model. *Journal of Interdisciplinary Perspectives, 3*(6). https://doi.org/10.69569/jip.2025.194

Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE.

Cruz, J. H., Florentino, M. C. A., Lacatan, L. L., & Peralta, R. L. (2025). Leveraging predictive analytics on LMS logs to examine the impact of engagement on academic performance among college students enrolled in Centro Escolar University. *International Journal of Research and Scientific Innovation, 12*(1), 563-573. https://doi.org/10.51244/ijrsi.2025.12010051

Donelan, H., Kear, K., Rosewell, J., Okada, A., Sheehy, K., Amor, K., Edwards, C., Mooney, A., Cuffe, P., & Elder, T. (2025). Synchronous online learning: Why some students don't actively participate. *Online Learning, 29*(3). https://doi.org/10.24059/olj.v29i3.4641

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. *American Journal of Theoretical and Applied Statistics, 5*(1), 1-4. https://doi.org/10.11648/j.ajtas.20160501.11

Fink, A. (2017). *How to conduct surveys: A step-by-step guide* (6th ed.). SAGE.

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO)-IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Fu, P., Gao, C., Chen, X., Zhang, Z., Chen, J., & Yang, D. (2024). Proactive personality and its impact on online learning engagement through positive emotions and learning motivation. *Scientific Reports, 14*(1), 28144. https://doi.org/10.1038/s41598-024-79776-3

Funa, A. A., & Gabay, R. A. E. (2024). Policy guidelines and recommendations on AI use in teaching and learning: A meta-synthesis study. *Social Sciences & Humanities Open, 11*, 101221. https://doi.org/10.1016/j.ssaho.2024.101221

Gan, B., & Ouh, E. L. (2023). Class participation: Using technology to enhance efficiency and fairness. *IEEE TALE 2023*, 1-8. https://doi.org/10.1109/TALE56641.2023.10398380

Garrison, D. R., Anderson, T., & Archer, W. (2000). Critical inquiry in a text-based environment: Computer conferencing in higher education. *The Internet and Higher Education, 2*(2-3), 87-105. https://doi.org/10.1016/S1096-7516(00)00016-6

Hamad, W. (2022). Understanding the foremost challenges in the transition to online teaching and learning during COVID-19 pandemic: A systematic literature review. *Journal of Educational Technology and Online Learning, 5*(2), 393-410. https://doi.org/10.31681/jetol.1055695

Howard, J. L., Bureau, J. S., Guay, F., Chong, J. X. Y., & Ryan, R. M. (2021). Student motivation and associated outcomes: A meta-analysis from Self-Determination Theory. *Perspectives on Psychological Science, 16*(6), 1300-1323. https://doi.org/10.1177/1745691620966789

Jopson, A. A. E., et al. (2024). The lived experiences of college students in adapting the blended learning. *BAHANDIAN, Institutional Repository of Central Philippine University*. https://hdl.handle.net/20.500.12852/3309

Kabir, R., & Mondal, M. S. H. (2025). Perceived benefits or barriers? The online learning experience of Bangladeshi undergraduate students. *Malaysian Online Journal of Educational Sciences, 13*(2), 53-63. https://doi.org/10.22452/mojes.vol13no2.5

Kaliisa, R., Misiejuk, K., Lopez-Pernas, S., Khalil, M., & Saqr, M. (2023). Have learning analytics dashboards lived up to the hype? A systematic review of impact on students' achievement, motivation, participation and attitude. *arXiv*. https://doi.org/10.48550/arxiv.2312.15042

Karmini, N. W., Yudabakti, I. M., Seniwati, D. N., Makulua, K., & Burnama, N. (2024). The effect of student participation through the use of online learning platforms in improving student learning outcomes. *International Journal of Language and Ubiquitous Learning, 2*(1). https://doi.org/10.70177/ijlul.v2i1.752

Marquez, J., Lazcano, L., Bada, C., & Arroyo-Barriguete, J. L. (2023). Class participation and feedback as enablers of student academic performance. *SAGE Open, 13*(2). https://doi.org/10.1177/21582440231177298

Martin, F., & Bolliger, D. U. (2018). Engagement matters: Student perceptions on the importance of engagement strategies in the online learning environment. *Online Learning, 22*(1). https://doi.org/10.24059/olj.v22i1.1092

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Oshodi, O. (2024). Assessment of students' attendance, participation and classroom involvement in e-classroom. *International Conference on Education Research, 1*(1), 442-448. https://doi.org/10.34190/icer.1.1.3192

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Prasetyanto, D., Rizki, M., & Sunitiyoso, Y. (2022). Online learning participation intention after COVID-19 pandemic in Indonesia: Do students still make trips for online class? *Sustainability, 14*(4), 1982. https://doi.org/10.3390/su14041982

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. In *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)* (pp. 1-5). https://doi.org/10.1109/HNICEM54116.2021.9731917

Rogers, J. K. B., Mercado, T. C. R., & Decano, R. S. (2024). Moodle interactions and academic performance: Educational data mining in a Philippine university. *Journal of Education and Learning (EduLearn), 19*(1), 542-550. https://doi.org/10.11591/edulearn.v19i1.21549

Ryan, R. M., & Deci, E. L. (2017). *Self-determination theory: Basic psychological needs in motivation, development, and wellness*. The Guilford Press. https://doi.org/10.1521/978.14625/28806

Samnidze, N., Didmanidze, I., Diasamidze, M., Akhvlediani, D., & Kirvalidze, N. (2023). Critical factors influencing classroom participation in online learning. *Platforms, 1*(1), 26-33. https://doi.org/10.3390/platforms1010004

Sancon, R. J. S. (2023). Data privacy best practices of a local higher educational institution: A model for governance. *International Multidisciplinary Research Journal*. https://doi.org/10.54476/ioer-imrj/688585

Simon, P. D., Jiang, J., & Fryer, L. K. (2025). Assessment of class participation in online and offline learning environments: A qualitative investigation of teachers' best practices and challenges. *Higher Education Research & Development, 44*(5), 1191-1208. https://doi.org/10.1080/07294360.2025.2462024

Svabensky, V., Verger, M., Rodrigo, M. M. T., Monterozo, C. J. G., Baker, R. S., Saavedra, M. Z. N. L., Lalle, S., & Shimada, A. (2024). Evaluating algorithmic bias in models for predicting academic performance of Filipino students. *arXiv*. https://doi.org/10.48550/arxiv.2405.09821

Talosa, A. D., Acidera, R. A., Tamanu, M. J. M., & Sumer, J. J. M. (2025). Knowledge, self-efficacy and effectiveness in leveraging blended delivery system: A study of higher education teachers. *International Journal of Instruction, 18*(2), 709-726. https://doi.org/10.29333/iji.2025.18238a

VEMETER. (2025). A tool for evaluating participation levels in virtual class sessions. *IEEE EDUCON Conference Proceedings*. https://doi.org/10.1109/EDUCON62633.2025.11016534

Vygotsky, L. S. (1978). *Mind in society: The development of higher psychological processes*. Harvard University Press.

Wongthong, P. (n.d.). Influence of synchronous online learning on students' and parents' perceptions: A case study of a demonstration school. https://eric.ed.gov/?q=source%3a%22Journal+of+Educators+Online%22&ff1=eduGrade+4&id=EJ1462234

---
## Source: bibliography.md
# Bibliography

Alejandro, I. M. V., Sanchez, J. M. P., Sumalinog, G. G., Mananay, J. A., Goles, C. E., & Fernandez, C. B. (2024). Pre-service teachers' technology acceptance of artificial intelligence (AI) applications in education. *STEM Education, 4*(4), 445-465. https://doi.org/10.3934/steme.2024024

Aquino, J. M. D. (2023). Assessing the role of recreational activities in physical education participation of college students in one state university in Laguna Philippines. *International Journal of Multidisciplinary Sciences, 1*(2), 190-204. https://doi.org/10.37329/ijms.v1i2.2506

Ayog, J. T., & Oliva, E. R. A. (2023). Writing competency and student participation in Filipino class: The mediating effect of reading strategy. *Asian Journal of Education and Social Studies, 49*(4), 84-94. https://doi.org/10.9734/ajess/2023/v49i41190

Bergdahl, N., Bond, M., Sjoberg, J., Dougherty, M., & Oxley, E. (2024). Unpacking student engagement in higher education learning analytics: A systematic review. *International Journal of Educational Technology in Higher Education, 21*(1). https://doi.org/10.1186/s41239-024-00493-y

Cervantes, J., & Navarro, E. (2025). Business students' perceptions of AI in higher education: An analysis using the Technology Acceptance Model. *Journal of Interdisciplinary Perspectives, 3*(6). https://doi.org/10.69569/jip.2025.194

Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE.

Cruz, J. H., Florentino, M. C. A., Lacatan, L. L., & Peralta, R. L. (2025). Leveraging predictive analytics on LMS logs to examine the impact of engagement on academic performance among college students enrolled in Centro Escolar University. *International Journal of Research and Scientific Innovation, 12*(1), 563-573. https://doi.org/10.51244/ijrsi.2025.12010051

Donelan, H., Kear, K., Rosewell, J., Okada, A., Sheehy, K., Amor, K., Edwards, C., Mooney, A., Cuffe, P., & Elder, T. (2025). Synchronous online learning: Why some students don't actively participate. *Online Learning, 29*(3). https://doi.org/10.24059/olj.v29i3.4641

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. *American Journal of Theoretical and Applied Statistics, 5*(1), 1-4. https://doi.org/10.11648/j.ajtas.20160501.11

Fink, A. (2017). *How to conduct surveys: A step-by-step guide* (6th ed.). SAGE.

Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO)-IMRAD. *SSRN Electronic Journal*. https://doi.org/10.2139/ssrn.4621933

Fu, P., Gao, C., Chen, X., Zhang, Z., Chen, J., & Yang, D. (2024). Proactive personality and its impact on online learning engagement through positive emotions and learning motivation. *Scientific Reports, 14*(1), 28144. https://doi.org/10.1038/s41598-024-79776-3

Funa, A. A., & Gabay, R. A. E. (2024). Policy guidelines and recommendations on AI use in teaching and learning: A meta-synthesis study. *Social Sciences & Humanities Open, 11*, 101221. https://doi.org/10.1016/j.ssaho.2024.101221

Gan, B., & Ouh, E. L. (2023). Class participation: Using technology to enhance efficiency and fairness. *IEEE TALE 2023*, 1-8. https://doi.org/10.1109/TALE56641.2023.10398380

Garrison, D. R., Anderson, T., & Archer, W. (2000). Critical inquiry in a text-based environment: Computer conferencing in higher education. *The Internet and Higher Education, 2*(2-3), 87-105. https://doi.org/10.1016/S1096-7516(00)00016-6

Hamad, W. (2022). Understanding the foremost challenges in the transition to online teaching and learning during COVID-19 pandemic: A systematic literature review. *Journal of Educational Technology and Online Learning, 5*(2), 393-410. https://doi.org/10.31681/jetol.1055695

Howard, J. L., Bureau, J. S., Guay, F., Chong, J. X. Y., & Ryan, R. M. (2021). Student motivation and associated outcomes: A meta-analysis from Self-Determination Theory. *Perspectives on Psychological Science, 16*(6), 1300-1323. https://doi.org/10.1177/1745691620966789

Jopson, A. A. E., et al. (2024). The lived experiences of college students in adapting the blended learning. *BAHANDIAN, Institutional Repository of Central Philippine University*. https://hdl.handle.net/20.500.12852/3309

Kabir, R., & Mondal, M. S. H. (2025). Perceived benefits or barriers? The online learning experience of Bangladeshi undergraduate students. *Malaysian Online Journal of Educational Sciences, 13*(2), 53-63. https://doi.org/10.22452/mojes.vol13no2.5

Kaliisa, R., Misiejuk, K., Lopez-Pernas, S., Khalil, M., & Saqr, M. (2023). Have learning analytics dashboards lived up to the hype? A systematic review of impact on students' achievement, motivation, participation and attitude. *arXiv*. https://doi.org/10.48550/arxiv.2312.15042

Karmini, N. W., Yudabakti, I. M., Seniwati, D. N., Makulua, K., & Burnama, N. (2024). The effect of student participation through the use of online learning platforms in improving student learning outcomes. *International Journal of Language and Ubiquitous Learning, 2*(1). https://doi.org/10.70177/ijlul.v2i1.752

Marquez, J., Lazcano, L., Bada, C., & Arroyo-Barriguete, J. L. (2023). Class participation and feedback as enablers of student academic performance. *SAGE Open, 13*(2). https://doi.org/10.1177/21582440231177298

Martin, F., & Bolliger, D. U. (2018). Engagement matters: Student perceptions on the importance of engagement strategies in the online learning environment. *Online Learning, 22*(1). https://doi.org/10.24059/olj.v22i1.1092

Miano, L. C. (2025). Awareness on data privacy vis-a-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. *Edelweiss Applied Science and Technology, 9*(1), 302-315. https://doi.org/10.55214/25768484.v9i1.4130

Oshodi, O. (2024). Assessment of students' attendance, participation and classroom involvement in e-classroom. *International Conference on Education Research, 1*(1), 442-448. https://doi.org/10.34190/icer.1.1.3192

Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. *Review of Social Sciences, 5*(1). https://doi.org/10.18533/rss.v5i1.143

Prasetyanto, D., Rizki, M., & Sunitiyoso, Y. (2022). Online learning participation intention after COVID-19 pandemic in Indonesia: Do students still make trips for online class? *Sustainability, 14*(4), 1982. https://doi.org/10.3390/su14041982

Quiban, J. (2024). Faculty acceptance and adoption of learning management systems (LMS) using the extended Technology Acceptance Model (ETAM). *Journal of Innovative Technology Convergence, 6*(1), 1-14. https://doi.org/10.69478/jitc2024v6n2a01

Revano, T. F., & Garcia, M. B. (2021). Designing human-centered learning analytics dashboard for higher education using a participatory design approach. In *2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM)* (pp. 1-5). https://doi.org/10.1109/HNICEM54116.2021.9731917

Rogers, J. K. B., Mercado, T. C. R., & Decano, R. S. (2024). Moodle interactions and academic performance: Educational data mining in a Philippine university. *Journal of Education and Learning (EduLearn), 19*(1), 542-550. https://doi.org/10.11591/edulearn.v19i1.21549

Ryan, R. M., & Deci, E. L. (2017). *Self-determination theory: Basic psychological needs in motivation, development, and wellness*. The Guilford Press. https://doi.org/10.1521/978.14625/28806

Samnidze, N., Didmanidze, I., Diasamidze, M., Akhvlediani, D., & Kirvalidze, N. (2023). Critical factors influencing classroom participation in online learning. *Platforms, 1*(1), 26-33. https://doi.org/10.3390/platforms1010004

Sancon, R. J. S. (2023). Data privacy best practices of a local higher educational institution: A model for governance. *International Multidisciplinary Research Journal*. https://doi.org/10.54476/ioer-imrj/688585

Simon, P. D., Jiang, J., & Fryer, L. K. (2025). Assessment of class participation in online and offline learning environments: A qualitative investigation of teachers' best practices and challenges. *Higher Education Research & Development, 44*(5), 1191-1208. https://doi.org/10.1080/07294360.2025.2462024

Svabensky, V., Verger, M., Rodrigo, M. M. T., Monterozo, C. J. G., Baker, R. S., Saavedra, M. Z. N. L., Lalle, S., & Shimada, A. (2024). Evaluating algorithmic bias in models for predicting academic performance of Filipino students. *arXiv*. https://doi.org/10.48550/arxiv.2405.09821

Talosa, A. D., Acidera, R. A., Tamanu, M. J. M., & Sumer, J. J. M. (2025). Knowledge, self-efficacy and effectiveness in leveraging blended delivery system: A study of higher education teachers. *International Journal of Instruction, 18*(2), 709-726. https://doi.org/10.29333/iji.2025.18238a

VEMETER. (2025). A tool for evaluating participation levels in virtual class sessions. *IEEE EDUCON Conference Proceedings*. https://doi.org/10.1109/EDUCON62633.2025.11016534

Vygotsky, L. S. (1978). *Mind in society: The development of higher psychological processes*. Harvard University Press.

Wongthong, P. (n.d.). Influence of synchronous online learning on students' and parents' perceptions: A case study of a demonstration school. https://eric.ed.gov/?q=source%3a%22Journal+of+Educators+Online%22&ff1=eduGrade+4&id=EJ1462234
