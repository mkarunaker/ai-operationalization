# Build Prompt: AI Editorial Board

## Role

Act as a senior product architect and full-stack engineer. Build a practical, maintainable web application called **AI Editorial Board**.

The application helps KK develop, challenge, refine, publish, and learn from thought-leadership content focused on:

- Enterprise AI operationalization
- Moving AI from experimentation into production
- Data and AI strategy
- AI governance and risk
- Enterprise architecture
- AI adoption and organizational change
- Measuring AI value and business impact
- The gap between AI activity and AI maturity

This is not an automated content-generation machine. It is a structured thinking and editorial review system.

The system should help KK express his own ideas more clearly. It should not replace his judgment, fabricate experience, or turn his writing into generic AI content.

---

# 1. Product objective

Build a web-based editorial workspace where KK can:

1. Load his AI Operationalization Book of Knowledge as the primary knowledge base.
2. Capture raw ideas, observations, notes, and draft articles.
3. Submit a draft to a multi-agent editorial review board.
4. Use different AI models for different review roles.
5. Compare the reviewers’ perspectives.
6. Produce a synthesized editorial brief.
7. Create a final draft using the `kk-spoken-voice` writing skill.
8. Maintain multiple versions of each post.
9. mark a version as published.
10. Record publication links, dates, platforms, impressions, reactions, comments, reposts, saves, and qualitative feedback.
11. Connect feedback to the original post and its editorial decisions.
12. Analyze what themes, structures, arguments, and writing choices appear to work over time.
13. Track AI model usage, tokens, latency, estimated cost, and actual cost when available.
14. Swap models and providers without changing the core application design.

The application should be useful initially for LinkedIn posts and short articles, but the architecture should support longer articles, strategy papers, workshop content, executive briefs, and architecture reviews later.

---

# 2. Core product principles

Use these principles throughout the design.

## Preserve author ownership

KK owns the thinking, argument, experience, and final judgment.

The system should:

- Challenge his ideas.
- Identify gaps.
- Improve clarity.
- Recommend changes.
- Present alternatives.
- Preserve his natural voice.

The system should not:

- Fabricate stories, data, accomplishments, examples, citations, or personal experience.
- Quietly introduce claims that were not present in the source material.
- optimize solely for engagement.
- Treat virality as proof that an idea is correct.
- Automatically publish content.

## Roles should be model-independent

Do not permanently bind a role such as “Skeptic” or “Editor” to a specific model vendor.

A role is a stable business capability.

A model is a replaceable implementation choice.

For example:

```text
Role: Skeptic
Provider: configurable
Model: configurable
Prompt version: configurable
```

The user should be able to change the model assigned to each role through the application settings.

## Cost discipline

Use inexpensive models for routine review tasks.

Use more capable or expensive reasoning models only when:

- The content is strategically important.
- Reviewers materially disagree.
- Confidence is low.
- The user explicitly requests deeper analysis.
- The draft contains complex or consequential claims.
- A final high-stakes review is needed.

Do not send the entire knowledge base with every model request. Retrieve only the most relevant passages.

## Evidence over hype

The system should flag:

- Unsupported claims
- False precision
- Overgeneralization
- Hype language
- Claims of novelty without evidence
- Weak causal reasoning
- Claims that confuse activity with business value
- Claims that confuse adoption with maturity
- Claims that imply AI will solve organizational problems automatically

## Human decision authority

Agents provide recommendations.

KK decides:

- Which feedback to accept
- Which claims to retain
- Which sources to use
- Whether the argument reflects his actual view
- Which version becomes final
- Whether and when to publish

---

# 3. Primary users

For the MVP, assume a single primary user: KK.

Design the data model so multi-user support could be added later, but do not spend unnecessary time building enterprise tenancy for the first version.

Provide secure authentication even for the single-user MVP.

Preferred authentication options:

- Local authentication for development
- OAuth or a managed identity provider for deployment

Do not hard-code user credentials.

---

# 4. Knowledge architecture

The system must support several distinct knowledge layers.

## 4.1 AI Operationalization Book of Knowledge

The primary domain knowledge source for the MVP is:

```text
EAIO_Canonical_Knowledge_Base.md
```

Load it from a configurable filesystem path. The recommended configuration is:

```text
EAIO_BOK_PATH=./content/knowledge/EAIO_Canonical_Knowledge_Base.md
```

The application must read the file without modifying it and preserve:

- File name
- Document title
- Section hierarchy
- Original text
- Metadata
- Last modified date
- Source type
- Version
- Checksum
- Embedding or retrieval index references

Parse the file by Markdown headings and sections, preserve heading hierarchy, calculate a checksum, detect changes, and reindex only changed sections where practical. The Book of Knowledge must remain separate from generated content and remain the durable source of truth on the filesystem.

The normal application flow must not ask the user to upload, paste, select, replace, archive, or tag the Book of Knowledge. The interface should still allow the user to:

- Search indexed sections
- Browse by heading
- View the exact source passage used during a review
- Inspect the source path, checksum, version, and indexing status

Retrieve only relevant sections for each model call, record exactly which sections were used, and do not send the entire file to every agent. The design may support additional knowledge files later, but the MVP requires only this primary file.

## 4.2 KK spoken voice skill

Use the separately maintained, authoritative writing skill located by default at:

```text
~/.codex/skills/kk-spoken-voice
```

Load it from a configurable filesystem path:

```text
KK_VOICE_SKILL_PATH=~/.codex/skills/kk-spoken-voice
```

Treat `kk-spoken-voice` as a durable writing policy, not as casual context. The application must read it without modifying it and must not require it to be copied into the repository or uploaded or pasted through the UI.

The loader must accept either a direct Markdown file path or a skill directory. When the path is a directory, locate the primary instructions in this order:

1. `SKILL.md`
2. `skill.md`
3. `README.md`
4. A single top-level Markdown file

The loader must expand `~`, record the source path, calculate a checksum, create a version identifier, detect changes without an application rebuild, and save the skill version used for every generated draft.

Both the Initial Drafting Agent and Final Drafting Agent must apply `kk-spoken-voice`.

The skill should capture principles such as:

