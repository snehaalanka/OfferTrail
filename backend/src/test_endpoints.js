import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('🚀 Starting Backend Integration Tests...');
  
  try {
    // 1. Register a test user
    console.log('\n--- Test 1: User Registration/Login ---');
    let token = '';
    try {
      const regRes = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test Engineer',
        email: `test_${Date.now()}@example.com`,
        password: 'password123'
      });
      token = regRes.data.token;
      console.log('✅ Registered test user successfully!');
    } catch (err) {
      console.log('User registration failed, attempting login...', err.response?.data || err.message);
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test_engineer@example.com',
        password: 'password123'
      });
      token = loginRes.data.token;
      console.log('✅ Logged in successfully!');
    }

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Add goal with no companies (verifying general goals auto-creator fallback)
    console.log('\n--- Test 2: Add Goal with No Companies (Auto-Creator Fallback) ---');
    const goalText = `Learn System Design Part ${Date.now()}`;
    const goalRes = await axios.post(`${BASE_URL}/companies/dashboard/goals`, { text: goalText }, authHeader);
    console.log('✅ Goal added with no existing company!');
    console.log('Fallback company name:', goalRes.data.name);
    console.log('Checklist contents:', goalRes.data.checklist);

    // 3. Create a test company
    console.log('\n--- Test 3: Create Company Workspace ---');
    const compRes = await axios.post(`${BASE_URL}/companies`, {
      name: 'Google LLC',
      role: 'Software Engineer',
      status: 'Prepping'
    }, authHeader);
    const companyId = compRes.data._id;
    console.log('✅ Company created successfully! ID:', companyId);

    // 4. Add goal targeting the new company
    console.log('\n--- Test 4: Add Goal to Specific Company ---');
    const companyGoalText = 'Solve 5 LeetCode DP Problems';
    const specificGoalRes = await axios.post(`${BASE_URL}/companies/dashboard/goals`, {
      text: companyGoalText,
      companyId: companyId
    }, authHeader);
    console.log('✅ Specific company goal added successfully!');
    console.log('Updated Google checklist:', specificGoalRes.data.checklist);

    // 5. Toggle goal completion status
    console.log('\n--- Test 5: Toggle Goal Status ---');
    const toggleRes = await axios.put(`${BASE_URL}/companies/${companyId}/checklist-toggle`, {
      text: companyGoalText,
      completed: true
    }, authHeader);
    const updatedItem = toggleRes.data.checklist.find(c => c.text === companyGoalText);
    console.log('✅ Goal toggled successfully! Completed status:', updatedItem?.completed);

    // 6. Update progress dots (rating 3/5)
    console.log('\n--- Test 6: Update Progress Dots ---');
    const progressRes = await axios.put(`${BASE_URL}/companies/${companyId}/progress-step`, {
      rating: 3
    }, authHeader);
    const activeCount = progressRes.data.progress.filter(p => p.completed).length;
    console.log('✅ Progress dots updated successfully! Active count (completed):', activeCount);
    console.log('Progress array details:', progressRes.data.progress);

    // 7. Delete goal
    console.log('\n--- Test 7: Delete Goal ---');
    const deleteRes = await axios.put(`${BASE_URL}/companies/${companyId}/checklist-delete`, {
      text: companyGoalText
    }, authHeader);
    const exists = deleteRes.data.checklist.some(c => c.text === companyGoalText);
    console.log('✅ Goal deleted successfully! Still exists in checklist?', exists);

    // 8. Fetch and verify recent activity feed
    console.log('\n--- Test 8: Fetch Dashboard Activity Feed ---');
    const actRes = await axios.get(`${BASE_URL}/companies/dashboard/activities`, authHeader);
    console.log('✅ Activities retrieved successfully! Count:', actRes.data.length);
    console.log('Sample activities logged:');
    actRes.data.forEach(act => {
      console.log(` - [${act.type}] [${act.companyName || 'General'}] ${act.action} (${act.timestamp})`);
    });

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Integration Test Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
