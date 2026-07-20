# Graph Report - .  (2026-07-20)

## Corpus Check
- 137 files · ~55,661 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 544 nodes · 1296 edges · 34 communities (25 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Domain Actions and Access|Domain Actions and Access]]
- [[_COMMUNITY_UI Components and Layout|UI Components and Layout]]
- [[_COMMUNITY_Supabase Data and Auth|Supabase Data and Auth]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Product Architecture and Operations|Product Architecture and Operations]]
- [[_COMMUNITY_Authentication Actions and Forms|Authentication Actions and Forms]]
- [[_COMMUNITY_Dashboard and Idea Views|Dashboard and Idea Views]]
- [[_COMMUNITY_Graphify Pipeline|Graphify Pipeline]]
- [[_COMMUNITY_Form and Editor Components|Form and Editor Components]]
- [[_COMMUNITY_Domain Data Mapping|Domain Data Mapping]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Project Scripts|Project Scripts]]
- [[_COMMUNITY_Upload Validation and Constants|Upload Validation and Constants]]
- [[_COMMUNITY_Local Environment Setup|Local Environment Setup]]
- [[_COMMUNITY_Continuous Integration Tests|Continuous Integration Tests]]
- [[_COMMUNITY_Sentry Instrumentation|Sentry Instrumentation]]
- [[_COMMUNITY_Graphify Project Guidance|Graphify Project Guidance]]
- [[_COMMUNITY_Reminder Edge Function|Reminder Edge Function]]
- [[_COMMUNITY_Claude Tool Hooks|Claude Tool Hooks]]
- [[_COMMUNITY_Codex Tool Hooks|Codex Tool Hooks]]
- [[_COMMUNITY_Deno Supabase Imports|Deno Supabase Imports]]
- [[_COMMUNITY_Authenticated E2E Test|Authenticated E2E Test]]
- [[_COMMUNITY_Next.js Configuration|Next.js Configuration]]
- [[_COMMUNITY_PostCSS Configuration|PostCSS Configuration]]
- [[_COMMUNITY_Prettier Configuration|Prettier Configuration]]

## God Nodes (most connected - your core abstractions)
1. `requireViewer()` - 48 edges
2. `Button()` - 25 edges
3. `requireProfile()` - 22 edges
4. `Card` - 21 edges
5. `createClient()` - 21 edges
6. `scripts` - 18 edges
7. `cn()` - 18 edges
8. `Badge()` - 17 edges
9. `compilerOptions` - 17 edges
10. `firstIssue()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Claude Graphify Pipeline` --semantically_similar_to--> `Codex Graphify Pipeline`  [INFERRED] [semantically similar]
  .claude/skills/graphify/SKILL.md → .codex/skills/graphify/SKILL.md
- `Claude Semantic Extraction Contract` --semantically_similar_to--> `Codex Semantic Extraction Contract`  [INFERRED] [semantically similar]
  .claude/skills/graphify/references/extraction-spec.md → .codex/skills/graphify/references/extraction-spec.md
- `Atomic Idea-to-Goal Promotion` --semantically_similar_to--> `Atomic Promotion Transaction`  [INFERRED] [semantically similar]
  README.md → docs/architecture.md
- `Goalpost Privacy Model` --semantically_similar_to--> `Database-Enforced Authorization`  [INFERRED] [semantically similar]
  README.md → docs/architecture.md
- `Reproducible Local Toolchain` --semantically_similar_to--> `Reproducible Local Environment`  [INFERRED] [semantically similar]
  README.md → testing.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Graphify Full Build Pipeline** — graphify_skill_file_detection_gate, graphify_skill_ast_structural_extraction, graphify_skill_semantic_subagent_extraction, graphify_skill_graph_build_and_community_detection, graphify_skill_graph_output_publication [EXTRACTED 1.00]
- **Graph Query Feedback Cycle** — references_query_graph_vocabulary, references_query_constrained_query_expansion, references_query_bfs_dfs_traversal, references_query_query_result_feedback [EXTRACTED 1.00]
- **CI Validation Suite** — workflows_ci_application_validation_job, workflows_ci_database_validation_job, workflows_ci_playwright_chromium_e2e, workflows_ci_supabase_database_tests [EXTRACTED 1.00]
- **Idea-to-Goal Content Lifecycle** — readme_private_idea_lists, readme_atomic_idea_to_goal_promotion, docs_architecture_atomic_promotion_transaction, readme_public_goal_trees [INFERRED 0.95]
- **Production Release Assurance** — docs_operations_staged_deployment_order, docs_operations_required_monitoring, testing_manual_beta_smoke_test, testing_production_release_gate [INFERRED 0.85]
- **Encrypted Backup and Recovery** — workflows_nightly_backup_nightly_encrypted_backup_workflow, docs_operations_encrypted_backup_lifecycle, docs_operations_restore_rehearsal, testing_nightly_backup_configuration [INFERRED 0.95]

## Communities (34 total, 9 thin omitted)

