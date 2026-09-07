"""
GoHighLevel (GHL) Multi-Niche Sub-Account Production Architectures.
Contains battle-tested turnkey schemas for:
1. Gym & Fitness Centers
2. Real Estate & Mortgage
3. MedSpa, Dental & Aesthetics
4. Solar & Roofing / Home Improvement
5. High-Ticket Coaching & Consulting

Each niche contains:
- Custom Fields Schema (with strict GHL data types: TEXT, NUMBER, SINGLE_OPTIONS, DATE)
- Tag Taxonomy (Sources, Lifecycle States, Campaigns, Lead Tiers)
- Pipelines & Ordered Stages
- Standard Custom Values Recommended
"""

from typing import List, Dict, Any

# =============================================================================
# 1. GYM & FITNESS CENTER ARCHITECTURE
# =============================================================================
GYM_CUSTOM_FIELDS_SCHEMA: List[Dict[str, Any]] = [
    {
        "name": "Primary Fitness Goal",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Weight Loss", "Muscle Building", "General Health & Fitness", "Athletic Performance", "Post-Rehab / Mobility"]
    },
    {
        "name": "Exercise Experience",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Beginner (0-6 mo)", "Intermediate (1-2 yrs)", "Advanced (3+ yrs)"]
    },
    {
        "name": "Exercise Limitations",
        "dataType": "SINGLE_OPTIONS",
        "options": ["No", "Yes"]
    },
    {
        "name": "Limitation Category",
        "dataType": "SINGLE_OPTIONS",
        "options": ["None", "Lower Body / Knee", "Upper Body / Shoulder", "Back / Core", "Cardiovascular / Endurance"]
    },
    {
        "name": "Trainer Safety Notes",
        "dataType": "TEXT"
    },
    {
        "name": "Preferred Workout Time",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Early Morning (5am-8am)", "Morning (9am-12pm)", "Afternoon (1pm-4pm)", "Evening (5pm-9pm)"]
    },
    {
        "name": "Lead Score",
        "dataType": "NUMBER"
    },
    {
        "name": "Lead Tier",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Cold", "Warm", "Hot"]
    },
    {
        "name": "Membership Plan Type",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Month-to-Month Basic", "Annual VIP Uncapped", "Personal Training 1-on-1", "Student / Senior Pass", "Corporate Partner"]
    },
    {
        "name": "Membership Status",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Prospect", "Trial Active", "Member Active", "Membership Frozen", "Renewal Due", "Cancelled / Churned"]
    },
    {
        "name": "Trial Start Date",
        "dataType": "DATE"
    },
    {
        "name": "Trial Expiry Date",
        "dataType": "DATE"
    }
]

GYM_TAGS_TAXONOMY: List[str] = [
    "Src: Meta Ads", "Src: Google Ads", "Src: Referral", "Src: Walk-In", "Src: Organic",
    "State: Lead - New", "State: Contacted", "State: Qualified", "State: Trial - Booked",
    "State: Trial - Attended", "State: Trial - No Show", "State: Member - Active",
    "Campaign: Active - SpeedToLead", "Campaign: Active - TrialReminders", "Campaign: Active - NoShowRecovery",
    "Tier: Cold", "Tier: Warm", "Tier: Hot"
]

GYM_PIPELINES: List[Dict[str, Any]] = [
    {
        "name": "Gym Lead-to-Member Sales Pipeline",
        "stages": [
            "New Lead",
            "Contact Attempted",
            "Engaged / Qualified",
            "Trial Booked",
            "Trial Attended",
            "Membership Offer Sent",
            "Closed Won (Member)",
            "Closed Lost / Disqualified"
        ]
    },
    {
        "name": "Member Retention & Renewal Pipeline",
        "stages": [
            "New Member Onboarding",
            "Active Regular Member",
            "Renewal Upcoming (30D)",
            "Renewal In Discussion",
            "Renewed (Won)",
            "Churn Risk (Inactive 14D+)",
            "Cancelled / Churned"
        ]
    }
]

