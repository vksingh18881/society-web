export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, title, desc } = req.body;

  // Passwords mapped to Display Names
  const adminAccounts = {
    'admin123': 'Society Admin',
    'president123': 'President',
    'secretary123': 'Secretary'
  };

  // Assign author based on password, or default to "Society Admin"
  const author = adminAccounts[password] || 'Society Admin';

  const BIN_ID = '6a69a6d3da38895dfe9ea9ce';
  const API_KEY = process.env.JSONBIN_MASTER_KEY;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const today = new Date();
  const autoDate = today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear();

  try {
    let getResponse = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    let data = await getResponse.json();
    let notices = data.record;
    
    if (!Array.isArray(notices)) notices = [];

    // Save notice WITH the author tag
    notices.unshift({ date: autoDate, title: title, desc: desc, author: author });

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