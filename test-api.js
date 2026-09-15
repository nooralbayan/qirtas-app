import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3001/api/state');
  const data = await res.json();
  console.log('GET /api/state length of students:', data.data.students.length);
  
  const res2 = await fetch('http://localhost:3001/api/state/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'academicYear', value: '2025 - 2026' })
  });
  console.log('POST update status:', res2.status);
  console.log(await res2.text());
}
test().catch(console.error);