- Conversational, direct, thoughtful, and practical
- Written as an experienced practitioner speaking to another professional
- No hype
- No generic AI phrasing
- No corporate buzzwords
- No fabricated facts or experience
- No exaggerated certainty
- No em dashes
- Avoid compressed résumé language
- Prefer clear reasoning over dramatic statements
- Humble but confident
- Challenge weak assumptions
- Clearly separate fact, inference, and opinion
- Preserve KK’s natural phrasing where practical
- Avoid making every post sound overly polished or synthetic
- Use concise paragraphs suitable for LinkedIn
- Do not turn every idea into a listicle
- Do not create artificial controversy merely to increase engagement

If the voice skill is unavailable, allow idea capture, clarification, and Editorial Board review, but block AI-assisted initial and final drafting and display a clear configuration error. Never silently fall back to a generic writing style.

## 4.3 Author context for the MVP

Do not require a separate `/author` directory or structured author profile for the MVP.

For the MVP:

- Domain knowledge comes from `EAIO_Canonical_Knowledge_Base.md`.
- Writing style comes from `kk-spoken-voice`.
- Personal stories, experience, evidence, and examples come from the user's current input.
- Published posts and historical application data come from the database.

Do not infer or fabricate career details. A separate author profile may be added later only if there is a demonstrated need.

## 4.4 Published content library

Store all published posts and articles, including:

- Title
- Platform
- Publication URL
- Published date
- Content type
- Final published text
- Draft lineage
- Themes
- Frameworks referenced
- Sources used
- Editorial board results
- Model configuration used
- Prompt versions
- Voice skill version
- Manual edits made after AI generation

The system should help identify accidental repetition across previous posts.

It should not prevent deliberate reinforcement of a recurring thesis.

## 4.5 Feedback and performance history

For each published item, support both quantitative and qualitative feedback.

Quantitative fields may include:

- Impressions
- Reach
- Reactions
- Likes
- Comments
- Reposts
- Shares
- Saves
- Profile views
- Follows attributed
- Link clicks
- Newsletter subscriptions
- Dwell time, when available

Qualitative fields may include:

- Comment text
- Direct-message feedback
- Conversation notes
- Feedback from executives
- Feedback from practitioners
- Objections
- Misinterpretations
- Questions raised
- Ideas for follow-up content
- User’s own reflection

Do not treat engagement metrics as the sole measure of quality.

Allow KK to record outcomes such as:

- Created a useful conversation
- Led to an advisory discussion
- Clarified a concept
- Generated a strong objection worth exploring
- Reached the intended audience
- Performed well but attracted the wrong audience
- Low engagement but strategically important
- Needs refinement
- Should become a longer article

---

# 5. Conversational idea intake and drafting workflow

The application must support users who do not begin with a polished draft.

The user may provide any of the following:

* A few bullet points
* An incomplete thought
* A rough argument
* A partially written post
* A long unstructured note
* A transcript from a voice conversation
* A link with personal observations
* A question the user wants to explore
* A reaction to an industry article or claim
* A possible title or opening sentence
* Several disconnected ideas that may or may not belong in one post

The system should not require the user to organize or polish this material before starting.

## 5.1 Initial experience

The primary starting action on the dashboard should be:

**What are you thinking about?**

Provide a large conversational input area where the user can paste or type ideas in any form.

Supporting text may say:

> Share bullet points, a rough draft, an observation, a question, or anything you are thinking about. It does not need to be polished.

Provide optional fields for:

* Intended audience
* Intended platform
* Desired content length
* Urgency
* Relevant source or link
* Whether this is a new idea or a follow-up to an existing post

These fields should remain optional. The system should infer reasonable defaults and confirm only what materially affects the outcome.

## 5.2 Clarification agent

Before running the editorial board, use a lightweight **Intake and Clarification Agent**.

This is not one of the editorial reviewers. Its job is to understand the user’s intended argument before the system starts evaluating it.

The Clarification Agent should:

1. Read all material supplied by the user.
2. Identify the likely central idea.
3. Identify missing information that would materially change the post.
4. Ask no more than four or five focused clarification questions.
5. Avoid asking questions that can be answered from the Book of Knowledge, published-post history, or information already provided.
6. Avoid generic questions such as “Can you provide more detail?”
7. Ask questions conversationally, one group at a time.
8. Allow the user to skip any question.
9. Allow the user to say, “Use your best judgment.”
10. Avoid turning idea capture into a long interview.

The questions should focus on matters such as:

* What is the main point the user wants readers to take away?
* What triggered the idea?
* Who is the intended reader?
* Is the user making an observation, argument, prediction, or recommendation?
* What personal experience or evidence supports the view?
* What claim does the user most want to challenge?
* What level of confidence does the user have in the idea?
* Is there a specific example that should be included?
* What tone should the post take?
* Is the user trying to begin a series or make a standalone point?

Ask only the questions that are genuinely needed for the current input.

## 5.3 Clarification output

After the user answers, create an editable **Content Intent Brief** containing:

* Working title
* Central thesis
* Intended audience
* Purpose of the post
* Trigger or context
* Key supporting points
* Relevant personal experience
* Known evidence
* Claims requiring validation
* Possible counterargument
* Desired tone
* Intended platform
* Suggested length
* Relationship to previous posts
* Open questions
* Assumptions made by the system

Show this brief to the user.

The user should be able to:

* Edit it
* Approve it
* Answer another clarification question
* Ask the system to proceed using best judgment
* Return to the original notes

Do not require formal approval for every field. A single **Continue to Editorial Board** action is sufficient.

## 5.4 Draft creation options

After clarification, allow the user to choose one of three paths:

### Path 1: Review my existing draft

Use when the user supplied a mostly complete post.

Preserve the original wording and send the draft to the editorial board.

### Path 2: Create a working draft from my ideas

Use the clarified intent, the user’s raw material, relevant Book of Knowledge passages, and `kk-spoken-voice` to create a first working draft.

Clearly label this as an AI-assisted working draft.

Do not treat it as ready to publish.

### Path 3: Review the idea before drafting

Send the Content Intent Brief to the Strategist and Skeptic before creating prose.

Use this path when:

* The idea is broad
* The thesis is unclear
* The claim may be weak
* The subject is strategically important
* The user wants to test whether the idea is worth writing

