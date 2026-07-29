// api/publish.js

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, title, desc } = req.body;

  // 1. SECURE PASSWORD CHECK (Hidden from the public)
  const adminAccounts = {
    'admin123': 'Society Admin',
    'president123': 'President',
    'secretary123': 'Secretary'
  };

  const author = adminAccounts[password];

  if (!author) {
    return res.status(401).json({ error: 'Incorrect Password' });
  }

  // 2. SECURE DATABASE CONFIGURATION
  const BIN_ID = '6a69a6d3da38895dfe9ea9ce';
  const API_KEY = process.env.JSONBIN_MASTER_KEY; // Pulled secretly from Vercel settings

  // 3. AUTO-GENERATE DATE
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  const autoDate = today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear();

  try {
    // 4. FETCH CURRENT NOTICES
    let getResponse = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    let data = await getResponse.json();
    let notices = data.record;
    
    if (!Array.isArray(notices)) notices = [];

    // 5. ADD NEW NOTICE
    notices.unshift({ date: autoDate, title: title, desc: desc, author: author });

    // 6. SAVE BACK TO DATABASE
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(notices)
    });

    return res.status(200).json({ success: true, message: 'Notice published!' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to communicate with database.' });
  }
}