GYM_CUSTOM_VALUES: List[Dict[str, str]] = [
    {"name": "gym_free_trial_duration", "value": "7-Day Free Pass"},
    {"name": "gym_primary_offer_price", "value": "$49/month"},
    {"name": "gym_onboarding_calendar_url", "value": "https://link.msgsndr.com/widget/booking/trial"},
    {"name": "gym_support_sms_number", "value": "{{ location.phone }}"}
]

# =============================================================================
# 2. REAL ESTATE & MORTGAGE ARCHITECTURE
# =============================================================================
REAL_ESTATE_CUSTOM_FIELDS_SCHEMA: List[Dict[str, Any]] = [
    {
        "name": "Real Estate Role",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Buyer", "Seller", "Both (Sell then Buy)", "Investor", "Renter"]
    },
    {
        "name": "Property Type Desired",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Single Family Home", "Townhouse / Condo", "Multi-Family (2-4 Units)", "Commercial / Land", "Luxury Estate"]
    },
    {
        "name": "Target Price Range",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Under $300k", "$300k - $500k", "$500k - $750k", "$750k - $1M", "$1M - $2M", "$2M+ Luxury"]
    },
    {
        "name": "Mortgage Pre-Approval Status",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Already Pre-Approved (Have Letter)", "Need Pre-Approval / Lender Intro", "Cash Buyer", "Not Yet Started"]
    },
    {
        "name": "Target Moving Timeline",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Immediately (0-30 days)", "1 - 3 Months", "3 - 6 Months", "6 - 12 Months", "Just Browsing / Curious"]
    },
    {
        "name": "Current Homeowner Status",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Own Home (Need to Sell First)", "Own Home (Keeping as Rental)", "Renting", "Living with Family"]
    },
    {
        "name": "Estimated Property Valuation",
        "dataType": "NUMBER"
    },
    {
        "name": "Target Neighborhoods / Zip Codes",
        "dataType": "TEXT"
    },
    {
        "name": "Preferred Bedroom Count",
        "dataType": "SINGLE_OPTIONS",
        "options": ["1-2 Beds", "3 Beds", "4 Beds", "5+ Beds"]
    },
    {
        "name": "Agent Notes & Showing Preferences",
        "dataType": "TEXT"
    }
]

REAL_ESTATE_TAGS_TAXONOMY: List[str] = [
    "Src: Facebook Lead Ads", "Src: Google Search", "Src: Zillow / Realtor", "Src: Open House", "Src: Referral",
    "Role: Buyer", "Role: Seller", "Role: Investor",
    "State: Lead - New", "State: Pre-Approval Needed", "State: Pre-Approved",
    "State: Showing Scheduled", "State: Home Valuation Sent", "State: Listing Agreement Signed",
    "State: Under Contract", "State: Closed Won", "State: Closed Lost",
    "Campaign: Active - BuyerSpeedToLead", "Campaign: Active - SellerNurture", "Campaign: Active - MortgageFollowup",
    "Tier: Hot Buyer", "Tier: Warm Prospect", "Tier: Long-Term Nurture"
]

REAL_ESTATE_PIPELINES: List[Dict[str, Any]] = [
    {
        "name": "Real Estate Buyer Pipeline",
        "stages": [
            "New Buyer Lead",
            "Contact Attempted",
            "Buyer Discovery Call",
            "Pre-Approval Verified",
            "Active Home Showings",
            "Offer Submitted",
            "Under Contract / Escrow",
            "Closed Won (Homeowner)",
            "Disqualified / Cold"
        ]
    },
    {
        "name": "Real Estate Seller Listing Pipeline",
        "stages": [
            "New Valuation Request",
            "Contact Attempted",
            "CMA / Valuation Delivered",
            "Listing Presentation Booked",
            "Listing Agreement Signed",
            "Active on MLS",
            "Under Contract",
            "Closed Won (Sold)",
            "Listing Expired / Cancelled"
        ]
    }
]

