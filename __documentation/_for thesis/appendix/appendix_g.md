# APPENDIX G  
STATISTICAL TREATMENT DETAILS

This appendix presents the statistical procedures used to analyze the survey data, usability scores, and detection accuracy results for the ENGAGIUM study. The procedures are aligned with the pre-development and post-development instruments presented in Appendix F.

---

## G.1 Weighted Mean Computation and Interpretation

Weighted means are used to summarize responses from all non-SUS 5-point Likert-scale items in the study, including the pre-development constructs and the post-development evaluation constructs.

For a 5-point scale, the weighted mean is computed as:

$$\bar{X}_w = \frac{\sum f_i x_i}{\sum f_i}$$

where:

- $f_i$ = frequency of responses at rating $i$
- $x_i$ = numeric value of the rating
- $\bar{X}_w$ = weighted mean

The following interpretation ranges are used for all 5-point Likert-scale items:

| Weighted Mean Range | Verbal Interpretation |
|---------------------|-----------------------|
| 4.21 – 5.00 | Very High / Strongly Agree |
| 3.41 – 4.20 | High / Agree |
| 2.61 – 3.40 | Moderate / Neutral |
| 1.81 – 2.60 | Low / Disagree |
| 1.00 – 1.80 | Very Low / Strongly Disagree |

These ranges are applied to the pre-development constructs in Appendix F.2 and to the post-development constructs in Appendix F.4, excluding the SUS items, which are scored separately.

---

## G.2 System Usability Scale (SUS) Scoring and Interpretation

The System Usability Scale (SUS) consists of 10 items rated on a 5-point Likert scale (1 = Strongly Disagree to 5 = Strongly Agree) (Brooke, 1996; Bangor et al., 2008). SUS is used in the post-development evaluation to measure perceived usability of ENGAGIUM.

To compute the SUS score for one respondent:

1. Record the response for each SUS item (1–10).
2. For **odd-numbered items** (1, 3, 5, 7, 9), compute:

   $$X_i = \text{response} - 1$$

3. For **even-numbered items** (2, 4, 6, 8, 10), compute:

   $$X_i = 5 - \text{response}$$

4. Sum all adjusted item scores:

   $$S = \sum_{i=1}^{10} X_i$$

5. Multiply the sum by 2.5 to obtain the SUS score:

   $$\text{SUS score} = S \times 2.5$$

SUS scores range from 0 to 100, where higher values indicate better perceived usability.

### Interpretation Guide

SUS scores are interpreted using established benchmark categories (Bangor et al., 2008; Sauro & Lewis, 2016):

| SUS Score Range | Grade | Adjective Rating | Percentile Range |
|-----------------|-------|------------------|------------------|
| 84.1 – 100 | A+ | Best Imaginable | 96 – 100 |
| 80.8 – 84.0 | A | Excellent | 90 – 95 |
| 78.9 – 80.7 | A- | — | 85 – 89 |
| 77.2 – 78.8 | B+ | — | 80 – 84 |
| 74.1 – 77.1 | B | Good | 70 – 79 |
| 72.6 – 74.0 | B- | — | 65 – 69 |
| 71.1 – 72.5 | C+ | — | 60 – 64 |
| 65.0 – 71.0 | C | OK | 41 – 59 |
| 62.7 – 64.9 | C- | — | 35 – 40 |
| 51.7 – 62.6 | D | Poor | 15 – 34 |
| 0 – 51.6 | F | Worst Imaginable | 0 – 14 |

The benchmark score of 68 is commonly used as a reference point for average usability.

---

## G.3 Detection Accuracy Metrics

To evaluate the accuracy of ENGAGIUM’s participation-event detection, the following metrics are used (Powers, 2011):

- **True Positive (TP)** – An event correctly detected by the system and present in ground truth.
- **False Positive (FP)** – An event detected by the system but not present in ground truth.
- **False Negative (FN)** – An event present in ground truth but missed by the system.

The formulas are:

$$\text{Precision} = \frac{TP}{TP + FP}$$

$$\text{Recall} = \frac{TP}{TP + FN}$$

$$F1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

These metrics are applied to relevant participation-event categories such as participant joins/leaves, chat messages, reactions, hand raises, and microphone-related events, depending on the availability of ground-truth data.

For interpretation, higher precision indicates fewer false positives, higher recall indicates fewer missed events, and the F1 score provides a balanced measure of overall detection performance.

---

## G.4 Internal Consistency Reliability

Internal consistency reliability for each multi-item construct is assessed using **Cronbach’s alpha (α)** (Taber, 2018).

For a scale with $k$ items:

$$\alpha = \frac{k}{k - 1} \left(1 - \frac{\sum_{i=1}^{k} \sigma_i^2}{\sigma_T^2}\right)$$

where:

- $k$ = number of items in the scale
- $\sigma_i^2$ = variance of item $i$
- $\sigma_T^2$ = variance of the total score across respondents

Cronbach’s alpha is computed for the pre-development Likert constructs in Appendix F.2 and the post-development Likert constructs in Appendix F.4, excluding the SUS items, which are summarized separately through the SUS scoring procedure.

### Interpretation Guide

| α Value | Interpretation |
|---------|----------------|
| ≥ 0.90 | Excellent |
| 0.80 – 0.89 | Good |
| 0.70 – 0.79 | Acceptable |
| 0.60 – 0.69 | Questionable |
| 0.50 – 0.59 | Poor |
| < 0.50 | Unacceptable |

These thresholds are used as a practical guide for evaluating the reliability of each construct prior to interpretation of the survey results.

---

## G.5 Summary of Statistical Treatment by Data Type

| Data Type | Statistical Treatment |
|-----------|-----------------------|
| Respondent profile data | Frequency counts and percentages |
| Pre-development Likert-scale items | Weighted mean and verbal interpretation |
| Post-development Likert-scale items | Weighted mean and verbal interpretation |
| SUS items | Standard SUS scoring and benchmark interpretation |
| Detection accuracy data | Precision, recall, and F1 score |
| Multi-item scales | Cronbach’s alpha |
| Open-ended responses | Thematic grouping |

This statistical treatment supports both the baseline assessment of the problem and the post-development evaluation of ENGAGIUM’s usability, effectiveness, and performance.
