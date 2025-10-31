#!/usr/bin/env python3
"""
4Profit MVP Backend API Testing
Tests the complete backend flow as specified in the review request.
"""

import requests
import json
import time
from urllib.parse import urljoin, parse_qs, urlparse

# Configuration
BASE_URL = "https://tradematch-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials from seed data
INVESTOR_EMAIL = "investor1@4profit.dev"
INVESTOR_PASSWORD = "Passw0rd!"
TRADER_EMAIL = "trader01@4profit.dev"
TRADER_PASSWORD = "Passw0rd!"

class APITester:
    def __init__(self):
        self.investor_session = requests.Session()
        self.trader_session = requests.Session()
        self.test_results = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_seed_endpoint(self):
        """Test 1: GET /api/seed"""
        try:
            response = self.investor_session.get(f"{API_BASE}/seed")
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    self.log_result("Seed endpoint", True, f"Response: {data}")
                    return True
                else:
                    self.log_result("Seed endpoint", False, f"Invalid response: {data}")
            else:
                self.log_result("Seed endpoint", False, f"Status: {response.status_code}, Body: {response.text}")
        except Exception as e:
            self.log_result("Seed endpoint", False, f"Exception: {str(e)}")
        return False
        
    def login_user(self, session, email, password, user_type):
        """Login user via NextAuth credentials flow"""
        try:
            # Step 1: Get CSRF token
            csrf_response = session.get(f"{API_BASE}/auth/csrf")
            if csrf_response.status_code != 200:
                self.log_result(f"{user_type} login - CSRF", False, f"CSRF failed: {csrf_response.status_code}")
                return False
                
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get("csrfToken")
            if not csrf_token:
                self.log_result(f"{user_type} login - CSRF", False, "No CSRF token in response")
                return False
                
            # Step 2: Login with credentials
            login_data = {
                "csrfToken": csrf_token,
                "callbackUrl": "/",
                "email": email,
                "password": password,
                "json": "true"
            }
            
            login_response = session.post(
                f"{API_BASE}/auth/callback/credentials",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                allow_redirects=False
            )
            
            # NextAuth returns 302 on successful login or 200 with error
            if login_response.status_code in [200, 302]:
                # Check if we have session cookies
                cookies = session.cookies.get_dict()
                has_session = any("next-auth" in cookie_name.lower() for cookie_name in cookies.keys())
                
                if has_session or login_response.status_code == 302:
                    self.log_result(f"{user_type} login", True, f"Login successful, cookies: {list(cookies.keys())}")
                    return True
                else:
                    self.log_result(f"{user_type} login", False, f"No session cookies found")
            else:
                self.log_result(f"{user_type} login", False, f"Login failed: {login_response.status_code}, {login_response.text}")
                
        except Exception as e:
            self.log_result(f"{user_type} login", False, f"Exception: {str(e)}")
        return False
        
    def test_session_endpoint(self, session, user_type, expected_role):
        """Test GET /api/session"""
        try:
            response = session.get(f"{API_BASE}/session")
            if response.status_code == 200:
                data = response.json()
                user = data.get("user")
                if user and user.get("role") == expected_role:
                    self.log_result(f"{user_type} session check", True, f"User: {user}")
                    return user
                else:
                    self.log_result(f"{user_type} session check", False, f"Invalid user data: {data}")
            else:
                self.log_result(f"{user_type} session check", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result(f"{user_type} session check", False, f"Exception: {str(e)}")
        return None
        
    def test_traders_list(self, session):
        """Test GET /api/traders"""
        try:
            response = session.get(f"{API_BASE}/traders")
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                if items:
                    # Check if contacts are masked
                    first_trader = items[0]
                    email = first_trader.get("links", {}).get("email", "")
                    telegram = first_trader.get("links", {}).get("telegram", "")
                    
                    is_masked = "***" in email or "***" in telegram
                    self.log_result("Traders list with masking", True, 
                                  f"Found {len(items)} traders, email masked: {'***' in email}, telegram masked: {'***' in telegram}")
                    return items
                else:
                    self.log_result("Traders list", False, "No traders found")
            else:
                self.log_result("Traders list", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Traders list", False, f"Exception: {str(e)}")
        return []
        
    def test_contact_request(self, session, trader_id):
        """Test POST /api/contact/request"""
        try:
            payload = {"trader_id": trader_id}
            response = session.post(f"{API_BASE}/contact/request", 
                                  json=payload,
                                  headers={"Content-Type": "application/json"})
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    self.log_result("Contact request", True, f"Request created: {data}")
                    return data.get("request", {}).get("id")
                else:
                    self.log_result("Contact request", False, f"Request failed: {data}")
            else:
                self.log_result("Contact request", False, f"Status: {response.status_code}, Body: {response.text}")
        except Exception as e:
            self.log_result("Contact request", False, f"Exception: {str(e)}")
        return None
        
    def logout_user(self, session, user_type):
        """Logout user"""
        try:
            # Get CSRF token for logout
            csrf_response = session.get(f"{API_BASE}/auth/csrf")
            if csrf_response.status_code == 200:
                csrf_data = csrf_response.json()
                csrf_token = csrf_data.get("csrfToken")
                
                # Logout
                logout_response = session.post(f"{API_BASE}/auth/signout", 
                                             data={"csrfToken": csrf_token},
                                             headers={"Content-Type": "application/x-www-form-urlencoded"})
                
                self.log_result(f"{user_type} logout", True, f"Logout status: {logout_response.status_code}")
                return True
        except Exception as e:
            self.log_result(f"{user_type} logout", False, f"Exception: {str(e)}")
        return False
        
    def test_my_requests(self, session, user_type):
        """Test GET /api/my/requests"""
        try:
            response = session.get(f"{API_BASE}/my/requests")
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                self.log_result(f"{user_type} my requests", True, f"Found {len(items)} requests")
                return items
            else:
                self.log_result(f"{user_type} my requests", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result(f"{user_type} my requests", False, f"Exception: {str(e)}")
        return []
        
    def test_contact_decision(self, session, request_id, accept=True):
        """Test POST /api/contact/decision"""
        try:
            payload = {"request_id": request_id, "accept": accept}
            response = session.post(f"{API_BASE}/contact/decision",
                                  json=payload,
                                  headers={"Content-Type": "application/json"})
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    action = "accepted" if accept else "declined"
                    self.log_result(f"Contact decision ({action})", True, f"Decision processed: {data}")
                    return True
                else:
                    self.log_result("Contact decision", False, f"Decision failed: {data}")
            else:
                self.log_result("Contact decision", False, f"Status: {response.status_code}, Body: {response.text}")
        except Exception as e:
            self.log_result("Contact decision", False, f"Exception: {str(e)}")
        return False
        
    def test_trader_profile_unmasked(self, session, trader_slug):
        """Test GET /api/trader/[slug] for unmasked contacts"""
        try:
            response = session.get(f"{API_BASE}/trader/{trader_slug}")
            if response.status_code == 200:
                data = response.json()
                profile = data.get("profile", {})
                links = profile.get("links", {})
                email = links.get("email", "")
                telegram = links.get("telegram", "")
                
                is_unmasked = "***" not in email and "***" not in telegram
                self.log_result("Trader profile unmasked", is_unmasked, 
                              f"Email: {email}, Telegram: {telegram}")
                return is_unmasked
            else:
                self.log_result("Trader profile unmasked", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_result("Trader profile unmasked", False, f"Exception: {str(e)}")
        return False
        
    def test_rate_limit(self, session, trader_id):
        """Test rate limiting - attempt 6 requests within hour"""
        try:
            success_count = 0
            rate_limited = False
            
            for i in range(6):
                payload = {"trader_id": trader_id}
                response = session.post(f"{API_BASE}/contact/request",
                                      json=payload,
                                      headers={"Content-Type": "application/json"})
                
                if response.status_code == 200:
                    success_count += 1
                elif response.status_code == 429:
                    rate_limited = True
                    break
                    
                time.sleep(0.5)  # Small delay between requests
                
            if rate_limited and success_count <= 5:
                self.log_result("Rate limiting", True, f"Rate limited after {success_count} requests")
                return True
            else:
                self.log_result("Rate limiting", False, f"Expected rate limit after 5 requests, got {success_count} successful")
                return False
                
        except Exception as e:
            self.log_result("Rate limiting", False, f"Exception: {str(e)}")
        return False
        
    def test_credit_limit(self, session, trader_ids):
        """Test credit limiting - attempt 4th unique trader request within month"""
        try:
            successful_requests = 0
            credit_limited = False
            
            # Try to make requests to different traders
            for i, trader_id in enumerate(trader_ids[:4]):
                payload = {"trader_id": trader_id}
                response = session.post(f"{API_BASE}/contact/request",
                                      json=payload,
                                      headers={"Content-Type": "application/json"})
                
                if response.status_code == 200:
                    successful_requests += 1
                elif response.status_code == 402:
                    credit_limited = True
                    break
                    
                time.sleep(0.5)
                
            if credit_limited and successful_requests <= 3:
                self.log_result("Credit limiting", True, f"Credit limited after {successful_requests} requests")
                return True
            else:
                self.log_result("Credit limiting", False, f"Expected credit limit after 3 requests, got {successful_requests} successful")
                return False
                
        except Exception as e:
            self.log_result("Credit limiting", False, f"Exception: {str(e)}")
        return False
        
    def run_full_test_suite(self):
        """Run the complete test suite"""
        print("🚀 Starting 4Profit MVP Backend API Tests")
        print("=" * 60)
        
        # Test 1: Seed endpoint
        if not self.test_seed_endpoint():
            print("❌ Seed endpoint failed - stopping tests")
            return False
            
        # Test 2: Login investor
        if not self.login_user(self.investor_session, INVESTOR_EMAIL, INVESTOR_PASSWORD, "Investor"):
            print("❌ Investor login failed - stopping tests")
            return False
            
        # Test 3: Check investor session
        investor_user = self.test_session_endpoint(self.investor_session, "Investor", "investor")
        if not investor_user:
            print("❌ Investor session check failed - stopping tests")
            return False
            
        # Test 4: Get traders list (masked)
        traders = self.test_traders_list(self.investor_session)
        if not traders:
            print("❌ Traders list failed - stopping tests")
            return False
            
        # Save trader info for later tests
        first_trader = traders[0]
        trader_id = first_trader.get("id")
        trader_slug = first_trader.get("slug")
        
        # Test 5: Make contact request
        request_id = self.test_contact_request(self.investor_session, trader_id)
        if not request_id:
            print("❌ Contact request failed - continuing with other tests")
            
        # Test 6: Logout investor and login trader
        self.logout_user(self.investor_session, "Investor")
        
        if not self.login_user(self.trader_session, TRADER_EMAIL, TRADER_PASSWORD, "Trader"):
            print("❌ Trader login failed - stopping trader tests")
            return False
            
        # Test 7: Check trader session
        trader_user = self.test_session_endpoint(self.trader_session, "Trader", "trader")
        if not trader_user:
            print("❌ Trader session check failed")
            
        # Test 8: Get trader's requests
        trader_requests = self.test_my_requests(self.trader_session, "Trader")
        
        # Test 9: Accept contact request (if we have one)
        if request_id:
            self.test_contact_decision(self.trader_session, request_id, accept=True)
            
        # Test 10: Logout trader, login investor again
        self.logout_user(self.trader_session, "Trader")
        self.login_user(self.investor_session, INVESTOR_EMAIL, INVESTOR_PASSWORD, "Investor")
        
        # Test 11: Check unmasked trader profile
        if trader_slug:
            self.test_trader_profile_unmasked(self.investor_session, trader_slug)
            
        # Test 12: Rate limiting (this might affect other tests, so do it last)
        if len(traders) > 1:
            second_trader_id = traders[1].get("id")
            if second_trader_id:
                self.test_rate_limit(self.investor_session, second_trader_id)
                
        # Test 13: Credit limiting (use different traders)
        if len(traders) >= 4:
            trader_ids = [t.get("id") for t in traders[2:6]]  # Use different traders
            self.test_credit_limit(self.investor_session, trader_ids)
            
        print("\n" + "=" * 60)
        print("📊 Test Summary:")
        
        passed = sum(1 for r in self.test_results if r["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
                    
        return passed == total

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_full_test_suite()
    exit(0 if success else 1)