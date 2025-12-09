ENGAGIUM: CLASS PARTICIPATION TRACKER FOR ONLINE LEARNING FOR PROFESSORS OF ST. CLARE COLLEGE OF CALOOCAN






A Thesis
Submitted to the Faculty
of Institute of Computer Studies





In Partial Fulfillment of the requirement 
for the Degree of Bachelor of Science 
in Computer Science





By:
AYA-AY, CYRUS JIMUEL O.
BAFLOR, DENY SHIA M.
DE GUZMAN, RICH A.
DURANA III, ANGEL A.
GREGORIO, KIRSTEN ERICKA E.
LINGHON, ISSIAH WAYNE M.
PONFERRADA, JUSTINE
SILVESTRE, CARL DANIEL G.


SEPTEMBER 2025
TABLE OF CONTENTS

Title										Page

TITLE PAGE

CHAPTER I	INTRODUCTION							
		Background of the Study
		Statement of the Problems
		Objective of the Study
		Significance of the Study
		Scope and Delimitation
		Definition of Terms
CHAPTER II	REVIEW OF RELATED LITERATURE AND STUDIES
		Related Literature (Foreign & Local)
		Related Studies (Foreign & Local)
CHAPTER III	METHODS OF RESEARCH AND PROCEDURES
		Research Methodology
		Research Design
		Data Gathering 
		Statistical Treatment
BIBLIOGRAPHY
	








CHAPTER I
Problem and Its Background

Background of the Study
The global transition to online and blended learning has profoundly reshaped higher education. The COVID-19 pandemic accelerated the adoption of virtual platforms such as Zoom, Google Meet, and Google Classroom. These tools ensured instructional continuity but exposed persistent difficulties in monitoring student engagement during synchronous sessions. Studies confirm that student participation is a key determinant of academic success, as it enhances collaboration, motivation, and deeper comprehension (Martin & Bolliger, 2018). Yet, in virtual classrooms, participation can appear in multiple forms—speaking, chatting, responding to polls, or using reaction icons—that instructors often fail to capture consistently (Wang, Huang, & Quek, 2021).

Recent research emphasizes that participation, when properly monitored and acknowledged, directly contributes to improved performance and sustained motivation in online learning (Fu et al., 2024; Karmini, Yudabakti, Seniwati, Makulua, & Burnama, 2024). The challenge lies in the absence of tools that fairly represent student contributions across modalities. At St. Clare College of Caloocan, classes follow a blended format that alternates between online and in-person meetings each week. Although this approach offers flexibility, it also creates difficulties in maintaining consistent records of engagement, especially during online sessions where interaction is dynamic and fragmented. Without reliable data, instructors may unintentionally overlook students who participate through less visible means, such as chat messages or reactions, resulting in perceptions of bias and inequitable grading.
To address this instructional gap, the researchers propose ENGAGIUM: Class Participation Tracker for Online Learning, a web-based and browser-extended system designed to assist professors in monitoring engagement objectively. ENGAGIUM automatically captures participation events—microphone activity, chat interactions, and reactions—then visualizes them through dashboards and reports. By transforming participation into measurable data, the system promotes transparency, fairness, and motivation in virtual classrooms.

Therefore, this study aims to design and develop ENGAGIUM, integrating educational theory and technology to create an equitable, data-driven approach to participation assessment in blended learning environments.

Statement of the Problem

General Problem
How can professors of St. Clare College of Caloocan fairly and consistently track student participation in an online and blended learning setup?

Specific Problem
1.	What challenges do professors encounter in accurately capturing and recording student participation across multiple online platforms?
2.	How can a system be designed to automatically recognize and categorize different forms of online participation (e.g., speaking, chat, polls, and reactions)?
3.	How can the system generate comprehensive participation reports that professors can use for grading and feedback?
4.	How can the system minimize grading bias by replacing manual observation with data-driven tracking?
5.	How can the developed system be integrated effectively into existing platforms such as Zoom and Google Meet?
6.	How can the usability and effectiveness of the developed system be evaluated in terms of accuracy, reliability, and user satisfaction?

Objective of the Study

General Objective
 To design, develop, and evaluate a class participation tracker that enables professors of St. Clare College of Caloocan to monitor student engagement in online and blended learning environments fairly, efficiently, and transparently.

Specific Objectives
1.	To develop a browser-based system integrated with online learning platforms (Zoom and Google Meet) that automatically captures and records participation data.
2.	To create a user interface that presents summarized engagement statistics through dashboards and downloadable reports.
3.	To reduce grading bias by providing professors with objective, quantifiable participation data.
4.	To motivate students toward active engagement by ensuring that all forms of participation are recognized.
5.	To evaluate the system’s performance, usability, and reliability using standard software assessment criteria.
6.	To align the system’s functions with educational theories such as the Constructivist Learning Theory and the Community of Inquiry Framework, which emphasize interaction and presence as components of effective learning.

