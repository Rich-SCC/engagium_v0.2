# APPENDIX G  
STATISTICAL TREATMENT DETAILS

## G.1 Likert Scale Interpretation Table

For all 5-point Likert scale items (1 = Strongly Disagree to 5 = Strongly Agree), the following interpretation ranges are used:

| Weighted Mean Range | Verbal Interpretation  |
|---------------------|------------------------|
| 4.21 – 5.00         | Very High / Strongly Agree |
| 3.41 – 4.20         | High / Agree          |
| 2.61 – 3.40         | Moderate / Neutral    |
| 1.81 – 2.60         | Low / Disagree        |
| 1.00 – 1.80         | Very Low / Strongly Disagree |

These ranges are applied when interpreting composite scores for constructs such as perceived usefulness, perceived ease of use, behavioral intention, feasibility, usability expectations, and data privacy concerns.

---

## G.2 SUS Scoring Procedure and Example Computation

The System Usability Scale (SUS) consists of 10 items rated on a 5-point scale (1 = Strongly Disagree to 5 = Strongly Agree) (Brooke, 1996; Bangor et al., 2008). To compute the SUS score for one respondent:

1. Record the response for each item (1–10).
2. For **odd-numbered items** (1, 3, 5, 7, 9), compute:

   $$X_{\text{odd}} = \text{response} - 1$$

3. For **even-numbered items** (2, 4, 6, 8, 10), compute:

   $$X_{\text{even}} = 5 - \text{response}$$

4. Sum all adjusted scores:

   $$S = \sum_{i=1}^{10} X_i$$

5. Multiply the sum by 2.5 to obtain the SUS score:

   $$\text{SUS score} = S \times 2.5$$

### Sample Computation

Suppose a respondent gives the following ratings:

1: 4, 2: 3, 3: 4, 4: 2, 5: 5, 6: 3, 7: 4, 8: 2, 9: 5, 10: 3  

Adjusted scores:

- Odd items: (4−1) + (4−1) + (5−1) + (4−1) + (5−1) = 3 + 3 + 4 + 3 + 4 = 17  
- Even items: (5−3) + (5−2) + (5−3) + (5−2) + (5−3) = 2 + 3 + 2 + 3 + 2 = 12  

Total $S = 17 + 12 = 29$.  

SUS score:

$$\text{SUS score} = 29 \times 2.5 = 72.5$$

A score of 72.5 is above the commonly cited average of 68 and indicates good perceived usability (Bangor et al., 2008).

---

## G.3 Precision, Recall, and F1 Score Formulas with Sample Calculation

To evaluate the accuracy of ENGAGIUM’s participation detection, the following metrics are used (Powers, 2011):

- **True Positive (TP)** – Event correctly detected by the system and present in ground truth.
- **False Positive (FP)** – Event detected by the system but not present in ground truth.
- **False Negative (FN)** – Event present in ground truth but missed by the system.

The formulas are:

$$\text{Precision} = P = \frac{TP}{TP + FP}$$

$$\text{Recall} = R = \frac{TP}{TP + FN}$$

$$F1 = 2 \times \frac{P \times R}{P + R}$$

### Sample Computation

Assume that for chat message detection in one session:

- TP = 45  
- FP = 5  
- FN = 10  

Then:

$$P = \frac{45}{45 + 5} = \frac{45}{50} = 0.90$$

$$R = \frac{45}{45 + 10} = \frac{45}{55} \approx 0.82$$

$$F1 = 2 \times \frac{0.90 \times 0.82}{0.90 + 0.82}
= 2 \times \frac{0.738}{1.72}
\approx 2 \times 0.429
\approx 0.86$$

In this example, the system shows high precision (few false positives) and reasonably high recall (most actual events are detected), with an overall F1 score of approximately 0.86.

---

## G.4 Cronbach’s Alpha Formula and Sample Reliability Computation

To assess the internal consistency of multi-item scales (e.g., perceived usefulness, perceived ease of use), **Cronbach’s alpha (α)** is computed (Taber, 2018).

For a scale with $k$ items:

$$\alpha = \frac{k}{k - 1} \left(1 - \frac{\sum_{i=1}^{k} \sigma_i^2}{\sigma_T^2}\right)$$

where:

- $k$ = number of items in the scale  
- $\sigma_i^2$ = variance of item $i$  
- $\sigma_T^2$ = variance of the total score (sum of all items) for each respondent  

### Sample Computation (Illustrative)

Suppose a 5-item perceived usefulness scale is administered to a group of respondents, and the following are obtained:

- Item variances: $\sigma_1^2 = 0.40$, $\sigma_2^2 = 0.35$, $\sigma_3^2 = 0.45$, $\sigma_4^2 = 0.50$, $\sigma_5^2 = 0.30$  
- Total score variance (sum of the 5 items): $\sigma_T^2 = 2.50$

First, compute the sum of item variances:

$$\sum_{i=1}^{5} \sigma_i^2 = 0.40 + 0.35 + 0.45 + 0.50 + 0.30 = 2.00$$

Then:

$$\alpha = \frac{5}{5-1} \left(1 - \frac{2.00}{2.50}\right)
= \frac{5}{4} \left(1 - 0.80\right)
= 1.25 \times 0.20
= 0.25$$

In practice, acceptable alpha values are generally interpreted as:

- ≥ 0.90: Excellent  
- 0.80–0.89: Good  
- 0.70–0.79: Acceptable  
- 0.60–0.69: Questionable  
- 0.50–0.59: Poor  
- < 0.50: Unacceptable  

(Exact cut-offs may vary across disciplines; see Taber, 2018.)

Researchers compute Cronbach’s alpha for each multi-item construct and report whether internal consistency is acceptable for the purposes of the study.