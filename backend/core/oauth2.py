"""Utility class to handle OAuth2.0 token fetching and refreshing."""
import os
from datetime import datetime, timedelta

import requests
from fastapi import HTTPException

CLIENT_ID = os.getenv("FATSECRET_CLIENT_ID")
CLIENT_SECRET = os.getenv("FATSECRET_CLIENT_SECRET")
TOKEN_URL = os.getenv("FATSECRET_TOKEN_URL")

ACCESS_TOKEN = None
REFRESH_TOKEN = None
TOKEN_EXPIRY_TIME = None


class FatSecretAuthorization:
    @staticmethod
    def fetch_oauth2_token():
        global ACCESS_TOKEN, REFRESH_TOKEN, TOKEN_EXPIRY_TIME

        data = {
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        }
        auth_token_response = requests.post(TOKEN_URL, data=data)

        if auth_token_response.status_code == 200:
            token_data = auth_token_response.json()
            ACCESS_TOKEN = token_data['access_token']
            REFRESH_TOKEN = token_data.get('refresh_token', None)
            expires_in = token_data['expires_in']
            TOKEN_EXPIRY_TIME = datetime.now() + timedelta(seconds=expires_in)
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch OAuth token")

    @staticmethod
    def refresh_oauth2_token():
        global ACCESS_TOKEN, REFRESH_TOKEN, TOKEN_EXPIRY_TIME

        if not REFRESH_TOKEN:
            raise HTTPException(status_code=400, detail="Refresh token is missing. Please fetch a new access token.")

        data = {
            "grant_type": "refresh_token",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": REFRESH_TOKEN,
        }

        refresh_token_response = requests.post(TOKEN_URL, data=data)

        if refresh_token_response.status_code == 200:
            token_data = refresh_token_response.json()
            ACCESS_TOKEN = token_data['access_token']
            REFRESH_TOKEN = token_data.get('refresh_token', REFRESH_TOKEN)
            expires_in = token_data['expires_in']
            TOKEN_EXPIRY_TIME = datetime.now() + timedelta(seconds=expires_in)
        else:
            raise HTTPException(status_code=500, detail="Failed to refresh OAuth token")

    @staticmethod
    def get_access_token():
        try:
            print("Getting access token...")
            if not ACCESS_TOKEN or datetime.now() > TOKEN_EXPIRY_TIME:
                print("Access token expired, refreshing...")

                # If no access token, fetch a new one; otherwise, refresh the existing token
                if not ACCESS_TOKEN:
                    FatSecretAuthorization.fetch_oauth2_token()
                else:
                    FatSecretAuthorization.refresh_oauth2_token()
            access_token = ACCESS_TOKEN
            print(f"Token obtained: {access_token[:10]}...")
            return access_token
        except Exception as e:
            print(f"Error getting access token: {str(e)}")
            raise