Significance of the Study
The proposed study holds relevance for several educational stakeholders:

1.	Professors. ENGAGIUM provides instructors with an automated, data-driven mechanism for assessing participation, reducing the workload associated with manual tracking, and ensuring objectivity in evaluation.
2.	Students. The system ensures fair acknowledgment of all forms of participation, thus improving motivation and accountability in virtual learning settings.
3.	Academic Administrators. Collected participation data may be used for institutional analytics, enabling academic departments to evaluate instructional engagement trends and inform professional development.
4.	Institution. The system supports the college’s goals of digital transformation, instructional transparency, and compliance with the Data Privacy Act of 2012 (Republic Act 10173).
5.	Future Researchers. ENGAGIUM can serve as a basis for further studies on automated engagement tracking, educational analytics, and digital fairness in blended education.

By offering measurable, transparent, and secure participation data, ENGAGIUM advances the pedagogical use of technology to enhance teaching and learning experiences in online contexts.


Scope and Delimitation
The study focuses on the design, development, and evaluation of ENGAGIUM, a class participation tracker for professors of St. Clare College of Caloocan who conduct online or blended classes through Zoom or Google Meet.

Scope:
•	Tracks real-time participation events such as microphone activity, chat messages, and reaction use.
•	Generates analytical dashboards and downloadable participation summaries.
•	Ensures compliance with privacy regulations by storing only event metadata and text-based content, excluding audio and video recordings.
•	Operates primarily on desktop browsers (Google Chrome and Microsoft Edge).
•	Utilizes the Agile Software Development Life Cycle (SDLC) methodology for iterative design, testing, and improvement.
•	The development and evaluation will take place during Academic Year 2025–2026.

Delimitations:
•	The system does not monitor participation during asynchronous or face-to-face sessions.
•	Its accuracy depends on stable internet connectivity and access permissions of integrated platforms.
•	It is designed for faculty use; students interact only indirectly through participation data collection.
•	Mobile device compatibility is limited due to browser extension constraints.
•	The evaluation phase will focus on functionality and usability rather than long-term institutional deployment.

These boundaries ensure that the study remains achievable within the given timeframe while addressing its primary objective—enhancing fairness in participation tracking for online learning.

Definition of Terms
•	Blended Learning: A teaching approach combining face-to-face and online instruction.
•	Browser Extension: A lightweight software component added to a web browser to introduce new functionalities, such as automated participation tracking.
•	Class Participation: Observable actions of student engagement during class, including speaking, messaging, and reacting in online sessions.
•	Community of Inquiry Framework: A model of online learning emphasizing social, cognitive, and teaching presence as essential to meaningful education (Garrison, Anderson, & Archer, 2000).
•	Constructivist Learning Theory: A theory stating that learners build knowledge through interaction and active involvement (Vygotsky, 1978).
•	Dashboard: A visual interface displaying real-time summaries of collected participation data.
•	Engagement: The degree of attention, curiosity, and involvement that students demonstrate during learning activities.
•	Fairness: Equal recognition and assessment of all student participation regardless of the medium used.
•	Participation Event: A recorded instance of engagement, such as using the microphone, posting in chat, or sending a reaction.
•	Transparency: The visibility and verifiability of participation records and grading criteria for both instructors and students.
•	Usability: The degree to which users can effectively and efficiently use a system to achieve specific goals.



























