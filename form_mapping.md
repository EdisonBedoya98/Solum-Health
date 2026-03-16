# Form Mapping: REQUEST FOR APPROVAL OF SERVICES

This document maps the fields found in `07-service-request-form.pdf` to the backend JSON schema and the database tables.

## 1. Header Metadata
| Form Field | JSON Key | DB Column |
|------------|----------|-----------|
| Payer | `payer_name` | `payer_name` |
| Date of Request | `request_date` | `request_date` |
| Payer Fax | `payer_fax` | `payer_fax` |
| Payer Phone | `payer_phone` | `payer_phone` |

## 2. SECTION A: MEMBER INFORMATION
| Form Field | JSON Key | DB Column |
|------------|----------|-----------|
| Member Name (Last, First, MI) | `member_name` | `member_name` |
| Date of Birth | `member_dob` | `member_dob` |
| Gender | `member_gender` | `member_gender` |
| Member ID | `member_id` | `member_id` |
| Group Number | `group_number` | `group_number` |
| Phone Number | `member_phone` | `member_phone` |
| Address | `member_address` | `member_address` |

## 3. SECTION B: REQUESTING PROVIDER INFORMATION
| Form Field | JSON Key | DB Column |
|------------|----------|-----------|
| Provider Name | `provider_name` | `provider_name` |
| Provider NPI | `provider_npi` | `provider_npi` |
| Facility/Practice Name | `provider_facility` | `provider_facility` |
| Tax ID | `provider_tax_id` | `provider_tax_id` |
| Phone | `provider_phone` | `provider_phone` |
| Fax | `provider_fax` | `provider_fax` |
| Address | `provider_address` | `provider_address` |

## 4. SECTION C: REFERRING PROVIDER (if different)
| Form Field | JSON Key | DB Column |
|------------|----------|-----------|
| Referring Provider Name | `referring_provider_name` | `referring_provider_name` |
| Referring Provider NPI | `referring_provider_npi` | `referring_provider_npi` |
| Phone | `referring_provider_phone` | `referring_provider_phone` |

## 5. SECTION D: SERVICE INFORMATION
| Form Field | JSON Key | DB Column |
|------------|----------|-----------|
| Type of Service Requested | `service_type` | `service_type` |
| Service Setting | `service_setting` | `service_setting` |
| CPT/HCPCS Code(s) | `cpt_codes` | `cpt_codes` |
| ICD-10 Diagnosis Code(s) | `icd10_codes` | `icd10_codes` |
| Diagnosis Description(s) | `diagnosis_descriptions` | `diagnosis_descriptions` |
| Requested Start Date | `start_date` | `start_date` |
| Requested End Date | `end_date` | `end_date` |
| Number of Sessions/Units | `num_sessions_units` | `num_sessions_units` |
| Frequency | `frequency` | `frequency` |

## 6. SECTION E: CLINICAL INFORMATION
| Form Field | JSON Key | DB Column |
|------------|----------|-----------|
| Presenting symptoms... | `presenting_symptoms` | `presenting_symptoms` |
| Relevant clinical history... | `clinical_history` | `clinical_history` |
| Treatment goals... | `treatment_goals` | `treatment_goals` |

### 6a. Medications Table
- **Base Table:** `service_request_medications`
- **Fields:** `name`, `dose`, `frequency`, `prescriber`

### 6b. Assessments Table
- **Base Table:** `service_request_assessments`
- **Fields:** `tool_name`, `score`, `assessment_date`

## 7. SECTION F: CLINICAL JUSTIFICATION
| Form Field | JSON Key | DB Column |
|------------|----------|-----------|
| Why is this level of care... necessary? | `medical_necessity` | `medical_necessity` |
| What is the risk if... not provided? | `risk_justification` | `risk_justification` |

## 8. SECTION G: ATTESTATION
| Form Field | JSON Key | DB Column |
|------------|----------|-----------|
| Printed Name | `attestation_signature_name` | `attestation_signature_name` |
| Date | `attestation_date` | `attestation_date` |
| License # | `license_number` | `license_number` |

## 9. Footer (Payer Use Only)
| Form Field | JSON Key | DB Column |
|------------|----------|-----------|
| Auth # | `auth_number` | `auth_number` |
| Decision | `decision` | `decision` |
| Reviewer | `reviewer_name` | `reviewer_name` |
| Date | `decision_date` | `decision_date` |
