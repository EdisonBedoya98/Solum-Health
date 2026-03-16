import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load from apps/api/.env which should have the secret key
load_dotenv('apps/api/.env')

url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in environment.")
    exit(1)

supabase: Client = create_client(url, key)

try:
    bucket_name = 'medical-documents'
    # Check if bucket exists
    buckets = supabase.storage.list_buckets()
    bucket_exists = any(b.name == bucket_name for b in buckets)
    
    if not bucket_exists:
        supabase.storage.create_bucket(bucket_name, options={'public': False})
        print(f"Bucket '{bucket_name}' created successfully.")
    else:
        print(f"Bucket '{bucket_name}' already exists.")
except Exception as e:
    print(f"Error creating bucket: {str(e)}")
