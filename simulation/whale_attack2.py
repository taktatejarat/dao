import numpy as np
import pandas as pd

# --- Simulation Parameters ---
NUM_RUNS = 100  # Number of times to run the simulation
DAO_TREASURY = 1_000_000
NUM_VOTERS = 1000
NUM_PROPOSALS = 5
ALPHA = 0.4
BETA = 0.6

# Define proposals (fixed across all runs)
proposals = [
    {'proposal_id': 'P-1', 'hype_score': 0.25, 'ai_risk_score': 0.35},
    {'proposal_id': 'P-2', 'hype_score': 1.0,  'ai_risk_score': 0.49},
    {'proposal_id': 'P-3', 'hype_score': 0.15, 'ai_risk_score': 0.06},
    {'proposal_id': 'P-4', 'hype_score': 0.8,  'ai_risk_score': 0.46},
    {'proposal_id': 'P-5', 'hype_score': 0.6,  'ai_risk_score': 0.39}
]
proposals_df = pd.DataFrame(proposals)

# --- Run the Simulation Loop ---
all_runs_results = []

print(f"--- Running Monte Carlo Simulation ({NUM_RUNS} runs) ---")

for i in range(NUM_RUNS):
    # Generate a new random voter population for each run
    token_holdings = np.random.lognormal(mean=8, sigma=1.8, size=NUM_VOTERS)
    participation_scores = np.random.normal(loc=100, scale=40, size=NUM_VOTERS)
    participation_scores[participation_scores < 0] = 0
    voters_df = pd.DataFrame({
        'voter_id': range(NUM_VOTERS),
        'tokens': token_holdings,
        'pop_score': participation_scores
    })
    
    # Simulate voting for this run
    voting_probabilities = proposals_df['hype_score'] / proposals_df['hype_score'].sum()
    voters_df['voted_for'] = np.random.choice(proposals_df['proposal_id'], size=NUM_VOTERS, p=voting_probabilities)
    
    # Calculate results for this run
    for pid in proposals_df['proposal_id']:
        voters_for_proposal = voters_df[voters_df['voted_for'] == pid]
        
        raw_vote_score = voters_for_proposal['tokens'].sum()
        pop_adjusted_score = ((ALPHA * voters_for_proposal['tokens']) + (BETA * voters_for_proposal['pop_score'])).sum()
        
        all_runs_results.append({
            'run_id': i,
            'Proposal ID': pid,
            'Raw Vote Score': raw_vote_score,
            'PoP-Adjusted Score': pop_adjusted_score
        })

# --- Aggregate and Analyze Results ---
all_runs_df = pd.DataFrame(all_runs_results)
all_runs_df = all_runs_df.merge(proposals_df, left_on='Proposal ID', right_on='proposal_id')

# For each run, calculate the ranks
def calculate_ranks(df):
    df['Traditional Rank'] = df['Raw Vote Score'].rank(ascending=False, method='first').astype(int)
    df['AIPoX Merit'] = df['PoP-Adjusted Score'] / df['ai_risk_score']
    df['AIPoX Rank'] = df['AIPoX Merit'].rank(ascending=False, method='first').astype(int)
    return df

ranked_df = all_runs_df.groupby('run_id').apply(calculate_ranks)

# Now, calculate the average rank and std deviation for each proposal
summary_stats = ranked_df.groupby('Proposal ID').agg(
    Avg_Traditional_Rank=('Traditional Rank', 'mean'),
    Std_Traditional_Rank=('Traditional Rank', 'std'),
    Avg_AIPoX_Rank=('AIPoX Rank', 'mean'),
    Std_AIPoX_Rank=('AIPoX Rank', 'std')
).reset_index()

# --- Display Final Aggregated Table ---
print(f"\n--- Aggregated Results over {NUM_RUNS} Runs ---")
print("\nTable (New): Average Project Prioritization")
print(summary_stats.to_string(index=False, float_format="%.2f"))