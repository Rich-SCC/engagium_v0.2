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