The Strategist and Skeptic must review the idea independently. After their pre-draft review, the user may revise the brief, hold or discard the idea, provide a draft, or ask the Initial Drafting Agent to create one. The Editor must not be asked to perform a prose review until a usable draft exists. If the user proceeds to a draft, run the complete Editorial Board review on that draft; the pre-draft findings may be retained as context but must not compromise the independence of the draft reviewers.

The system should recommend a path, but the user makes the final choice.

## 5.5 Initial drafting agent

When the user chooses to create a working draft, use an **Initial Drafting Agent**.

The Initial Drafting Agent should:

* Use only the ideas, context, experience, and evidence available to it
* Apply `kk-spoken-voice`
* Preserve uncertainty
* Avoid invented examples
* Avoid invented professional experiences
* Avoid unsupported numerical claims
* Avoid generic LinkedIn hooks
* Avoid artificial controversy
* Avoid excessive polish
* Produce a draft that still feels editable and owned by the user
* Identify placeholders where the user’s input is needed
* Keep a clear record of which portions came from user-provided material and which were structural suggestions from the model

The Initial Drafting Agent is separate from the final drafting agent.

The initial agent turns rough thinking into a workable draft.

The final drafting agent applies user-approved editorial recommendations after the board review.

## 5.6 Editorial workflow after intake

The canonical end-to-end workflow is:

```text
Raw idea, bullets, rough draft, or transcript
→ Intake and Clarification Agent
→ Up to five focused questions
→ User responses
→ Editable Content Intent Brief
→ User selects one of three paths
  Path 1: preserve usable existing draft → retrieve relevant context
  Path 2: retrieve relevant context → Initial Drafting Agent → AI-assisted working draft
  Path 3: retrieve relevant context → independent Strategist and Skeptic idea review
          → user revises, holds, discards, supplies a draft, or requests a working draft
→ A usable existing or AI-assisted working draft
→ Independent Strategist, Skeptic, and Editor reviews of a usable draft
→ Synthesizer
→ User accepts, partially accepts, or rejects recommendations
→ Final draft using kk-spoken-voice
→ User editing and approval
→ Publication record
→ Feedback and performance tracking
```

## 5.7 Chat-based interaction

The application should include a conversational workspace, not only static forms.

The user should be able to say things such as:

* “This is what I am thinking.”
* “Turn these bullets into something coherent.”
* “I am not sure what the central point is.”
* “Challenge this before writing it.”
* “This sounds too generic.”
* “Keep my original opening.”
* “Do not turn this into a list.”
* “Make it a three-minute LinkedIn read.”
* “Use my best related ideas from the Book of Knowledge.”
* “This is a follow-up to my activity-versus-maturity post.”
* “I do not have evidence for this yet.”
* “Proceed with your best judgment.”

The system should translate these conversational instructions into structured workflow actions while preserving the original conversation in the content history.

## 5.8 Cost controls for intake

Use a low-cost model for clarification and initial classification.

Do not send the entire Book of Knowledge during the first intake step.

Retrieve knowledge only after the central topic is reasonably understood.

The user should not incur four or five separate model calls merely because the system asks four or five questions. Prefer one call that generates the clarification questions, followed by one call that creates the Content Intent Brief after the user responds.

Display the estimated cost before creating a working draft or running the editorial board.

---

# 6. Editorial board agents

The complete MVP agent roster is:

1. Intake and Clarification Agent
2. Initial Drafting Agent
3. Strategist
4. Skeptic
5. Editor
6. Synthesizer
7. Optional Originality and Landscape Reviewer
8. Final Drafting Agent

The core Editorial Board consists of the Strategist, Skeptic, Editor, and Synthesizer. The optional Originality and Landscape Reviewer may be invoked when needed. The Intake and Clarification Agent, Initial Drafting Agent, and Final Drafting Agent are workflow agents outside the independent review board.

Each independent Editorial Board reviewer receives:

- The assignment
- The current draft
- Relevant author context drawn from the current user input and stored application history
- Relevant Book of Knowledge excerpts
- Selected published-content history
- Relevant feedback history
- Its own role prompt
- Required structured output format

Each reviewer should operate independently. Do not let one reviewer see another reviewer’s feedback before submitting its own assessment. The Synthesizer receives the completed reviewer outputs only after those independent reviews finish.

## Agent 1: Strategist

### Purpose

Determine whether the idea is worth publishing and whether it advances KK’s broader point of view.

### Responsibilities

Evaluate:

- What is the central idea?
- Why should the intended audience care?
- Is the argument strategically relevant?
- Is the post saying one clear thing?
- Does it connect to AI operationalization?
- Is the idea too broad?
- Is the idea too obvious?
- Is there a meaningful tension or insight?
- Does the post advance a larger body of work?
- Is the intended audience clear?
- What should the reader remember?
- What should the reader think or do differently?
- Is this better as a short post, article, framework, diagram, or series?

### Required output

Return:

- Core thesis
- Intended audience
- Strategic value
- Strongest element
- Weakest element
- Missing context
- Recommended scope
- Recommended content format
- Top three improvements
- Publish, revise, hold, or discard recommendation
- Confidence score
- Reason for confidence score

The Strategist should not rewrite the full post unless explicitly asked.

---

## Agent 2: Skeptic

### Purpose

Stress-test the argument without being contrarian merely for effect.

### Responsibilities

Identify:

- Weak assumptions
- Unsupported claims
- Missing evidence
- False precision
- Overgeneralization
- Logical gaps
- Causal claims that are not demonstrated
- Statements that a CIO, CDAO, CTO, CISO, CFO, product leader, or engineering leader may challenge
- Claims that could be interpreted as dismissive
- Claims that sound like criticism of individuals rather than analysis of systems
- Places where the post confuses tool use with maturity
- Places where the post underestimates real progress
- Places where KK may be projecting his experience too broadly
- Claims that require current external validation
- Reasonable counterarguments
- Alternative explanations
- Evidence that could disconfirm the thesis

### Required output

Return:

- Main argument being challenged
- Five strongest objections
- Assumptions that must be made explicit
- Claims requiring evidence
- Claims that should be softened
- Claims that can remain strong
- Best counterargument
- What would change the reviewer’s mind
- Top three recommended corrections
- Risk level: low, medium, or high
- Confidence score

The Skeptic should be constructive and evidence-oriented.

---

## Agent 3: Editor

