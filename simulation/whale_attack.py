import numpy as np
import pandas as pd

def run_full_simulation():
    # --- Step 1: Base Simulation Setup ---
    DAO_TREASURY = 1_000_000
    NUM_VOTERS = 1000
    NUM_PROPOSALS = 5
    ALPHA = 0.4
    BETA = 0.6

    print("--- Simulation Parameters ---")
    print(f"DAO Treasury: ${DAO_TREASURY:,.2f}, Voters: {NUM_VOTERS}")
    print(f"AIPoX Weights: Alpha (Tokens) = {ALPHA}, Beta (Participation) = {BETA}\n")

    # --- Step 2: Generate Legitimate Population and Proposals ---
    # We use a fixed seed for reproducibility of results for the paper
    np.random.seed(42) 
    token_holdings = np.random.lognormal(mean=8, sigma=1.8, size=NUM_VOTERS)
    participation_scores = np.random.normal(loc=100, scale=40, size=NUM_VOTERS)
    participation_scores[participation_scores < 0] = 0
    voters_df = pd.DataFrame({
        'voter_id': range(NUM_VOTERS),
        'tokens': token_holdings,
        'pop_score': participation_scores
    })

    proposals_data = [
        {'proposal_id': 'P-1', 'hype_score': 0.25, 'ai_risk_score': 0.35},
        {'proposal_id': 'P-2', 'hype_score': 1.0,  'ai_risk_score': 0.49},
        {'proposal_id': 'P-3', 'hype_score': 0.15, 'ai_risk_score': 0.06},
        {'proposal_id': 'P-4', 'hype_score': 0.8,  'ai_risk_score': 0.46},
        {'proposal_id': 'P-5', 'hype_score': 0.6,  'ai_risk_score': 0.39}
    ]
    proposals_df = pd.DataFrame(proposals_data)
    
    voting_probabilities = proposals_df['hype_score'] / proposals_df['hype_score'].sum()
    voters_df['voted_for'] = np.random.choice(proposals_df['proposal_id'], size=NUM_VOTERS, p=voting_probabilities)

    # --- Step 3: Calculate Peacetime (Original) Results ---
    original_results = []
    for pid in proposals_df['proposal_id']:
        voters_for_proposal = voters_df[voters_df['voted_for'] == pid]
        pop_adjusted_score = ((ALPHA * voters_for_proposal['tokens']) + (BETA * voters_for_proposal['pop_score'])).sum()
        ai_risk = proposals_df[proposals_df['proposal_id'] == pid]['ai_risk_score'].iloc[0]
        
        original_results.append({
            'Proposal ID': pid,
            'PoP-Adjusted Score': pop_adjusted_score,
            'AI Risk Score': ai_risk
        })
    original_results_df = pd.DataFrame(original_results)
    original_results_df['AIPoX Merit'] = original_results_df['PoP-Adjusted Score'] / original_results_df['AI Risk Score']
    total_merit = original_results_df['AIPoX Merit'].sum()
    original_results_df['Original AIPoX Allocation'] = (original_results_df['AIPoX Merit'] / total_merit) * DAO_TREASURY if total_merit > 0 else 0
    
    print("\n--- Peacetime Governance Results (For Context) ---")
    print(original_results_df[['Proposal ID', 'Original AIPoX Allocation']].to_string(index=False, formatters={'Original AIPoX Allocation': '${:,.2f}'.format}))


    # --- Step 4: Simulate Whale Attack ---
    ATTACK_TARGET_PROPOSAL = 'P-2'
    WHALE_TOKEN_PERCENTAGE = 0.60 

    total_legit_tokens = voters_df['tokens'].sum()
    whale_tokens = total_legit_tokens / (1 - WHALE_TOKEN_PERCENTAGE) * WHALE_TOKEN_PERCENTAGE
    median_pop_score = voters_df['pop_score'].median()
    
    print(f"\n--- Simulating Whale Attack ---")
    print(f"A whale with {whale_tokens:,.0f} tokens ({WHALE_TOKEN_PERCENTAGE:.0%}) attacks Proposal {ATTACK_TARGET_PROPOSAL}.\n")

    whale_voter = pd.DataFrame([{'voter_id': 'WHALE', 'tokens': whale_tokens, 'pop_score': median_pop_score, 'voted_for': ATTACK_TARGET_PROPOSAL}])
    attack_voters_df = pd.concat([voters_df, whale_voter], ignore_index=True)

    # --- Step 5: Recalculate Results with Whale ---
    attack_results = []
    for pid in proposals_df['proposal_id']:
        voters_for_proposal = attack_voters_df[attack_voters_df['voted_for'] == pid]
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
    attack_results_df['Traditional Rank (Attack)'] = attack_results_df['Raw Vote Score (Attack)'].rank(ascending=False, method='first').astype(int)
    attack_results_df['AIPoX Merit (Attack)'] = attack_results_df['PoP-Adjusted Score (Attack)'] / attack_results_df['AI Risk Score']
    attack_results_df['AIPoX Rank (Attack)'] = attack_results_df['AIPoX Merit (Attack)'].rank(ascending=False, method='first').astype(int)
    total_attack_merit = attack_results_df['AIPoX Merit (Attack)'].sum()
    attack_results_df['AIPoX Allocation (Attack)'] = (attack_results_df['AIPoX Merit (Attack)'] / total_attack_merit) * DAO_TREASURY if total_attack_merit > 0 else 0

    # --- Step 6: Display Final Comparison Tables ---
    print("Table 4: Whale Attack Impact on Prioritization")
    print(attack_results_df[['Proposal ID', 'Traditional Rank (Attack)', 'AIPoX Rank (Attack)']].to_string(index=False))

    print("\nTable 5: Whale Attack Impact on Allocation")
    comparison_df = pd.merge(
        original_results_df[['Proposal ID', 'Original AIPoX Allocation']],
        attack_results_df[['Proposal ID', 'AIPoX Allocation (Attack)']],
        on='Proposal ID'
    )
    # Sort for better readability
    comparison_df = comparison_df.sort_values(by='Original AIPoX Allocation', ascending=False)
    print(comparison_df.to_string(index=False, formatters={
        'Original AIPoX Allocation': '${:,.2f}'.format,
        'AIPoX Allocation (Attack)': '${:,.2f}'.format
    }))

# Run the entire simulation
run_full_simulation()