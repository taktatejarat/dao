import numpy as np
import pandas as pd
import time

# --- Step 1: Define Scalability Test Scenarios ---
voter_counts = [1000, 5000, 10000, 20000]
proposal_counts = [10, 25, 50]
ALPHA = 0.4
BETA = 0.6

scalability_results = []

print("--- Running Scalability Analysis ---")
print("This may take several minutes...\n")

# --- Step 2: Run Nested Loop for Each Scenario ---
for n_voters in voter_counts:
    for n_proposals in proposal_counts:
        
        print(f"Testing with {n_voters} voters and {n_proposals} proposals...")
        
        # --- A: Setup the environment for this specific scenario ---
        
        # Generate a new random voter population
        token_holdings = np.random.lognormal(mean=8, sigma=1.8, size=n_voters)
        participation_scores = np.random.normal(loc=100, scale=40, size=n_voters)
        participation_scores[participation_scores < 0] = 0
        voters_df = pd.DataFrame({
            'voter_id': range(n_voters),
            'tokens': token_holdings,
            'pop_score': participation_scores
        })

        # Generate new random proposals, but include one "golden" proposal to track
        proposals_list = []
        for i in range(n_proposals - 1):
            proposals_list.append({
                'Proposal ID': f'P-{i}',
                'hype_score': np.random.uniform(0.2, 1.0),
                'ai_risk_score': np.random.uniform(0.2, 0.8)
            })
        # Add the "golden" proposal: low hype, very low risk
        proposals_list.append({
            'Proposal ID': 'P-Golden',
            'hype_score': 0.1,
            'ai_risk_score': 0.05
        })
        proposals_df = pd.DataFrame(proposals_list)

        # --- B: Run the core logic and measure time ---
        
        start_time = time.time()
        
        # Simulate voting
        voting_probabilities = proposals_df['hype_score'] / proposals_df['hype_score'].sum()
        voters_df['voted_for'] = np.random.choice(proposals_df['Proposal ID'], size=n_voters, p=voting_probabilities)
        
        # Calculate results
        results = []
        for pid in proposals_df['Proposal ID']:
            voters_for_proposal = voters_df[voters_df['voted_for'] == pid]
            raw_vote_score = voters_for_proposal['tokens'].sum()
            pop_adjusted_score = ((ALPHA * voters_for_proposal['tokens']) + (BETA * voters_for_proposal['pop_score'])).sum()
            results.append({
                'Proposal ID': pid,
                'Raw Vote Score': raw_vote_score,
                'PoP-Adjusted Score': pop_adjusted_score
            })
        
        results_df = pd.DataFrame(results)
        results_df = results_df.merge(proposals_df, on='Proposal ID')
        
        # Calculate ranks
        results_df['Traditional Rank'] = results_df['Raw Vote Score'].rank(ascending=False, method='first').astype(int)
        results_df['AIPoX Merit'] = results_df['PoP-Adjusted Score'] / results_df['ai_risk_score']
        results_df['AIPoX Rank'] = results_df['AIPoX Merit'].rank(ascending=False, method='first').astype(int)
        
        end_time = time.time()
        
        # --- C: Record the results for this scenario ---
        
        execution_time = end_time - start_time
        golden_proposal_rank = results_df[results_df['Proposal ID'] == 'P-Golden']['AIPoX Rank'].iloc[0]
        
        scalability_results.append({
            'Num Voters': n_voters,
            'Num Proposals': n_proposals,
            'Execution Time (s)': execution_time,
            'Rank of High-Merit Proposal': golden_proposal_rank
        })

# --- Step 3: Display Final Summary Table ---
summary_df = pd.DataFrame(scalability_results)
print("\n--- Scalability Analysis Results ---")
print(summary_df.to_string(index=False, float_format="%.4f"))