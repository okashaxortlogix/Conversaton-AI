import requests
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class GHLSubAccountClient:
    """
    GoHighLevel REST API v2 SDK for Sub-Account (Location) Asset Creation & Management.
    Official Base URL: https://services.leadconnectorhq.com
    API Version Header: 2021-07-28
    """
    BASE_URL = "https://services.leadconnectorhq.com"
    API_VERSION = "2021-07-28"

    def __init__(self, location_id: str, access_token: str):
        self.location_id = location_id.strip() if location_id else ""
        self.access_token = access_token.strip() if access_token else ""
        self.session = requests.Session()
        self.session.headers.update(self._get_headers())

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Version": self.API_VERSION,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def verify_connection(self) -> Dict[str, Any]:
        """Verify if Location ID and Access Token are valid."""
        if not self.location_id or not self.access_token:
            return {"success": False, "message": "Missing Location ID or Access Token."}

        url = f"{self.BASE_URL}/locations/{self.location_id}"
        try:
            res = self.session.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                loc_name = data.get("location", {}).get("name") or "Sub-Account"
                return {"success": True, "location_name": loc_name, "message": f"Successfully connected to GHL Sub-Account: {loc_name}"}
            else:
                err_detail = res.json().get("message", res.text) if res.text else res.reason
                return {"success": False, "message": f"GHL API Error ({res.status_code}): {err_detail}"}
        except Exception as e:
            return {"success": False, "message": f"Connection Exception: {str(e)}"}

    def create_contact(
        self,
        first_name: str,
        last_name: str = "",
        email: str = "",
        phone: str = "",
        tags: Optional[List[str]] = None,
        custom_fields: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Create a new Contact in the GHL Sub-Account."""
        url = f"{self.BASE_URL}/contacts/"
        payload = {
            "locationId": self.location_id,
            "firstName": first_name,
            "lastName": last_name,
            "email": email,
            "phone": phone
        }
        if tags:
            payload["tags"] = tags
        if custom_fields:
            payload["customFields"] = custom_fields

        try:
            res = self.session.post(url, json=payload, timeout=12)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Contact '{(first_name + ' ' + last_name).strip()}' created successfully."}
            else:
                err_detail = res.json().get("message", res.text)
                return {"success": False, "error": f"HTTP {res.status_code}: {err_detail}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def search_contacts(self, query: str) -> Dict[str, Any]:
        """Search contacts by query string."""
        url = f"{self.BASE_URL}/contacts/"
        params = {"locationId": self.location_id, "query": query}
        try:
            res = self.session.get(url, params=params, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": res.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_pipeline(self, name: str, stages: List[str]) -> Dict[str, Any]:
        """Create a new Opportunity Pipeline with custom stages."""
        url = f"{self.BASE_URL}/opportunities/pipelines/"
        formatted_stages = [{"name": st, "position": idx} for idx, st in enumerate(stages)]
        payload = {
            "locationId": self.location_id,
            "name": name,
            "stages": formatted_stages
        }
        try:
            res = self.session.post(url, json=payload, timeout=12)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Pipeline '{name}' created with {len(stages)} stages."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_pipelines(self) -> Dict[str, Any]:
        """Fetch all Opportunity Pipelines in location."""
        url = f"{self.BASE_URL}/opportunities/pipelines/"
        params = {"locationId": self.location_id}
        try:
            res = self.session.get(url, params=params, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": res.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_opportunity(
        self,
        pipeline_id: str,
        stage_id: str,
        title: str,
        status: str = "open",
        monetary_value: float = 0.0,
        contact_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create an Opportunity / Deal in a pipeline stage."""
        url = f"{self.BASE_URL}/opportunities/"
        payload = {
            "locationId": self.location_id,
            "pipelineId": pipeline_id,
            "pipelineStageId": stage_id,
            "name": title,
            "status": status,
            "monetaryValue": monetary_value
        }
        if contact_id:
            payload["contactId"] = contact_id

        try:
            res = self.session.post(url, json=payload, timeout=12)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Opportunity '{title}' created successfully."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_tag(self, tag_name: str) -> Dict[str, Any]:
        """Create a new tag for the GHL Sub-Account."""
        url = f"{self.BASE_URL}/locations/{self.location_id}/tags"
        payload = {"name": tag_name}
        try:
            res = self.session.post(url, json=payload, timeout=10)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Tag '{tag_name}' created successfully."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_custom_field(self, name: str, data_type: str = "TEXT", options: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create a Custom Field (TEXT, NUMBER, SINGLE_OPTIONS, etc.) in GHL."""
        url = f"{self.BASE_URL}/locations/{self.location_id}/custom-fields"
        payload: Dict[str, Any] = {
            "name": name,
            "dataType": data_type.upper(),
            "placeholder": f"Enter {name}"
        }
        if options and data_type.upper() in ["SINGLE_OPTIONS", "MULTIPLE_OPTIONS", "RADIO", "CHECKBOX"]:
            payload["options"] = options
        try:
            res = self.session.post(url, json=payload, timeout=10)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Custom Field '{name}' ({data_type}) created."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def send_conversation_message(self, contact_id: str, message: str, type_: str = "SMS") -> Dict[str, Any]:
        """Send an SMS or Email message to a contact via GHL conversations endpoint."""
        url = f"{self.BASE_URL}/conversations/messages"
        payload = {
            "type": type_.upper(),
            "contactId": contact_id,
            "message": message
        }
        try:
            res = self.session.post(url, json=payload, timeout=10)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Message sent to contact ID {contact_id} via {type_}."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_tags(self) -> Dict[str, Any]:
        """Fetch all Location Tags."""
        url = f"{self.BASE_URL}/locations/{self.location_id}/tags"
        try:
            res = self.session.get(url, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": res.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_custom_fields(self) -> Dict[str, Any]:
        """Fetch all Custom Fields in location."""
        url = f"{self.BASE_URL}/locations/{self.location_id}/custom-fields"
        try:
            res = self.session.get(url, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": res.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_workflows(self) -> Dict[str, Any]:
        """Fetch all Workflows in location."""
        url = f"{self.BASE_URL}/workflows/"
        params = {"locationId": self.location_id}
        try:
            res = self.session.get(url, params=params, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": res.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_contact_task(self, contact_id: str, title: str, due_date: str = "") -> Dict[str, Any]:
        """Create a Task for a Contact."""
        url = f"{self.BASE_URL}/contacts/{contact_id}/tasks"
        payload = {"title": title, "completed": False}
        if due_date:
            payload["dueDate"] = due_date
        try:
            res = self.session.post(url, json=payload, timeout=10)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Task '{title}' added to contact ID {contact_id}."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_contact_note(self, contact_id: str, body: str) -> Dict[str, Any]:
        """Add an internal note to a contact."""
        url = f"{self.BASE_URL}/contacts/{contact_id}/notes"
        payload = {"body": body}
        try:
            res = self.session.post(url, json=payload, timeout=10)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Note added to contact ID {contact_id}."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def setup_niche_subaccount(self, niche: str) -> Dict[str, Any]:
        """Automated Setup of Niche Sub-Account Architecture (Gym, Real Estate, MedSpa/Dental, Solar/Roofing, Coaching)."""
        from niche_architectures import NICHE_SCHEMAS

        normalized_niche = niche.lower().strip().replace(" ", "_").replace("-", "_")
        schema = NICHE_SCHEMAS.get(normalized_niche)
        if not schema:
            valid_keys = ["gym", "real_estate", "medspa", "solar", "coaching"]
            return {
                "success": False,
                "error": f"Unsupported niche '{niche}'. Supported niches: {', '.join(valid_keys)}"
            }

        label = schema.get("label", niche.title())
        created_fields = 0
        created_tags = 0
        created_pipelines = 0
        errors = []

        # 1. Create Custom Fields
        for field in schema.get("custom_fields", []):
            res = self.create_custom_field(
                name=field["name"],
                data_type=field.get("dataType", "TEXT"),
                options=field.get("options")
            )
            if res.get("success"):
                created_fields += 1
            else:
                errors.append(f"Field '{field['name']}': {res.get('error')}")

        # 2. Create Tags
        for tag in schema.get("tags", []):
            res = self.create_tag(tag_name=tag)
            if res.get("success"):
                created_tags += 1
            else:
                errors.append(f"Tag '{tag}': {res.get('error')}")

        # 3. Create Pipelines
        for pipe in schema.get("pipelines", []):
            res = self.create_pipeline(name=pipe["name"], stages=pipe["stages"])
            if res.get("success"):
                created_pipelines += 1
            else:
                errors.append(f"Pipeline '{pipe['name']}': {res.get('error')}")

        return {
            "success": True,
            "niche": normalized_niche,
            "label": label,
            "created_fields": created_fields,
            "created_tags": created_tags,
            "created_pipelines": created_pipelines,
            "recommended_custom_values": schema.get("custom_values", []),
            "errors": errors,
            "message": f"✅ {label} Sub-Account Architecture Setup Complete: {created_fields} Custom Fields, {created_tags} Tags, {created_pipelines} Pipelines deployed."
        }

    def setup_gym_subaccount(self) -> Dict[str, Any]:
        """Automated Setup of Gym & Fitness Center Sub-Account Architecture (Backward compatible)."""
        return self.setup_niche_subaccount("gym")

    def audit_subaccount(self) -> Dict[str, Any]:
        """
        Executes a comprehensive health audit of the connected GHL Sub-Account.
        Scans pipelines, custom fields, tags, workflows, evaluates CRM maturity,
        calculates a health score (0-100), and returns actionable recommendations.
        """
        if not self.location_id or not self.access_token:
            return {"success": False, "error": "Location ID & Access Token missing. Cannot audit disconnected sub-account."}

        conn = self.verify_connection()
        if not conn.get("success"):
            return {"success": False, "error": f"Failed to connect for audit: {conn.get('message')}"}

        loc_name = conn.get("location_name", "Sub-Account")

        pipes_res = self.get_pipelines()
        fields_res = self.get_custom_fields()
        tags_res = self.get_tags()
        workflows_res = self.get_workflows()

        pipelines = pipes_res.get("data", {}).get("pipelines", []) if pipes_res.get("success") else []
        custom_fields = fields_res.get("data", {}).get("customFields", []) if fields_res.get("success") else []
        tags = tags_res.get("data", {}).get("tags", []) if tags_res.get("success") else []
        workflows = workflows_res.get("data", {}).get("workflows", []) if workflows_res.get("success") else []

        score = 0
        findings = []
        recommendations = []

        # A. Pipeline Evaluation (max 25 pts)
        if len(pipelines) >= 2:
            score += 25
            findings.append(f"✅ Strong pipeline coverage: {len(pipelines)} pipelines found with multi-stage tracking.")
        elif len(pipelines) == 1:
            score += 15
            findings.append(f"⚠️ Single pipeline found ({pipelines[0].get('name', 'Sales')}).")
            recommendations.append("Add a secondary Post-Sale / Customer Retention & Nurture Pipeline.")
        else:
            score += 0
            findings.append("❌ No Opportunity Pipelines found in this sub-account.")
            recommendations.append("High Priority: Deploy a Sales Pipeline with defined stages (Lead In ➔ Discovery ➔ Qualified ➔ Offer Sent ➔ Won/Lost).")

        # B. Custom Fields Evaluation (max 25 pts)
        if len(custom_fields) >= 8:
            score += 25
            findings.append(f"✅ Rich custom data capture: {len(custom_fields)} custom fields configured.")
        elif len(custom_fields) >= 3:
            score += 15
            findings.append(f"ℹ️ Basic custom fields present ({len(custom_fields)} fields).")
            recommendations.append("Expand qualification custom fields (e.g. Budget Range, Timeline, Specific Bottleneck) to qualify leads before calls.")
        else:
            score += 5
            findings.append(f"⚠️ Sparse custom field taxonomy ({len(custom_fields)} fields).")
            recommendations.append("High Priority: Add industry-specific custom fields for automated lead scoring and CRM segmentation.")

        # C. Tag Taxonomy Evaluation (max 25 pts)
        if len(tags) >= 10:
            score += 25
            findings.append(f"✅ Robust tag taxonomy: {len(tags)} tags active across source/status lifecycle.")
        elif len(tags) >= 4:
            score += 15
            findings.append(f"ℹ️ Moderate tag usage ({len(tags)} tags).")
            recommendations.append("Adopt standard prefix naming convention (e.g. 'Src: Meta Ads', 'State: Booked', 'Tier: Hot').")
        else:
            score += 5
            findings.append(f"⚠️ Minimal tag taxonomy ({len(tags)} tags).")
            recommendations.append("High Priority: Implement lifecycle tags to prevent overlapping broadcast messaging.")

        # D. Automation & Workflow Evaluation (max 25 pts)
        active_workflows = [w for w in workflows if w.get("status") == "published" or w.get("active", True)]
        has_speed_to_lead = any("speed" in w.get("name", "").lower() or "lead" in w.get("name", "").lower() or "new" in w.get("name", "").lower() for w in workflows)

        if len(active_workflows) >= 3:
            score += 20
            findings.append(f"✅ Automation active: {len(active_workflows)} workflows found.")
        elif len(active_workflows) >= 1:
            score += 10
            findings.append(f"ℹ️ Limited automation: {len(active_workflows)} workflow(s) found.")
            recommendations.append("Deploy end-to-end follow-up sequences (No-Show recovery, Long-term drip nurture).")
        else:
            score += 0
            findings.append("❌ No active workflows detected in sub-account.")
            recommendations.append("Critical: Set up Instant Speed-to-Lead (<2 minute response) workflow immediately.")

        if has_speed_to_lead:
            score += 5
            findings.append("✅ Speed-to-Lead workflow trigger detected.")
        else:
            recommendations.append("Add a dedicated Speed-to-Lead workflow with internal team SMS notifications.")

        score = min(100, max(0, score))
        tier = "Elite Enterprise" if score >= 85 else "Growth Grade" if score >= 65 else "Foundational / Needs Setup"

        return {
            "success": True,
            "location_name": loc_name,
            "location_id": self.location_id,
            "health_score": score,
            "grade_tier": tier,
            "summary": {
                "pipeline_count": len(pipelines),
                "custom_field_count": len(custom_fields),
                "tag_count": len(tags),
                "workflow_count": len(workflows),
                "active_workflow_count": len(active_workflows)
            },
            "findings": findings,
            "recommendations": recommendations,
            "message": f"📊 GHL Sub-Account Health Audit for '{loc_name}': {score}/100 ({tier})"
        }