### Community 0 - "Domain Actions and Access"
Cohesion: 0.08
Nodes (45): addLinkAttachmentAction(), deleteAttachmentAction(), parentSchema, uploadAttachmentAction(), addCommentAction(), addGoalEventAction(), addGoalTaskAction(), addGoalUpdateAction() (+37 more)

### Community 1 - "UI Components and Layout"
Cohesion: 0.08
Nodes (36): toggleGoalTaskAction(), NotFound(), signOutAction(), AppNav(), items, MobileNav(), Brand(), GoalTree() (+28 more)

### Community 2 - "Supabase Data and Auth"
Cohesion: 0.08
Nodes (37): requireAdmin(), resolveReportAction(), suspendAccountAction(), deleteAccountAction(), updateProfileAction(), uploadAvatarAction(), AdminPage(), Row (+29 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.04
Nodes (47): dependencies, class-variance-authority, clsx, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, lucide-react (+39 more)

### Community 4 - "Product Architecture and Operations"
Cohesion: 0.08
Nodes (46): Atomic Promotion Transaction, Authorized Realtime Broadcast, Database-Enforced Authorization, Goalpost Architecture, Goalpost Data Model, Hybrid Rendering Boundary, Idempotent Reminder Delivery, Goalpost Permission Matrix (+38 more)

### Community 5 - "Authentication Actions and Forms"
Cohesion: 0.09
Nodes (27): createListAction(), AuthState, requestPasswordResetAction(), signInAction(), signInWithGoogleAction(), signUpAction(), signUpSchema, updatePasswordAction() (+19 more)

### Community 6 - "Dashboard and Idea Views"
Cohesion: 0.16
Nodes (24): DashboardPage(), steps, ArchivePage(), CalendarPage(), IdeaBoard(), IdeaStack(), LandingTree(), nodes (+16 more)

### Community 7 - "Graphify Pipeline"
Cohesion: 0.07
Nodes (40): Graphify Invocation Directive, AST Structural Extraction, Claude Graphify Pipeline, Codex Graphify Pipeline, Codex Inline Query Fallback, Codex Parallel Agent Extraction, Confidence Audit Trail, Existing Graph Fast Path (+32 more)

### Community 8 - "Form and Editor Components"
Cohesion: 0.13
Nodes (17): ActionMessage(), CreateGoalButton(), CreateListButton(), GoalUpdateForm(), NewGoalForm(), IdeaEditorForm(), Row, NewListForm() (+9 more)

### Community 9 - "Domain Data Mapping"
Cohesion: 0.14
Nodes (24): asNullableString(), asString(), collaboratorFromRow(), getIdea(), getProfileById(), goalFromRow(), ideaFromRow(), profileFromRow() (+16 more)

### Community 10 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 11 - "Project Scripts"
Cohesion: 0.11
Nodes (18): scripts, build, db:reset, db:start, db:stop, db:test, db:types, dev (+10 more)

### Community 12 - "Upload Validation and Constants"
Cohesion: 0.16
Nodes (12): fraunces, manrope, ALLOWED_DOCUMENT_TYPES, ALLOWED_IMAGE_TYPES, GOAL_EVENT_LABELS, RESERVED_USERNAMES, asciiContains(), readFileBuffer() (+4 more)

### Community 13 - "Local Environment Setup"
Cohesion: 0.29
Nodes (6): envPath, root, status, supabaseCli, templatePath, values

### Community 14 - "Continuous Integration Tests"
Cohesion: 0.40
Nodes (6): Application Validation Job, CI Workflow, Concurrency Cancellation, Database Validation Job, Playwright Chromium End-to-End Tests, Supabase Database Tests

### Community 16 - "Graphify Project Guidance"
Cohesion: 0.83
Nodes (4): Graphify Knowledge Graph, Graphify Project Instructions, Incremental Graph Maintenance, Query-First Graph Navigation

## Knowledge Gaps
- **154 isolated node(s):** `PreToolUse`, `PreToolUse`, `runId`, `nextConfig`, `name` (+149 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireViewer()` connect `Domain Actions and Access` to `UI Components and Layout`, `Supabase Data and Auth`, `Authentication Actions and Forms`, `Dashboard and Idea Views`, `Form and Editor Components`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `Button()` connect `UI Components and Layout` to `Domain Actions and Access`, `Supabase Data and Auth`, `Authentication Actions and Forms`, `Dashboard and Idea Views`, `Form and Editor Components`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Supabase Data and Auth` to `Domain Actions and Access`, `Domain Data Mapping`, `Authentication Actions and Forms`, `Form and Editor Components`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireProfile()` (e.g. with `WorkspaceLayout()` and `DashboardPage()`) actually correct?**
  _`requireProfile()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PreToolUse`, `PreToolUse`, `runId` to the rest of the system?**
  _164 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Domain Actions and Access` be split into smaller, more focused modules?**
  _Cohesion score 0.08376623376623377 - nodes in this community are weakly interconnected._
- **Should `UI Components and Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.08013468013468013 - nodes in this community are weakly interconnected._