### Purpose

Improve clarity, flow, readability, and structure while preserving KK’s voice.

### Responsibilities

Evaluate:

- Opening strength
- Narrative flow
- Sentence clarity
- Paragraph length
- Repetition
- Jargon
- Generic phrases
- Unnecessary qualifiers
- Abrupt transitions
- Tone
- Authenticity
- Whether the writing sounds generated
- Whether the post is over-polished
- Whether the conclusion follows from the argument
- Whether the call to reflection or action feels natural
- Whether the post can be shortened without weakening it

The Editor should flag, rather than silently fix:

- Claims that change meaning
- New factual assertions
- New examples
- New professional experience
- New metrics
- New citations

### Required output

Return:

- One-sentence editorial diagnosis
- What to keep
- What to cut
- What to clarify
- What to reorder
- Jargon to remove
- Repetitive sections
- Suggested opening
- Suggested closing
- Recommended length
- Top five line-level changes
- Confidence score

The Editor may provide a revised version only when the workflow explicitly requests one.

---

## Agent 4: Synthesizer

### Purpose

Combine the independent reviews into a practical decision brief for KK.

### Responsibilities

The Synthesizer receives the completed outputs of the Strategist, Skeptic, and Editor.

It should not merely average their recommendations.

It must identify:

- Where reviewers agree
- Where reviewers disagree
- Which disagreements matter
- Which suggestions are high confidence
- Which suggestions are subjective
- Which suggested changes would materially alter KK’s thesis
- Which issues must be resolved before publication
- Which issues can remain as intentional choices
- What should be fixed first
- Whether deeper review is justified
- Whether a more capable model should be invoked

### Required output

Return:

- Draft thesis
- Review consensus
- Material disagreements
- Critical issues
- Optional improvements
- Evidence gaps
- Voice risks
- Recommended next action
- Prioritized change list
- Escalation recommendation
- Estimated effort to revise
- Final board recommendation: publish, revise, rethink, or hold

The Synthesizer must preserve minority opinions when they are materially important.

---

## Optional Agent 5: Originality and Landscape Reviewer

Do not make this part of every run initially.

Use it when KK wants to assess whether the framing is common, distinctive, or overused.

### Purpose

Evaluate the argument within the broader public conversation.

### Responsibilities

Assess:

- Whether the core idea is widely discussed
- Whether the framing is common or distinct
- Whether the terminology is overused
- Whether the post resembles common LinkedIn AI content
- Whether the argument adds a useful synthesis
- What makes the idea recognizably KK’s
- What prior published KK content overlaps
- What claims require current web research
- Whether external sources should be added

This agent must not claim comprehensive knowledge of everything published.

It should clearly state the limits of model memory and available retrieval.

### Required output

Return:

- Common, somewhat distinct, or highly distinct classification
- Common elements
- Distinctive elements
- Risk of sounding repetitive
- Similar themes in KK’s existing content
- Recommendations for differentiation
- Research questions
- Confidence score
- Knowledge limitations

For current landscape review, use a retrieval or web-search capability. Do not rely only on model memory.

---

# 7. Final drafting workflow

The application must not jump directly from an idea to a final AI-written post.

After the canonical intake and Editorial Board workflow in Section 5, use this final-drafting sequence:

```text
Completed synthesis
→ User recommendation decisions
→ Final Drafting Agent using kk-spoken-voice
→ User editing
→ Final approval
→ Publication record
→ Feedback collection
→ Retrospective analysis
```

The user should be able to:

- Accept a recommendation
- Reject a recommendation
- Mark it as partially accepted
- Add a note explaining the decision
- Request another review
- Escalate one role to a stronger model
- Compare before-and-after drafts
- Restore earlier versions
- Manually edit any version

The final-draft agent must receive:

- The user-approved recommendations
- The original draft
- The current working draft
- The relevant Book of Knowledge excerpts
- The configured `kk-spoken-voice` skill and its version identifier
- Explicit factual constraints
- A list of rejected recommendations

The final-draft agent must not reintroduce rejected changes without flagging them.

---

# 8. Model-agnostic architecture

Create a provider abstraction layer.

The business logic should never directly depend on one vendor’s SDK.

Use an interface conceptually similar to:

```typescript
interface ModelProvider {
  generate(request: ModelRequest): Promise<ModelResponse>;
  stream?(request: ModelRequest): AsyncIterable<ModelStreamEvent>;
  estimateCost?(usage: TokenUsage, model: string): CostEstimate;
  listModels?(): Promise<ModelDescriptor[]>;
}
```

A normalized request should support:

```typescript
type ModelRequest = {
  provider: string;
  model: string;
  messages: ModelMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: JsonSchemaDefinition;
  reasoningEffort?: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
};
```

A normalized response should support:

```typescript
type ModelResponse = {
  text: string;
  structuredOutput?: unknown;
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  providerRequestId?: string;
  model: string;
  provider: string;
  finishReason?: string;
  rawUsage?: Record<string, unknown>;
};
```

Implement adapters rather than vendor-specific calls throughout the application.

Initial adapters may include:

- OpenAI-compatible API
- Anthropic
- Google
- OpenRouter or another optional aggregator
- A generic custom endpoint for locally hosted or open-weight models

Support OpenAI-compatible endpoints because many providers expose that interface. Do not assume that all providers implement every parameter consistently.

Keep provider-specific differences inside adapters.

---

# 9. Model configuration

Provide an administrative configuration page where KK can manage:

- Provider
- Model name
- Display name
- API endpoint
- API key reference
- Supported context length
- Supported output length
- Structured-output support
- Tool-use support
- Reasoning support
- Input token price
- Cached-input token price
- Output token price
- Reasoning token price, when separate
- Currency
- Effective date of price
- Whether the model is enabled
- Recommended use
- Quality tier
- Cost tier
- Privacy notes
- Data-retention notes
- Default temperature
- Default output-token limit
- Timeout
- Retry policy

Never commit API keys to source control.

Use environment variables or a secrets manager.

Prices must be configurable because vendors change pricing.

Do not hard-code pricing values into application logic.

Store a dated pricing record so historical runs retain the price assumptions used at that time.

---

# 10. Model routing

For the MVP, use user-controlled and rule-based routing. Do not build an opaque autonomous router.

