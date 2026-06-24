# CrowdMind AI — Demo Environment

> **All data in the demo environment is synthetic and clearly labeled.**
> It exists for portfolio reviews, recruiter demos, investor previews,
> hackathon judging, and automated testing.

## What's included

On first boot, the backend automatically seeds **4 fully-analyzed sample projects** owned by a shared demo user:

| Project        | Category               | Validation | PMF | Investor | Responses |
|----------------|------------------------|-----------:|----:|---------:|----------:|
| **FleetBrain AI** | Transportation Tech | 82         | 80  | 80       | 30        |
| **MedPass**       | HealthTech          | 78         | 74  | 72       | 30        |
| **FitGenie AI**   | FitnessTech         | 71         | 70  | 64       | 30        |
| **SkillSwap**     | EdTech (P2P)        | 68         | 66  | 58       | 30        |

Each project ships with:

- 30 synthetic feedback responses (ratings, intents, suggestions, sentiment)
- A complete **Sample AI Analysis** including:
  - Product–Market Fit Engine (PMF, Demand, Readiness, Differentiation, Scalability)
  - Customer Personas (3–5)
  - Competitor Intelligence (table + market gaps + advantages + blue-ocean ideas)
  - Investor Readiness (5 sub-scores + reasoning)
  - SWOT matrix
  - Business Model Canvas (9 cells)
  - Startup Success Forecast (1y / 3y / 5y probabilities)
  - 10-slide Pitch Deck outline

## How the data is marked synthetic

Every demo artefact is tagged so it can never be mistaken for real research:

- **Projects** have `is_demo: true` in MongoDB.
- **Insights** carry `model: "demo-sample-analysis-v1"` and a top-level `_demo_label: "Sample AI Analysis — <project>"`.
- **Reviewer names** end in `" (Demo)"`.
- The UI shows a "Demo data" pill next to demo project cards and on the project detail header.

## Demo credentials

```
email:    demo@crowdmind.io
password: DemoUser123!
```

## Re-seeding

The seeder is idempotent on startup. If you want to re-seed manually:

```bash
# As admin
curl -X POST $API_URL/api/demo/seed -H "Authorization: Bearer <admin_token>"

# Or wipe and let startup re-seed
mongosh --eval 'use("test_database"); db.projects.deleteMany({is_demo:true}); db.feedback.deleteMany({user_id:"demo_reviewer"})'
```

## Real analyses still work

The demo data only fills *seeded* projects. When a real user creates a new project and collects feedback, the system runs the **live async modular Claude Sonnet 4.5 pipeline** (`POST /api/projects/{id}/analyze`) — no shortcuts, no mock fallback. The two flows are independent.
