# AegisOps AI — Machine Learning & Anomaly Engine

## 1. Algorithmic Overview

AegisOps AI implements genuine, multi-strategy machine learning and statistical time-series analysis:

1. **Dynamic Statistical Baselining (Rolling Z-Score & EWMA)**:
   - Tracks 50-datapoint sliding windows per service metric.
   - Computes rolling mean $\mu$ and standard deviation $\sigma$.
   - $Z = \frac{|x - \mu|}{\sigma}$ detects sudden single-metric spikes exceeding $2.5\sigma$.

2. **Multivariate Anomaly Scoring (Isolation Forest & Dimensional Normalization)**:
   - Evaluates multi-dimensional state vector:
     $$\mathbf{x} = [\text{Latency}_{p95}, \text{ErrorRate}, \text{CPU}, \text{Memory}, \text{DBConnections}]$$
   - Uncovers subtle multi-signal anomalies where individual metrics appear within nominal bounds, but their joint distribution indicates failure.

3. **Composite Anomaly Fusion**:
   - Blends statistical sensitivity with multivariate isolation:
     $$\text{Score} = 0.50 \cdot S_{\text{iso}} + 0.50 \cdot \min(1.0, \frac{Z_{\max}}{6.0})$$
   - Mapped to severity levels:
     - `CRITICAL`: Score $> 0.70$
     - `HIGH`: Score $> 0.45$
     - `MEDIUM`: Score $> 0.25$
     - `LOW`: Nominal

---

## 2. ⭐ Incident DNA Fingerprinting & Cosine Similarity

When an outage occurs, AegisOps AI extracts an 8-dimensional normalized feature vector:

$$\mathbf{v}_{\text{DNA}} = [\Delta\text{lat}, \Delta\text{err}, \Delta\text{cpu}, \Delta\text{mem}, \Delta\text{conns}, \Delta\text{rps}, \text{queue}, \text{error\_log\_ratio}]$$

This vector is mapped against historical incident vectors via cosine similarity:

$$\text{Sim}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$

This provides operators with immediate context:
> *"This incident has a 91.2% signature similarity to INC-HIST-0014 (resolved by expanding HikariCP pool to 150)."*

---

## 3. Incident Predictive Risk Modeling (30-Minute Horizon)

The degradation predictor forecasts service failure probability over a 30-minute forward horizon:
- Identifies leading indicators (latency slope acceleration, connection saturation headroom, GC pause frequency).
- Produces calibrated probabilistic risk scores ($0.0 - 1.0$) rather than binary statements.
- Surfaces contributing signals directly in the SRE dashboard.
