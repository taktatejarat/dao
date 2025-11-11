import numpy as np
import pandas as pd

# --- Step 1: Base Simulation Setup (Same as before) ---
DAO_TREASURY = 1_000_000
NUM_VOTERS = 1000
NUM_PROPOSALS = 5
ALPHA = 0.4
BETA = 0.6

# Generate the legitimate voter population
token_holdings = np.random.lognormal(mean=8, sigma=1.8, size=NUM_VOTERS)
participation_scores = np.random.normal(loc=100, scale=40, size=NUM_VOTERS)
participation_scores[participation_scores < 0] = 0
voters_df = pd.DataFrame({
    'voter_id': range(NUM_VOTERS),
    'tokens': token_holdings,
    'pop_score': participation_scores,
    'is_sybil': False
})

# Define proposals
proposals = [
    {'proposal_id': 'P-1', 'hype_score': 0.25, 'ai_risk_score': 0.35},
    {'proposal_id': 'P-2', 'hype_score': 1.0,  'ai_risk_score': 0.49},
    {'proposal_id': 'P-3', 'hype_score': 0.15, 'ai_risk_score': 0.06}, # Target for attack
    {'proposal_id': 'P-4', 'hype_score': 0.8,  'ai_risk_score': 0.46},
    {'proposal_id': 'P-5', 'hype_score': 0.6,  'ai_risk_score': 0.39}
]
proposals_df = pd.DataFrame(proposals)

# Legitimate voting
voting_probabilities = proposals_df['hype_score'] / proposals_df['hype_score'].sum()
voters_df['voted_for'] = np.random.choice(proposals_df['proposal_id'], size=NUM_VOTERS, p=voting_probabilities)

# --- Step 2: Introduce the Sybil Attacker ---
NUM_SYBIL_ACCOUNTS = 1500
ATTACK_TARGET_PROPOSAL = 'P-3'

print(f"\n--- Simulating Sybil Attack ---")
print(f"{NUM_SYBIL_ACCOUNTS} Sybil accounts are created to attack Proposal {ATTACK_TARGET_PROPOSAL}.\n")

sybil_tokens = np.random.uniform(1, 20, size=NUM_SYBIL_ACCOUNTS)
sybil_df = pd.DataFrame({
    'voter_id': range(NUM_VOTERS, NUM_VOTERS + NUM_SYBIL_ACCOUNTS),
    'tokens': sybil_tokens,
    'pop_score': 0,  # Sybil accounts have no history
    'is_sybil': True,
    'voted_for': ATTACK_TARGET_PROPOSAL
})

# Combine legitimate and Sybil voters
combined_voters_df = pd.concat([voters_df, sybil_df], ignore_index=True)

# --- Step 3: Recalculate Results with Sybil Voters ---
attack_results = []
for pid in proposals_df['proposal_id']:
    voters_for_proposal = combined_voters_df[combined_voters_df['voted_for'] == pid]
    
    raw_vote_score = voters_for_proposal['tokens'].sum()
    pop_adjusted_score = ((ALPHA * voters_for_proposal['tokens']) + (BETA * voters_for_proposal['pop_score'])).sum()
    
    ai_risk = proposals_df[proposals_df['proposal_id'] == pid]['ai_risk_score'].iloc[0]
    
    attack_results.append({
        'Proposal ID': pid,
        'Raw Vote Score (Attack)': raw_vote_score,
        'PoP-Adjusted Score (Attack)': pop_adjusted_score,
        'AI Risk Score': ai_risk
    })
attack_results_df = pd.DataFrame(attack_results)

# Calculate final ranks
attack_results_df['Traditional Rank (Attack)'] = attack_results_df['Raw Vote Score (Attack)'].rank(ascending=False, method='first').astype(int)
attack_results_df['AIPoX Merit (Attack)'] = attack_results_df['PoP-Adjusted Score (Attack)'] / attack_results_df['AI Risk Score']
attack_results_df['AIPoX Rank (Attack)'] = attack_results_df['AIPoX Merit (Attack)'].rank(ascending=False, method='first').astype(int)

# --- Display Attack Results ---
print("Table 3: Sybil Attack Impact on Prioritization")
attack_display_table = attack_results_df[['Proposal ID', 'Traditional Rank (Attack)', 'AIPoX Rank (Attack)']]
print(attack_display_table.to_string(index=False))