Allow KK to define:

```text
Intake and Clarification → provider/model A
Initial Drafter → provider/model B
Strategist → provider/model C
Skeptic → provider/model D
Editor → provider/model E
Synthesizer → provider/model F
Optional Originality Reviewer → provider/model G
Final Drafter → provider/model H
```

## Model selection policy

The default execution path must use the lowest-cost model that is reasonably capable of completing the assigned role.

Frontier or high-cost reasoning models must not be used by default.

They may be invoked only when one or more of these conditions apply:

* The user explicitly selects a higher-capability model
* Reviewer confidence is below the configured threshold
* Strategist and Skeptic materially disagree
* Structured output repeatedly fails
* The content is marked high stakes
* The draft contains complex claims requiring deeper reasoning
* The user requests a final high-confidence review
* A lower-cost model has already produced an inadequate result

The system must:

* Show the assigned model and estimated cost before execution
* Allow a per-run budget cap
* Prevent automatic escalation when the projected cost exceeds that cap
* Record the reason for every model escalation
* Allow escalation for one agent without rerunning the entire board
* Support side-by-side comparison before permanently changing a role’s default model
* Never infer that a higher-cost model is automatically better
* Track whether escalation materially improved the accepted output
* Prevent accidental duplicate calls

The default MVP configuration should use low-cost models for:

* Intake and clarification
* Content Intent Brief creation
* Initial classification
* Routine editorial review
* Simple synthesis

Mid-tier models may be used for:

* More complex synthesis
* Final drafting
* Difficult skepticism or strategic review

Frontier models should be reserved for explicit escalation and exceptional cases.

---

# 11. Cost and token tracking

For every model call, save:

- Provider
- Model
- Agent role
- Post or project ID
- Draft version ID
- Prompt template ID
- Prompt template version
- Voice skill version
- Knowledge chunks retrieved
- Input tokens
- Cached input tokens
- Output tokens
- Reasoning tokens, when supplied
- Total tokens
- Estimated input cost
- Estimated output cost
- Estimated total cost
- Actual billed cost, when available
- Currency
- Pricing record used
- Start time
- End time
- Latency
- Success or failure
- Retry count
- Error category
- Escalation reason, when applicable
- Prior lower-cost model call ID, when applicable
- Per-run budget cap and projected cost at the escalation decision
- Whether escalation materially improved the accepted output
- User rating
- Whether the output was accepted
- Whether the output influenced the final draft

Display:

- Cost per review run
- Cost per agent
- Cost per post
- Cost per final published item
- Cost by provider
- Cost by model
- Average cost per accepted recommendation
- Average latency
- Token usage over time
- Estimated monthly spend
- Budget remaining
- Escalation frequency, reasons, and accepted-output improvement outcomes

Treat “cost per useful insight” as more meaningful than token cost alone.

Provide simple user feedback controls such as:

- Useful
- Partly useful
- Not useful
- Repetitive
- Too generic
- Too harsh
- Missed the point
- Changed my thinking

Use these ratings for analysis, not autonomous model training.

---

# 12. Retrieval and context management

## 12.1 Storage responsibilities and runtime loading

Use the filesystem for durable source material:

- Book of Knowledge
- Voice skill
- Prompt templates
- Agent instructions

Use the database for transactional, indexed, and evolving application data:

- Ideas
- Content Intent Briefs
- Drafts and draft versions
- Agent reviews
- Recommendations and user decisions
- Model calls, token usage, pricing assumptions, costs, and latency
- Published posts and publication URLs
- Performance metrics
- Comments and qualitative feedback
- Retrospectives

The database must not become the only copy of the Book of Knowledge or voice skill.

Load and validate the Book of Knowledge and voice skill at application startup or through an explicit refresh command:

```bash
npm run content:index
```

The command must validate configured paths, detect changed files and sections, parse and index changed content, skip unchanged content, report errors clearly, and preserve the previous valid indexed content when possible. Content must not be available only at build time. Local development may optionally watch the configured files so changes become available without rebuilding.

## 12.2 Retrieval pipeline

Use retrieval-augmented generation for the Book of Knowledge and published-content history.

Do not place all documents into every request.

The retrieval pipeline should:

1. Identify the content assignment.
2. Extract likely topics and claims.
3. Retrieve relevant Book of Knowledge sections.
4. Retrieve relevant previously published posts.
5. Retrieve related feedback when helpful.
6. Provide citations or source references with each context chunk.
7. Log exactly which chunks were sent to each agent.

Use a storage and retrieval design that can begin locally and evolve later.

Possible implementation:

- PostgreSQL for application data
- `pgvector` for embeddings
- Full-text search for exact terms
- Hybrid retrieval combining keyword and vector search

For a smaller local MVP, SQLite plus a lightweight vector store is acceptable, but structure the repository so PostgreSQL can be adopted without rewriting the domain layer.

Each retrieved passage should include:

- Document ID
- Document title
- Heading path
- Passage text
- Source location
- Relevance score
- Retrieval method
- Version

The UI should let the user inspect the context used in a review.

---

# 13. Data model

Create a clear relational schema.

Core entities should include:

## Users

- id
- name
- email
- created_at
- updated_at

## Projects or content workspaces

- id
- user_id
- title
- description
- status
- created_at
- updated_at

## Ideas

- id
- project_id
- title
- raw_notes
- source
- theme
- status
- created_at
- updated_at

## Intake conversations

- id
- idea_id
- status
- created_at
- updated_at

## Intake messages

- id
- conversation_id
- role
- message_type
- body
- sequence
- model_call_id, when generated by a model
- created_at

## Content Intent Briefs

- id
- content_item_id
- working_title
- central_thesis
- intended_audience
- purpose
- trigger_context
- supporting_points
- user_provided_evidence
- claims_requiring_validation
- possible_counterargument
- desired_tone
- intended_platform
- suggested_length
- relationship_to_previous_posts
- open_questions
- system_assumptions
- version
- status
- created_at
- updated_at

## Content items

- id
- project_id
- idea_id
- content_type
- working_title
- target_audience
- intended_platform
- objective
- status
- created_at
- updated_at

## Draft versions

- id
- content_item_id
- version_number
- body
- created_by
- parent_version_id
- change_summary
- voice_skill_version_id, when AI-assisted drafting used the voice skill
- model_call_id, when generated by a model
- created_at

