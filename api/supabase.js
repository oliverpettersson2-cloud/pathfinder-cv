import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const { action, email, token, accessToken, userId, cvData, table, data,
    adminEmail, taskId, params: tParams,
    title, description, category, deadline, durationMinutes, note,
    targetUserId, role, kommunId, enhetId, name: personName,
    filters, phone: personPhone
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
          try { resolve({ status: response.statusCode, data: JSON.parse(data) }); }
          catch(e) { resolve({ status: response.statusCode, data: { raw: data } }); }
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
  function authHeaders(t) { return { ...baseHeaders, 'Authorization': `Bearer ${t}` }; }
  function serviceHeaders() {
    const key = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
    return { ...baseHeaders, 'apikey': key, 'Authorization': `Bearer ${key}` };
  }

  try {

    if (action === 'send_otp') {
      const result = await makeRequest(`${SUPABASE_URL}/auth/v1/otp`, { method: 'POST', headers: baseHeaders }, { email, options: { shouldCreateUser: true } });
      if (result.status >= 400) return res.status(result.status).json({ error: result.data.error_description || result.data.msg || result.data.message || JSON.stringify(result.data) });
      return res.status(200).json({ success: true });
    }

    if (action === 'verify_otp') {
      const result = await makeRequest(`${SUPABASE_URL}/auth/v1/verify`, { method: 'POST', headers: baseHeaders }, { email, token, type: 'email' });
      if (result.status >= 400) return res.status(result.status).json({ error: result.data.error_description || result.data.msg || result.data.message || 'Felaktig eller utgången kod' });
      return res.status(200).json({ access_token: result.data.access_token, user: result.data.user });
    }

    if (action === 'get_user') {
      const result = await makeRequest(`${SUPABASE_URL}/auth/v1/user`, { method: 'GET', headers: authHeaders(accessToken) });
      return res.status(200).json(result.data);
    }

    if (action === 'save_cv') {
      await makeRequest(`${SUPABASE_URL}/rest/v1/cvs`, { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'resolution=merge-duplicates' } }, { user_id: userId, data: cvData, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    }

    if (action === 'load_cv') {
      const result = await makeRequest(`${SUPABASE_URL}/rest/v1/cvs?user_id=eq.${userId}&select=data&limit=1`, { method: 'GET', headers: authHeaders(accessToken) });
      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(200).json({ cv: rows[0]?.data || null });
    }

    if (action === 'save_table') {
      const ALLOWED = ['saved_cvs', 'matched_cvs', 'saved_edu', 'job_diary'];
      if (!ALLOWED.includes(table)) return res.status(400).json({ error: 'Invalid table: ' + table });
      await makeRequest(`${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}`, { method: 'DELETE', headers: authHeaders(accessToken) });
      await makeRequest(`${SUPABASE_URL}/rest/v1/${table}`, { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'return=minimal' } }, { user_id: userId, data: data, saved_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    }

    if (action === 'save_progress') {
      await makeRequest(`${SUPABASE_URL}/rest/v1/ovning_progress`, { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'resolution=merge-duplicates' } }, { user_id: userId, progress: data, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    }

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
      return res.status(200).json({ cv: pick(cvRes, 'data'), savedCvs: pick(savedRes, 'data'), matchedCvs: pick(matchedRes, 'data'), progress: pick(progressRes, 'progress'), savedEdu: pick(eduRes, 'data'), jobDiary: pick(diaryRes, 'data') });
    }

    if (action === 'check_onboarding') {
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/user_assignments?user_id=eq.${userId}&select=name&limit=1`,
        { method: 'GET', headers: serviceHeaders() }
      );
      const rows = Array.isArray(result.data) ? result.data : [];
      const hasName = rows.length > 0 && rows[0].name && rows[0].name.trim() !== '';
      return res.status(200).json({ hasName });
    }

    if (action === 'ensure_participant') {
      // FIX: Bara kolumner som faktiskt finns i user_assignments (ingen email/updated_at)
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/user_assignments`,
        { method: 'POST', headers: { ...serviceHeaders(), 'Prefer': 'resolution=ignore-duplicates,return=minimal' } },
        { user_id: userId, name: personName || null, phone: personPhone || null, status: 'active', created_at: new Date().toISOString() }
      );
      if (personName) {
        await makeRequest(
          `${SUPABASE_URL}/rest/v1/user_assignments?user_id=eq.${userId}`,
          { method: 'PATCH', headers: serviceHeaders() },
          { name: personName, phone: personPhone || null }
        );
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'admin_login') {
      const result = await makeRequest(`${SUPABASE_URL}/rest/v1/admins?email=eq.${encodeURIComponent(adminEmail || email)}&select=*,kommuner(name),enheter(name)&limit=1`, { method: 'GET', headers: serviceHeaders() });
      const rows = Array.isArray(result.data) ? result.data : [];
      if (!rows.length) return res.status(404).json({ error: 'Ej inbjuden till CVmatchen' });
      await makeRequest(`${SUPABASE_URL}/rest/v1/admins?id=eq.${rows[0].id}`, { method: 'PATCH', headers: serviceHeaders() }, { last_login: new Date().toISOString() });
      return res.status(200).json({ admin: rows[0] });
    }

    if (action === 'admin_list_users') {
      // FIX: Sorterar på created_at — updated_at finns ej i user_assignments
      let url = `${SUPABASE_URL}/rest/v1/user_assignments?select=*&order=created_at.desc`;
      if (filters?.enhet_id) url += `&enhet_id=eq.${filters.enhet_id}`;
      if (filters?.kommun_id) url += `&kommun_id=eq.${filters.kommun_id}`;
      if (filters?.status) url += `&status=eq.${filters.status}`;
      if (filters?.limit) url += `&limit=${filters.limit}`;
      if (filters?.offset) url += `&offset=${filters.offset}`;
      const result = await makeRequest(url, { method: 'GET', headers: serviceHeaders() });
      const users = Array.isArray(result.data) ? result.data : [];
      const userIds = users.map(u => u.user_id).filter(Boolean);
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

    if (action === 'admin_get_user') {
      const uid = targetUserId || userId;
      const [assignRes, cvRes, progressRes, tasksRes, matchRes] = await Promise.all([
        makeRequest(`${SUPABASE_URL}/rest/v1/user_assignments?user_id=eq.${uid}&select=*&limit=1`, { method: 'GET', headers: serviceHeaders() }),
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
        matchedCvs: pick(matchRes, 'data')
      });
    }

    if (action === 'assign_task') {
      const task = {
        user_id: targetUserId,
        assigned_by: filters?.adminId || null,
        title, description: description || '',
        category: category || 'övrigt',
        type: durationMinutes ? 'timed' : (tParams?.verify_field ? 'auto' : 'manual'),
        verify_field: tParams?.verify_field || null,
        verify_operator: tParams?.verify_operator || '>=',
        verify_target: tParams?.verify_target || null,
        deadline: deadline || null,
        duration_minutes: durationMinutes || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const result = await makeRequest(`${SUPABASE_URL}/rest/v1/tasks`, { method: 'POST', headers: { ...serviceHeaders(), 'Prefer': 'return=representation' } }, task);
      await makeRequest(`${SUPABASE_URL}/rest/v1/admin_activity_log`, { method: 'POST', headers: { ...serviceHeaders(), 'Prefer': 'return=minimal' } }, { user_id: targetUserId, admin_id: filters?.adminId, action: 'task_assigned', detail: title });
      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(201).json({ task: rows[0] || null, message: 'Uppgift tilldelad' });
    }

    if (action === 'my_tasks') {
      const result = await makeRequest(`${SUPABASE_URL}/rest/v1/tasks?user_id=eq.${userId}&select=*&order=status.asc,deadline.asc.nullslast`, { method: 'GET', headers: authHeaders(accessToken) });
      return res.status(200).json({ data: Array.isArray(result.data) ? result.data : [] });
    }

    if (action === 'start_task_session') {
      await makeRequest(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}&user_id=eq.${userId}`, { method: 'PATCH', headers: authHeaders(accessToken) }, { status: 'active', started_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      const result = await makeRequest(`${SUPABASE_URL}/rest/v1/task_sessions`, { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'return=representation' } }, { task_id: parseInt(taskId), user_id: userId, started_at: new Date().toISOString() });
      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(201).json({ session: rows[0] || null });
    }

    if (action === 'stop_task_session') {
      const sessRes = await makeRequest(`${SUPABASE_URL}/rest/v1/task_sessions?task_id=eq.${taskId}&user_id=eq.${userId}&ended_at=is.null&order=started_at.desc&limit=1`, { method: 'GET', headers: authHeaders(accessToken) });
      const sessions = Array.isArray(sessRes.data) ? sessRes.data : [];
      if (!sessions.length) return res.status(400).json({ error: 'Ingen aktiv session' });
      const session = sessions[0];
      const durationSec = Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000);
      await makeRequest(`${SUPABASE_URL}/rest/v1/task_sessions?id=eq.${session.id}`, { method: 'PATCH', headers: authHeaders(accessToken) }, { ended_at: new Date().toISOString(), duration_sec: durationSec });
      const totalRes = await makeRequest(`${SUPABASE_URL}/rest/v1/task_sessions?task_id=eq.${taskId}&select=duration_sec`, { method: 'GET', headers: authHeaders(accessToken) });
      const totalSec = (Array.isArray(totalRes.data) ? totalRes.data : []).reduce((sum, s) => sum + (s.duration_sec || 0), 0);
      const taskRes = await makeRequest(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}&limit=1`, { method: 'GET', headers: authHeaders(accessToken) });
      const task = (Array.isArray(taskRes.data) ? taskRes.data : [])[0];
      let completed = false;
      if (task?.verify_field === 'session_duration' && task?.verify_target) completed = totalSec >= parseInt(task.verify_target);
      const updates = { time_spent_sec: totalSec, updated_at: new Date().toISOString() };
      if (completed) { updates.status = 'completed'; updates.completed_at = new Date().toISOString(); }
      await makeRequest(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}`, { method: 'PATCH', headers: authHeaders(accessToken) }, updates);
      return res.status(200).json({ duration_sec: durationSec, total_sec: totalSec, completed });
    }

    if (action === 'complete_task') {
      await makeRequest(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}&user_id=eq.${userId}`, { method: 'PATCH', headers: authHeaders(accessToken) }, { status: 'completed', completed_at: new Date().toISOString(), result_note: note || null, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    }

    if (action === 'cancel_task') {
      await makeRequest(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}`, { method: 'PATCH', headers: serviceHeaders() }, { status: 'cancelled', updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    }

    if (action === 'admin_invite') {
      const existing = await makeRequest(`${SUPABASE_URL}/rest/v1/admins?email=eq.${encodeURIComponent(email)}&limit=1`, { method: 'GET', headers: serviceHeaders() });
      if (Array.isArray(existing.data) && existing.data.length) return res.status(409).json({ error: 'E-postadressen finns redan' });
      const crypto = await import('crypto');
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const result = await makeRequest(`${SUPABASE_URL}/rest/v1/admins`, { method: 'POST', headers: { ...serviceHeaders(), 'Prefer': 'return=representation' } }, { name: personName || email.split('@')[0], email: email.toLowerCase(), role: role || 'handlaggare', kommun_id: kommunId || null, enhet_id: enhetId || null, invite_token: inviteToken, invite_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(201).json({ admin: rows[0] || null, invite_token: inviteToken });
    }

    if (action === 'admin_list_admins') {
      let url = `${SUPABASE_URL}/rest/v1/admins?select=*,kommuner(name),enheter(name)&order=role.asc,name.asc`;
      if (filters?.kommun_id) url += `&kommun_id=eq.${filters.kommun_id}`;
      const result = await makeRequest(url, { method: 'GET', headers: serviceHeaders() });
      return res.status(200).json({ data: Array.isArray(result.data) ? result.data : [] });
    }

    if (action === 'admin_stats') {
      let taskUrl = `${SUPABASE_URL}/rest/v1/tasks?select=status,category,time_spent_sec,user_id`;
      let userUrl = `${SUPABASE_URL}/rest/v1/user_assignments?select=status,kommun_id,enhet_id`;
      if (filters?.kommun_id) userUrl += `&kommun_id=eq.${filters.kommun_id}`;
      if (filters?.enhet_id)  userUrl += `&enhet_id=eq.${filters.enhet_id}`;
      const [taskRes, userRes] = await Promise.all([
        makeRequest(taskUrl, { method: 'GET', headers: serviceHeaders() }),
        makeRequest(userUrl, { method: 'GET', headers: serviceHeaders() })
      ]);
      const tasks = Array.isArray(taskRes.data) ? taskRes.data : [];
      const users = Array.isArray(userRes.data) ? userRes.data : [];
      return res.status(200).json({
        users: { total: users.length, active: users.filter(u => u.status === 'active').length, recent: users.filter(u => u.status === 'recent').length, new_count: users.filter(u => u.status === 'new').length, inactive: users.filter(u => u.status === 'inactive').length },
        tasks: { total: tasks.length, completed: tasks.filter(t => t.status === 'completed').length, pending: tasks.filter(t => t.status === 'pending').length, active: tasks.filter(t => t.status === 'active').length, expired: tasks.filter(t => t.status === 'expired').length, total_time_sec: tasks.reduce((s, t) => s + (t.time_spent_sec || 0), 0) },
        byCategory: Object.entries(tasks.reduce((acc, t) => { if (!acc[t.category]) acc[t.category] = { total: 0, completed: 0 }; acc[t.category].total++; if (t.status === 'completed') acc[t.category].completed++; return acc; }, {})).map(([cat, data]) => ({ category: cat, ...data })),
      });
    }

    if (action === 'admin_get_enheter') {
      let url = `${SUPABASE_URL}/rest/v1/enheter?select=*,kommuner(name)&order=name`;
      if (filters?.kommun_id) url += `&kommun_id=eq.${filters.kommun_id}`;
      const result = await makeRequest(url, { method: 'GET', headers: serviceHeaders() });
      return res.status(200).json({ data: Array.isArray(result.data) ? result.data : [] });
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERVJUTRÄNING — Actions för AI-intervju-modulen
    // ═══════════════════════════════════════════════════════════════

    if (action === 'create_interview_session') {
      // Skapa ny intervjusession
      // Förväntar: accessToken, userId, branch, company?, roleTitle?, difficulty?, jobMatchId?
      const { branch, company, roleTitle, difficulty, jobMatchId } = req.body || {};
      if (!branch) return res.status(400).json({ error: 'branch krävs' });
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/interview_sessions`,
        { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'return=representation' } },
        {
          user_id: userId,
          branch: branch,
          company: company || null,
          role_title: roleTitle || null,
          difficulty: difficulty || 'medium',
          job_match_id: jobMatchId || null
        }
      );
      if (result.status >= 400) return res.status(result.status).json({ error: result.data.message || 'Kunde inte skapa session' });
      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(201).json({ session: rows[0] || null });
    }

    if (action === 'add_interview_message') {
      // Lägg till meddelande i intervju
      // Förväntar: accessToken, sessionId, role ('interviewer'|'candidate'), content
      const { sessionId, role: msgRole, content } = req.body || {};
      if (!sessionId || !msgRole || !content) return res.status(400).json({ error: 'sessionId, role, content krävs' });
      if (msgRole !== 'interviewer' && msgRole !== 'candidate') return res.status(400).json({ error: 'role måste vara interviewer eller candidate' });
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/interview_messages`,
        { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'return=representation' } },
        {
          session_id: sessionId,
          role: msgRole,
          content: content
        }
      );
      if (result.status >= 400) return res.status(result.status).json({ error: result.data.message || 'Kunde inte spara meddelande' });
      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(201).json({ message: rows[0] || null });
    }

    if (action === 'complete_interview_session') {
      // Avsluta session och spara feedback
      // Förväntar: accessToken, sessionId, durationSeconds?, overallFeedback?, userRating?, userNotes?, status?
      const { sessionId, durationSeconds, overallFeedback, userRating, userNotes, status: sessStatus } = req.body || {};
      if (!sessionId) return res.status(400).json({ error: 'sessionId krävs' });
      const updates = {
        status: sessStatus || 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds || null,
        overall_feedback: overallFeedback || null,
        user_rating: userRating || null,
        user_notes: userNotes || null
      };
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/interview_sessions?id=eq.${sessionId}&user_id=eq.${userId}`,
        { method: 'PATCH', headers: { ...authHeaders(accessToken), 'Prefer': 'return=minimal' } },
        updates
      );
      return res.status(200).json({ success: true });
    }

    if (action === 'save_interview_question') {
      // Spara en fråga att öva vidare på
      // Förväntar: accessToken, userId, sessionId?, messageId?, questionText, userAnswer?, difficulty?, category?
      const { sessionId, messageId, questionText, userAnswer, difficulty: qDiff, category: qCat } = req.body || {};
      if (!questionText) return res.status(400).json({ error: 'questionText krävs' });
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/saved_questions`,
        { method: 'POST', headers: { ...authHeaders(accessToken), 'Prefer': 'return=representation' } },
        {
          user_id: userId,
          session_id: sessionId || null,
          message_id: messageId || null,
          question_text: questionText,
          user_answer: userAnswer || null,
          category: qCat || null,
          difficulty: qDiff || null
        }
      );
      if (result.status >= 400) return res.status(result.status).json({ error: result.data.message || 'Kunde inte spara fråga' });
      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(201).json({ savedQuestion: rows[0] || null });
    }

    if (action === 'list_interview_sessions') {
      // Hämta intervjuhistorik för användaren
      // Förväntar: accessToken, userId, limit?
      const listLimit = (req.body && req.body.limit) || 20;
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/interview_sessions?user_id=eq.${userId}&select=*&order=started_at.desc&limit=${listLimit}`,
        { method: 'GET', headers: authHeaders(accessToken) }
      );
      return res.status(200).json({ sessions: Array.isArray(result.data) ? result.data : [] });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('Supabase API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