REAL_ESTATE_CUSTOM_VALUES: List[Dict[str, str]] = [
    {"name": "re_agency_brokerage_name", "value": "{{ location.name }}"},
    {"name": "re_lender_partner_name", "value": "Preferred Mortgage Partners"},
    {"name": "re_showing_calendar_url", "value": "https://link.msgsndr.com/widget/booking/showings"},
    {"name": "re_valuation_guide_link", "value": "https://storage.googleapis.com/home-valuation-guide.pdf"}
]

# =============================================================================
# 3. MEDSPA, DENTAL & AESTHETICS ARCHITECTURE
# =============================================================================
MEDSPA_CUSTOM_FIELDS_SCHEMA: List[Dict[str, Any]] = [
    {
        "name": "Primary Aesthetic Concern",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Facial Rejuvenation & Anti-Aging", "Lip Enhancement & Fillers", "Skin Texture & Acne Scarring", "Laser Hair Removal", "Body Contouring / Fat Reduction", "Teeth Whitening / Cosmetic Dental"]
    },
    {
        "name": "Prior Treatment Experience",
        "dataType": "SINGLE_OPTIONS",
        "options": ["First Time Ever", "Had Injections/Fillers Before", "Had Laser/Skin Treatment Before", "Regular MedSpa Client"]
    },
    {
        "name": "Treatment Timeline Preference",
        "dataType": "SINGLE_OPTIONS",
        "options": ["This Week (Ready Now)", "Within 2-3 Weeks", "Preparing for Upcoming Event / Wedding", "Consultation First"]
    },
    {
        "name": "Claimed Promotion / Voucher Code",
        "dataType": "TEXT"
    },
    {
        "name": "Medical Contraindication / Allergies",
        "dataType": "TEXT"
    },
    {
        "name": "Budget Comfort Level",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Under $500", "$500 - $1,500", "$1,500 - $3,000", "$3,000+ Full Transformation"]
    },
    {
        "name": "Consultation Type",
        "dataType": "SINGLE_OPTIONS",
        "options": ["In-Clinic Visual Assessment", "Virtual Video Consultation"]
    },
    {
        "name": "Lead Tier",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Cold", "Warm", "VIP High-Ticket"]
    }
]

MEDSPA_TAGS_TAXONOMY: List[str] = [
    "Src: Instagram Ads", "Src: TikTok Ads", "Src: Google Local", "Src: Referral Program",
    "Offer: $50 First Visit Voucher", "Offer: Free Skin Analysis", "Offer: BOGO Treatment",
    "State: Lead - Voucher Claimed", "State: Consult Booked", "State: Consult Confirmed",
    "State: Consult Attended", "State: Treatment Purchased", "State: VIP Member Club",
    "Campaign: Active - VoucherExpiryWarning", "Campaign: Active - 24hAppointmentReminder", "Campaign: Active - PostTreatmentCare",
    "Tier: Warm Voucher", "Tier: VIP Client"
]

MEDSPA_PIPELINES: List[Dict[str, Any]] = [
    {
        "name": "Patient Acquisition & Treatment Pipeline",
        "stages": [
            "Voucher Claimed / Lead In",
            "Contact Attempted",
            "Consultation Scheduled",
            "Appointment Confirmed (SMS Sent)",
            "Consultation Attended",
            "Treatment Package Presented",
            "Closed Won (Treatment Started)",
            "No-Show / Reschedule Needed",
            "Cancelled / Disqualified"
        ]
    },
    {
        "name": "Patient VIP Retention & Re-Booking Pipeline",
        "stages": [
            "New Patient Post-Care",
            "30-Day Follow-Up Check",
            "90-Day Touchup Due (Botox/Fillers)",
            "Membership Maintenance Active",
            "Re-Booked (Won)",
            "Overdue Inactive (120D+)"
        ]
    }
]

