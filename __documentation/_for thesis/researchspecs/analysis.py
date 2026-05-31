import pandas as pd
import numpy as np

def cronbach_alpha(df):
    df = df.dropna()
    item_vars = df.var(axis=0, ddof=1)
    t_scores = df.sum(axis=1)
    n_items = df.shape[1]
    return (n_items / (n_items - 1)) * (1 - (item_vars.sum() / t_scores.var(ddof=1)))

# --- Pre-Prod Analysis ---
print("--- Pre-Prod Analysis ---")
# Pre-prod skip first 5 lines (header noise)
# The header row is the one with Respondent/Profile info. 
# Looking at the head output, line 5 has SECTION 2/3 info, line 6 has labels, line 7 has sub-labels.
# It seems actual data starts from line 8.
# Let's try to read it specifically.
try:
    pre_df = pd.read_csv("__documentation/_for thesis/researchspecs/pre-prod survey data.csv", skiprows=5)
    # The first row of pre_df contains sub-headers like Q1, Q2...
    # The actual data seems to follow.
    # Actually, let's re-read identifying the correct header index.
    # Looking at the cat output:
    # 0: ,,,,
    # 1: ,,,,
    # 2: ,,,,
    # 3: ,,,,
    # 4: SECTION 2, SECTION 3...
    # 5: ,PROFILE,,,SECTION A,,,,,SECTION 1...
    # 6: ,Name,Email,Date,Q1...
    # 7: row 1
    
    pre_df = pd.read_csv("__documentation/_for thesis/researchspecs/pre-prod survey data.csv", skiprows=6)
    # Column mapping for Pre-Prod (approx based on head output and thesis requirements)
    # SECTION 1: PV (5 items?), Section 2: PU, PEOU, BI, FC, Section 3: DIE, RP, TO, DP...
    # This needs exact mapping. Given the complexity, I will infer from standard sizes.
    # Mapping based on common questionnaire layouts for these constructs:
    # PV: 5 items, PU: 4, PEOU: 4, BI: 3, FC: 3, DIE: 3, RP: 3, TO: 3, DP: 3 (Guessing)
    # Let's just output the columns to see.
    print(f"Pre-prod columns: {list(pre_df.columns)}")
    print(f"Pre-prod shape: {pre_df.shape}")
    
    # Profile: Q1(Dept), Q2(Experience), Q3(Sessions), Q4(Students), Q5(Device)
    dept_counts = pre_df['Q1'].value_counts()
    print("Pre-prod Dept counts:\n", dept_counts)

except Exception as e:
    print(f"Error reading pre-prod: {e}")

# --- Post-Prod Analysis ---
print("\n--- Post-Prod Analysis ---")
try:
    post_df = pd.read_csv("__documentation/_for thesis/researchspecs/post-prod survey data.csv", skiprows=5)
    print(f"Post-prod shape: {post_df.shape}")
    # SUS: SUS1-10
    sus_cols = [f'SUS{i}' for i in range(1, 11)]
    # SUS items are 1-indexed. Odds are positive (x-1), evens are negative (5-x).
    def calc_sus(row):
        score = 0
        for i in range(1, 11):
            val = row[f'SUS{i}']
            if i % 2 == 1: score += (val - 1)
            else: score += (5 - val)
        return score * 2.5
    
    post_df['sus_score'] = post_df[sus_cols].apply(calc_sus, axis=1)
    print(f"SUS Mean: {post_df['sus_score'].mean():.2f}")
    
    # Cronbach for SUS
    print(f"SUS Alpha: {cronbach_alpha(post_df[sus_cols]):.4f}")

    # Groups: EFF (Effectiveness1-5), PR (Performance1-5), UI (Interface1-5), SAT (Satisfaction1-4)
    # Wait, is it PR or PU? The prompt says PR.
    groups = {
        'EFF': [f'Effectiveness{i}' for i in range(1, 6)],
        'PR': [f'Performance{i}' for i in range(1, 6)],
        'UI': [f'Interface{i}' for i in range(1, 6)],
        'SAT': [f'Satisfaction{i}' for i in range(1, 5)]
    }
    for name, cols in groups.items():
        sub = post_df[cols]
        print(f"{name} Mean: {sub.mean().mean():.2f}, Alpha: {cronbach_alpha(sub):.4f}")

    # Usage contexts
    print("Platform Used counts:\n", post_df['PlatformUsed'].value_counts())

except Exception as e:
    print(f"Error reading post-prod: {e}")
