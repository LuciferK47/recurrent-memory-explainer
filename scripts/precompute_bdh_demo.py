#!/usr/bin/env python3
"""
Precompute BDH-CQ demo tasks for the educational walkthrough.

Uses simple ARC-style grid transformation examples (original, not from ARC dataset)
to illustrate how demonstrations are absorbed into recurrent state.

Output: data/bdh_cq_demo_tasks.json
"""

import json
import os

def main():
    # Simple ARC-style tasks: input grid → output grid
    # These are ORIGINAL toy examples inspired by ARC-AGI's format,
    # NOT copied from the ARC-AGI dataset.
    # Each task has demonstration pairs and a test input.

    tasks = [
        {
            "id": "fill_color",
            "name": "Fill Enclosed Region",
            "description": "Given a grid with a rectangular border, fill the interior with the border's color.",
            "demonstrations": [
                {
                    "input": [
                        [0, 0, 0, 0, 0],
                        [0, 1, 1, 1, 0],
                        [0, 1, 0, 1, 0],
                        [0, 1, 1, 1, 0],
                        [0, 0, 0, 0, 0]
                    ],
                    "output": [
                        [0, 0, 0, 0, 0],
                        [0, 1, 1, 1, 0],
                        [0, 1, 1, 1, 0],
                        [0, 1, 1, 1, 0],
                        [0, 0, 0, 0, 0]
                    ]
                },
                {
                    "input": [
                        [0, 0, 0, 0, 0, 0],
                        [0, 0, 0, 0, 0, 0],
                        [0, 2, 2, 2, 2, 0],
                        [0, 2, 0, 0, 2, 0],
                        [0, 2, 0, 0, 2, 0],
                        [0, 2, 2, 2, 2, 0]
                    ],
                    "output": [
                        [0, 0, 0, 0, 0, 0],
                        [0, 0, 0, 0, 0, 0],
                        [0, 2, 2, 2, 2, 0],
                        [0, 2, 2, 2, 2, 0],
                        [0, 2, 2, 2, 2, 0],
                        [0, 2, 2, 2, 2, 0]
                    ]
                }
            ],
            "test": {
                "input": [
                    [3, 3, 3, 3],
                    [3, 0, 0, 3],
                    [3, 0, 0, 3],
                    [3, 3, 3, 3]
                ],
                "expected_output": [
                    [3, 3, 3, 3],
                    [3, 3, 3, 3],
                    [3, 3, 3, 3],
                    [3, 3, 3, 3]
                ]
            }
        },
        {
            "id": "mirror_horizontal",
            "name": "Horizontal Mirror",
            "description": "Reflect the non-zero pattern horizontally across the grid's vertical center.",
            "demonstrations": [
                {
                    "input": [
                        [1, 0, 0],
                        [1, 1, 0],
                        [1, 0, 0]
                    ],
                    "output": [
                        [0, 0, 1],
                        [0, 1, 1],
                        [0, 0, 1]
                    ]
                },
                {
                    "input": [
                        [2, 2, 0, 0],
                        [0, 2, 0, 0],
                        [0, 0, 0, 0]
                    ],
                    "output": [
                        [0, 0, 2, 2],
                        [0, 0, 2, 0],
                        [0, 0, 0, 0]
                    ]
                }
            ],
            "test": {
                "input": [
                    [4, 0, 0, 0],
                    [4, 4, 0, 0],
                    [4, 4, 4, 0],
                    [0, 0, 0, 0]
                ],
                "expected_output": [
                    [0, 0, 0, 4],
                    [0, 0, 4, 4],
                    [0, 4, 4, 4],
                    [0, 0, 0, 0]
                ]
            }
        },
        {
            "id": "count_and_fill",
            "name": "Count Distinct Colors",
            "description": "Count the number of distinct non-zero colors in the input. Output a 1×N grid filled with color 1.",
            "demonstrations": [
                {
                    "input": [
                        [1, 0, 2],
                        [0, 3, 0],
                        [0, 0, 0]
                    ],
                    "output": [
                        [1, 1, 1]
                    ]
                },
                {
                    "input": [
                        [5, 5, 0],
                        [0, 0, 7],
                        [0, 0, 0]
                    ],
                    "output": [
                        [1, 1]
                    ]
                }
            ],
            "test": {
                "input": [
                    [0, 4, 0],
                    [6, 0, 2],
                    [0, 8, 0]
                ],
                "expected_output": [
                    [1, 1, 1, 1]
                ]
            }
        }
    ];

    # ARC-AGI color mapping for visualization
    color_map = {
        0: "#1a1a2e",  # black/background
        1: "#e74c3c",  # red
        2: "#2ecc71",  # green
        3: "#3498db",  # blue
        4: "#f39c12",  # yellow/orange
        5: "#9b59b6",  # purple
        6: "#e91e63",  # pink
        7: "#ff5722",  # deep orange
        8: "#00bcd4",  # cyan
        9: "#8bc34a",  # light green
    }

    output = {
        "description": "Toy ARC-style tasks for the BDH-CQ educational walkthrough. "
                       "These are ORIGINAL examples created for this explainer, "
                       "NOT taken from the ARC-AGI dataset.",
        "label": "ILLUSTRATION — these tasks demonstrate the concept of learning from "
                 "demonstrations, not actual BDH-CQ inference.",
        "color_map": color_map,
        "tasks": tasks
    }

    os.makedirs("data", exist_ok=True)
    with open("data/bdh_cq_demo_tasks.json", "w") as f:
        json.dump(output, f, indent=2)

    print("Saved to data/bdh_cq_demo_tasks.json")

if __name__ == "__main__":
    main()