## Agent roles

- id
- name
- description
- prompt_path
- prompt_version
- prompt_checksum
- enabled

## Model providers

- id
- name
- adapter_type
- endpoint
- enabled
- configuration

## Models

- id
- provider_id
- model_key
- display_name
- capabilities
- context_limit
- enabled

## Model pricing

- id
- model_id
- currency
- input_price_per_million
- cached_input_price_per_million
- output_price_per_million
- reasoning_price_per_million
- effective_from
- effective_to
- source_note

## Agent configurations

- id
- role_id
- model_id
- prompt_version
- temperature
- max_output_tokens
- reasoning_effort
- active

## Review runs

- id
- content_item_id
- draft_version_id
- status
- estimated_cost
- actual_cost
- started_at
- completed_at

## Agent reviews

- id
- review_run_id
- role_id
- model_id
- prompt_version
- structured_output
- text_output
- confidence_score
- status
- created_at

## Recommendations

- id
- agent_review_id
- category
- recommendation
- severity
- user_decision
- user_note
- applied_to_version_id

## Model calls

Include all token, pricing, latency, retry, and outcome fields described above.

## Knowledge documents

- id
- title
- source_path
- source_type
- version
- checksum
- status
- metadata
- created_at
- updated_at

## Knowledge sections

- id
- document_id
- heading_path
- text
- sequence
- embedding_reference
- metadata

## Retrieval records

- id
- model_call_id
- knowledge_section_id
- relevance_score
- retrieval_method
- rank

## Voice skill versions

Store discovery and usage metadata, not the only durable copy of the skill:

- id
- name
- source_path
- version
- checksum
- status
- loaded_at
- metadata

## Publications

- id
- content_item_id
- draft_version_id
- platform
- publication_url
- published_at
- final_text
- notes

## Performance snapshots

- id
- publication_id
- captured_at
- impressions
- reactions
- comments
- reposts
- saves
- clicks
- follows
- other_metrics

## Feedback items

- id
- publication_id
- source
- feedback_type
- author_or_audience_type
- text
- sentiment
- theme
- user_interpretation
- created_at

## Retrospectives

- id
- publication_id
- what_worked
- what_did_not
- unexpected_feedback
- follow_up_ideas
- strategic_value
- created_at

Use migrations and indexes.

---

# 14. Application pages

Build a clean, practical UI.

## Dashboard

Show:

- Active drafts
- Ideas awaiting development
- Recent reviews
- Recent publications
- Current month AI spend
- Average cost per review
- Posts needing feedback updates
- Recommended follow-up topics

## Idea inbox

Allow KK to quickly capture:

- A sentence
- Voice notes converted to text
- A link
- A quotation
- An observation
- A question
- A rough argument
- A response to an industry claim

## Content workspace

Show:

- Draft editor
- Version history
- Target audience
- Content objective
- Intended platform
- Selected knowledge context
- Previous related posts
- Editorial board controls
- Cost estimate
- Agent assignment
- Review results
- Recommendation decisions
- Final drafting controls

## Editorial board view

Present each agent separately.

Show:

- Agent role
- Model used
- Prompt version
- Summary
- Structured findings
- Confidence
- Cost
- Tokens
- Latency
- User rating
- Rerun button
- Escalate button
- Compare-model button

## Synthesis view

Show:

- Consensus
- Disagreements
- Critical issues
- Suggested revisions
- Claims requiring evidence
- Recommended next action
- Cost of the complete run

## Knowledge browser and Content Status

Allow:

- Search indexed Book of Knowledge sections
- Browse by heading
- Version and checksum inspection
- Source-section preview
- Inspection of sections supplied to each model call
- Read-only Book of Knowledge path and status
- Last indexed time and indexed-section count
- Read-only voice skill path, status, and version
- Indexing and configuration error display

Do not provide normal-use upload, paste, replace, archive, or tagging controls for the Book of Knowledge or voice skill in the MVP.

## Published library

Allow:

- Search by topic
- View final post
- View draft history
- View reviews
- Add feedback
- Update metrics
- Start a follow-up post
- Compare related posts

## Analytics

Show:

- Engagement trends
- Topic trends
- Cost trends
- Model usefulness
- Accepted recommendations by agent
- Frequently rejected recommendations
- Posts by strategic outcome
- High-engagement versus high-value content
- Repeated arguments
- Audience questions
- Potential content series

Do not create simplistic claims that a model caused higher engagement unless the data supports it.

## Settings

Allow configuration of:

- Models
- Providers
- Pricing
- Agent assignments
- Budgets
- Prompt versions
- Voice skill versions
- Privacy settings
- Data retention
- Default review workflow

---

# 15. Prompt management

Store prompts as versioned filesystem files. The database may record prompt paths, checksums, and versions used by model calls, but it must not become the only durable copy of prompt templates or agent instructions.

Use modular prompts:

```text
/prompts
  /shared
    editorial-board-policy.md
    author-ownership.md
    factual-integrity.md
    output-schema.md
  /roles
    intake-clarification.md
    initial-drafter.md
    strategist.md
    skeptic.md
    editor.md
    synthesizer.md
    originality-reviewer.md
    final-drafter.md
```

The authoritative `kk-spoken-voice` skill remains at its configured external filesystem path and must not be duplicated under `/prompts` or elsewhere in the repository.

Do not bury long prompts inside application source files.

Record the exact prompt version used for every call.

Make prompts editable through files initially. An administrative prompt editor may be added later.

Require structured JSON output from review agents.

Validate all structured outputs against schemas.

When validation fails:

1. Attempt one repair call using the same model.
2. If it still fails, preserve the raw output.
3. Mark the result as partially structured.
4. Do not silently discard it.
5. Log the failure and repair cost.

---

# 16. Suggested review output schema

Use a common envelope:

```json
{
  "role": "skeptic",
  "summary": "string",
  "confidence": {
    "score": 0.0,
    "reason": "string"
  },
  "findings": [
    {
      "category": "unsupported_claim",
      "severity": "high",
      "location": "paragraph 3",
      "observation": "string",
      "recommendation": "string",
      "requires_user_judgment": true
    }
  ],
  "strengths": ["string"],
  "risks": ["string"],
  "top_recommendations": ["string"],
  "recommended_action": "revise"
}
```

