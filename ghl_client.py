"""
GoHighLevel (GHL) REST API v2 SDK and OAuth Client
=================================================
Provides clean wrapper classes and helper functions for:
- OAuth 2.0 Authorization URL generation and Token Exchange
- Sub-Account Asset Management (Contacts, Custom Fields, Pipelines, Opportunities, Tags, Tasks, Notes)
"""
import requests
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class GHLSubAccountClient:
    """
    GoHighLevel REST API v2 SDK for Sub-Account (Location) Asset Creation & Management.
    Official Base URL: https://services.leadconnectorhq.com
    API Version Header: 2023-02-21
    """
    BASE_URL = "https://services.leadconnectorhq.com"
    API_VERSION = "2023-02-21"

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

    def create_custom_value(self, name: str, value: str) -> Dict[str, Any]:
        """Create a Custom Value in the GHL Sub-Account."""
        url = f"{self.BASE_URL}/locations/{self.location_id}/customValues"
        payload = {"name": name, "value": value}
        try:
            res = self.session.post(url, json=payload, timeout=10)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Custom Value '{name}' created with value '{value}'."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_custom_values(self) -> Dict[str, Any]:
        """Fetch all Custom Values in location."""
        url = f"{self.BASE_URL}/locations/{self.location_id}/customValues"
        try:
            res = self.session.get(url, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": res.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_location_details(self) -> Dict[str, Any]:
        """Fetch Sub-Account details (name, email, phone, address, website)."""
        url = f"{self.BASE_URL}/locations/{self.location_id}"
        try:
            res = self.session.get(url, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": res.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_calendars(self) -> Dict[str, Any]:
        """Fetch all booking Calendars configured in the location."""
        url = f"{self.BASE_URL}/calendars/"
        params = {"locationId": self.location_id}
        try:
            res = self.session.get(url, params=params, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_calendar_events(self, start_time: str = "", end_time: str = "", calendar_id: str = "") -> Dict[str, Any]:
        """Fetch booked Appointments, meetings, and calendar events."""
        import datetime
        url = f"{self.BASE_URL}/calendars/events"
        now = datetime.datetime.utcnow()
        if not start_time:
            # Default to 7 days past up to 30 days ahead
            start_dt = now - datetime.timedelta(days=7)
            start_time = start_dt.strftime("%Y-%m-%dT00:00:00Z")
        if not end_time:
            end_dt = now + datetime.timedelta(days=30)
            end_time = end_dt.strftime("%Y-%m-%dT23:59:59Z")

        params = {
            "locationId": self.location_id,
            "startTime": start_time,
            "endTime": end_time
        }
        if calendar_id:
            params["calendarId"] = calendar_id

        try:
            res = self.session.get(url, params=params, timeout=12)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # =====================================================================
    # NEW: Extended GHL API v2 Methods — Maximum Sub-Account Capability
    # =====================================================================

    def get_contact(self, contact_id: str) -> Dict[str, Any]:
        """Fetch a single contact's full details by ID."""
        url = f"{self.BASE_URL}/contacts/{contact_id}"
        try:
            res = self.session.get(url, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_contact(
        self,
        contact_id: str,
        first_name: str = "",
        last_name: str = "",
        email: str = "",
        phone: str = "",
        tags: Optional[List[str]] = None,
        custom_fields: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Update an existing contact's fields in the GHL Sub-Account."""
        url = f"{self.BASE_URL}/contacts/{contact_id}"
        payload: Dict[str, Any] = {}
        if first_name:
            payload["firstName"] = first_name
        if last_name:
            payload["lastName"] = last_name
        if email:
            payload["email"] = email
        if phone:
            payload["phone"] = phone
        if tags is not None:
            payload["tags"] = tags
        if custom_fields is not None:
            payload["customFields"] = custom_fields
        try:
            res = self.session.put(url, json=payload, timeout=12)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Contact '{contact_id}' updated successfully."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_contact(self, contact_id: str) -> Dict[str, Any]:
        """Delete a contact from the GHL Sub-Account."""
        url = f"{self.BASE_URL}/contacts/{contact_id}"
        try:
            res = self.session.delete(url, timeout=10)
            if res.status_code in [200, 204]:
                return {"success": True, "message": f"✅ Contact '{contact_id}' deleted successfully."}
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

    def delete_tag(self, tag_id: str) -> Dict[str, Any]:
        """Delete a tag from the GHL Sub-Account."""
        url = f"{self.BASE_URL}/locations/{self.location_id}/tags/{tag_id}"
        try:
            res = self.session.delete(url, timeout=10)
            if res.status_code in [200, 204]:
                return {"success": True, "message": f"✅ Tag '{tag_id}' deleted successfully."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_opportunities(self, pipeline_id: str = "") -> Dict[str, Any]:
        """Fetch all opportunities/deals, optionally filtered by pipeline ID."""
        url = f"{self.BASE_URL}/opportunities/"
        params: Dict[str, str] = {"locationId": self.location_id}
        if pipeline_id:
            params["pipelineId"] = pipeline_id
        try:
            res = self.session.get(url, params=params, timeout=12)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_opportunity(
        self,
        opportunity_id: str,
        title: str = "",
        status: str = "",
        monetary_value: Optional[float] = None,
        pipeline_id: str = "",
        stage_id: str = ""
    ) -> Dict[str, Any]:
        """Update an existing opportunity/deal in the GHL Sub-Account."""
        url = f"{self.BASE_URL}/opportunities/{opportunity_id}"
        payload: Dict[str, Any] = {}
        if title:
            payload["name"] = title
        if status:
            payload["status"] = status
        if monetary_value is not None:
            payload["monetaryValue"] = monetary_value
        if pipeline_id:
            payload["pipelineId"] = pipeline_id
        if stage_id:
            payload["pipelineStageId"] = stage_id
        try:
            res = self.session.put(url, json=payload, timeout=12)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Opportunity '{opportunity_id}' updated successfully."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_opportunity(self, opportunity_id: str) -> Dict[str, Any]:
        """Delete an opportunity/deal from the GHL Sub-Account."""
        url = f"{self.BASE_URL}/opportunities/{opportunity_id}"
        try:
            res = self.session.delete(url, timeout=10)
            if res.status_code in [200, 204]:
                return {"success": True, "message": f"✅ Opportunity '{opportunity_id}' deleted successfully."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_conversations(self, contact_id: str = "") -> Dict[str, Any]:
        """Fetch conversations/threads, optionally filtered by contact ID."""
        url = f"{self.BASE_URL}/conversations/"
        params: Dict[str, str] = {"locationId": self.location_id}
        if contact_id:
            params["contactId"] = contact_id
        try:
            res = self.session.get(url, params=params, timeout=12)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_calendar(
        self,
        name: str,
        description: str = "",
        slug: str = "",
        event_type: str = "RoundRobin_OptimizeForAvailability"
    ) -> Dict[str, Any]:
        """Create a new booking calendar in the GHL Sub-Account."""
        url = f"{self.BASE_URL}/calendars/"
        payload: Dict[str, Any] = {
            "locationId": self.location_id,
            "name": name,
            "eventType": event_type
        }
        if description:
            payload["description"] = description
        if slug:
            payload["slug"] = slug
        try:
            res = self.session.post(url, json=payload, timeout=12)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Calendar '{name}' created successfully."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def create_appointment(
        self,
        calendar_id: str,
        contact_id: str,
        start_time: str,
        end_time: str,
        title: str = "Appointment",
        appointment_status: str = "confirmed"
    ) -> Dict[str, Any]:
        """Book an appointment on a calendar for a contact."""
        url = f"{self.BASE_URL}/calendars/events/appointments"
        payload = {
            "calendarId": calendar_id,
            "locationId": self.location_id,
            "contactId": contact_id,
            "startTime": start_time,
            "endTime": end_time,
            "title": title,
            "appointmentStatus": appointment_status
        }
        try:
            res = self.session.post(url, json=payload, timeout=12)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Appointment '{title}' booked for contact '{contact_id}'."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def delete_custom_field(self, field_id: str) -> Dict[str, Any]:
        """Delete a custom field from the GHL Sub-Account."""
        url = f"{self.BASE_URL}/locations/{self.location_id}/custom-fields/{field_id}"
        try:
            res = self.session.delete(url, timeout=10)
            if res.status_code in [200, 204]:
                return {"success": True, "message": f"✅ Custom field '{field_id}' deleted successfully."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_funnels(self) -> Dict[str, Any]:
        """Fetch all funnels in the connected GHL Sub-Account (read-only)."""
        url = f"{self.BASE_URL}/funnels/"
        params = {"locationId": self.location_id}
        try:
            res = self.session.get(url, params=params, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_funnel_pages(self, funnel_id: str) -> Dict[str, Any]:
        """Fetch all pages within a specific funnel (read-only)."""
        url = f"{self.BASE_URL}/funnels/page"
        params = {"locationId": self.location_id, "funnelId": funnel_id}
        try:
            res = self.session.get(url, params=params, timeout=10)
            if res.status_code == 200:
                return {"success": True, "data": res.json()}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def update_location(
        self,
        name: str = "",
        phone: str = "",
        email: str = "",
        address: str = "",
        city: str = "",
        state: str = "",
        postal_code: str = "",
        website: str = ""
    ) -> Dict[str, Any]:
        """Update the connected GHL Sub-Account settings (name, phone, email, address, website)."""
        url = f"{self.BASE_URL}/locations/{self.location_id}"
        payload: Dict[str, Any] = {}
        if name:
            payload["name"] = name
        if phone:
            payload["phone"] = phone
        if email:
            payload["email"] = email
        if address:
            payload["address"] = address
        if city:
            payload["city"] = city
        if state:
            payload["state"] = state
        if postal_code:
            payload["postalCode"] = postal_code
        if website:
            payload["website"] = website
        try:
            res = self.session.put(url, json=payload, timeout=12)
            if res.status_code in [200, 201]:
                return {"success": True, "data": res.json(), "message": f"✅ Sub-Account settings updated successfully."}
            else:
                return {"success": False, "error": f"HTTP {res.status_code}: {res.text}"}
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

        # 4. Create Custom Values
        created_values = 0
        for cv in schema.get("custom_values", []):
            cv_key = cv.get("key", "").replace("custom_values.", "").strip()
            cv_val = cv.get("value", "") or cv.get("placeholder", "")
            if cv_key:
                res_cv = self.create_custom_value(name=cv_key, value=cv_val)
                if res_cv.get("success"):
                    created_values += 1

        return {
            "success": True,
            "niche": normalized_niche,
            "label": label,
            "created_fields": created_fields,
            "created_tags": created_tags,
            "created_pipelines": created_pipelines,
            "created_custom_values": created_values,
            "recommended_custom_values": schema.get("custom_values", []),
            "errors": errors,
            "message": f"✅ {label} Sub-Account Architecture Setup Complete: {created_fields} Custom Fields, {created_tags} Tags, {created_pipelines} Pipelines, {created_values} Custom Values deployed."
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



class GHLOAuthHandler:
    """
    GoHighLevel OAuth 2.0 Token Exchange and Authorization Handler.
    Handles App Marketplace OAuth flows for Sub-Accounts and Agencies.
    """
    BASE_URL = "https://services.leadconnectorhq.com"
    AUTH_URL = "https://marketplace.leadconnectorhq.com/oauth/chooselocation"

    @staticmethod
    def get_authorization_url(client_id: str, redirect_uri: str, scopes: Any) -> str:
        import urllib.parse
        scope_str = " ".join(scopes) if isinstance(scopes, list) else str(scopes)
        params = {
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "scope": scope_str
        }
        return f"{GHLOAuthHandler.AUTH_URL}?{urllib.parse.urlencode(params)}"

    @staticmethod
    def exchange_code_for_token(client_id: str, client_secret: str, code: str, redirect_uri: str) -> Dict[str, Any]:
        """
        Exchanges authorization code for access_token, refresh_token, and locationId.
        Endpoint: POST https://services.leadconnectorhq.com/oauth/token
        """
        url = f"{GHLOAuthHandler.BASE_URL}/oauth/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "user_type": "Location",
            "redirect_uri": redirect_uri
        }
        try:
            res = requests.post(url, data=payload, headers=headers, timeout=15)
            if res.status_code == 200:
                data = res.json()
                return {
                    "success": True,
                    "access_token": data.get("access_token"),
                    "refresh_token": data.get("refresh_token"),
                    "token_type": data.get("token_type", "Bearer"),
                    "expires_in": data.get("expires_in"),
                    "location_id": data.get("locationId"),
                    "company_id": data.get("companyId"),
                    "user_id": data.get("userId"),
                    "raw": data
                }
            else:
                err_text = res.text
                try:
                    err_json = res.json()
                    err_text = err_json.get("error_description") or err_json.get("message") or err_text
                except Exception:
                    pass
                return {"success": False, "error": err_text, "status_code": res.status_code}
        except Exception as e:
            return {"success": False, "error": str(e), "status_code": 500}

    @staticmethod
    def refresh_access_token(client_id: str, client_secret: str, refresh_token: str) -> Dict[str, Any]:
        """
        Refreshes an expired GHL access token using refresh_token.
        """
        url = f"{GHLOAuthHandler.BASE_URL}/oauth/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "user_type": "Location"
        }
        try:
            res = requests.post(url, data=payload, headers=headers, timeout=15)
            if res.status_code == 200:
                data = res.json()
                return {"success": True, "data": data}
            else:
                return {"success": False, "error": res.text, "status_code": res.status_code}
        except Exception as e:
            return {"success": False, "error": str(e), "status_code": 500}


# =====================================================================
# Dedicated High-Level Connect & Callback Helper Functions
# =====================================================================

def connect_ghl(client_id: Optional[str] = None, redirect_uri: Optional[str] = None, scopes: Optional[Any] = None) -> str:
    """
    1-Click Connect Function for GoHighLevel:
    Generates the official OAuth 2.0 authorization URL where users select
    their sub-account and grant permissions.
    """
    import os
    client_id = client_id or os.getenv("GHL_CLIENT_ID", "").strip()
    redirect_uri = redirect_uri or os.getenv("GHL_REDIRECT_URI", "https://xortlogixai.up.railway.app/oauth/callback").strip()
    scopes = scopes or os.getenv("GHL_SCOPES", (
        "contacts.readonly contacts.write "
        "opportunities.readonly opportunities.write "
        "locations.readonly locations/customFields.readonly locations/customFields.write "
        "locations/tags.readonly locations/tags.write "
        "workflows.readonly conversations.readonly conversations.write"
    ))
    return GHLOAuthHandler.get_authorization_url(client_id, redirect_uri, scopes)


def callback_ghl(code: str, client_id: Optional[str] = None, client_secret: Optional[str] = None, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
    """
    Callback Handler Function for GoHighLevel OAuth 2.0:
    1. Receives authorization code from GHL redirect.
    2. Exchanges code for access_token, refresh_token, and location_id.
    3. Verifies and retrieves the Sub-Account name.
    4. Returns fully structured connection dictionary.
    """
    import os
    client_id = client_id or os.getenv("GHL_CLIENT_ID", "").strip()
    client_secret = client_secret or os.getenv("GHL_CLIENT_SECRET", "").strip()
    redirect_uri = redirect_uri or os.getenv("GHL_REDIRECT_URI", "https://xortlogixai.up.railway.app/oauth/callback").strip()

    if not client_id or not client_secret:
        return {
            "success": False,
            "error": "Missing GHL_CLIENT_ID or GHL_CLIENT_SECRET in environment.",
            "status_code": 400
        }

    token_res = GHLOAuthHandler.exchange_code_for_token(
        client_id=client_id,
        client_secret=client_secret,
        code=code,
        redirect_uri=redirect_uri
    )

    if not token_res.get("success"):
        return token_res

    location_id = token_res.get("location_id", "")
    access_token = token_res.get("access_token", "")
    location_name = "GHL Sub-Account"

    if location_id and access_token:
        try:
            client = GHLSubAccountClient(location_id=location_id, access_token=access_token)
            verify = client.verify_connection()
            if verify.get("success"):
                location_name = verify.get("location_name", location_name)
        except Exception as e:
            logger.warning(f"Could not verify location name in callback: {e}")

    return {
        "success": True,
        "location_id": location_id,
        "location_name": location_name,
        "access_token": access_token,
        "refresh_token": token_res.get("refresh_token", ""),
        "expires_in": token_res.get("expires_in"),
        "user_id": token_res.get("user_id"),
        "company_id": token_res.get("company_id"),
        "message": f"Successfully connected to {location_name}!"
    }