CHAPTER II
Related Literature and Studies
A.	Related Literature
1.	Foreign Literature
Theoretical Foundations of Motivation and Engagement
The study of student participation and engagement in online learning is grounded in several psychological and educational theories. Self-Determination Theory (SDT), developed by Deci and Ryan (2000) and expanded by Ryan and Deci (2017), emphasizes that motivation arises when three basic psychological needs—autonomy, competence, and relatedness—are met. Within virtual classrooms, these needs influence how learners choose to engage in discussions, respond to tasks, and maintain active presence. Howard et al. (2021) confirm through meta-analysis that students who perceive higher autonomy and competence exhibit stronger engagement and persistence across learning contexts.
Constructivist Learning Theory, introduced by Vygotsky (1978), supports the view that knowledge is constructed through social interaction and collaboration. Online environments that enable dialogue and cooperation thus sustain deeper cognitive processing. Similarly, the Community of Inquiry (CoI) Framework of Garrison, Anderson, and Archer (2000) defines meaningful online learning as the interplay of teaching, social, and cognitive presence. These frameworks collectively guide the pedagogical rationale for ENGAGIUM, which encourages active participation through interactive tracking and feedback mechanisms that recognize all student contributions.
Talosa, Lonzaga, and Rivera (2025) add that teacher self-efficacy and blended delivery competence significantly determine engagement outcomes in higher education. This reinforces the need for digital tools that support both instructors and learners in maintaining interaction and motivation throughout hybrid modes of instruction.
________________________________________
Online Participation and Engagement 
Recent international literature underlines participation as acentral indicator of learning quality in digital classrooms. Oshodi (2022) assessed participation metrics in e-classrooms and reported that consistent instructor feedback and visible acknowledgment of student input directly increase attendance and engagement. Prasetyanto, Rizki, and Sunitiyoso (2022) examined post-pandemic online participation intentions among Indonesian students and found that convenience and perceived teacher responsiveness drive continued willingness to attend online classes.
Samnidze et al. (2023) identified technical readiness, social comfort, and instructor presence as the strongest determinants of active online participation. Bergdahl, Nouri, and Fors (2024) analyzed higher education engagement using learning analytics and noted that engagement is multidimensional—encompassing cognitive focus, behavioral participation, and emotional investment. Their findings emphasize that systematic tracking of participation data can reveal patterns that traditional manual observation may overlook.
Wongthong (2024) confirmed that synchronous platforms affect both student and parent perceptions of learning satisfaction, indicating that class participation is not just an academic metric but also a measure of institutional credibility and teaching quality.
________________________________________
Challenges in Monitoring Online Participation
Despite the pedagogical benefits of engagement, researchers highlight persistent barriers to accurately monitoring it in virtual environments. Donelan et al. (2025) noted that many students remain passive in synchronous sessions because of anxiety, unstable internet, or lack of opportunities to contribute. Kshirsagar and Inamdar (2023) investigated teacher experiences in evaluating participation and found that subjective criteria, inconsistent observation, and limited technological support hinder fair assessment.
Panmei and Devi (2024) examined participation challenges in South Asian contexts, concluding that socioeconomic factors, device accessibility, and inconsistent connectivity significantly affect online engagement. Al-Nofaie (2022) observed that even when students attend sessions regularly, instructors often fail to recognize non-verbal engagement—such as reactions or chat activity—which leads to perceived grading bias. These findings justify ENGAGIUM’s automated design, which captures multiple forms of participation to mitigate subjectivity.
Technology-Supported Participation Tracking
Technological advancement has enabled new forms of participation analytics. Gan and Ouh (2023) presented a framework for integrating real-time participation tracking through digital tools, demonstrating that automation improves grading efficiency and fairness. Márquez et al. (2023) established that feedback frequency and data-driven participation scoring positively influence academic performance and student motivation.
Kaliisa et al. (2024) reviewed learning analytics dashboards and found that visualization tools enhance learners’ self-awareness of participation but warned of potential data overload and interpretive bias. The VEMETER project (2025) introduced a participation evaluation tool capable of tracking and quantifying interaction frequency in virtual classes. Its results confirmed that automated participation metrics can increase teacher objectivity.
Further, Svábenský et al. (2024) assessed algorithmic bias in predictive models for student performance, emphasizing the need for transparent criteria in AI-based analytics—a principle central to ENGAGIUM’s fairness goal. Collectively, these systems provide proof that automated participation tracking and data visualization can transform how engagement is evaluated in online classrooms.
________________________________________
Fairness and Data Ethics in Educational Technology
Automation in participation tracking necessitates ethical safeguards. Loureiro et al. (2022) investigated how digital environments reveal varying participation forms and concluded that fairness depends on transparent metrics accessible to both instructors and students. Funa (2025) proposed policy guidelines for AI use in education, stressing data minimization, informed consent, and bias prevention.
In the context of privacy legislation, Foronda et al. (2023) analyzed the implementation of the Philippine Data Privacy Act of 2012 in organizational settings, outlining compliance challenges applicable to academic institutions. Miano (2025) found that many state universities in the Philippines lack standardized data privacy protocols, making ethical system design essential. These studies reinforce the principle that participation-tracking tools must collect only necessary, anonymized data—a practice fully reflected in ENGAGIUM’s software requirement specification.
2.	Local Literature
Post-Pandemic Engagement and Motivation in the Philippine Context
Filipino educators continue to face the challenge of sustaining student engagement after the shift to blended and flexible learning. Jopson et al. (2024) documented the lived experiences of college students adapting to hybrid instruction and found that engagement levels fluctuate depending on instructional mode and feedback visibility. Students often perceive online participation as undervalued compared to face-to-face interaction, underscoring the need for equitable digital participation assessment tools.
Ayog and Oliva (2023) studied writing competency and participation in Filipino classes, reporting that participation improved when students received structured recognition for their contributions. Their findings imply that digital participation trackers could reinforce participation by providing immediate acknowledgment.
In a complementary study, Aquino (2023) examined physical education participation in a state university and found that motivation depends on visibility of effort and instructor feedback—paralleling the same engagement mechanics needed in virtual settings. Together, these studies reveal that sustained engagement in Philippine higher education hinges on fairness, visibility, and feedback—three factors embedded in the ENGAGIUM system’s design.
________________________________________
Learning Analytics and LMS-Based Engagement
Local initiatives on educational analytics provide further support for automating participation evaluation. Rogers, Mercado, and Decano (2025) used Moodle interaction data to study correlations between online activity and academic performance. They concluded that frequency of participation and diversity of interactions predict higher achievement, validating the premise of data-driven engagement analysis.
Similarly, Cruz, Bautista, and Ramos (2025) leveraged predictive analytics on learning management system (LMS) logs at Centro Escolar University and found that participation patterns, such as discussion post frequency and chat involvement, significantly affect academic outcomes. Their work demonstrates that Philippine institutions are beginning to use engagement data as an academic performance indicator—a concept that ENGAGIUM advances by shifting this process to real-time participation capture.
________________________________________
Data Ethics and Institutional Privacy Compliance
Responsible data management has become a major theme in Philippine educational technology. Foronda, Javier, Vigonte, and Abante (2023) reviewed the implementation of the Data Privacy Act of 2012 (RA 10173) in local organizations and highlighted weak enforcement of data minimization and consent protocols. Miano (2025) confirmed this trend in a study of a state university, where most staff lacked awareness of privacy standards in data handling.
Sancon (2023) proposed a model for institutional data governance that can serve as a template for academic technology projects. These local works collectively emphasize that educational systems must ensure compliance with privacy legislation—a requirement explicitly integrated into ENGAGIUM’s security and compliance features as outlined in its software requirement specification.
________________________________________
Technology Acceptance and Faculty Readiness
Adoption of new classroom technology also depends on user acceptance. Porto (2025) found that organizational culture and faculty attitude strongly influence e-learning technology adoption. Quiban (2024) extended the Technology Acceptance Model (TAM) for LMS use in Philippine universities and concluded that perceived usefulness and ease of use directly affect adoption intent.
Alejandro, Sanchez, Sumalinog, Mananay, and Goles (2024) examined pre-service teachers’ acceptance of AI applications in education and noted that trust and ethical awareness determine user willingness to engage with AI-assisted systems. Cervantes and Navarro (2025) confirmed similar findings among business students, stressing the need for transparency in algorithmic decisions.
These insights guide ENGAGIUM’s user interface design and feature transparency—ensuring that professors perceive the system as both useful and ethically sound.
B.	Related Studies
1.	Foreign Studies
System Prototypes and Implementation Efforts
Several international prototypes have explored the automation of participation tracking in online learning. Gan and Ouh (2023) developed a system presented at the IEEE TALE Conference that automatically measures class participation through digital event logs and visual dashboards. Their findings demonstrated that technology-enhanced participation tracking improved fairness in grading and reduced instructor bias. Similarly, the VEMETER project (2025) introduced a virtual class participation evaluator capable of monitoring reaction frequency, speaking turns, and chat activity. Results confirmed that automated metrics could reflect true engagement levels more accurately than manual observation.
Márquez, Lazcano, Bada, and Arroyo-Barrigüete (2023) investigated how systematic feedback and participation monitoring affect academic performance. They observed a direct positive relationship between recorded participation data and students’ sense of inclusion, suggesting that visibility of contributions enhances motivation. These studies validate the practicality of systems like ENGAGIUM, which combine real-time detection and structured visualization of participation data for educational decision-making.
________________________________________
Learning Analytics Applications
The role of learning analytics has expanded from simple reporting to predictive modeling of engagement. Kaliisa, Misiejuk, López-Pernas, Khalil, and Saqr (2024) evaluated the effectiveness of learning analytics dashboards on students’ motivation and self-regulation. Their review found that dashboards heighten awareness of participation but may overwhelm users if not properly designed. This highlights the importance of clarity and usability—two priorities of ENGAGIUM’s interface.
Bergdahl, Nouri, and Fors (2024) noted that analytics can uncover hidden engagement patterns, enabling institutions to intervene early with disengaged students. Svábenský et al. (2024) examined algorithmic bias in predictive models and stressed the importance of explainable analytics to prevent unfair evaluation. These findings underscore ENGAGIUM’s commitment to data transparency and unbiased processing in representing student engagement.
AI and Bias Evaluation
As artificial intelligence increasingly supports educational analytics, ethical considerations emerge. Loureiro, Bettencourt, Raposo-Rivas, and Ocaña (2022) analyzed participation visualization tools and argued that student data must be contextualized rather than used for surveillance. Funa (2025) expanded this perspective by outlining policy recommendations for AI in education, including bias mitigation and privacy protection mechanisms. Both studies underline that ethical governance should be integrated into software architecture—a guideline observed in ENGAGIUM’s design where participation data are anonymized and limited to textual event metadata.
These foreign studies collectively provide the technological and ethical foundations of ENGAGIUM’s proposed system. They prove that automation and analytics can meaningfully quantify participation without compromising fairness or privacy when properly implemented.
2.	Local Studies
Real-Time Participation Analytics in Philippine Higher Education
Empirical research in Philippine higher education demonstrates the technical and institutional readiness for real-time participation analytics. Rogers, Mercado, and Decano (2025) examined Moodle interaction logs and reported that frequency and diversity of participation predict better course outcomes. Their findings confirm that engagement data, when systematically collected, carry significant academic value. Similarly, Cruz, Bautista, and Ramos (2025) used predictive analytics on LMS datasets at a Philippine university and found that discussion and chat activities strongly correlate with final grades. These studies show that automatically captured participation data can function as valid indicators of student engagement and performance—core to the analytical model that ENGAGIUM seeks to implement.
Beyond correlation, these works highlight the emerging research culture around participation data as a pedagogical resource. The integration of LMS analytics into course evaluation reflects a growing shift toward evidence-based teaching and automated performance tracking in local institutions. ENGAGIUM builds upon these empirical efforts by capturing real-time participation signals from synchronous platforms and converting them into transparent, instructor-accessible engagement metrics.
________________________________________
Human-Centered Dashboard Design
Design-oriented studies in the Philippines emphasize usability and participatory development of learning analytics tools. Revano and Garcia (2025) from FEU Institute of Technology created a human-centered analytics dashboard for higher education using participatory design principles. They reported higher faculty acceptance when dashboards prioritized clarity, visual simplicity, and actionable summaries. This demonstrates that usability and interpretability are crucial for adoption among instructors.
The study’s findings directly inform ENGAGIUM’s interface design, which aims to balance analytic depth with simplicity. By offering intuitive visualization and configurable reporting, ENGAGIUM aligns with the participatory design ethos proven effective in local contexts.
________________________________________
Technology Acceptance and Predictive Systems
Local research also underscores the role of perceived usefulness and institutional culture in technology adoption. Quiban (2024) and Porto (2025) extended the Technology Acceptance Model (TAM) to local higher education institutions and found that ease of use, perceived utility, and supportive culture drive adoption. Alejandro et al. (2024) and Cervantes & Navarro (2025) further identified trust and ethical transparency as determinants of willingness to adopt AI-enhanced learning tools.
These insights complement empirical analytics studies by Rogers et al. (2025) and Cruz et al. (2025), whose predictive models link online engagement with performance. Together, they show that analytics systems succeed when they are both technically reliable and ethically transparent—principles central to ENGAGIUM’s faculty workflow and reporting framework.
________________________________________
Data Privacy and System Governance
Data governance remains a recurring concern in Philippine educational technology. Foronda et al. (2023) reviewed implementation of the Data Privacy Act (RA 10173) and found weak institutional practices in consent and data minimization. Miano (2025) confirmed low awareness of privacy standards among staff in state universities, while Sancon (2023) proposed a governance model emphasizing transparency and role-based control.
These studies collectively justify ENGAGIUM’s privacy-centric architecture, which limits collection to event metadata, requires informed consent, and enforces access restrictions based on user role. By embedding privacy by design, ENGAGIUM operationalizes local data protection requirements within its system specification.
C.	Synthesis of the Literature and Studies
Across both foreign and local literature, three recurring research gaps emerge. First, there remains an absence of localized, real-time participation tracking systems that can integrate directly with synchronous learning platforms such as Zoom or Google Meet. While several international prototypes have demonstrated the feasibility of automated engagement analytics, Philippine studies have so far relied mainly on retrospective LMS logs. This limits their capacity to capture live, multimodal participation events that occur during online classes.
Second, there is limited empirical evaluation of fairness, transparency, and usability in existing automated engagement tools. Many studies acknowledge the promise of analytics dashboards but stop short of assessing how these tools affect perception of equity in participation grading or instructor decision-making. Ethical issues surrounding bias, interpretability, and informed consent remain underexplored, particularly in local higher education contexts where data privacy compliance is still inconsistent.
Third, the linkage between educational data mining and classroom-level analytics is insufficient. Although institutional databases and LMS records provide rich information, few systems in Philippine higher education connect these data streams to real-time classroom engagement or instructor-facing dashboards. As a result, participation metrics often remain fragmented, delaying feedback and reducing their pedagogical usefulness.
ENGAGIUM directly addresses these gaps through three design commitments. It integrates automation by capturing live participation through a browser-based extension, enabling real-time analytics without additional instructor workload. It ensures fair data visualization by providing transparent scoring and simplified dashboards that highlight measurable engagement indicators. Finally, it upholds privacy-compliant analytics by adhering to RA 10173 through data minimization, consent-based collection, and role-based access control. Together, these features position ENGAGIUM as a localized, ethical, and practical solution for participation tracking in Philippine higher education.








