# OpenStacks — Enterprise-Grade Library Management Software (Functional Feature Brief)

Short pitch: **OpenStacks** is a cloud-native, enterprise-grade Library Management Platform offered as Library-as-a-Service (LaaS). It combines a full integrated library system (ILS) with modern discovery, digital asset management, analytics, automated acquisitions, and extensible APIs so universities, public systems, corporate libraries and consortia can run resilient, multi-tenant, searchable, secure library services at scale.

Below I outline the functional surface area (what it *does*), compare/collect features found in existing solutions, and list features to *add* and *improve* so OpenStacks becomes a market-leading LaaS.

---

# 1 — Core functional modules (what OpenStacks must offer)

**1.1 Cataloging & Metadata**

* Support MARC21, UNIMARC, Dublin Core, BIBFRAME; import/export MARC, CSV, YAML.
* Authority control (names, subjects), automated duplicate detection, batch-editing, and metadata normalization.
* Linked data support (BIBFRAME/JSON-LD output) and enrichment (CrossRef, VIAF, LC Linked Data).
* Persistent identifiers: ISBN, ISSN, DOI, ORCID linking.

**1.2 Discovery & OPAC**

* Modern discovery layer (responsive OPAC), relevance-ranked search, faceted navigation, spell correction, typeahead.
* Indexed full-text search for born-digital content and OCRed images (Elasticsearch/Opensearch).
* Personalization: saved searches, favorites, reading lists, recommendations.
* Mobile-first UI and PWA support.

**1.3 Circulation & Patron Management**

* Check-in/check-out, renewals, holds/queue, recalls, fines/fee management (configurable fee rules).
* Multi-branch support, item-level statuses, copies, loan policies by patron type & item type.
* Patron profiles, access control, borrower categories, group accounts (faculty, departments).
* Self-checkout kiosk and contactless (NFC/RFID) workflows.

**1.4 Acquisitions & E-Resources Management**

* Purchase requests, approval workflows, budgeting, PO generation and tracking.
* Vendor management, invoice reconciliation, subscription and license management.
* E-resource access control (proxy, IP, SAML), link resolver, KB (knowledge base) and COUNTER usage import.

**1.5 Serial/Subscriptions Management**

* Periodical receipts tracking, prediction for gaps, routing slips, claim automation.
* Electronic serials management (integration with aggregators).

**1.6 Digital Assets & Institutional Repository**

* Ingest, store, and serve PDFs, datasets, images, audio, video; versioning, metadata.
* Preservation-ready storage (S3-compatible), checksums, fixity checks, OAI-PMH for harvesting.
* DOI/handle minting integration and access policies.

**1.7 Interlibrary Loan (ILL) & Consortia Services**

* ILL request creation, routing, automated lending rules, tracking.
* Consortia / multi-tenant sharing, resource pooling, patron-level sharing preferences.

**1.8 Reporting, Analytics & Dashboards**

* Standard reports (circulation, acquisitions, patron activity) + ad hoc report builder.
* Usage analytics (turnaways, e-resource COUNTER, cost-per-use) and KPI dashboards.
* Export to CSV, Excel; scheduled reports and webhooks.

**1.9 Identity, SSO & Authentication**

* SAML, OAuth2/OpenID Connect, LDAP/AD, CAS, Shibboleth.
* Two-factor auth, password policies, role and permission management (fine-grained RBAC).

**1.10 Integrations & APIs**

* REST and GraphQL APIs for every module, webhooks for events, SDKs (JS/Python).
* LMS integration (Canvas, Moodle, Blackboard) via LTI and reading list sync.
* ORCID, CrossRef, WorldCat, Google Scholar, discovery indices.
* Payment gateways for fines/fees and acquisitions (Stripe/PayPal/local gateways).

**1.11 Admin & Operations**

* Multi-site and multi-tenant management, tenant isolation, per-tenant customizations.
* Admin console for configuration, workflows, audit logs, job queues.
* Migration tools: MARC import wizards, bulk data mapping, preview/rollback.

---

# 2 — Library-as-a-Service (LaaS) specifics — operational & business features

