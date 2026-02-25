import requests

API_KEY = "AIzaSyDJKEbvOTjXPp9J9AnkQFnCIYlqWZm5X-U" 

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

response = requests.get(url)

print("Status:", response.status_code)
print(response.text)