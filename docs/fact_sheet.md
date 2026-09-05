# Internal Fact Sheet — Source of Truth

**Do not submit this file. All other deliverables derive from it.**

---

## Locked Claim

"A fixed-size recurrent memory can absorb key–value associations from demonstrations and recall them accurately — until the number of associations exceeds the memory's rank, at which point recall degrades through interference in a predictable, measurable way."

## Audience

CS/ML students or junior practitioners who understand what attention is but haven't built a recurrent memory system.

## Prerequisites

Basic linear algebra (matrix multiplication, outer product). Familiarity with the concept of attention in Transformers.

## Learning Objectives

1. Explain how an outer-product write stores a key–value association in a fixed-size matrix.
2. Predict when recall will degrade given memory dimension and number of stored associations.
3. Describe how BDH/BDH-CQ uses this mechanism for in-context learning without gradient updates.

---

## Core Mechanism

A d×d matrix M starts at zero. To store a key–value pair (k, v), we write:
  M ← M + v · kᵀ   (outer-product / Hebbian write)

To recall the value for a query q:
  v̂ = M · q

If keys are orthogonal, recall is exact. When keys are not orthogonal or the number of stored associations exceeds d, cross-talk (interference) corrupts retrieval. This is the fundamental capacity–fidelity tradeoff of fixed-size associative memory.

---

## BDH — What It Is (arXiv:2509.26507, Kosowski et al., Sept 2025)

- A scale-free, biologically-inspired network of locally-interacting "neuron particles."
- Attention emerges from neuron/synapse-level graph dynamics (Hebbian synaptic writes) rather than centralized matrix multiplication.
- BDH's working memory during inference IS this mechanism: recent activity temporarily strengthens connections (synaptic plasticity), turning wiring into working memory.
- Reported properties: ~5% sparse, non-negative neuron activity; monosemantic synapses; power-law connectivity.
- BDH is NOT an SSM in the Mamba sense.

## BDH-GPU (same paper)

- A GPU-efficient reformulation of BDH built from ReLU/low-rank transformations with linear attention.
- Used for the actual pretraining-scale experiments (1B to 600B parameters).
- A special case within the BDH paper, NOT a separate system.

## BDH-CQ (arXiv:2608.09888, separate paper, 2026)

- Built on the BDH family. Adds in-context demonstration learning.
- Learns from demonstrations at inference time by writing them into recurrent latent state.
- No gradient update, no written chain-of-thought.
- Demonstrations are absorbed into the recurrent state via Hebbian-style writes (outer-product accumulation into a fixed-size state matrix).
- At test time: state is read to produce the output.

### BDH-CQ Reported Results

- **29.5% pass@2 on public ARC-AGI-1 evaluation set** at estimated **$0.0007/task**, using a 150M-parameter model.
  - Evidence type: **Self-reported benchmark result with partially-independent audit.**
  - The "independent audit" was conducted by co-authors from partner institutions, not a fully arm's-length third party.
  - A scaling-law claim is asserted without multi-scale (50M/150M/500M) ablations.
  - A language-modeling capability claim is asserted without LM experiments.
  - Disclosed failure: 0/72 on a specific color-swap composition task.
  - Source: arXiv:2608.09888 + Hugging Face paper page public review.

---

## Citations — Group A: Concept Papers (2022–2026)

1. Munkhdalai et al., "Leave No Context Behind: Efficient Infinite Context Transformers with Infini-attention," arXiv:2404.07143, 2024.
   - **Supports**: Fixed-size compressive memory (linear attention state) integrated into Transformer blocks; 1M-token passkey retrieval with bounded memory.

2. Behrouz et al., "Titans: Learning to Memorize at Test Time," arXiv:2501.00663, 2025.
   - **Supports**: Deep neural memory module with test-time learning; dual short-term (attention) / long-term (neural memory) system; 2M+ token scaling.

3. Yang et al., "Gated Delta Networks with Softmax Attention," arXiv:2412.06464, 2024.
   - **Supports**: Delta rule for linear attention state updates; recall–throughput tradeoff in fixed-size states; gating mechanisms for selective memory.

## Citations — Group B: BDH/BDH-CQ Primary Sources

1. Kosowski et al., "The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain," arXiv:2509.26507, Sept 2025.
2. "BDH-CQ: In-Context Learning with Recurrent Latent Reasoning," arXiv:2608.09888, 2026.
3. Pathway BDH toy implementation: github.com/pathwaycom/bdh (labeled by Pathway as NOT reproducing their internal benchmark numbers).
4. Pathway BDH Explainer: pathway.com/research/bdh-explainer
5. Pathway BDH-CQ Introduction: pathway.com/research/introducing-bdh-cq

---

## Key Limitations to Disclose

1. Fixed-size memory has a hard capacity limit — interference is inherent, not a bug to fix.
2. BDH-CQ's 29.5% is self-reported; independent reproduction by a fully separate group is not yet public.
3. BDH-CQ scaling claims lack multi-scale ablation evidence.
4. 0/72 on color-swap task — composition failure mode.
5. Our toy model is a simplified illustration of the mechanism, NOT the actual BDH/BDH-CQ system.

---

## AI Assistance Log

- Implementation plan and code architecture: generated with AI assistance (Claude), reviewed and modified by the team.
- Toy associative memory model: implemented from first principles (outer-product write / linear readout), not copied from any existing codebase.
- Precomputation scripts: AI-assisted, team-reviewed.
- All prose (README, one-pager, fact sheet): AI-drafted, team-edited for accuracy and voice.
- BDH/BDH-CQ content: derived exclusively from primary sources listed above, cross-checked by team.
- No code, data, weights, or graphics were reused from the pathwaycom/bdh repository.

---

## Licenses

- Artifact code: MIT License
- Inter font: SIL Open Font License
- JetBrains Mono: SIL Open Font License
- KaTeX: MIT License
- ARC-AGI-1 public training examples: Apache 2.0 (François Chollet)
