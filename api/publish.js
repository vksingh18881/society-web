export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      // NEW LOGIC: Delete by ID for new notices, or fallback to Title for old legacy notices
      notices = notices.filter(n => {
        if (noticeId && noticeId !== 'undefined') {
          return n.id !== noticeId;
        } else {
          return n.title !== title;
        }
      });
    } else {
      // Publish Action
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const today = new Date();
      const autoDate = today.getDate() + ' ' + months[today.getMonth()] + ' ' + today.getFullYear();
      
      let expiryTime = null; 
      if (duration === 'daily') expiryTime = Date.now() + (24 * 60 * 60 * 1000);
      else if (duration === 'weekly') expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      else if (duration === 'monthly') expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000);

      const newNotice = {
        id: Date.now().toString(),
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