**Deployment & Pricing models**

* SaaS (multi-tenant) with optional single-tenant/managed-hosting for large clients.
* Pricing options: per-patron, per-active-user, per-resource, flat enterprise, or hybrid (base + usage).
* Onboarding packages (migration + metadata cleanup) and sandbox/test tenants.

**Operational guarantees**

* SLAs (uptime, RTO/RPO), geo-redundant hosting, multi-region failover.
* Automated backups, point-in-time restore, and disaster recovery testing.

**Tenant administration**

* White-labeling (brandable OPAC), language/localization, timezone, currency.
* Tenant-specific policy engine (loan rules, fines, notification templates).

**Support & Professional Services**

* Tiered support (email, chat, phone), dedicated customer success manager for enterprise.
* Training (live, docs, video), community forum, marketplace for plugins/extensions.

---

# 3 — Features common in existing solutions (survey & parity checklist)

Existing mature systems (examples that inspire feature parity): Ex Libris Alma/Primo, OCLC WorldShare, Koha, Evergreen, Sierra, TC Library Systems, Folio, LibGuides, and commercial ILSes. OpenStacks should include or surpass the following standard features:

* MARC support & authority control.
* Multi-branch circulation and fulfilment.
* OPAC with faceted search and relevancy ranking.
* Acquisitions with PO lifecycle and invoice handling.
* Serial management and subscription tracking.
* ILL workflows and lending/borrowing automation.
* E-resource management and link resolution.
* API surface for integrations and data exports.
* Basic analytics and scheduled reporting.
* Authentication via SAML/CAS/LDAP and patron import.
* Mobile responsive UI and self-service patron portal.

---

# 4 — Differentiators to *add* (innovative features to lead the market)

**4.1 AI & Machine Intelligence**

* AI-powered discovery: semantic search, entity extraction, citation-aware relevance, conversational search/bot for OPAC.
* Recommendation engine: collaborative + content-based suggestions for patrons and acquisition recommendations for librarians (predict demand).
* Automated metadata enrichment: auto-fill subject headings, language detection, auto-OCR quality tagging.

**4.2 Advanced Analytics & Forecasting**

* Predictive acquisitions: forecast demand and recommend titles to purchase or subscribe based on historical use, course schedules, and faculty requests.
* Cost-per-use optimization: show spending efficiency and suggest cancellations/renewals.

**4.3 Modern Data Interoperability**

* Full BIBFRAME-first support and RDF triple store integration for semantic web capabilities.
* Native support for non-MARC metadata (JSON-LD, schema.org) to improve web visibility and search engine indexing.

**4.4 Extensibility & Marketplace**

* Plugin/extension marketplace (authentication plugins, payment providers, discovery themes, OCR).
* Low-code workflow builder for librarians to design email flows, approvals and custom automations.

**4.5 Reader/Instructor Tools**

* Deep LMS integration: reading list auto-synchronization, course reserves, per-course resource licensing dashboards.
* Embedded reader for many formats, annotated highlights stored against patron profiles (with privacy controls).

**4.6 Digital Preservation & Research Data**

* Built-in preservation workflows: format migration tools, dataset metadata schema support (DataCite), long-term storage (cold tier).
* Research data management (RDM) features: datasets, DOIs, access embargoes and consent tracking.

**4.7 Privacy & Patron Anonymity**

* Privacy-first defaults: anonymized reading history, fine-grained consent for recommendations, GDPR and local privacy law compliance.
* "Privacy mode" for patrons to use the catalogue anonymously.

**4.8 Offline & Low-Bandwidth Modes**

* Mobile app with offline caching for circulation and catalog search for outreach teams in low-connectivity locations.

**4.9 RFID, IoT & Automation**

* Native support for RFID gates, smart shelves, automated returns sorting integration, inventory drones (third-party).

**4.10 Blockchain-backed Provenance (optional)**

* Immutable provenance for special collections/digital rights logs (blockchain or ledger logging for critical audits).

---

# 5 — Improvements to common pain points (practical UX / ops upgrades)

**5.1 Search Relevance & UX**