Extend the schema for role-specific fields.

---

# 17. Learning loop

The application should learn through analysis of recorded history, not through hidden autonomous behavior.

After publication, allow KK to add metrics and feedback.

Then support retrospective questions such as:

- Which ideas consistently produce substantive executive discussion?
- Which posts generate engagement but little meaningful follow-up?
- Which openings work best for KK’s audience?
- Which themes are becoming repetitive?
- Where do readers misunderstand the argument?
- Which posts attract practitioners versus casual AI audiences?
- Which editorial recommendations were most useful?
- Which agents produce repetitive feedback?
- Which low-cost models perform nearly as well as expensive models?
- When did model escalation materially improve the output?
- Which posts should become longer articles?
- Which objections deserve a dedicated follow-up?
- Is KK’s writing becoming clearer over time?
- Is the system making the writing too polished or generic?

Do not automatically train or fine-tune a model on private content.

For the MVP, use retrieval and analytics.

Any future fine-tuning capability should require a separate explicit design and approval process.

---

# 18. Privacy and security

Assume the Book of Knowledge and unpublished writing are private.

Implement:

- Authentication
- Authorization
- Encrypted transport
- Secure API-key storage
- Environment-based secrets
- Database backups
- Audit logging for sensitive configuration changes
- Input validation
- Output sanitization
- CSRF protection where applicable
- Rate limiting
- Content-size limits
- Safe file-upload handling
- Dependency scanning
- Secret scanning
- Clear provider privacy configuration

Do not send private content to a provider unless that provider is enabled by the user.

Allow the user to mark content sensitivity:

- Public
- Internal
- Confidential
- Highly sensitive

Model routing should respect sensitivity rules.

For example, a locally hosted model may be required for highly sensitive drafts.

---

# 19. Technology choices

Use a mainstream stack that any capable coding assistant can understand and continue.

Preferred default:

## Frontend

- Next.js
- TypeScript
- React
- A simple component library
- Server-side rendering where appropriate

## Backend

Use either:

- Next.js server routes for a compact MVP, or
- A separate Python FastAPI service if the AI orchestration and retrieval layer would be cleaner in Python

Choose one approach and explain the tradeoff before implementation.

A reasonable design is:

```text
Next.js frontend
FastAPI orchestration API
PostgreSQL + pgvector
Background job worker
Object storage for user-provided attachments if attachment support is implemented
```

However, do not introduce unnecessary distributed infrastructure for the MVP.

## Database

- PostgreSQL
- `pgvector`
- SQL migrations
- Repository or service layer separating domain logic from persistence

## Background processing

Use a lightweight job queue for multi-agent runs.

The UI should show:

- Pending
- Running
- Completed
- Partially completed
- Failed

A failed agent should not invalidate successful agent outputs.

## Testing

Include:

- Unit tests
- Provider-adapter contract tests
- Prompt-output schema tests
- Cost-calculation tests
- Retrieval tests
- API tests
- Basic end-to-end tests

Mock model providers in tests.

Do not require live model calls for the standard test suite.

---

# 20. Repository standard
Make the codebase easy for Codex, Claude Code, OpenCode, or another coding assistant to pick up.

Include:

```text
README.md
ARCHITECTURE.md
PRODUCT_REQUIREMENTS.md
DATA_MODEL.md
MODEL_PROVIDER_INTERFACE.md
PROMPTING.md
SECURITY.md
DEVELOPMENT.md
TESTING.md
DECISIONS.md
CHANGELOG.md
.env.example
```

Also include:

```text
/docs/adr
```

Use a repository layout that keeps domain logic, provider adapters, content loading, persistence, prompts, schemas, migrations, and tests separate. At minimum, provide the following structure, adjusted only as required by the selected backend approach:

```text
/app or /apps
/src
  /domain
  /application
  /ai
    /adapters
    /routing
    /usage
  /content
    /loaders
    /markdown
    /indexing
    /retrieval
  /persistence
  /jobs
/content
  /knowledge
    EAIO_Canonical_Knowledge_Base.md
/prompts
  /shared
  /roles
/schemas
/migrations
/scripts
/tests
  /unit
  /contract
  /integration
  /e2e
/docs/adr
```

Do not add an `/author` directory or a repository copy of `kk-spoken-voice` for the MVP.

Use architecture decision records for important choices.

Document:

- Why the selected stack was chosen
- How to add a provider
- How to add a model
- How to add an agent role
- How to update pricing
- How to configure, refresh, and verify `kk-spoken-voice`
- How to configure and index the Book of Knowledge
- How token cost is calculated
- How retrieval works
- How review runs are persisted
- How to run locally
- How to deploy
- How to test without API keys

Use clear names and avoid clever abstractions.

Prefer small modules with explicit interfaces.

Add comments only where the intent is not obvious.

---

# 21. MVP scope

The first usable version should include:

1. Authentication
2. File-based loading and indexing of `EAIO_Canonical_Knowledge_Base.md` through `EAIO_BOK_PATH`
3. External loading and versioning of `kk-spoken-voice` through `KK_VOICE_SKILL_PATH`
4. Conversational idea intake beginning with **What are you thinking about?**
5. Intake and Clarification Agent
6. No more than four or five focused clarification questions
7. Editable Content Intent Brief
8. Three post-intake paths: review an existing draft, create a working draft, or review the idea before drafting
9. Initial Drafting Agent
10. Draft editor and version history
11. Strategist, Skeptic, and Editor agents
12. Synthesizer
13. Model-provider abstraction
14. At least two provider adapters
15. Per-role model configuration
16. Structured review output
17. Token, pricing-assumption, latency, and cost tracking for every model call
18. Cost estimate before Editorial Board execution
19. Final Drafting Agent using the versioned `kk-spoken-voice` skill
20. User acceptance, partial acceptance, or rejection of recommendations
21. Publication record
22. Manual performance and feedback entry
23. Basic analytics and retrospectives
24. Full local setup documentation
25. Mock-provider test mode

Do not include in the initial MVP:

- Automatic LinkedIn publishing
- Automated scraping of LinkedIn metrics
- Autonomous posting
- Self-modifying prompts
- Automatic fine-tuning
- Complex multi-user tenancy
- An elaborate workflow engine
- Dozens of agent roles
- Fully autonomous model routing
- Claims of learning that are not backed by stored data

