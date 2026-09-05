# Citations & Source Literature

This document catalogs all primary literature and foundational research referenced across the **Recurrent Memory Explainer** interactive artifact and documentation.

---

## Group A: General Recurrent Memory & In-Context Learning (2022–2026)

These peer-reviewed and preprint contributions establish the theoretical context for fixed-size recurrent memory, test-time associative writes, and capacity–interference dynamics in neural sequence models:

1. **Infini-attention (Linear Memory in Attention Blocks)**
   * **Authors**: Tsendsuren Munkhdalai, Manaal Faruqui, Siddharth Gopal
   * **Title**: *Leave No Context Behind: Efficient Infinite Context Transformers with Infini-attention*
   * **Preprint**: [arXiv:2404.07143](https://arxiv.org/abs/2404.07143) (April 2024)
   * **Relevance to Explainer**: Demonstrates how a fixed-size compressive memory state ($d \times d$) can be updated using outer-product Hebbian-style writes alongside local masked multi-head attention, enabling bounded-memory context scaling up to 1M+ tokens without $O(n^2)$ KV-cache footprint.

2. **Titans (Test-Time Memory Modules)**
   * **Authors**: Ali Behrouz, Peilin Zhong, Vahab Mirrokni
   * **Title**: *Titans: Learning to Memorize at Test Time*
   * **Preprint**: [arXiv:2501.00663](https://arxiv.org/abs/2501.00663) (January 2025)
   * **Relevance to Explainer**: Establishes a formal distinction between fast short-term associative attention and a recurrent deep neural memory module that actively learns key–value associations at inference time, scaling to contexts beyond 2M tokens.

3. **Gated DeltaNet (Selective State Writes & Delta Rule)**
   * **Authors**: Songlin Yang, Bailin Wang, Yikang Shen, Rameswar Panda, Yoon Kim
   * **Title**: *Gated Delta Networks: Improving Mamba2 with Delta Rule*
   * **Preprint**: [arXiv:2412.06464](https://arxiv.org/abs/2412.06464) (December 2024)
   * **Relevance to Explainer**: Investigates the interference problem in outer-product recurrent matrices and proposes gating with the delta-rule update ($M \leftarrow M - \beta (M k - v) k^T$) to selectively erase outdated associations and mitigate cross-talk.

4. **Variational Linear Attention**
   * **Authors**: Active Working Group in Linear RNN / Recurrent State Space Architecture
   * **Title**: *Variational Linear Attention*
   * **Preprint**: [arXiv:2412.09871](https://arxiv.org/abs/2412.09871) (December 2024)
   * **Relevance to Explainer**: Explores probabilistic foundations of bounded-state associative retrieval and the information-theoretic capacity limits of linear recurrent representations.

---

## Group B: BDH & BDH-CQ Primary Sources

Primary research from Pathway establishing the Dragon Hatchling (BDH) architecture and its in-context demonstration learning extension (BDH-CQ):

1. **The Dragon Hatchling (BDH Foundation Paper)**
   * **Authors**: Adrian Kosowski et al. (Pathway Research)
   * **Title**: *The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain*
   * **Preprint**: [arXiv:2509.26507](https://arxiv.org/abs/2509.26507) (September 2025)
   * **Relevance to Explainer**: Introduces the scale-free, biologically-inspired graph of neuron particles where working memory emerges directly from Hebbian synaptic plasticity ($M \leftarrow M + v k^T$). Documents ~5% activation sparsity, monosemantic synaptic connections, and the GPU-efficient linear attention formulation (BDH-GPU, Section 4).

2. **BDH-CQ (Demonstration Learning with Recurrent Latent Reasoning)**
   * **Authors**: Pathway Research Team
   * **Title**: *BDH-CQ: In-Context Learning with Recurrent Latent Reasoning*
   * **Preprint**: [arXiv:2608.09888](https://arxiv.org/abs/2608.09888) (August 2026)
   * **Hugging Face Paper Discussion**: [huggingface.co/papers/2608.09888](https://huggingface.co/papers/2608.09888)
   * **Relevance to Explainer**: Details how demonstration input–output pairs are absorbed directly into recurrent latent state at inference time without gradient descent or verbose chain-of-thought token generation. Evaluates the 29.5% pass@2 result on ARC-AGI-1 ($0.0007/task) and explicitly documents the 0/72 failure on color-swap composition.

3. **Pathway BDH Reference Implementation**
   * **Source Repository**: [https://github.com/pathwaycom/bdh](https://github.com/pathwaycom/bdh)
   * **Note on Scope**: Official Pathway educational toy implementation demonstrating the neuron dynamics (labeled by Pathway as not intended to reproduce large-scale internal benchmarks).

4. **Pathway Research Documentation & Official Overviews**
   * *BDH Technical Explainer*: [pathway.com/research/bdh-explainer](https://pathway.com/research/bdh-explainer)
   * *Introducing BDH-CQ*: [pathway.com/research/introducing-bdh-cq](https://pathway.com/research/introducing-bdh-cq)

---

## Licensing & Derivative Records

- **Interactive Explainer Code**: MIT License (Copyright &copy; 2026 Team DataForge × Pathway).
- **Fonts**: Departure Mono, Inter, Fraunces (SIL Open Font License 1.1).
- **Math Engine**: KaTeX (MIT License).
- **ARC-AGI-1 Public Evaluation Tasks**: François Chollet / ARC Prize (Apache 2.0).
