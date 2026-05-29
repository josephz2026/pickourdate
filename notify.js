export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, guestName, venueName, date, time, type } = req.body;

  if (!to) return res.status(400).json({ error: 'Missing email' });

  const subjects = {
    viewed: `${guestName} just opened your date proposal`,
    confirmed: `${guestName} confirmed the date!`
  };

  const bodies = {
    viewed: `
      <div style="font-family:'Georgia',serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#12121C;color:white;border-radius:16px;">
        <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:24px">pickourdate.co</p>
        <h1 style="font-size:32px;font-weight:400;color:white;margin-bottom:12px;line-height:1.2">${guestName} opened<br>your date proposal.</h1>
        <p style="font-size:15px;color:rgba(255,255,255,0.4);font-weight:300;line-height:1.6">She's looking at your options right now. Fingers crossed.</p>
      </div>
    `,
    confirmed: `
      <div style="font-family:'Georgia',serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#12121C;color:white;border-radius:16px;">
        <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:24px">pickourdate.co</p>
        <h1 style="font-size:32px;font-weight:400;color:white;margin-bottom:12px;line-height:1.2">It's a date.</h1>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin:24px 0;">
          <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:4px">Spot</p>
          <p style="font-size:16px;color:white;margin-bottom:16px">${venueName}</p>
          <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:4px">Date</p>
          <p style="font-size:16px;color:white;margin-bottom:16px">${date}</p>
          <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:4px">Time</p>
          <p style="font-size:16px;color:white">${time}</p>
        </div>
        <p style="font-size:15px;color:rgba(255,255,255,0.4);font-weight:300">${guestName} locked it in. Now show up.</p>
      </div>
    `
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'PickOurDate <noreply@pickourdate.co>',
        to: [to],
        subject: subjects[type] || 'Update from pickourdate.co',
        html: bodies[type] || '<p>You have a new notification.</p>'
      })
    });

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}