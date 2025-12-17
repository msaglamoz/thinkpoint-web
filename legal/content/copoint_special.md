# Copoint Privacy Addendum

**Product Scope:** Copoint Identity, Atlas, and Draft

## 1. Specific Data Processed by Copoint
When you utilize the Copoint module, we process additional categories of data specifically to deliver financial intelligence and project management capabilities:

*   **Financial Metadata:** Transaction timestamps, amounts, currency, and counterparty hashes. **We do not store plain-text bank account numbers or sensitive payment authentication data (SAD).**
*   **Project Artifacts:** Documents, blueprints, and proposals uploaded to Copoint Draft. These are encrypted at rest.
*   **Organizational Hierarchy:** Team structures and role assignments within your tenant.

> **Summary:** Copoint needs to see your project meta-data to work. We encrypt your documents and never store raw credit card or full banking credentials.

## 2. Automated Fraud Detection (Identity & Atlas)
Copoint utilizes proprietary algorithms to analyze patterns in your data for the purpose of detecting anomalies, potential forgery, and financial risk.
*   **Decision Making:** Our system may flag transactions as "High Risk."
*   **Human Oversight:** These flags are advisory. The final decision to approve or reject a transaction remains with your organization's authorized users.

## 3. Third-Party Integrations
If you connect Copoint to external services (e.g., Salesforce, Jira, GitHub), we act as a data processor for the information you choose to sync. You retain control over the scope of data imported via these integrations.

## 4. API Telemetry
For developers using the Copoint API:
*   We log the payload header size and response latency.
*   We do **not** log the body of API requests unless debug mode is explicitly enabled by your administrator for troubleshooting.
