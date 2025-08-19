"""Basic API tests to verify the backend is working"""

import asyncio
import httpx
from datetime import datetime


async def test_api():
    """Test basic API endpoints"""
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        # Test root endpoint
        print("Testing root endpoint...")
        response = await client.get(f"{base_url}/")
        print(f"Root: {response.status_code} - {response.json()}")
        
        # Test health endpoint
        print("\nTesting health endpoint...")
        response = await client.get(f"{base_url}/health")
        print(f"Health: {response.status_code} - {response.json()}")
        
        # Test services endpoint
        print("\nTesting services endpoint...")
        response = await client.get(f"{base_url}/api/v1/services")
        print(f"Services: {response.status_code}")
        data = response.json()
        print(f"Total services: {data.get('total', 0)}")
        
        # Test categories endpoint
        print("\nTesting categories endpoint...")
        response = await client.get(f"{base_url}/api/v1/categories")
        print(f"Categories: {response.status_code}")
        categories = response.json()
        print(f"Total categories: {len(categories)}")
        
        # Test creating a service
        print("\nTesting service creation...")
        new_service = {
            "name": f"Test Service {datetime.now().strftime('%H%M%S')}",
            "url": "https://test.example.com",
            "description": "Test service created via API",
            "is_active": True,
            "tags": []
        }
        response = await client.post(
            f"{base_url}/api/v1/services",
            json=new_service
        )
        print(f"Create service: {response.status_code}")
        if response.status_code == 200:
            created = response.json()
            print(f"Created service ID: {created['id']}")
            
            # Test updating the service
            print("\nTesting service update...")
            update_data = {"description": "Updated description"}
            response = await client.put(
                f"{base_url}/api/v1/services/{created['id']}",
                json=update_data
            )
            print(f"Update service: {response.status_code}")
            
            # Test deleting the service
            print("\nTesting service deletion...")
            response = await client.delete(
                f"{base_url}/api/v1/services/{created['id']}"
            )
            print(f"Delete service: {response.status_code}")
        
        print("\n✅ All tests completed!")


if __name__ == "__main__":
    print("Starting API tests...")
    print("Make sure the backend server is running on http://localhost:8000")
    print("-" * 50)
    asyncio.run(test_api())