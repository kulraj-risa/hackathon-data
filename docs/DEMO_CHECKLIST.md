# Demo Day Checklist

## The night before
- [ ] `cd web && npm run build` passes
- [ ] API + web redeployed to Cloud Run; both URLs load
- [ ] Open the live app, click every tab once (Overview, Risk Insights, Predict, Batch, Impact, Patterns, Audit)
- [ ] Predict → "Conflicted case" → Analyze works; SHAP factors + fixes render
- [ ] Batch → "Score 5 cases" works; distribution bar renders
- [ ] Impact tab loads both scenarios
- [ ] Screenshots saved as backup (in case wifi dies)

## Before walking on stage
- [ ] App already open in browser, logged in, on the **Overview** tab
- [ ] Second tab pre-opened on **Predict** with "Conflicted case" loaded
- [ ] Notifications OFF / Do-Not-Disturb ON
- [ ] Zoom level set so the gauge + factors are readable from the back
- [ ] Slides in presenter mode, deck on Slide 1
- [ ] Water nearby, phone silenced

## During (90-sec demo spine)
1. Overview: 60% approval, AUC 0.64→0.83
2. Predict: Conflicted case → gauge + SHAP factors + fixes
3. Remove a contradiction → risk drops ("denial prevented")
4. Batch: score the worklist → preventable count
5. Impact: target vs model-grounded ROI

## Talking discipline
- [ ] Lead with the honest number (AUC 0.83), not hype
- [ ] Point at the screen when showing factors/fixes
- [ ] Pause after "denial prevented"
- [ ] If asked a hard question, see `docs/QA_PREP.md`

## Recovery if the live app fails
- [ ] Switch to backup screenshots
- [ ] Run locally: `uvicorn app:app --port 8000` + `cd web && npm run dev`
- [ ] Keep narrating — the story stands on its own
