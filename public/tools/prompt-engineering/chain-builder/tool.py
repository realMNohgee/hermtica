#!/usr/bin/env python3
"""
Chain Builder - Assemble multi-step reasoning chains for complex tasks.
Usage: python chain_builder.py --task "research topic" --steps 3
"""
import sys, json

def build_chain(task, steps=3):
    templates = [
        f"Step 1 (ANALYZE): Break down '{task}' into its core components. What are the key elements?",
        f"Step 2 (RESEARCH): For each component, identify relevant information, data sources, and expert knowledge.",
        f"Step 3 (SYNTHESIZE): Combine the findings into a coherent analysis. Identify patterns and draw conclusions.",
        f"Step 4 (CRITIQUE): Challenge your own conclusions. What are the weaknesses and counterarguments?",
        f"Step 5 (REFINE): Improve the analysis based on the critique. Present the final polished result.",
    ]
    return {"task": task, "chain": templates[:steps]}

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--task", required=True)
    p.add_argument("--steps", type=int, default=3)
    args = p.parse_args()
    result = build_chain(args.task, args.steps)
    for i, step in enumerate(result["chain"]):
        print(f"\n{step}\n")
