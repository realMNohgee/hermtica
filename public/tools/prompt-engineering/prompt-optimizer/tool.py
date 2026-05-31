#!/usr/bin/env python3
"""
Prompt Optimizer - Test and refine prompts for LLMs.
Usage: python prompt_optimizer.py --prompt "your prompt" --goal "what you want"
"""
import sys, json, argparse

VARIANTS = {
    "clarity": "Rewrite this to be clearer and more specific: ",
    "concise": "Make this more concise while preserving all key information: ",
    "structured": "Add structure, bullet points, and clear sections to this: ",
    "creative": "Make this more creative and engaging: ",
    "technical": "Make this more technically precise: ",
    "chain_of_thought": "Add 'think step by step' and reasoning structure: ",
}

def optimize(prompt, style="clarity"):
    variant = VARIANTS.get(style, VARIANTS["clarity"])
    return f"{variant}\n\n{prompt}"

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Prompt Optimizer")
    p.add_argument("--prompt", required=True, help="Your prompt")
    p.add_argument("--style", default="clarity", choices=list(VARIANTS.keys()))
    p.add_argument("--all", action="store_true", help="Generate all variants")
    args = p.parse_args()
    
    if args.all:
        result = {style: optimize(args.prompt, style) for style in VARIANTS}
        print(json.dumps(result, indent=2))
    else:
        print(optimize(args.prompt, args.style))
