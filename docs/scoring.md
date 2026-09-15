# Bore Score

The Bore Score is a deterministic, spot-specific heuristic from 0 to 10. It is not a machine-learning model and does not claim observation precision.

## Factors

- Wave size: 22%
- Swell/peak period: 18%
- Swell direction: 16%
- Local wind: 26%
- Tide: 8%
- Swell coherence/mixing: 10%

These weights form the initial baseline only. Each factor also provides a normalized value, a Norwegian reason and the raw inputs it used.

## Interactions and gates

The engine deliberately does not stop at a weighted average:

- moderate onshore wind reduces the combined result;
- destructive onshore wind applies a severe multiplicative penalty;
- near-flat conditions cap the score;
- swell beyond the configured maximum caps the score;
- incomplete inputs reduce confidence and modestly damp the total.

Daylight does not reduce physical surf quality. It is used by the best-window selection and labelled when the best conditions happen at night. Air and sea temperature never affect wave quality.

## Initial Bore calibration

The spot coordinates are verified. The initial shore normal, preferred swell angle, size, period and tide ranges are explicitly marked `initial_heuristic` in spot configuration. The tide contribution is deliberately conservative until real Bore sessions have been compared with the model.

Calibration should record forecast inputs, the generated breakdown and a structured human assessment. Tune configuration and curves; do not scatter spot exceptions through the UI.

## Semantic bands

```text
0.0–1.9   terrible
2.0–3.9   poor
4.0–5.4   marginal
5.5–6.9   fun
7.0–8.4   good
8.5–9.4   firing
9.5–10.0  exceptional
```

Labels and numbers accompany every score color.
