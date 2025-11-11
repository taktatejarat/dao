import numpy as np
import pandas as pd

# --- Step 1: Define Simulation Environment ---
DAO_TREASURY = 1_000_000
NUM_VOTERS = 1000
NUM_PROPOSALS = 5
ALPHA = 0.4  # Weight for token holdings
BETA = 0.6   # Weight for participation score

print("--- Simulation Parameters ---")
print(f"DAO Treasury: ${DAO_TREASURY:,.2f}")
print(f"Number of Voters: {NUM_VOTERS}")
print(f"Number of Proposals: {NUM_PROPOSALS}")
print(f"AIPoX Weights: Alpha (Tokens) = {ALPHA}, Beta (Participation) = {BETA}\n")

# --- Step 2: Generate the Voter Population ---
# Use a log-normal distribution for tokens to simulate wealth disparity (whales)
# Reduced sigma to make the PoP score more impactful
token_holdings = np.random.lognormal(mean=8, sigma=1.8, size=NUM_VOTERS)

# Use a normal distribution for participation scores
participation_scores = np.random.normal(loc=100, scale=40, size=NUM_VOTERS)
participation_scores[participation_scores < 0] = 0

voters_df = pd.DataFrame({
    'voter_id': range(NUM_VOTERS),
    'tokens': token_holdings,
    'pop_score': participation_scores
})

# --- Step 3: Define Proposal Characteristics ---
# We decouple "hype" from "risk" to create a more interesting scenario
proposals = []
hype_scores = np.random.uniform(0.5, 1.5, size=NUM_PROPOSALS) # A random popularity/hype factor
for i in range(NUM_PROPOSALS):
    intrinsic_risk = np.random.uniform(0.1, 0.9)
    ai_risk_score = np.clip(intrinsic_risk + np.random.normal(0, 0.05), 0.01, 1.0)
    
    proposals.append({
        'proposal_id': f'P-{i+1}',
        'hype_score': hype_scores[i],
        'ai_risk_score': ai_risk_score
    })
proposals_df = pd.DataFrame(proposals)

# --- Step 4: Simulate the Voting Process ---
# Voters now vote based on the "hype score", not the underlying quality (risk)
voting_probabilities = proposals_df['hype_score'] / proposals_df['hype_score'].sum()
voters_df['voted_for'] = np.random.choice(proposals_df['proposal_id'], size=NUM_VOTERS, p=voting_probabilities)

# --- Step 5: Calculate Results for Each Proposal ---
results = []
for pid in proposals_df['proposal_id']:
    voters_for_proposal = voters_df[voters_df['voted_for'] == pid]
    
    # Traditional Model: Sum of tokens
    raw_vote_score = voters_for_proposal['tokens'].sum()
    
    # AIPoX Model: Calculate score directly to avoid SettingWithCopyWarning
    pop_adjusted_score = ((ALPHA * voters_for_proposal['tokens']) + (BETA * voters_for_proposal['pop_score'])).sum()
    
    ai_risk = proposals_df[proposals_df['proposal_id'] == pid]['ai_risk_score'].iloc[0]
    
    results.append({
        'Proposal ID': pid,
        'Raw Vote Score': raw_vote_score,
        'PoP-Adjusted Score': pop_adjusted_score,
        'AI Risk Score': ai_risk
    })
results_df = pd.DataFrame(results)

# --- Final Calculations for Tables ---

# Prioritization Table
results_df['Traditional Rank'] = results_df['Raw Vote Score'].rank(ascending=False, method='first').astype(int)
results_df['AIPoX Merit'] = results_df['PoP-Adjusted Score'] / results_df['AI Risk Score']
results_df['AIPoX Rank'] = results_df['AIPoX Merit'].rank(ascending=False, method='first').astype(int)

# Allocation Table
total_raw_votes = results_df['Raw Vote Score'].sum()
results_df['Traditional Allocation'] = (results_df['Raw Vote Score'] / total_raw_votes) * DAO_TREASURY if total_raw_votes > 0 else 0

total_merit = results_df['AIPoX Merit'].sum()
results_df['AIPoX Allocation'] = (results_df['AIPoX Merit'] / total_merit) * DAO_TREASURY if total_merit > 0 else 0

# --- Display Results ---
print("\n--- Simulation Results ---")

print("\nTable 1: Project Prioritization Comparison")
# Sort the entire DataFrame first
results_df_sorted = results_df.sort_values('AIPoX Rank')
prioritization_table = results_df_sorted[['Proposal ID', 'Raw Vote Score', 'PoP-Adjusted Score', 'AI Risk Score', 'Traditional Rank', 'AIPoX Rank']]
print(prioritization_table.to_string(index=False, formatters={
    'Raw Vote Score': '{:,.0f}'.format,
    'PoP-Adjusted Score': '{:,.0f}'.format,
    'AI Risk Score': '{:.2f}'.format
}))

print("\nTable 2: Resource Allocation Comparison")
# Use the same sorted DataFrame to select columns for the allocation table
allocation_table = results_df_sorted[['Proposal ID', 'Traditional Allocation', 'AIPoX Allocation']]
print(allocation_table.to_string(index=False, formatters={
    'Traditional Allocation': '${:,.2f}'.format,
    'AIPoX Allocation': '${:,.2f}'.format
}))