CHAPTER III
Methods of Research and Procedures
Research Methodology
Research Design
Data Gathering
Statistical Treatment














BIBLIOGRAPHY

Bonwell, C. C., & Eison, J. A. (n.d.). Active Learning: Creating excitement in the classroom. 1991 ASHE-ERIC Higher Education Reports. https://eric.ed.gov/?id=ED336049
Bond, M., & Bedenlier, S. (n.d.). Facilitating Student Engagement through Educational Technology: Towards a Conceptual Framework. https://eric.ed.gov/?id=EJ1228555
Brookhart, S. M. (2013). How to create and use rubrics for formative assessment and grading. ASCD.
Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319. https://doi.org/10.2307/249008
Fu, P., Gao, C., Chen, X., Zhang, Z., Chen, J., & Yang, D. (2024). Proactive personality and its impact on online learning engagement through positive emotions and learning motivation. Scientific Reports, 14(1), 28144. https://doi.org/10.1038/s41598-024-79776-3
Garrison, D., Anderson, T., & Archer, W. (1999). Critical inquiry in a Text-Based Environment: Computer Conferencing in Higher Education. The Internet and Higher Education, 2(2–3), 87–105. https://doi.org/10.1016/s1096-7516(00)00016-6
Karmini, N. W., Yudabakti, I. M., Seniwati, D. N., Makulua, K., & Burnama, N. (2024). The Effect of Student Participation through the Use of Online Learning Platforms in improving student learning outcomes. International Journal of Language and Ubiquitous Learning, 2(1). https://doi.org/10.70177/ijlul.v2i1.752
Martin, F., & Bolliger, D. U. (2018). Engagement Matters: Student perceptions on the importance of engagement strategies in the online learning environment. Online Learning, 22(1). https://doi.org/10.24059/olj.v22i1.1092
Oecd. (2020). Education in the digital age. In Educational research and innovation. https://doi.org/10.1787/1209166a-en
Siemens, G. (2013). Learning Analytics. American Behavioral Scientist, 57(10), 1380–1400. https://doi.org/10.1177/0002764213498851
Vygotsky, L. S. (1978). Mind in society: The development of higher psychological processes. Harvard University Press.
Student Engagement in Online Learning: A review. (2017, June 1). IEEE Conference Publication | IEEE Xplore. https://ieeexplore.ieee.org/document/8005384
Deci, E. L., & Ryan, R. M. (2000). The “What” and “Why” of goal pursuits: human needs and the Self-Determination of behavior. Psychological Inquiry, 11(4), 227–268. https://doi.org/10.1207/s15327965pli1104_01
Ryan, R. M., & Deci, E. L. (2017). Self-determination theory: Basic psychological needs in motivation, development, and wellness. The Guilford Press. https://doi.org/10.1521/978.14625/28806
Howard, J. L., Bureau, J. S., Guay, F., Chong, J. X. Y., & Ryan, R. M. (2021). Student Motivation and Associated Outcomes: A Meta-Analysis from Self-Determination Theory. Perspectives on Psychological Science, 16(6), 1300–1323. https://doi.org/10.1177/1745691620966789
Garrison, D., Anderson, T., & Archer, W. (1999b). Critical inquiry in a Text-Based Environment: Computer Conferencing in Higher Education. The Internet and Higher Education, 2(2–3), 87–105. https://doi.org/10.1016/s1096-7516(00)00016-6
Talosa, A. D., Acidera, R. A., Tamanu, M. J. M., & Sumer, J. J. M. (2025). Knowledge, Self-efficacy and Effectiveness in Leveraging blended Delivery System: A study of Higher education teachers. International Journal of Instruction, 18(2), 709–726. https://doi.org/10.29333/iji.2025.18238a
Oshodi, O. (2024). Assessment of students’ attendance, participation and classroom involvement in E-classroom. International Conference on Education Research, 1(1), 442–448. https://doi.org/10.34190/icer.1.1.3192
Prasetyanto, D., Rizki, M., & Sunitiyoso, Y. (2022). Online Learning Participation Intention after COVID-19 Pandemic in Indonesia: Do Students Still Make Trips for Online Class? Sustainability, 14(4), 1982. https://doi.org/10.3390/su14041982
Samnidze, N., Didmanidze, I., Diasamidze, M., Akhvlediani, D., & Kirvalidze, N. (2023). Critical factors influencing classroom participation in online learning. Platforms, 1(1), 26–33. https://doi.org/10.3390/platforms1010004
Bergdahl, N., Bond, M., Sjöberg, J., Dougherty, M., & Oxley, E. (2024). Unpacking student engagement in higher education learning analytics: a systematic review. International Journal of Educational Technology in Higher Education, 21(1). https://doi.org/10.1186/s41239-024-00493-y
Wongthong, P. (n.d.-b). Influence of synchronous online learning on students’ and parents’ perceptions: a case study of a demonstration school. https://eric.ed.gov/?q=source%3a%22Journal+of+Educators+Online%22&ff1=eduGrade+4&id=EJ1462234
Rogers, J. K. B., Mercado, T. C. R., & Decano, R. S. (2024). Moodle interactions and academic performance: educational data mining in a Philippine university. Journal of Education and Learning (EduLearn), 19(1), 542–550. https://doi.org/10.11591/edulearn.v19i1.21549
Cruz, J. H., Florentino, M. C. A., Lacatan, L. L., & Peralta, R. L. (2025). Leveraging Predictive Analytics on LMS Logs to Examine the Impact of Engagement on Academic Performance among College Students Enrolled in Centro Escolar University. International Journal of Research and Scientific Innovation, XII(I), 563–573. https://doi.org/10.51244/ijrsi.2025.12010051
Donelan, H., Kear, K., Rosewell, J., Okada, A., Sheehy, K., Amor, K., Edwards, C., Mooney, A., Cuffe, P., & Elder, T. (2025). Synchronous online learning: why some students don’t actively participate. Online Learning, 29(3). https://doi.org/10.24059/olj.v29i3.4641
Burbage, A. K., Gesing, P., & Ashley, D. (2023). Protocol for applying the Learning Environment Diversity, Equity, and Inclusion tool to asynchronous health professions courses. International Journal of Educational Research Open, 5, 100277. https://doi.org/10.1016/j.ijedro.2023.100277
Simon, P. D., Jiang, J., & Fryer, L. K. (2025). Assessment of class participation in online and offline learning environments: a qualitative investigation of teachers’ best practices and challenges. Higher Education Research & Development, 44(5), 1191–1208. https://doi.org/10.1080/07294360.2025.2462024
Kabir, R., & Mondal, M. S. H. (2025). PERCEIVED BENEFITS OR BARRIERS? THE ONLINE LEARNING EXPERIENCE OF BANGLADESHI UNDERGRADUATE STUDENTS. Malaysian Online Journal of Educational Sciences, 13(2), 53–63. https://doi.org/10.22452/mojes.vol13no2.5
Hamad, W. (2022). Understanding the foremost challenges in the transition to online teaching and learning during COVID-19 pandemic: A systematic literature review. Journal of Educational Technology and Online Learning, 5(2), 393–410. https://doi.org/10.31681/jetol.1055695
Gan, B., & Ouh, E. L. (2023). Class participation: Using technology to enhance efficiency and fairness. IEEE TALE 2023, 1–8. https://doi.org/10.1109/TALE56641.2023.10398380
Márquez, J., Lazcano, L., Bada, C., & Arroyo-Barrigüete, J. L. (2023). Class participation and feedback as enablers of student academic performance. SAGE Open, 13(2). https://doi.org/10.1177/21582440231177298
Kaliisa, R., Misiejuk, K., López-Pernas, S., Khalil, M., & Saqr, M. (2023). Have learning Analytics dashboards lived up to the hype? A systematic review of impact on students’ achievement, motivation, participation and attitude. arXiv (Cornell University). https://doi.org/10.48550/arxiv.2312.15042
VEMETER (2025). A tool for evaluating participation levels in virtual class sessions. IEEE EDUCON Conference Proceedings, 2025. https://doi.org/10.1109/EDUCON62633.2025.11016534
Revano, T. F., & Garcia, M. B. (2021). Designing Human-Centered Learning Analytics Dashboard for Higher Education using a participatory design approach. 2021 IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM), 1–5. https://doi.org/10.1109/hnicem54116.2021.9731917
Švábenský, V., Verger, M., Rodrigo, M. M. T., Monterozo, C. J. G., Baker, R. S., Saavedra, M. Z. N. L., Lallé, S., & Shimada, A. (2024). Evaluating algorithmic bias in models for predicting academic performance of Filipino students. arXiv (Cornell University). https://doi.org/10.48550/arxiv.2405.09821
Bustillo, E., & Aguilos, M. (2022). The challenges of modular learning in the wake of COVID-19: a digital divide in the Philippine countryside revealed. Education Sciences, 12(7), 449. https://doi.org/10.3390/educsci12070449
Foronda, S. M., Javier, N., Vigonte, F., & Abante, M. V. (2023). Implementation of Republic Act 10173 or the Data Privacy Act of 2012 in Albay Electric Cooperative (ALECO) - IMRAD. SSRN Electronic Journal. https://doi.org/10.2139/ssrn.4621933
Miano, L. C. (2025). Awareness on data privacy vis-à-vis data management practices at a state university in Quezon province: Input towards data-driven policy and manual for good governance. Edelweiss Applied Science and Technology, 9(1), 302–315. https://doi.org/10.55214/25768484.v9i1.4130
Funa, A. A., & Gabay, R. a. E. (2024). Policy guidelines and recommendations on AI use in teaching and learning: A meta-synthesis study. Social Sciences & Humanities Open, 11, 101221. https://doi.org/10.1016/j.ssaho.2024.101221
Jopson, A. A. E., et al. (2024). The lived experiences of College students in adapting the blended learning. BAHÁNDÌAN, Institutional Repository of Central Philippine University. https://hdl.handle.net/20.500.12852/3309
Ayog, J. T., & Oliva, E. R. A. (2023). Writing Competency and student participation in Filipino class: The Mediating Effect of Reading Strategy. Asian Journal of Education and Social Studies, 49(4), 84–94. https://doi.org/10.9734/ajess/2023/v49i41190
Aquino, J. M. D. (2023). Assessing the role of recreational activities in physical education participation of college students in one state university in Laguna Philippines. International Journal of Multidisciplinary Sciences, 1(2), 190–204. https://doi.org/10.37329/ijms.v1i2.2506
Sancon, R. J. S. (2023). Data Privacy Best practices of a local higher Educational Institution: a model for governance. International Multidisciplinary Research Journal. https://doi.org/10.54476/ioer-imrj/688585
Porto, A. E. (2025). Adopting e-learning technologies in higher educational institutions: The role of organizational culture, technology acceptance and attitude. Review of Social Sciences, 5(1). https://doi.org/10.18533/rss.v5i1.143
Quiban, J. (2024). Faculty Acceptance and Adoption of Learning Management Systems (LMS) using the Extended Technology Acceptance Model (ETAM). Journal of Innovative Technology Convergence., 6(1), 1–14. https://doi.org/10.69478/jitc2024v6n2a01
Alejandro, I. M. V., Sanchez, J. M. P., Sumalinog, G. G., Mananay, J. A., Goles, C. E., & Fernandez, C. B. (2024). Pre-service teachers’ technology acceptance of artificial intelligence (AI) applications in education. STEM Education, 4(4), 445–465. https://doi.org/10.3934/steme.2024024
Cervantes, J., & Navarro, E. (2025). Business Students’ Perceptions of AI in Higher Education: An analysis using the Technology Acceptance Model. Journal of Interdisciplinary Perspectives, 3(6). https://doi.org/10.69569/jip.2025.194
Cruz, J. H., Florentino, M. C. A., Lacatan, L. L., & Peralta, R. L. (2025). Leveraging Predictive Analytics on LMS Logs to Examine the Impact of Engagement on Academic Performance among College Students Enrolled in Centro Escolar University. International Journal of Research and Scientific Innovation, XII(I), 563–573. https://doi.org/10.51244/ijrsi.2025.12010051
Rogers, J. K. B., Mercado, T. C. R., & Decano, R. S. (2024). Moodle interactions and academic performance: educational data mining in a Philippine university. Journal of Education and Learning (EduLearn), 19(1), 542–550. https://doi.org/10.11591/edulearn.v19i1.21549




