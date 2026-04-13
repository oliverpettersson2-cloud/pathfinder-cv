import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Ny — för admin-operationer

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const { action, email, token, accessToken, userId, cvData, table, data,
    // Nya fält för uppgifter/admin
    adminEmail, taskId, templateId, params: tParams,
    title, description, category, deadline, durationMinutes, note,
    targetUserId, role, kommunId, enhetId, name: personName,
    filters
  } = req.body || {};

  function makeRequest(url, options, body) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const reqOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 10000
      };
      const req = https.request(reqOptions, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            resolve({ status: response.statusCode, data: JSON.parse(data) });
          } catch(e) {
            resolve({ status: response.statusCode, data: { raw: data } });
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
      req.end();
    });
  }

  const baseHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };

  function authHeaders(token) {
    return { ...baseHeaders, 'Authorization': `Bearer ${token}` };
  }

  // Service-headers för admin-operationer (kringgår RLS)
  function serviceHeaders() {
    const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
    return { ...baseHeaders, 'apikey': key, 'Authorization': `Bearer ${key}` };
  }

  try {

    // ╔═══════════════════════════════════════════════╗
    // ║  BEFINTLIGA ACTIONS — INGA ÄNDRINGAR          ║
    // ╚═══════════════════════════════════════════════╝

    // ── Skicka OTP-kod via mail ──
    if (action === 'send_otp') {
      const result = await makeRequest(
        `${SUPABASE_URL}/auth/v1/otp`,
        { method: 'POST', headers: baseHeaders },
        { email, options: { shouldCreateUser: true } }
      );
      if (result.status >= 400) {
        return res.status(result.status).json({
          error: result.data.error_description || result.data.msg || result.data.message || JSON.stringify(result.data)
        });
      }
      return res.status(200).json({ success: true });
    }

    // ── Verifiera OTP-kod ──
    if (action === 'verify_otp') {
      const result = await makeRequest(
        `${SUPABASE_URL}/auth/v1/verify`,
        { method: 'POST', headers: baseHeaders },
        { email, token, type: 'email' }
      );
      if (result.status >= 400) {
        return res.status(result.status).json({
          error: result.data.error_description || result.data.msg || result.data.message || 'Felaktig eller utgången kod'
        });
      }
      return res.status(200).json({
        access_token: result.data.access_token,
        user: result.data.user
      });
    }

    // ── Hämta användare ──
    if (action === 'get_user') {
      const result = await makeRequest(
        `${SUPABASE_URL}/auth/v1/user`,
        { method: 'GET', headers: authHeaders(accessToken) }
      );
      return res.status(200).json(result.data);
    }

    // ── Spara CV ──
    if (action === 'save_cv') {
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/cvs`,
        { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'resolution=merge-duplicates' } },
        { user_id: userId, data: cvData, updated_at: new Date().toISOString() }
      );
      return res.status(200).json({ success: true });
    }

    // ── Ladda CV ──
    if (action === 'load_cv') {
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/cvs?user_id=eq.${userId}&select=data&limit=1`,
        { method: 'GET', headers: authHeaders(accessToken) }
      );
      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(200).json({ cv: rows[0]?.data || null });
    }

    // ── Spara valfri tabell ──
    if (action === 'save_table') {
      const ALLOWED = ['saved_cvs', 'matched_cvs', 'saved_edu', 'job_diary'];
      if (!ALLOWED.includes(table)) {
        return res.status(400).json({ error: 'Invalid table: ' + table });
      }
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}`,
        { method: 'DELETE', headers: authHeaders(accessToken) }
      );
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/${table}`,
        { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'return=minimal' } },
        { user_id: userId, data: data, saved_at: new Date().toISOString() }
      );
      return res.status(200).json({ success: true });
    }

    // ── Spara övningsprogress ──
    if (action === 'save_progress') {
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/ovning_progress`,
        { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'resolution=merge-duplicates' } },
        { user_id: userId, progress: data, updated_at: new Date().toISOString() }
      );
      return res.status(200).json({ success: true });
    }

    // ── Ladda all data ──
    if (action === 'load_all') {
      const [cvRes, savedRes, matchedRes, progressRes, eduRes, diaryRes] = await Promise.all([
        makeRequest(`${SUPABASE_URL}/rest/v1/cvs?user_id=eq.${userId}&select=data&limit=1`, { method: 'GET', headers: authHeaders(accessToken) }),
        makeRequest(`${SUPABASE_URL}/rest/v1/saved_cvs?user_id=eq.${userId}&select=data&limit=1`, { method: 'GET', headers: authHeaders(accessToken) }),
        makeRequest(`${SUPABASE_URL}/rest/v1/matched_cvs?user_id=eq.${userId}&select=data&limit=1`, { method: 'GET', headers: authHeaders(accessToken) }),
        makeRequest(`${SUPABASE_URL}/rest/v1/ovning_progress?user_id=eq.${userId}&select=progress&limit=1`, { method: 'GET', headers: authHeaders(accessToken) }),
        makeRequest(`${SUPABASE_URL}/rest/v1/saved_edu?user_id=eq.${userId}&select=data&limit=1`, { method: 'GET', headers: authHeaders(accessToken) }),
        makeRequest(`${SUPABASE_URL}/rest/v1/job_diary?user_id=eq.${userId}&select=data&limit=1`, { method: 'GET', headers: authHeaders(accessToken) }),
      ]);
      const pick = (r, key) => { const rows = Array.isArray(r.data) ? r.data : []; return rows[0]?.[key] || null; };
      return res.status(200).json({
        cv: pick(cvRes, 'data'), savedCvs: pick(savedRes, 'data'),
        matchedCvs: pick(matchedRes, 'data'), progress: pick(progressRes, 'progress'),
        savedEdu: pick(eduRes, 'data'), jobDiary: pick(diaryRes, 'data')
      });
    }


    // ╔═══════════════════════════════════════════════╗
    // ║  NYA ACTIONS — HANDLÄGGARVY & UPPGIFTER       ║
    // ╚═══════════════════════════════════════════════╝

    // ── Admin: identifiera handläggare via e-post ──
    if (action === 'admin_login') {
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/admins?email=eq.${encodeURIComponent(adminEmail || email)}&select=*,kommuner(name),enheter(name)&limit=1`,
        { method: 'GET', headers: serviceHeaders() }
      );
      const rows = Array.isArray(result.data) ? result.data : [];
      if (!rows.length) return res.status(404).json({ error: 'Ej inbjuden till CVmatchen' });

      // Uppdatera last_login
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/admins?id=eq.${rows[0].id}`,
        { method: 'PATCH', headers: serviceHeaders() },
        { last_login: new Date().toISOString() }
      );

      return res.status(200).json({ admin: rows[0] });
    }

    // ── Admin: lista alla deltagare (rollfiltrerat) ──
    if (action === 'admin_list_users') {
      let url = `${SUPABASE_URL}/rest/v1/user_assignments?select=*,admins(name)&order=created_at.desc`;

      // Rollfiltrering
      if (filters?.enhet_id) url += `&enhet_id=eq.${filters.enhet_id}`;
      if (filters?.kommun_id) url += `&kommun_id=eq.${filters.kommun_id}`;
      if (filters?.status) url += `&status=eq.${filters.status}`;
      if (filters?.limit) url += `&limit=${filters.limit}`;
      if (filters?.offset) url += `&offset=${filters.offset}`;

      const result = await makeRequest(url, { method: 'GET', headers: serviceHeaders() });

      // Hämta CV-data och övningsprogress för varje användare
      const users = Array.isArray(result.data) ? result.data : [];

      // Batch-hämta extra data
      const userIds = users.map(u => u.user_id);
      if (userIds.length) {
        const idsFilter = userIds.map(id => `"${id}"`).join(',');

        const [cvRes, progressRes, taskRes] = await Promise.all([
          makeRequest(`${SUPABASE_URL}/rest/v1/cvs?user_id=in.(${idsFilter})&select=user_id,data,updated_at`, { method: 'GET', headers: serviceHeaders() }),
          makeRequest(`${SUPABASE_URL}/rest/v1/ovning_progress?user_id=in.(${idsFilter})&select=user_id,progress`, { method: 'GET', headers: serviceHeaders() }),
          makeRequest(`${SUPABASE_URL}/rest/v1/tasks?user_id=in.(${idsFilter})&select=user_id,status`, { method: 'GET', headers: serviceHeaders() }),
        ]);

        const cvMap = {};
        (Array.isArray(cvRes.data) ? cvRes.data : []).forEach(r => { cvMap[r.user_id] = r; });
        const progMap = {};
        (Array.isArray(progressRes.data) ? progressRes.data : []).forEach(r => { progMap[r.user_id] = r.progress; });
        const taskMap = {};
        (Array.isArray(taskRes.data) ? taskRes.data : []).forEach(r => {
          if (!taskMap[r.user_id]) taskMap[r.user_id] = { total: 0, completed: 0, pending: 0 };
          taskMap[r.user_id].total++;
          if (r.status === 'completed') taskMap[r.user_id].completed++;
          if (r.status === 'pending') taskMap[r.user_id].pending++;
        });

        users.forEach(u => {
          u.cv = cvMap[u.user_id] || null;
          u.progress = progMap[u.user_id] || null;
          u.tasks = taskMap[u.user_id] || { total: 0, completed: 0, pending: 0 };
        });
      }

      return res.status(200).json({ data: users });
    }

    // ── Admin: hämta enskild deltagare med allt ──
    if (action === 'admin_get_user') {
      const uid = targetUserId || userId;

      const [assignRes, cvRes, progressRes, tasksRes, matchRes] = await Promise.all([
        makeRequest(`${SUPABASE_URL}/rest/v1/user_assignments?user_id=eq.${uid}&select=*,admins(name),enheter(name),kommuner(name)&limit=1`, { method: 'GET', headers: serviceHeaders() }),
        makeRequest(`${SUPABASE_URL}/rest/v1/cvs?user_id=eq.${uid}&select=data,updated_at&limit=1`, { method: 'GET', headers: serviceHeaders() }),
        makeRequest(`${SUPABASE_URL}/rest/v1/ovning_progress?user_id=eq.${uid}&select=progress&limit=1`, { method: 'GET', headers: serviceHeaders() }),
        makeRequest(`${SUPABASE_URL}/rest/v1/tasks?user_id=eq.${uid}&select=*&order=created_at.desc`, { method: 'GET', headers: serviceHeaders() }),
        makeRequest(`${SUPABASE_URL}/rest/v1/matched_cvs?user_id=eq.${uid}&select=data&limit=1`, { method: 'GET', headers: serviceHeaders() }),
      ]);

      const pick = (r, key) => { const rows = Array.isArray(r.data) ? r.data : []; return rows[0]?.[key] || null; };

      return res.status(200).json({
        assignment: (Array.isArray(assignRes.data) ? assignRes.data : [])[0] || null,
        cv: pick(cvRes, 'data'),
        cv_updated: pick(cvRes, 'updated_at'),
        progress: pick(progressRes, 'progress'),
        tasks: Array.isArray(tasksRes.data) ? tasksRes.data : [],
        matchedCvs: pick(matchRes, 'data'),
      });
    }

    // ── Uppgifter: tilldela ──
    if (action === 'assign_task') {
      const task = {
        user_id: targetUserId,
        assigned_by: filters?.adminId || null,
        title: title,
        description: description || '',
        category: category || 'övrigt',
        type: durationMinutes ? 'timed' : (tParams?.verify_field ? 'auto' : 'manual'),
        verify_field: tParams?.verify_field || null,
        verify_operator: tParams?.verify_operator || '>=',
        verify_target: tParams?.verify_target || null,
        deadline: deadline || null,
        duration_minutes: durationMinutes || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/tasks`,
        { method: 'POST', headers: { ...serviceHeaders(), 'Prefer': 'return=representation' } },
        task
      );

      // Logga
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/admin_activity_log`,
        { method: 'POST', headers: { ...serviceHeaders(), 'Prefer': 'return=minimal' } },
        { user_id: targetUserId, admin_id: filters?.adminId, action: 'task_assigned', detail: title }
      );

      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(201).json({ task: rows[0] || null, message: 'Uppgift tilldelad' });
    }

    // ── Uppgifter: lista för deltagare ──
    if (action === 'my_tasks') {
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/tasks?user_id=eq.${userId}&select=*,admins(name)&order=status.asc,deadline.asc.nullslast`,
        { method: 'GET', headers: authHeaders(accessToken) }
      );
      return res.status(200).json({ data: Array.isArray(result.data) ? result.data : [] });
    }

    // ── Uppgifter: starta timer ──
    if (action === 'start_task_session') {
      // Uppdatera task-status
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}&user_id=eq.${userId}`,
        { method: 'PATCH', headers: authHeaders(accessToken) },
        { status: 'active', started_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      );

      // Skapa session
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/task_sessions`,
        { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'return=representation' } },
        { task_id: parseInt(taskId), user_id: userId, started_at: new Date().toISOString() }
      );

      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(201).json({ session: rows[0] || null });
    }

    // ── Uppgifter: stoppa timer ──
    if (action === 'stop_task_session') {
      // Hämta aktiv session
      const sessRes = await makeRequest(
        `${SUPABASE_URL}/rest/v1/task_sessions?task_id=eq.${taskId}&user_id=eq.${userId}&ended_at=is.null&order=started_at.desc&limit=1`,
        { method: 'GET', headers: authHeaders(accessToken) }
      );
      const sessions = Array.isArray(sessRes.data) ? sessRes.data : [];
      if (!sessions.length) return res.status(400).json({ error: 'Ingen aktiv session' });

      const session = sessions[0];
      const startTime = new Date(session.started_at).getTime();
      const durationSec = Math.round((Date.now() - startTime) / 1000);

      // Avsluta session
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/task_sessions?id=eq.${session.id}`,
        { method: 'PATCH', headers: authHeaders(accessToken) },
        { ended_at: new Date().toISOString(), duration_sec: durationSec }
      );

      // Summera total tid för denna task
      const totalRes = await makeRequest(
        `${SUPABASE_URL}/rest/v1/task_sessions?task_id=eq.${taskId}&select=duration_sec`,
        { method: 'GET', headers: authHeaders(accessToken) }
      );
      const totalSec = (Array.isArray(totalRes.data) ? totalRes.data : [])
        .reduce((sum, s) => sum + (s.duration_sec || 0), 0);

      // Hämta task för att kolla target
      const taskRes = await makeRequest(
        `${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}&limit=1`,
        { method: 'GET', headers: authHeaders(accessToken) }
      );
      const task = (Array.isArray(taskRes.data) ? taskRes.data : [])[0];

      let completed = false;
      if (task?.verify_field === 'session_duration' && task?.verify_target) {
        completed = totalSec >= parseInt(task.verify_target);
      }

      // Uppdatera task
      const updates = { time_spent_sec: totalSec, updated_at: new Date().toISOString() };
      if (completed) { updates.status = 'completed'; updates.completed_at = new Date().toISOString(); }

      await makeRequest(
        `${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}`,
        { method: 'PATCH', headers: authHeaders(accessToken) },
        updates
      );

      return res.status(200).json({ duration_sec: durationSec, total_sec: totalSec, completed });
    }

    // ── Uppgifter: kvittera manuell ──
    if (action === 'complete_task') {
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}&user_id=eq.${userId}`,
        { method: 'PATCH', headers: authHeaders(accessToken) },
        { status: 'completed', completed_at: new Date().toISOString(), result_note: note || null, updated_at: new Date().toISOString() }
      );
      return res.status(200).json({ success: true });
    }

    // ── Uppgifter: avbryt (handläggare) ──
    if (action === 'cancel_task') {
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}`,
        { method: 'PATCH', headers: serviceHeaders() },
        { status: 'cancelled', updated_at: new Date().toISOString() }
      );
      return res.status(200).json({ success: true });
    }

    // ── Admin: bjud in handläggare ──
    if (action === 'admin_invite') {
      const existing = await makeRequest(
        `${SUPABASE_URL}/rest/v1/admins?email=eq.${encodeURIComponent(email)}&limit=1`,
        { method: 'GET', headers: serviceHeaders() }
      );
      if (Array.isArray(existing.data) && existing.data.length) {
        return res.status(409).json({ error: 'E-postadressen finns redan' });
      }

      const crypto = await import('crypto');
      const inviteToken = crypto.randomBytes(32).toString('hex');

      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/admins`,
        { method: 'POST', headers: { ...serviceHeaders(), 'Prefer': 'return=representation' } },
        {
          name: personName || email.split('@')[0],
          email: email.toLowerCase(),
          role: role || 'handlaggare',
          kommun_id: kommunId || null,
          enhet_id: enhetId || null,
          invite_token: inviteToken,
          invite_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(201).json({ admin: rows[0] || null, invite_token: inviteToken });
    }

    // ── Admin: lista admins ──
    if (action === 'admin_list_admins') {
      let url = `${SUPABASE_URL}/rest/v1/admins?select=*,kommuner(name),enheter(name)&order=role.asc,name.asc`;
      if (filters?.kommun_id) url += `&kommun_id=eq.${filters.kommun_id}`;

      const result = await makeRequest(url, { method: 'GET', headers: serviceHeaders() });
      return res.status(200).json({ data: Array.isArray(result.data) ? result.data : [] });
    }

    // ── Admin: statistik ──
    if (action === 'admin_stats') {
      let taskUrl = `${SUPABASE_URL}/rest/v1/tasks?select=status,category,time_spent_sec,user_id`;
      let userUrl = `${SUPABASE_URL}/rest/v1/user_assignments?select=status,kommun_id,enhet_id`;

      if (filters?.kommun_id) {
        userUrl += `&kommun_id=eq.${filters.kommun_id}`;
      }
      if (filters?.enhet_id) {
        userUrl += `&enhet_id=eq.${filters.enhet_id}`;
      }

      const [taskRes, userRes] = await Promise.all([
        makeRequest(taskUrl, { method: 'GET', headers: serviceHeaders() }),
        makeRequest(userUrl, { method: 'GET', headers: serviceHeaders() }),
      ]);

      const tasks = Array.isArray(taskRes.data) ? taskRes.data : [];
      const users = Array.isArray(userRes.data) ? userRes.data : [];

      return res.status(200).json({
        users: {
          total: users.length,
          active: users.filter(u => u.status === 'active').length,
          recent: users.filter(u => u.status === 'recent').length,
          new_count: users.filter(u => u.status === 'new').length,
          inactive: users.filter(u => u.status === 'inactive').length,
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === 'completed').length,
          pending: tasks.filter(t => t.status === 'pending').length,
          active: tasks.filter(t => t.status === 'active').length,
          expired: tasks.filter(t => t.status === 'expired').length,
          total_time_sec: tasks.reduce((s, t) => s + (t.time_spent_sec || 0), 0),
        },
        byCategory: Object.entries(
          tasks.reduce((acc, t) => {
            if (!acc[t.category]) acc[t.category] = { total: 0, completed: 0 };
            acc[t.category].total++;
            if (t.status === 'completed') acc[t.category].completed++;
            return acc;
          }, {})
        ).map(([cat, data]) => ({ category: cat, ...data })),
      });
    }

    // ── Admin: hämta enheter ──
    if (action === 'admin_get_enheter') {
      let url = `${SUPABASE_URL}/rest/v1/enheter?select=*,kommuner(name)&order=name`;
      if (filters?.kommun_id) url += `&kommun_id=eq.${filters.kommun_id}`;

      const result = await makeRequest(url, { method: 'GET', headers: serviceHeaders() });
      return res.status(200).json({ data: Array.isArray(result.data) ? result.data : [] });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('Supabase API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