* Replace brittle boolean/MARC searches with hybrid semantic + fielded searching. Expose natural language queries.
* Improve relevance tuning controls for librarians (drag slider to prioritize newer/peer-reviewed items).

**5.2 Metadata Tools**

* Bulk edit with preview diffs and reversible transactions; validation rules to reduce bad imports.
* Visual mapping UI for complicated MARC->local field mapping.

**5.3 Performance & Scalability**

* Use an event-driven architecture so heavy imports/reporting do not impact OPAC responsiveness.
* Search index incremental updates and near-real-time replication for global deployments.

**5.4 Acquisition & License Workflows**

* Better license management UI: license clauses, access entitlements, renewal reminders, cost center allocations.
* Automate COUNTER ingestion and vendor usage reconciliation.

**5.5 Interoperability**

* Out-of-the-box connectors to: SUSHI for COUNTER, OAI-PMH harvesters, WorldCat xQuery, and popular discovery indexes.
* Turn-key LTI and Canvas/Blackboard plugins for reading lists and single sign-on.

**5.6 Security & Auditing**

* Immutable audit logs, configurable retention, exportable for compliance.
* Rate-limiting and anomaly detection on API calls, centralized authentication logs.

**5.7 Admin Experience**

* Modern admin dashboards with suggested actions (e.g., “these 20 titles are heavily used but not owned — recommend purchase”).
* Role delegation and temporary elevated roles for time-limited tasks.

---

# 6 — Architecture & tech recommendations (functional implications)

**Architecture**

* Microservices (catalog, circulation, auth, acquisitions, discovery) behind an API Gateway.
* PostgreSQL for authoritative data store + Elasticsearch / OpenSearch for discovery.
* Object storage (S3) for digital assets; CDN for content distribution.
* Message broker (Kafka/RabbitMQ) for events and integration jobs.
* Containerized (Docker) + orchestrated (Kubernetes) for horizontal scalability.

**APIs & Extensibility**

* REST + GraphQL endpoints; evemnt webhooks; SDKs for common languages.
* Admin UI with plugin architecture and sandbox tenants.

**Security & Compliance**

* TLS everywhere, DB encryption at rest, field-level encryption for sensitive patron data.
* SOC2/ISO27001 readiness, GDPR tools (data export, forget-me), WCAG 2.1 AA accessibility.

---

# 7 — Operational features for LaaS customers

* **Tenant Onboarding wizard:** automated mapping, sample import, verification routines.
* **Migration toolkit:** MARC normalization, staff-assisted migration packages.
* **Sandbox & staging tenants** for upgrades and customizations testing.
* **Versioned releases** with change logs and backward compatibility policy.
* **Usage dashboards** per-tenant (API calls, storage, active patrons, peak traffic).
* **Billing & metering:** tiered + overage alerts and billing APIs.

---

# 8 — Example feature roadmap (quick prioritized list)

**Phase 1 — Core parity**

* Cataloging (MARC/authority), circulation, OPAC, acquisitions, reporting, SSO, APIs.

**Phase 2 — Essentials for enterprise**

* Multi-branch, ILL, e-resource access control, digital repo, backups & SLA.

**Phase 3 — Differentiation**

* AI search and recommendations, predictive acquisitions, advanced analytics, LMS integrations, plugin marketplace.

**Phase 4 — Leadership**

* BIBFRAME-first linked data, research data management, preservation workflows, global multi-region failover.

---

# 9 — KPIs & success metrics for OpenStacks rollout

* Time-to-catalog entry (median) after acquisition; target < 30 minutes for typical items.
* OPAC search time P95 < 250 ms.
* Automated metadata match rate (CrossRef/VIAF) target > 70% on ingest.
* Customer onboarding time — migrate a medium library (100k records) in < 30 days (with paid migration).
* Uptime SLA: 99.95% (enterprise) with defined RTO/RPO.

---

# 10 — Final words — product voice & positioning

OpenStacks should position itself as: **“A modern, privacy-first LaaS for institutions that need enterprise reliability and modern discovery — with built-in intelligence, extensibility, and operational tooling so libraries can focus on service, not servers.”**


