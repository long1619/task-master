import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:5000/api/v1';

async function testTrashApis() {
  console.log('1. Logging in as demo user...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'pro@taskmaster.dev', password: 'password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken || loginData.token;
  console.log('Logged in successfully, token exists:', !!token);

  console.log('\n2. Fetching trash items...');
  const trashRes = await fetch(`${API_BASE}/todos/trash`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const trashData = await trashRes.json();
  console.log('Trash status:', trashRes.status, 'Total trash items:', (trashData.data || []).length);
  if (trashData.data && trashData.data.length > 0) {
    const firstItem = trashData.data[0];
    console.log('First item in trash:', firstItem.id, firstItem.title);

    console.log('\n3. Testing restore of item:', firstItem.id);
    const restoreRes = await fetch(`${API_BASE}/todos/${firstItem.id}/restore`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const restoreData = await restoreRes.json();
    console.log('Restore status:', restoreRes.status, restoreData);

    console.log('\n4. Soft deleting it again to put back into trash...');
    const delRes = await fetch(`${API_BASE}/todos/${firstItem.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Delete status:', delRes.status);
  }
}

testTrashApis().catch(err => console.error(err));