MEDSPA_CUSTOM_VALUES: List[Dict[str, str]] = [
    {"name": "medspa_voucher_amount", "value": "$50 Off First Treatment"},
    {"name": "medspa_booking_calendar_url", "value": "https://link.msgsndr.com/widget/booking/consultation"},
    {"name": "medspa_doctor_name", "value": "Medical Director & Master Injector"},
    {"name": "medspa_clinic_address", "value": "{{ location.address }}"}
]

# =============================================================================
# 4. SOLAR & ROOFING / HOME SERVICES ARCHITECTURE
# =============================================================================
SOLAR_CUSTOM_FIELDS_SCHEMA: List[Dict[str, Any]] = [
    {
        "name": "Average Monthly Electric Bill",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Under $150/mo", "$150 - $250/mo", "$250 - $400/mo", "$400 - $600/mo", "$600+/mo High Usage"]
    },
    {
        "name": "Homeownership Status",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Single-Family Homeowner (Eligible)", "Townhome Owner (HOA Approval Needed)", "Renter (Not Eligible)", "Commercial Property"]
    },
    {
        "name": "Current Electric Utility Company",
        "dataType": "TEXT"
    },
    {
        "name": "Roof Age & Condition",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Brand New (0-5 yrs)", "Good Condition (6-12 yrs)", "Older Roof (13-20 yrs - May Need Replacement)", "Unknown"]
    },
    {
        "name": "Roof Shade / Sun Exposure",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Full Sun / Zero Trees", "Partial Shade", "Heavy Tree Cover"]
    },
    {
        "name": "Electric Bill Copy Uploaded",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Yes (Attached)", "No (Pending Upload)"]
    },
    {
        "name": "Estimated System Size (kW)",
        "dataType": "NUMBER"
    },
    {
        "name": "Home Address & Zip Code",
        "dataType": "TEXT"
    }
]

SOLAR_TAGS_TAXONOMY: List[str] = [
    "Src: Facebook Energy Savings Ad", "Src: Google Solar Search", "Src: Canvassing / D2D", "Src: Referral",
    "Qual: Qualified Homeowner", "Qual: Disqualified Renter", "Qual: High Electric Bill ($250+)",
    "State: Lead - Assessment Requested", "State: Bill Received", "State: Site Survey Booked",
    "State: Proposal Prepared", "State: Proposal Presented", "State: Contract Signed",
    "State: Engineering & Permitting", "State: Installation Complete",
    "Campaign: Active - BillUploadNurture", "Campaign: Active - SiteSurveyReminder", "Campaign: Active - ProposalClosingFollowup"
]

SOLAR_PIPELINES: List[Dict[str, Any]] = [
    {
        "name": "Solar Lead-to-Install Pipeline",
        "stages": [
            "New Assessment Request",
            "Contact Attempted (Speed-to-Lead)",
            "Homeowner Discovery & Bill Collected",
            "Site Survey Scheduled",
            "Site Survey Completed",
            "Custom Savings Proposal Presented",
            "Contract Signed / Financing Approved",
            "Engineering & Permitting Submitted",
            "Install Scheduled & Completed",
            "NEM Interconnection (Turned On)",
            "Closed Lost / Ineligible"
        ]
    }
]

SOLAR_CUSTOM_VALUES: List[Dict[str, str]] = [
    {"name": "solar_federal_incentive_percent", "value": "30% Residential Clean Energy Credit"},
    {"name": "solar_site_survey_calendar_url", "value": "https://link.msgsndr.com/widget/booking/solar-survey"},
    {"name": "solar_company_license_number", "value": "Licensed Solar Contractor #SOL-88219"},
    {"name": "solar_bill_upload_portal_url", "value": "https://link.msgsndr.com/portal/bill-upload"}
]

