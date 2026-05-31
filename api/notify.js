export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, guestName, venueName, date, time, type, address } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing email' });

  const mapsLink = `https://www.google.com/maps/search/${encodeURIComponent((venueName || '') + ' ' + (address || ''))}`;
  const calLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Date at ${venueName}`)}&details=${encodeURIComponent(`${venueName} — ${date} at ${time}`)}&location=${encodeURIComponent((venueName || '') + ' ' + (address || ''))}&dates=${icsStart || ''}/${icsEnd || ''}`;

  function toISODate(dateStr, timeStr) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const d = new Date(`${dateStr} ${year} ${timeStr}`);
      if (isNaN(d)) return new Date().toISOString();
      return d.toISOString();
    } catch(e) { return new Date().toISOString(); }
  }

  function toICSDate(dateStr, timeStr) {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const d = new Date(`${dateStr} ${year} ${timeStr}`);
      if (isNaN(d)) return null;
      // Use local time format instead of UTC to avoid timezone shift
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    } catch(e) { return null; }
  }

  const isoDate = toISODate(date, time);
  const icsStart = toICSDate(date, time);
  const icsEnd = icsStart ? (() => {
    const d = new Date(`${date} ${new Date().getFullYear()} ${time}`);
    d.setHours(d.getHours() + 2);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  })() : null;

  const icsContent = icsStart ? [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PickOurDate//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTART:${icsStart}`,
    `DTEND:${icsEnd}`,
    `SUMMARY:Date at ${venueName}`,
    `DESCRIPTION:${venueName} — ${date} at ${time}`,
    `LOCATION:${address || venueName}`,
    `UID:${Date.now()}@pickourdate.co`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n') : null;

  const icsBase64 = icsContent
    ? Buffer.from(icsContent).toString('base64')
    : null;

  const schemaMarkup = (type === 'confirmed' || type === 'guest_confirmed') ? `
    <script type="application/ld+json">
    {
      "@context": "http://schema.org",
      "@type": "EventReservation",
      "reservationNumber": "POD-${Date.now()}",
      "underName": { "@type": "Person", "name": "${guestName}" },
      "reservationFor": {
        "@type": "Event",
        "name": "Date at ${venueName}",
        "startDate": "${isoDate}",
        "location": {
          "@type": "Place",
          "name": "${venueName}",
          "address": "${address || venueName}"
        }
      }
    }
    <\/script>
  ` : '';

  const card = (content) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width">
      ${schemaMarkup}
    </head>
    <body style="margin:0;padding:0;background:#E8E0D5;font-family:'Georgia',serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr><td align="center">
          <table width="100%" style="max-width:480px;background:#12121C;border-radius:24px;overflow:hidden;">
            <tr><td style="padding:48px 36px 40px;text-align:center;">
              ${content}
              <p style="margin:32px 0 0;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.15);font-family:'Helvetica',sans-serif">pickourdate.co</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const summaryBlock = `
    <table width="100%" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;margin:28px 0;text-align:left;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);font-family:'Helvetica',sans-serif">Spot</p>
        <p style="margin:0;font-size:17px;font-family:'Georgia',serif">
          <a href="${mapsLink}" style="color:white;text-decoration:underline">${venueName}</a>
        </p>
        ${address ? `<p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.5);font-family:'Helvetica',sans-serif">${address}</p>` : ''}
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);font-family:'Helvetica',sans-serif">Date</p>
        <p style="margin:0;font-size:17px;font-family:'Georgia',serif">
          <a href="${calLink}" style="color:white;text-decoration:underline">${date}</a>
        </p>
      </td></tr>
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);font-family:'Helvetica',sans-serif">Time</p>
        <p style="margin:0;font-size:17px;color:white;font-family:'Georgia',serif">${time}</p>
      </td></tr>
    </table>
  `;

  const calButton = `<a href="${calLink}" style="display:block;padding:15px 32px;border:1px solid rgba(255,255,255,0.3);border-radius:50px;color:white;text-decoration:none;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;font-family:'Helvetica',sans-serif;margin-bottom:12px">Add to Google Calendar</a>`;

  const emails = {
    viewed: {
      subject: `${guestName} just opened your date proposal ✦`,
      html: card(`
        <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 32px;font-family:'Helvetica',sans-serif">pickourdate.co</p>
        <h1 style="font-size:36px;font-weight:400;color:white;margin:0 0 16px;line-height:1.2">${guestName} opened<br><em style="color:rgba(255,255,255,0.45)">your proposal.</em></h1>
        <p style="font-size:16px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0;font-family:'Helvetica',sans-serif">They're looking at your options right now.<br>Fingers crossed.</p>
      `)
    },
    confirmed: {
      subject: `${guestName} confirmed the date 🎉`,
      html: card(`
        <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 32px;font-family:'Helvetica',sans-serif">pickourdate.co</p>
        <h1 style="font-size:40px;font-weight:400;color:white;margin:0 0 8px;line-height:1.1">It's a <em style="color:rgba(255,255,255,0.45)">date.</em></h1>
        <p style="font-size:16px;color:rgba(255,255,255,0.6);margin:0;font-family:'Helvetica',sans-serif">${guestName} locked it in.</p>
        ${summaryBlock}
        ${calButton}
        <p style="font-size:15px;color:rgba(255,255,255,0.4);margin:20px 0 0;font-family:'Helvetica',sans-serif">Now show up.</p>
      `),
      attachments: icsBase64 ? [{
        filename: 'date.ics',
        content: icsBase64,
        type: 'text/calendar'
      }] : []
    },
    guest_confirmed: {
      subject: `You're going on a date ✦`,
      html: card(`
        <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 32px;font-family:'Helvetica',sans-serif">pickourdate.co</p>
        <h1 style="font-size:40px;font-weight:400;color:white;margin:0 0 8px;line-height:1.1">It's a <em style="color:rgba(255,255,255,0.45)">date.</em></h1>
        <p style="font-size:16px;color:rgba(255,255,255,0.6);margin:0;font-family:'Helvetica',sans-serif">Here's what you picked, ${guestName}.</p>
        ${summaryBlock}
        ${calButton}
        <p style="font-size:15px;color:rgba(255,255,255,0.4);margin:20px 0 0;font-family:'Helvetica',sans-serif">Can't wait to see you.</p>
      `),
      attachments: icsBase64 ? [{
        filename: 'date.ics',
        content: icsBase64,
        type: 'text/calendar'
      }] : []
    }
  };

  const email = emails[type];
  if (!email) return res.status(400).json({ error: 'Invalid type' });

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
        subject: email.subject,
        html: email.html,
        attachments: email.attachments || []
      })
    });

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
