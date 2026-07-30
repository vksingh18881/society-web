export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // We now accept 'action', 'duration', and 'noticeId'
  const { password, action, title, desc, duration, noticeId } = req.body;

  const adminAccounts = {
    'admin123': 'Society Admin',
    'president123': 'President',
    'secretary123': 'Secretary'
  };

  const author = adminAccounts[password] || 'Society Admin';
  if (!adminAccounts[password]) {
    return res.status(401).json({ error: 'Incorrect Password' });
  }

  const BIN_ID = '6a69a6d3da38895dfe9ea9ce';
  const API_KEY = process.env.JSONBIN_MASTER_KEY;

  try {
    let getResponse = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    let data = await getResponse.json();
    let notices = Array.isArray(data.record) ? data.record : [];

    if (action === 'delete') {
      // Filter out the notice that matches the ID
      notices = notices.filter(n => n.id !== noticeId);
    } else {
      // Publish Action
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const today = new Date();
      const autoDate = today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear();
      
      // Calculate Auto-Disappear Expiry Time (in milliseconds)
      let expiryTime = null; // 'never'
      if (duration === 'daily') expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      else if (duration === 'weekly') expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      else if (duration === 'monthly') expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000);

      // Create notice with a Unique ID and Expiry
      const newNotice = {
        id: Date.now().toString(), // Unique timestamp ID
        date: autoDate, 
        title: title, 
        desc: desc, 
        author: author,
        expiry: expiryTime
      };
      
      notices.unshift(newNotice);
    }

    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(notices)
    });

    return res.status(200).json({ success: true, message: action === 'delete' ? 'Notice Deleted!' : 'Notice Published!' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to communicate with database.' });
  }
}