# =============================================================================
# 5. HIGH-TICKET COACHING & CONSULTING ARCHITECTURE
# =============================================================================
COACHING_CUSTOM_FIELDS_SCHEMA: List[Dict[str, Any]] = [
    {
        "name": "Current Monthly Revenue",
        "dataType": "SINGLE_OPTIONS",
        "options": ["$0 - $5k/mo (Starting Out)", "$5k - $15k/mo (Foundational)", "$15k - $50k/mo (Scaling)", "$50k - $100k+/mo (Enterprise)"]
    },
    {
        "name": "Target 12-Month Revenue Goal",
        "dataType": "SINGLE_OPTIONS",
        "options": ["$20k/month", "$50k/month", "$100k/month ($1.2M/yr)", "$250k+/month"]
    },
    {
        "name": "Primary Business Bottleneck",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Consistent Client Acquisition / Leads", "Low Sales Conversion / Pricing Too Low", "Delivery / Team Capacity Overwhelmed", "Offer / Positioning Confusion"]
    },
    {
        "name": "Investment Readiness",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Ready to Invest in Solution Today ($3k-$10k+)", "Have Resources / Financing Available", "Need to Consult Partner/Spouse", "No Budget / Zero Capital"]
    },
    {
        "name": "Decision Maker Status",
        "dataType": "SINGLE_OPTIONS",
        "options": ["Sole Decision Maker", "Business Partner Involved", "Spouse / Joint Decision"]
    },
    {
        "name": "Website or Social Profile URL",
        "dataType": "TEXT"
    },
    {
        "name": "VSL Watch Percentage",
        "dataType": "NUMBER"
    },
    {
        "name": "Application Qualification Tier",
        "dataType": "SINGLE_OPTIONS",
        "options": ["A-Player (Fast-Track)", "B-Tier (Promising)", "C-Tier (Disqualified / Downsell)"]
    }
]

COACHING_TAGS_TAXONOMY: List[str] = [
    "Src: YouTube VSL Funnel", "Src: Facebook Group", "Src: LinkedIn Outbound", "Src: Podcast Guest",
    "Event: VSL 80% Watched", "Event: App Submitted", "Event: App Incomplete",
    "Qual: A-Player ($10k+ Ready)", "Qual: Downsell Candidate",
    "State: Strategy Call Booked", "State: Call Confirmed (Video Watched)", "State: Call Attended",
    "State: Proposal Made", "State: Closed Won (Paid in Full)", "State: Closed Won (Payment Plan)",
    "State: No-Show", "State: Disqualified",
    "Campaign: Active - PreCallHomeworkNurture", "Campaign: Active - NoShowRecovery", "Campaign: Active - DownsellCourseOffer"
]

COACHING_PIPELINES: List[Dict[str, Any]] = [
    {
        "name": "High-Ticket Application & Enrollment Pipeline",
        "stages": [
            "Application Submitted",
            "Application Reviewed / Qualified",
            "Strategy Session Booked",
            "Call Confirmed (Pre-Call Video Done)",
            "Call Attended / Pitch Delivered",
            "Deposit Received / Agreement Sent",
            "Closed Won (Enrolled)",
            "Payment Plan Active",
            "Follow-Up / Partner Review Pending",
            "No-Show / Reschedule Sequence",
            "Disqualified / Downsell Nurture"
        ]
    }
]

COACHING_CUSTOM_VALUES: List[Dict[str, str]] = [
    {"name": "coaching_program_name", "value": "High-Ticket Accelerator Mastermind"},
    {"name": "coaching_investment_amount", "value": "$5,800 Pay-in-Full ($6,800 on 3-Pay)"},
    {"name": "coaching_calendar_url", "value": "https://link.msgsndr.com/widget/booking/strategy-session"},
    {"name": "coaching_pre_call_homework_video", "value": "https://www.youtube.com/watch?v=pre-call-training"}
]