---

# 22. Implementation sequence

Work in phases.

## Phase 1: Foundation

Create:

- Product requirements
- Architecture
- Repository structure
- Database schema
- Provider interface
- Prompt structure
- Local development setup
- Mock model provider

Pause and verify that the architecture is model-agnostic.

## Phase 2: Runtime content loading and retrieval

Implement:

- Configured Book of Knowledge loading from `EAIO_BOK_PATH`
- Configured external voice-skill loading from `KK_VOICE_SKILL_PATH`
- Path validation, checksum calculation, and version identifiers
- Startup loading and explicit `content:index` refresh command
- Changed-section detection and preservation of the previous valid index
- Section parsing
- Search
- Embeddings
- Retrieval
- Source traceability
- Read-only Content Status page

Verify that retrieved context can be inspected.

## Phase 3: Conversational intake and content workspace

Implement:

- **What are you thinking about?** conversational idea capture
- Optional audience, platform, length, link, and follow-up fields
- Intake and Clarification Agent using a low-cost model
- Up to five focused questions generated in one call where practical
- Skip and **Use your best judgment** behavior
- Editable Content Intent Brief and versioning
- Draft editing
- Draft versions
- Content metadata
- Related-content lookup

## Phase 4: Three drafting paths and Editorial Board

Implement:

- Existing-draft preservation
- Initial Drafting Agent using `kk-spoken-voice`
- Pre-draft Strategist and Skeptic idea review
- Strategist
- Skeptic
- Editor
- Independent execution
- Structured outputs
- Partial failure handling
- Synthesizer
- User review decisions

## Phase 5: Final draft

Implement:

- Versioned external `kk-spoken-voice` use
- Approved recommendation input
- Rejected recommendation preservation
- Final drafting
- Manual editing
- Version comparison

## Phase 6: Cost governance

Implement:

- Pricing configuration
- Token logging
- Cost calculations
- Run-level estimate
- Spending caps
- Cost dashboards
- Model comparison

## Phase 7: Publication and learning

Implement:

- Publication record
- Performance snapshots
- Feedback capture
- Retrospectives
- Basic cross-post analytics

At the end of every phase:

- Run tests
- Update documentation
- List unresolved decisions
- Identify shortcuts or technical debt
- Confirm that no vendor-specific dependency leaked into the domain layer

---

# 23. Initial UX flow

The application must validate configured content sources at startup, but the normal user experience must not ask the user to configure, upload, paste, select, or edit the Book of Knowledge or voice skill. Configuration and indexing status may be inspected on the read-only Content Status page.

After sign-in, the main screen must immediately ask **What are you thinking about?** and enter the canonical workflow defined in Section 5. Content-source administration must not interrupt that flow.

Provider, model, pricing, role-assignment, budget, privacy, and retention settings remain available in Settings. Missing configuration that blocks a requested action must produce a specific error at the point of use. In particular, a missing voice skill must not block intake or review, but must block AI-assisted drafting.

The read-only Content Status page may show the Book of Knowledge and voice-skill paths, status, versions, checksums where applicable, last successful indexing time, indexed-section count, and current errors. It must not become an upload or editing workflow.

---

# 24. Seed content

Create initial prompt files for:

- Shared editorial-board policy
- Intake and Clarification Agent
- Initial Drafting Agent
- Strategist
- Skeptic
- Editor
- Synthesizer
- Optional Originality and Landscape Reviewer
- Final Drafting Agent

Do not create a repository copy of `kk-spoken-voice`. Load it from `KK_VOICE_SKILL_PATH`.

Use the requirements in this document as the starting point.

Also create sample data:

- One raw idea
- One Content Intent Brief
- One draft
- One completed review
- One published LinkedIn post
- One performance snapshot
- Several qualitative comments
- One retrospective

Clearly label all sample records as synthetic.

Do not invent KK’s professional history in sample content.

---

# 25. Important behavioral constraints

The application must never:

- Present generated text as verified fact.
- Add fabricated citations.
- Claim complete awareness of public content.
- State that an idea is original with certainty.
- Use engagement as the only definition of success.
- Publish without explicit user action.
- Change the user’s argument without showing the change.
- hide token usage or model cost.
- Send the entire private knowledge base unnecessarily.
- Lock the application to one model provider.
- Hard-code current model names throughout business logic.
- Treat reviewer consensus as truth.
- Treat disagreement as failure.
- Allow the Synthesizer to erase an important minority objection.
- Automatically incorporate audience comments as facts.
- Train on private data without explicit approval.

---

# 26. Definition of done

The MVP is complete when KK can:

- Run the application locally.
- Load and incrementally index `EAIO_Canonical_Knowledge_Base.md` from `EAIO_BOK_PATH` without uploading it through the UI.
- Load and version `kk-spoken-voice` from `KK_VOICE_SKILL_PATH` without copying it into the repository.
- Begin with conversational idea intake using bullets, rough notes, incomplete thoughts, transcripts, or an existing draft.
- Answer or skip no more than four or five focused clarification questions.
- Edit a generated Content Intent Brief.
- Choose to review an existing draft, create a working draft, or review the idea before drafting.
- Run three independent reviewers and one Synthesizer.
- Assign different providers and models to each role.
- See retrieved source context.
- See model, token, latency, and cost information for every call.
- Accept, partially accept, or reject individual recommendations.
- Generate a final draft using the versioned external `kk-spoken-voice` skill.
- Compare draft versions.
- Mark a version as published.
- Enter performance metrics and comments.
- View a basic retrospective.
- Add a new provider without changing editorial workflow code.
- Run the automated test suite without making live model calls.

---

# 27. First response expected from the coding agent

Before writing production code, provide:

1. A concise understanding of the product.
2. The proposed architecture.
3. The recommended MVP stack.
4. The main domain entities.
5. The provider abstraction.
6. The proposed repository structure.
7. The phased build plan.
8. The most important risks and tradeoffs.
9. Any assumptions being made.
10. A list of decisions that can safely be deferred.

Do not ask broad discovery questions that are already answered in this specification.

Where a detail is missing, make a reasonable, reversible choice and document the assumption.

Then begin Phase 1.