# =============================================================================
# CENTRAL REGISTRY OF ALL SUPPORTED NICHES
# =============================================================================
NICHE_SCHEMAS: Dict[str, Dict[str, Any]] = {
    "gym": {
        "label": "Gym & Fitness Centers",
        "custom_fields": GYM_CUSTOM_FIELDS_SCHEMA,
        "tags": GYM_TAGS_TAXONOMY,
        "pipelines": GYM_PIPELINES,
        "custom_values": GYM_CUSTOM_VALUES
    },
    "fitness": {
        "label": "Gym & Fitness Centers",
        "custom_fields": GYM_CUSTOM_FIELDS_SCHEMA,
        "tags": GYM_TAGS_TAXONOMY,
        "pipelines": GYM_PIPELINES,
        "custom_values": GYM_CUSTOM_VALUES
    },
    "real_estate": {
        "label": "Real Estate & Mortgage",
        "custom_fields": REAL_ESTATE_CUSTOM_FIELDS_SCHEMA,
        "tags": REAL_ESTATE_TAGS_TAXONOMY,
        "pipelines": REAL_ESTATE_PIPELINES,
        "custom_values": REAL_ESTATE_CUSTOM_VALUES
    },
    "realtor": {
        "label": "Real Estate & Mortgage",
        "custom_fields": REAL_ESTATE_CUSTOM_FIELDS_SCHEMA,
        "tags": REAL_ESTATE_TAGS_TAXONOMY,
        "pipelines": REAL_ESTATE_PIPELINES,
        "custom_values": REAL_ESTATE_CUSTOM_VALUES
    },
    "mortgage": {
        "label": "Real Estate & Mortgage",
        "custom_fields": REAL_ESTATE_CUSTOM_FIELDS_SCHEMA,
        "tags": REAL_ESTATE_TAGS_TAXONOMY,
        "pipelines": REAL_ESTATE_PIPELINES,
        "custom_values": REAL_ESTATE_CUSTOM_VALUES
    },
    "medspa": {
        "label": "MedSpa, Dental & Aesthetics",
        "custom_fields": MEDSPA_CUSTOM_FIELDS_SCHEMA,
        "tags": MEDSPA_TAGS_TAXONOMY,
        "pipelines": MEDSPA_PIPELINES,
        "custom_values": MEDSPA_CUSTOM_VALUES
    },
    "dental": {
        "label": "MedSpa, Dental & Aesthetics",
        "custom_fields": MEDSPA_CUSTOM_FIELDS_SCHEMA,
        "tags": MEDSPA_TAGS_TAXONOMY,
        "pipelines": MEDSPA_PIPELINES,
        "custom_values": MEDSPA_CUSTOM_VALUES
    },
    "solar": {
        "label": "Solar & Roofing / Home Services",
        "custom_fields": SOLAR_CUSTOM_FIELDS_SCHEMA,
        "tags": SOLAR_TAGS_TAXONOMY,
        "pipelines": SOLAR_PIPELINES,
        "custom_values": SOLAR_CUSTOM_VALUES
    },
    "roofing": {
        "label": "Solar & Roofing / Home Services",
        "custom_fields": SOLAR_CUSTOM_FIELDS_SCHEMA,
        "tags": SOLAR_TAGS_TAXONOMY,
        "pipelines": SOLAR_PIPELINES,
        "custom_values": SOLAR_CUSTOM_VALUES
    },
    "coaching": {
        "label": "High-Ticket Coaching & Consulting",
        "custom_fields": COACHING_CUSTOM_FIELDS_SCHEMA,
        "tags": COACHING_TAGS_TAXONOMY,
        "pipelines": COACHING_PIPELINES,
        "custom_values": COACHING_CUSTOM_VALUES
    },
    "consulting": {
        "label": "High-Ticket Coaching & Consulting",
        "custom_fields": COACHING_CUSTOM_FIELDS_SCHEMA,
        "tags": COACHING_TAGS_TAXONOMY,
        "pipelines": COACHING_PIPELINES,
        "custom_values": COACHING_CUSTOM_VALUES
    }
}
