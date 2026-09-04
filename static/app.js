document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Sidebar & Views
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const historyList = document.getElementById('history-list');
    const clearAllHistoryBtn = document.getElementById('clear-all-history-btn');
    const activeChatTitle = document.getElementById('active-chat-title');
    const sidebarLocationName = document.getElementById('sidebar-location-name');
    const sidebarLocationId = document.getElementById('sidebar-location-id');
    const sidebarConnectGhlBtn = document.getElementById('sidebar-connect-ghl');

    // ==================== AUTHENTICATION & LOGIN SYSTEM ====================
    const loginOverlay = document.getElementById('login-modal-overlay');
    const loginForm = document.getElementById('login-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const loginErrorBanner = document.getElementById('login-error-banner');
    const loginErrorText = document.getElementById('login-error-text');
    const togglePwdBtn = document.getElementById('toggle-pwd-btn');
    const userDisplayName = document.getElementById('user-display-name');
    const userDisplayRole = document.getElementById('user-display-role');
    const userAvatarBadge = document.getElementById('user-avatar-badge');
    const logoutBtn = document.getElementById('logout-btn');

    function checkAuthSession() {
        const savedUserStr = localStorage.getItem('copilot_auth_user');
        const savedToken = localStorage.getItem('copilot_auth_token');

        if (!savedUserStr || !savedToken) {
            showLoginModal();
            return false;
        }

        try {
            const user = JSON.parse(savedUserStr);
            renderLoggedInUser(user);
            hideLoginModal();
            return true;
        } catch (e) {
            showLoginModal();
            return false;
        }
    }

    function showLoginModal() {
        if (loginOverlay) {
            loginOverlay.style.display = 'flex';
            if (loginEmailInput) loginEmailInput.focus();
        }
    }

    function hideLoginModal() {
        if (loginOverlay) {
            loginOverlay.style.display = 'none';
        }
        if (loginErrorBanner) {
            loginErrorBanner.style.display = 'none';
        }
    }

    function renderLoggedInUser(user) {
        if (userDisplayName) userDisplayName.textContent = user.name || user.email;
        if (userDisplayRole) userDisplayRole.textContent = user.role || 'Member';
        if (userAvatarBadge) userAvatarBadge.textContent = user.avatar || '👤';

        // Reveal Admin Management gear icon only for Master Admin
        const adminUsersBtn = document.getElementById('admin-users-btn');
        if (adminUsersBtn) {
            if (user.role === 'Master Admin' || user.email === 'muhammad.okasha2146@gmail.com') {
                adminUsersBtn.style.display = 'inline-flex';
            } else {
                adminUsersBtn.style.display = 'none';
            }
        }
    }

    // ==================== MASTER ADMIN USERS & PASSWORD CONTROLLER ====================
    const adminModalOverlay = document.getElementById('admin-modal-overlay');
    const adminUsersBtn = document.getElementById('admin-users-btn');
    const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
    const adminDoneBtn = document.getElementById('admin-done-btn');
    const adminUsersTableContainer = document.getElementById('admin-users-table-container');
    const adminFeedbackBanner = document.getElementById('admin-feedback-banner');
    const adminEditTargetEmail = document.getElementById('admin-edit-target-email');
    const adminEditPasswordInput = document.getElementById('admin-edit-password');
    const adminEditNameInput = document.getElementById('admin-edit-name');
    const adminSaveEditBtn = document.getElementById('admin-save-edit-btn');
    const adminCancelEditBtn = document.getElementById('admin-cancel-edit-btn');

    let currentEditingEmail = '';

    async function loadAdminUsersList() {
        if (!adminUsersTableContainer) return;
        adminUsersTableContainer.innerHTML = '<div style="padding:16px; text-align:center; color:#94a3b8; font-size:13px;">Loading users...</div>';
        const token = localStorage.getItem('copilot_auth_token');

        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok && data.success) {
                renderAdminUsersTable(data.users);
            } else {
                adminUsersTableContainer.innerHTML = `<div style="padding:16px; text-align:center; color:#f87171; font-size:13px;">${data.detail || 'Failed to load users.'}</div>`;
            }
        } catch (err) {
            adminUsersTableContainer.innerHTML = `<div style="padding:16px; text-align:center; color:#f87171; font-size:13px;">Network error loading users.</div>`;
        }
    }

    function renderAdminUsersTable(users) {
        if (!adminUsersTableContainer) return;
        if (!users || users.length === 0) {
            adminUsersTableContainer.innerHTML = '<div style="padding:16px; text-align:center; color:#94a3b8; font-size:13px;">No users found.</div>';
            return;
        }

        let html = '<table style="width:100%; border-collapse:collapse; font-size:12.5px; text-align:left;">';
        html += '<thead style="background:#0f172a; border-bottom:1px solid rgba(255,255,255,0.1); color:#94a3b8; text-transform:uppercase; font-size:11px;"><tr><th style="padding:10px 12px;">User</th><th style="padding:10px 12px;">Role</th><th style="padding:10px 12px;">Password</th><th style="padding:10px 12px; text-align:right;">Actions</th></tr></thead><tbody>';

        users.forEach(u => {
            html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.06); transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                <td style="padding:10px 12px;">
                    <div style="font-weight:600; color:#ffffff;">${u.avatar || '👤'} ${u.name || 'User'}</div>
                    <div style="font-size:11.5px; color:#94a3b8;">${u.email}</div>
                </td>
                <td style="padding:10px 12px;">
                    <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; background:${u.role === 'Master Admin' ? 'rgba(234,179,8,0.15); color:#facc15;' : 'rgba(59,130,246,0.15); color:#60a5fa;'}">${u.role}</span>
                </td>
                <td style="padding:10px 12px; font-family:monospace; color:#10b981; font-weight:600;">
                    ${u.password || '••••••••'}
                </td>
                <td style="padding:10px 12px; text-align:right;">
                    <button type="button" class="admin-select-edit-btn" data-email="${u.email}" data-name="${u.name}" data-pwd="${u.password}" style="padding:4px 10px; background:#334155; border:none; border-radius:6px; color:#f8fafc; font-size:11.5px; font-weight:500; cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='#10b981'" onmouseout="this.style.background='#334155'">Edit / Change Pwd</button>
                </td>
            </tr>`;
        });

        html += '</tbody></table>';
        adminUsersTableContainer.innerHTML = html;

        // Bind Edit buttons
        adminUsersTableContainer.querySelectorAll('.admin-select-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.currentTarget;
                currentEditingEmail = targetBtn.dataset.email;
                if (adminEditTargetEmail) adminEditTargetEmail.textContent = currentEditingEmail;
                if (adminEditNameInput) adminEditNameInput.value = targetBtn.dataset.name || '';
                if (adminEditPasswordInput) {
                    adminEditPasswordInput.value = targetBtn.dataset.pwd || '';
                    adminEditPasswordInput.focus();
                }
            });
        });
    }

    if (adminUsersBtn) {
        adminUsersBtn.addEventListener('click', () => {
            if (adminModalOverlay) {
                adminModalOverlay.style.display = 'flex';
                loadAdminUsersList();
            }
        });
    }

    function closeAdminModal() {
        if (adminModalOverlay) adminModalOverlay.style.display = 'none';
        if (adminFeedbackBanner) adminFeedbackBanner.style.display = 'none';
    }

    if (closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', closeAdminModal);
    if (adminDoneBtn) adminDoneBtn.addEventListener('click', closeAdminModal);

    if (adminCancelEditBtn) {
        adminCancelEditBtn.addEventListener('click', () => {
            currentEditingEmail = '';
            if (adminEditTargetEmail) adminEditTargetEmail.textContent = 'None';
            if (adminEditPasswordInput) adminEditPasswordInput.value = '';
            if (adminEditNameInput) adminEditNameInput.value = '';
        });
    }

    if (adminSaveEditBtn) {
        adminSaveEditBtn.addEventListener('click', async () => {
            if (!currentEditingEmail) {
                alert('Please select a user from the table above by clicking "Edit / Change Pwd".');
                return;
            }

            const newPwd = (adminEditPasswordInput.value || '').trim();
            const newName = (adminEditNameInput.value || '').trim();
            const token = localStorage.getItem('copilot_auth_token');

            adminSaveEditBtn.disabled = true;
            adminSaveEditBtn.textContent = 'Saving...';

            try {
                const res = await fetch('/api/admin/update-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email: currentEditingEmail,
                        new_password: newPwd,
                        name: newName
                    })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    if (adminFeedbackBanner) {
                        adminFeedbackBanner.style.display = 'block';
                        adminFeedbackBanner.style.background = 'rgba(16, 185, 129, 0.15)';
                        adminFeedbackBanner.style.border = '1px solid rgba(16, 185, 129, 0.4)';
                        adminFeedbackBanner.style.color = '#34d399';
                        adminFeedbackBanner.textContent = `Password and details for ${currentEditingEmail} updated successfully!`;
                        setTimeout(() => { if (adminFeedbackBanner) adminFeedbackBanner.style.display = 'none'; }, 4000);
                    }
                    loadAdminUsersList();
                } else {
                    alert(data.detail || 'Failed to update user.');
                }
            } catch (err) {
                alert('Network error while updating user.');
            } finally {
                adminSaveEditBtn.disabled = false;
                adminSaveEditBtn.textContent = 'Save Changes';
            }
        });
    }

    if (togglePwdBtn && loginPasswordInput) {
        togglePwdBtn.addEventListener('click', () => {
            const isPwd = loginPasswordInput.getAttribute('type') === 'password';
            loginPasswordInput.setAttribute('type', isPwd ? 'text' : 'password');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = (loginEmailInput.value || '').trim();
            const password = (loginPasswordInput.value || '').trim();

            if (!email || !password) {
                if (loginErrorText) loginErrorText.textContent = 'Please enter both email and password.';
                if (loginErrorBanner) loginErrorBanner.style.display = 'flex';
                return;
            }

            if (loginSubmitBtn) {
                loginSubmitBtn.disabled = true;
                loginSubmitBtn.innerHTML = '<span>Verifying...</span>';
            }
            if (loginErrorBanner) loginErrorBanner.style.display = 'none';

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    localStorage.setItem('copilot_auth_token', data.token);
                    localStorage.setItem('copilot_auth_user', JSON.stringify(data.user));
                    renderLoggedInUser(data.user);
                    hideLoginModal();
                } else {
                    const msg = data.detail || data.message || 'Invalid email or password.';
                    if (loginErrorText) loginErrorText.textContent = msg;
                    if (loginErrorBanner) loginErrorBanner.style.display = 'flex';
                }
            } catch (err) {
                if (loginErrorText) loginErrorText.textContent = 'Network error. Could not connect to server.';
                if (loginErrorBanner) loginErrorBanner.style.display = 'flex';
            } finally {
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.innerHTML = '<span>Sign In to Copilot</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to log out of Conversation AI Copilot?')) {
                const token = localStorage.getItem('copilot_auth_token');
                try {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                } catch (e) {}
                localStorage.removeItem('copilot_auth_token');
                localStorage.removeItem('copilot_auth_user');
                showLoginModal();
            }
        });
    }

    // Check login state immediately on boot
    checkAuthSession();

    // Sidebar Toggle & Overlay Logic
    function toggleSidebar() {
        if (!sidebar) return;
        if (sidebar.classList.contains('closed')) {
            openSidebar();
        } else {
            closeSidebar();
        }
    }

    function openSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('closed');
        if (sidebarOverlay) {
            if (window.innerWidth <= 768) {
                sidebarOverlay.classList.add('active');
                sidebarOverlay.classList.remove('hidden');
            }
        }
        localStorage.setItem('sidebar_closed', 'false');
    }

    function closeSidebar() {
        if (!sidebar) return;
        sidebar.classList.add('closed');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
            sidebarOverlay.classList.add('hidden');
        }
        localStorage.setItem('sidebar_closed', 'true');
    }

    if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', toggleSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);


    // DOM Elements - Usage Monitor Modal
    const usageModal = document.getElementById('usage-monitor-modal');
    const openUsageModalBtn = document.getElementById('open-usage-modal-btn');
    const sidebarUsageBtn = document.getElementById('sidebar-usage-btn');
    const closeUsageModalBtn = document.getElementById('close-usage-modal');
    const doneUsageModalBtn = document.getElementById('done-usage-modal');
    const usageModelsGrid = document.getElementById('usage-models-grid');
    const activeModelUsagePill = document.getElementById('active-model-usage-pill');

    // DOM Elements - GHL Connection Modal
    const ghlStatusPill = document.getElementById('ghl-status-pill');
    const ghlStatusLabel = document.getElementById('ghl-status-label');
    const openGhlModalBtn = document.getElementById('open-ghl-modal-btn');
    const ghlModal = document.getElementById('ghl-modal');
    const closeGhlModalBtn = document.getElementById('close-ghl-modal');
    const cancelGhlModalBtn = document.getElementById('cancel-ghl-modal');
    const saveGhlModalBtn = document.getElementById('save-ghl-modal');
    const ghlLocationIdInput = document.getElementById('ghl-location-id');
    const ghlAccessTokenInput = document.getElementById('ghl-access-token');
    const ghlModalError = document.getElementById('ghl-modal-error');
    const ghlModalSuccess = document.getElementById('ghl-modal-success');

    // DOM Elements - Chat & Actions
    const welcomeScreen = document.getElementById('welcome-screen');
    const messagesList = document.getElementById('messages-list');
    const chatContainer = document.getElementById('chat-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const modelSelector = document.getElementById('model-selector');
    const cardItems = document.querySelectorAll('.card-item');
    const chipBtns = document.querySelectorAll('.suggestion-chip');
    // DOM Elements - Prompt Queue & Generation Controls
    const stopGeneratingBtn = document.getElementById('stop-generating-btn');
    const promptQueueContainer = document.getElementById('prompt-queue-container');
    const queueStatusText = document.getElementById('queue-status-text');
    const queueCancelBtn = document.getElementById('queue-cancel-btn');

    // State Variables
    let isGenerating = false;
    let promptQueue = []; // [{ prompt: string, elementId: string }]
    let currentAbortController = null;

    function updateQueueUI() {
        if (!promptQueueContainer) return;
        if (promptQueue.length === 0) {
            promptQueueContainer.classList.add('hidden');
        } else {
            promptQueueContainer.classList.remove('hidden');
            if (queueStatusText) {
                queueStatusText.textContent = `${promptQueue.length} prompt${promptQueue.length > 1 ? 's' : ''} queued (Auto-executing next)`;
            }
        }
    }

    function clearPromptQueue() {
        if (promptQueue && promptQueue.length > 0) {
            promptQueue.forEach(item => {
                const el = document.getElementById(item.elementId);
                if (el) el.remove();
            });
        }
        promptQueue = [];
        updateQueueUI();
    }

    function updateSendButtonState() {
        if (!sendBtn) return;
        if (isGenerating) {
            sendBtn.disabled = false;
            sendBtn.classList.add('generating-stop-mode');
            sendBtn.title = 'Stop generating response (Esc)';
            sendBtn.setAttribute('aria-label', 'Stop generating');
            sendBtn.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="3.5"></rect>
                </svg>
            `;
        } else {
            sendBtn.classList.remove('generating-stop-mode');
            sendBtn.title = 'Send Prompt';
            sendBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            `;
            const hasText = (userInput && userInput.value.trim().length > 0);
            const hasAttachments = (typeof pendingAttachments !== 'undefined' && pendingAttachments.length > 0);
            sendBtn.disabled = !hasText && !hasAttachments;
        }
    }

    function abortCurrentGeneration() {
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
        }
        if (window._stopActiveStream) {
            window._stopActiveStream();
        }
        isGenerating = false;
        updateSendButtonState();
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
    }

    if (stopGeneratingBtn) stopGeneratingBtn.addEventListener('click', abortCurrentGeneration);
    if (queueCancelBtn) queueCancelBtn.addEventListener('click', clearPromptQueue);

    const sidebarProfileCard = document.getElementById('sidebar-profile-card');
    const sidebarConnectGhl = sidebarConnectGhlBtn;


    let ghlConfig = {
        locationId: localStorage.getItem('ghl_location_id') || '',
        accessToken: localStorage.getItem('ghl_access_token') || '',
        locationName: localStorage.getItem('ghl_location_name') || ''
    };

    function updateGhlUI() {
        const isConnected = !!(ghlConfig.locationId && ghlConfig.accessToken);
        if (ghlStatusPill) {
            ghlStatusPill.className = `ghl-status-pill ${isConnected ? 'connected' : 'disconnected'}`;
        }
        if (ghlStatusLabel) {
            ghlStatusLabel.textContent = isConnected ? 'Connected' : 'Disconnected';
        }
        if (openGhlModalBtn) {
            openGhlModalBtn.textContent = isConnected ? (ghlConfig.locationName || 'Settings') : 'Connect Location';
        }
        if (sidebarLocationName) {
            sidebarLocationName.textContent = isConnected ? (ghlConfig.locationName || 'Connected Sub-Account') : 'No Sub-Account';
        }
        if (sidebarLocationId) {
            sidebarLocationId.textContent = isConnected ? (ghlConfig.locationId.substring(0, 14) + '...') : 'Click to Connect';
        }
    }

    function openGhlModal() {
        if (!ghlModal) return;
        if (ghlLocationIdInput) ghlLocationIdInput.value = ghlConfig.locationId || '';
        if (ghlAccessTokenInput) ghlAccessTokenInput.value = ghlConfig.accessToken || '';
        if (ghlModalError) ghlModalError.classList.add('hidden');
        if (ghlModalSuccess) ghlModalSuccess.classList.add('hidden');
        ghlModal.classList.remove('hidden');
    }

    function closeGhlModal() {
        if (ghlModal) ghlModal.classList.add('hidden');
    }

    async function handleSaveGhlCredentials() {
        const locId = ghlLocationIdInput ? ghlLocationIdInput.value.trim() : '';
        const token = ghlAccessTokenInput ? ghlAccessTokenInput.value.trim() : '';

        if (!locId || !token) {
            if (ghlModalError) {
                ghlModalError.textContent = 'Please enter both Location ID and API Key / Access Token.';
                ghlModalError.classList.remove('hidden');
            }
            return;
        }

        if (saveGhlModalBtn) {
            saveGhlModalBtn.disabled = true;
            saveGhlModalBtn.textContent = 'Verifying...';
        }

        try {
            const res = await fetch('/api/ghl/verify-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_id: locId, access_token: token })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                ghlConfig.locationId = locId;
                ghlConfig.accessToken = token;
                ghlConfig.locationName = data.location_name || data.company_name || 'GHL Sub-Account';

                localStorage.setItem('ghl_location_id', ghlConfig.locationId);
                localStorage.setItem('ghl_access_token', ghlConfig.accessToken);
                localStorage.setItem('ghl_location_name', ghlConfig.locationName);

                if (ghlModalSuccess) {
                    ghlModalSuccess.textContent = `✓ Successfully connected to ${ghlConfig.locationName}!`;
                    ghlModalSuccess.classList.remove('hidden');
                }
                if (ghlModalError) ghlModalError.classList.add('hidden');

                updateGhlUI();
                setTimeout(closeGhlModal, 1200);
            } else {
                if (ghlModalError) {
                    ghlModalError.textContent = data.message || data.detail || 'Failed to verify GHL credentials. Please check token permissions.';
                    ghlModalError.classList.remove('hidden');
                }
                if (ghlModalSuccess) ghlModalSuccess.classList.add('hidden');
            }
        } catch (e) {
            if (ghlModalError) {
                ghlModalError.textContent = 'Network error verifying GHL connection: ' + e.message;
                ghlModalError.classList.remove('hidden');
            }
        } finally {
            if (saveGhlModalBtn) {
                saveGhlModalBtn.disabled = false;
                saveGhlModalBtn.textContent = 'Save & Connect';
            }
        }
    }

    if (openGhlModalBtn) openGhlModalBtn.addEventListener('click', openGhlModal);
    if (sidebarConnectGhl) sidebarConnectGhl.addEventListener('click', openGhlModal);
    if (sidebarProfileCard) sidebarProfileCard.addEventListener('click', openGhlModal);
    if (closeGhlModalBtn) closeGhlModalBtn.addEventListener('click', closeGhlModal);
    if (cancelGhlModalBtn) cancelGhlModalBtn.addEventListener('click', closeGhlModal);
    if (saveGhlModalBtn) saveGhlModalBtn.addEventListener('click', handleSaveGhlCredentials);

    // Initialize GHL UI state
    updateGhlUI();

    // =========================================================================
    // Multimodal Attachments & Web Speech API Voice Recognition
    // =========================================================================
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileAttachmentInput = document.getElementById('file-attachment-input');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const attachmentsPreview = document.getElementById('input-attachments-preview');

    let pendingAttachments = []; // [{ name, type, mime_type, data, size }]
    let speechRecognition = null;
    let isListeningVoice = false;

    function renderAttachmentPreviews() {
        if (!attachmentsPreview) return;
        if (pendingAttachments.length === 0) {
            attachmentsPreview.classList.add('hidden');
            attachmentsPreview.innerHTML = '';
            updateSendButtonState();
            return;
        }

        attachmentsPreview.classList.remove('hidden');
        attachmentsPreview.innerHTML = pendingAttachments.map((att, idx) => {
            const isImg = att.type === 'image' || (att.mime_type && att.mime_type.startsWith('image/'));
            const thumbHtml = isImg ?
                `<img src="${att.data}" class="att-thumb" alt="${escapeHtml(att.name)}">` :
                `<span class="att-icon">${getFileIcon(att.name)}</span>`;

            return `
                <div class="attachment-chip" data-idx="${idx}">
                    ${thumbHtml}
                    <span class="att-name" title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</span>
                    <button type="button" class="att-remove-btn" data-idx="${idx}" title="Remove file">✕</button>
                </div>
            `;
        }).join('');

        attachmentsPreview.querySelectorAll('.att-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-idx'), 10);
                pendingAttachments.splice(idx, 1);
                renderAttachmentPreviews();
            });
        });

        updateSendButtonState();
    }

    function getFileIcon(filename) {
        const ext = (filename.split('.').pop() || '').toLowerCase();
        if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return '🖼️';
        if (['pdf'].includes(ext)) return '📕';
        if (['csv', 'xlsx', 'xls'].includes(ext)) return '📊';
        if (['json', 'yaml', 'yml'].includes(ext)) return '⚙️';
        if (['html', 'htm'].includes(ext)) return '🌐';
        if (['css', 'scss'].includes(ext)) return '🎨';
        if (['js', 'ts', 'jsx', 'tsx', 'py'].includes(ext)) return '⚡';
        return '📄';
    }

    function handleFilesSelected(files) {
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const isImg = file.type.startsWith('image/');
            const reader = new FileReader();

            reader.onload = (e) => {
                const dataUrl = e.target.result;
                pendingAttachments.push({
                    name: file.name,
                    type: isImg ? 'image' : 'file',
                    mime_type: file.type || (isImg ? 'image/png' : 'text/plain'),
                    data: dataUrl,
                    size: file.size
                });
                renderAttachmentPreviews();
            };

            reader.readAsDataURL(file);
        });
    }

    if (attachFileBtn && fileAttachmentInput) {
        attachFileBtn.addEventListener('click', () => {
            fileAttachmentInput.click();
        });

        fileAttachmentInput.addEventListener('change', (e) => {
            handleFilesSelected(e.target.files);
            fileAttachmentInput.value = '';
        });
    }

    // Drag and drop onto input area
    const inputBoxWrapper = document.getElementById('input-box-wrapper');
    if (inputBoxWrapper) {
        inputBoxWrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            inputBoxWrapper.style.borderColor = 'var(--primary-color)';
        });
        inputBoxWrapper.addEventListener('dragleave', () => {
            inputBoxWrapper.style.borderColor = '';
        });
        inputBoxWrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            inputBoxWrapper.style.borderColor = '';
            if (e.dataTransfer && e.dataTransfer.files) {
                handleFilesSelected(e.dataTransfer.files);
            }
        });
    }

    // Paste images from clipboard (Ctrl + V)
    if (userInput) {
        userInput.addEventListener('paste', (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData)?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const blob = items[i].getAsFile();
                        if (blob) {
                            handleFilesSelected([blob]);
                        }
                    }
                }
            }
        });
    }

    // Web Speech API Voice Dictation
    function setupVoiceRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            if (voiceInputBtn) {
                voiceInputBtn.title = 'Speech-to-Text not supported in this browser (Use Chrome or Edge)';
                voiceInputBtn.style.opacity = '0.5';
            }
            return;
        }

        speechRecognition = new SpeechRec();
        speechRecognition.continuous = true;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'en-US';

        speechRecognition.onstart = () => {
            isListeningVoice = true;
            if (voiceInputBtn) {
                voiceInputBtn.classList.add('recording');
                voiceInputBtn.title = 'Listening... Click to stop voice dictation';
            }
        };

        speechRecognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (userInput && transcript) {
                const prev = userInput.value.trim();
                userInput.value = (prev ? prev + ' ' : '') + transcript;
                userInput.style.height = 'auto';
                userInput.style.height = Math.min(userInput.scrollHeight, 180) + 'px';
                updateSendButtonState();
            }
        };

        speechRecognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            stopVoiceRecognition();
        };

        speechRecognition.onend = () => {
            stopVoiceRecognition();
        };

        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => {
                if (isListeningVoice) {
                    speechRecognition.stop();
                } else {
                    try {
                        speechRecognition.start();
                    } catch (e) {
                        console.warn('Recognition already started:', e);
                    }
                }
            });
        }
    }

    function stopVoiceRecognition() {
        isListeningVoice = false;
        if (voiceInputBtn) {
            voiceInputBtn.classList.remove('recording');
            voiceInputBtn.title = 'Voice Dictation (Speech to Text)';
        }
    }

    setupVoiceRecognition();

    let chatThreads = loadSavedThreads();
    let currentThreadId = localStorage.getItem('ghl_active_thread_id') || null;
    let cachedModelsData = [];

    // Active artifacts storage for Claude-Style Side Drawer Code Studio
    window.activeArtifacts = {};

    function getArtifactMeta(lang, code) {
        const lowerCode = code.trim().toLowerCase();
        let cleanLang = (lang || 'text').toLowerCase().trim();

        // 1. Check if language identifier specifies a filename (e.g. ```html:dental_funnel.html or ```python filename=app.py)
        let explicitFilename = '';
        if (cleanLang.includes(':')) {
            const parts = cleanLang.split(':');
            cleanLang = parts[0].trim();
            explicitFilename = parts[1].trim();
        } else if (cleanLang.includes('=')) {
            const parts = cleanLang.split('=');
            cleanLang = parts[0].replace('filename', '').trim();
            explicitFilename = parts[1].replace(/['"]/g, '').trim();
        } else if (cleanLang.includes(' ')) {
            const parts = cleanLang.split(/\s+/);
            cleanLang = parts[0].trim();
            if (parts[1]) explicitFilename = parts[1].replace(/filename=/i, '').replace(/['"]/g, '').trim();
        }

        // 2. Check for inline filename comment: <!-- filename: dental_booking.html --> or # filename: ...
        const commentFileMatch = code.match(/(?:<!--|\/\*|#|\/\/)\s*(?:filename|file):\s*([a-zA-Z0-9_\-\.]+)\s*(?:-->|\*\/)?/i);
        if (commentFileMatch && commentFileMatch[1]) {
            explicitFilename = commentFileMatch[1].trim();
        }

        const isHtml = cleanLang === 'html' || lowerCode.includes('<!doctype') || lowerCode.includes('<html');
        let icon = '📄';
        let filename = '';

        if (isHtml) {
            cleanLang = 'html';
            icon = '🌐';

            if (explicitFilename && explicitFilename.endsWith('.html')) {
                filename = explicitFilename;
            } else {
                // Try extracting document <title>
                const titleMatch = code.match(/<title[^>]*>([^<]+)<\/title>/i);
                let titleText = titleMatch ? titleMatch[1].trim() : '';

                if (titleText && titleText.length > 2 && !['document', 'untitled', 'home', 'index'].includes(titleText.toLowerCase())) {
                    let slug = titleText.toLowerCase()
                        .replace(/[^\w\s-]/g, '')
                        .trim()
                        .replace(/[-\s]+/g, '_')
                        .substring(0, 32);
                    if (slug.endsWith('_')) slug = slug.slice(0, -1);
                    if (!slug.includes('funnel') && !slug.includes('page') && !slug.includes('portal') && !slug.includes('site')) {
                        slug += '_funnel';
                    }
                    filename = `${slug}.html`;
                } else {
                    // Try extracting main H1 or Brand name
                    const brandMatch = code.match(/class="[^"]*(?:brand|logo)[^"]*"[^>]*>([^<]+)</i);
                    const h1Match = code.match(/<h1[^>]*>([^<]+)<\/h1>/i);
                    let detectedName = (brandMatch ? brandMatch[1] : (h1Match ? h1Match[1] : '')).trim();

                    if (detectedName && detectedName.length > 2 && detectedName.length < 40) {
                        let slug = detectedName.toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .trim()
                            .replace(/[-\s]+/g, '_')
                            .substring(0, 28);
                        if (slug.endsWith('_')) slug = slug.slice(0, -1);
                        filename = `${slug}_funnel.html`;
                    } else {
                        // Detect niche from content
                        if (lowerCode.includes('dental') || lowerCode.includes('dentist') || lowerCode.includes('smile')) {
                            filename = 'dental_booking_funnel.html';
                        } else if (lowerCode.includes('gym') || lowerCode.includes('fitness') || lowerCode.includes('workout')) {
                            filename = 'fitness_gym_funnel.html';
                        } else if (lowerCode.includes('real estate') || lowerCode.includes('realtor') || lowerCode.includes('property')) {
                            filename = 'real_estate_funnel.html';
                        } else if (lowerCode.includes('ecommerce') || lowerCode.includes('checkout') || lowerCode.includes('cart') || lowerCode.includes('order')) {
                            filename = 'ecommerce_sales_funnel.html';
                        } else if (lowerCode.includes('webinar') || lowerCode.includes('masterclass')) {
                            filename = 'webinar_registration_funnel.html';
                        } else if (lowerCode.includes('coaching') || lowerCode.includes('consultant')) {
                            filename = 'coaching_lead_funnel.html';
                        } else if (lowerCode.includes('solar') || lowerCode.includes('roofing') || lowerCode.includes('plumb')) {
                            filename = 'contractor_lead_funnel.html';
                        } else if (lowerCode.includes('agency') || lowerCode.includes('marketing')) {
                            filename = 'agency_lead_funnel.html';
                        } else {
                            filename = 'custom_sales_funnel.html';
                        }
                    }
                }
            }
        } else if (cleanLang === 'css' || lowerCode.includes(':root {') || lowerCode.includes('body {')) {
            cleanLang = 'css';
            icon = '🎨';
            filename = explicitFilename || 'custom_funnel_styles.css';
        } else if (cleanLang === 'javascript' || cleanLang === 'js') {
            cleanLang = 'javascript';
            icon = '⚡';
            filename = explicitFilename || 'funnel_interactions.js';
        } else if (cleanLang === 'json') {
            cleanLang = 'json';
            icon = '⚙️';
            if (explicitFilename) {
                filename = explicitFilename;
            } else if (lowerCode.includes('pipeline') || lowerCode.includes('stages')) {
                filename = 'sales_pipeline_schema.json';
            } else if (lowerCode.includes('workflow') || lowerCode.includes('trigger')) {
                filename = 'ghl_workflow_automation.json';
            } else {
                filename = 'ghl_schema_config.json';
            }
        } else if (cleanLang === 'python' || cleanLang === 'py') {
            cleanLang = 'python';
            icon = '🐍';
            if (explicitFilename) {
                filename = explicitFilename;
            } else if (lowerCode.includes('webhook') || lowerCode.includes('fastapi') || lowerCode.includes('flask')) {
                filename = 'ghl_webhook_service.py';
            } else if (lowerCode.includes('contact')) {
                filename = 'ghl_contact_sync.py';
            } else {
                filename = 'ghl_automation.py';
            }
        } else {
            filename = explicitFilename || `code_snippet.${cleanLang || 'txt'}`;
        }

        const lines = code.trim().split('\n').length;
        return { filename, icon, lang: cleanLang, lines };
    }

    // Configure Custom Claude-Style Marked Renderer
    if (typeof marked !== 'undefined') {
        const renderer = new marked.Renderer();

        renderer.code = function (code, language) {
            const rawLang = (language || '').toLowerCase().trim();

            // Clean unclosed HTML leaks: If code contains <!DOCTYPE or <html, strip anything before it
            let cleanCode = code;
            let trailingMarkdown = '';
            if (rawLang === 'html' || cleanCode.includes('<html') || cleanCode.includes('<!DOCTYPE') || cleanCode.includes('<!doctype')) {
                const docIdx = cleanCode.search(/<!doctype\s+html|<html/i);
                if (docIdx > 0) {
                    cleanCode = cleanCode.substring(docIdx).trim();
                }
                // Strip any leaked model handover text or backtick markers
                cleanCode = cleanCode.replace(/[<>\s]*🔄\s*\*\*Model Handover:\*\*[\s\S]*?---\s*/gi, '').trim();
                cleanCode = cleanCode.replace(/^```(?:html)?\s*/i, '').trim();
            }

            if ((rawLang === 'html' || cleanCode.includes('<html') || cleanCode.includes('<!DOCTYPE') || cleanCode.includes('<!doctype')) && cleanCode.includes('</html>')) {
                const endIdx = cleanCode.indexOf('</html>') + 7;
                const rest = cleanCode.substring(endIdx).trim();
                cleanCode = cleanCode.substring(0, endIdx).trim();
                if (rest && rest.length > 5) {
                    trailingMarkdown = `<div class="agent-markdown-text" style="margin-top: 18px;">${safeMarkdown(rest)}</div>`;
                }
            }

            const meta = getArtifactMeta(rawLang, cleanCode);
            const artifactId = 'art_' + Math.random().toString(36).substring(2, 9);

            window.activeArtifacts[artifactId] = {
                id: artifactId,
                title: meta.filename,
                lang: meta.lang,
                icon: meta.icon,
                code: cleanCode
            };

            const validLang = (typeof hljs !== 'undefined' && hljs.getLanguage(meta.lang)) ? meta.lang : '';
            const highlightedCode = validLang ? hljs.highlight(cleanCode, { language: validLang }).value : escapeHtml(cleanCode);
            const displayLang = meta.lang.toUpperCase();

            // If it's a substantive code file (> 6 lines or html/css/js/json), render a Claude-style Artifact Card Widget!
            if (meta.lines >= 6 || ['html', 'css', 'javascript', 'json', 'python'].includes(meta.lang)) {
                return `
                    <div class="claude-artifact-card" data-artifact-id="${artifactId}">
                        <div class="artifact-card-left">
                            <div class="artifact-card-icon-box">${meta.icon}</div>
                            <div class="artifact-card-info">
                                <span class="artifact-card-title">${escapeHtml(meta.filename)}</span>
                                <span class="artifact-card-meta">
                                    <span class="meta-badge">${escapeHtml(displayLang)}</span>
                                    <span>${meta.lines} lines</span>
                                    <span>• Click to open Code Studio</span>
                                </span>
                            </div>
                        </div>
                        <div class="artifact-card-right">
                            <button type="button" class="open-artifact-btn" data-artifact-id="${artifactId}">
                                <span>Open Code</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </button>
                        </div>
                    </div>
                    <details class="inline-code-details">
                        <summary>View code inline (${meta.lines} lines)</summary>
                        <div class="code-block-wrapper">
                            <div class="code-block-header">
                                <span class="code-lang-tag">${escapeHtml(displayLang)}</span>
                                <button type="button" class="copy-code-btn" data-code="${escapeHtml(cleanCode)}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    <span>Copy code</span>
                                </button>
                            </div>
                            <pre><code class="hljs ${validLang}">${highlightedCode}</code></pre>
                        </div>
                    </details>
                    ${trailingMarkdown}
                `;
            }

            return `
                <div class="code-block-wrapper">
                    <div class="code-block-header">
                        <span class="code-lang-tag">${escapeHtml(displayLang)}</span>
                        <button type="button" class="copy-code-btn" data-code="${escapeHtml(cleanCode)}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            <span>Copy code</span>
                        </button>
                    </div>
                    <pre><code class="hljs ${validLang}">${highlightedCode}</code></pre>
                </div>
                ${trailingMarkdown}
            `;
        };

        marked.setOptions({
            renderer: renderer,
            breaks: true,
            gfm: true
        });
    }

    // DOM Elements - Artifact Drawer
    const artifactDrawer = document.getElementById('artifact-drawer');
    const artifactTitle = document.getElementById('artifact-title');
    const artifactLangBadge = document.getElementById('artifact-lang-badge');
    const artifactFileIcon = document.getElementById('artifact-file-icon');
    const artifactCodeDisplay = document.getElementById('artifact-code-display');
    const artifactPreviewIframe = document.getElementById('artifact-preview-iframe');
    const artifactCodeView = document.getElementById('artifact-code-view');
    const artifactPreviewView = document.getElementById('artifact-preview-view');
    const artifactTabCode = document.getElementById('artifact-tab-code');
    const artifactTabPreview = document.getElementById('artifact-tab-preview');
    const artifactTabsPill = document.getElementById('artifact-tabs-pill');
    const artifactCopyBtn = document.getElementById('artifact-copy-btn');
    const artifactDownloadBtn = document.getElementById('artifact-download-btn');
    const closeArtifactBtn = document.getElementById('close-artifact-btn');
    const mainContentArea = document.querySelector('.main-content');

    let currentOpenArtifact = null;

    window.openArtifactDrawer = function (artifactId) {
        const art = window.activeArtifacts[artifactId];
        if (!art) return;
        currentOpenArtifact = art;

        if (artifactTitle) artifactTitle.textContent = art.title;
        if (artifactLangBadge) artifactLangBadge.textContent = art.lang.toUpperCase();
        if (artifactFileIcon) artifactFileIcon.textContent = art.icon;

        if (artifactCodeDisplay) {
            artifactCodeDisplay.textContent = art.code;
            if (typeof hljs !== 'undefined') {
                artifactCodeDisplay.className = `hljs ${art.lang}`;
                hljs.highlightElement(artifactCodeDisplay);
            }
        }

        // Check if HTML for live preview tab
        if (art.lang === 'html' || art.code.includes('<html') || art.code.includes('<!DOCTYPE')) {
            if (artifactTabsPill) artifactTabsPill.classList.remove('hidden');

            let previewHtml = art.code;
            const docIdx = previewHtml.search(/<!doctype\s+html|<html/i);
            if (docIdx > 0) {
                previewHtml = previewHtml.substring(docIdx).trim();
            }
            previewHtml = previewHtml.replace(/[<>\s]*🔄\s*\*\*Model Handover:\*\*[\s\S]*?---\s*/gi, '').trim();
            previewHtml = previewHtml.replace(/^```(?:html)?\s*/i, '').trim();

            // If code contains placeholder GHL calendar iframe that fails in local sandbox,
            // replace with a beautiful interactive glassmorphic calendar mockup for preview!
            if (previewHtml.includes('YOUR_CALENDAR_ID') || previewHtml.includes('api.leadconnectorhq.com/widget/booking') || previewHtml.includes('services.leadconnectorhq.com')) {
                const calendarMockup = `
                <div id="interactive-ghl-calendar" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 16px; padding: 24px; color: #fff; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); user-select: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                        <span style="font-weight: 700; color: #38bdf8; font-size: 1.05rem;">📅 Select Assessment Date & Time</span>
                        <span style="font-size: 0.75rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 4px 10px; border-radius: 12px; font-weight: 600;">15 Min Slot</span>
                    </div>
                    <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; text-align: left;">1. Select Date (October 2026):</div>
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 18px; font-size: 0.8rem;" id="cal-dates-grid">
                        <span style="color: #94a3b8; font-weight: 600; padding: 4px 0;">M</span>
                        <span style="color: #94a3b8; font-weight: 600; padding: 4px 0;">T</span>
                        <span style="color: #94a3b8; font-weight: 600; padding: 4px 0;">W</span>
                        <span style="color: #94a3b8; font-weight: 600; padding: 4px 0;">T</span>
                        <span style="color: #94a3b8; font-weight: 600; padding: 4px 0;">F</span>
                        <span style="color: #94a3b8; font-weight: 600; padding: 4px 0;">S</span>
                        <span style="color: #94a3b8; font-weight: 600; padding: 4px 0;">S</span>
                        <button type="button" class="mock-date-btn" data-date="Oct 14" style="padding: 8px 4px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; cursor: pointer; transition: all 0.15s;">14</button>
                        <button type="button" class="mock-date-btn" data-date="Oct 15" style="padding: 8px 4px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; cursor: pointer; transition: all 0.15s;">15</button>
                        <button type="button" class="mock-date-btn active-date" data-date="Oct 16" style="padding: 8px 4px; border-radius: 8px; background: #0284c7; border: 1px solid #38bdf8; color: #fff; font-weight: 700; cursor: pointer; box-shadow: 0 0 10px rgba(2,132,199,0.5); transition: all 0.15s;">16</button>
                        <button type="button" class="mock-date-btn" data-date="Oct 17" style="padding: 8px 4px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; cursor: pointer; transition: all 0.15s;">17</button>
                        <button type="button" class="mock-date-btn" data-date="Oct 18" style="padding: 8px 4px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; cursor: pointer; transition: all 0.15s;">18</button>
                        <button type="button" class="mock-date-btn" data-date="Oct 19" style="padding: 8px 4px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; cursor: pointer; transition: all 0.15s;">19</button>
                        <button type="button" class="mock-date-btn" data-date="Oct 20" style="padding: 8px 4px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #cbd5e1; cursor: pointer; transition: all 0.15s;">20</button>
                    </div>
                    <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; text-align: left;">2. Select Time Slot (EST):</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px;" id="cal-slots-grid">
                        <button type="button" class="mock-time-btn" data-time="09:30 AM" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(56, 189, 248, 0.3); color: #fff; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.15s;">09:30 AM</button>
                        <button type="button" class="mock-time-btn" data-time="11:00 AM" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(56, 189, 248, 0.3); color: #fff; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.15s;">11:00 AM</button>
                        <button type="button" class="mock-time-btn active-time" data-time="02:00 PM" style="background: #0284c7; border: 1px solid #38bdf8; color: #fff; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; box-shadow: 0 0 10px rgba(2,132,199,0.4); transition: all 0.15s;">02:00 PM ✓</button>
                        <button type="button" class="mock-time-btn" data-time="04:30 PM" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(56, 189, 248, 0.3); color: #fff; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.15s;">04:30 PM</button>
                    </div>
                    <button type="button" id="mock-confirm-booking-btn" style="width: 100%; background: linear-gradient(135deg, #0ea5e9, #2563eb); border: none; color: #fff; padding: 12px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 12px rgba(14,165,233,0.3); transition: transform 0.15s;">Confirm Assessment Time ➔</button>
                    <p style="font-size: 0.72rem; color: #94a3b8; margin-top: 10px;">⚡ HighLevel native calendar will load your live slots once deployed with your Calendar ID.</p>
                </div>
                `;
                previewHtml = previewHtml.replace(/<iframe[^>]*api\.leadconnectorhq\.com[^>]*>.*?<\/iframe>/gis, calendarMockup)
                    .replace(/<iframe[^>]*YOUR_CALENDAR_ID[^>]*>.*?<\/iframe>/gis, calendarMockup)
                    .replace(/<iframe[^>]*leadconnectorhq\.com[^>]*><\/iframe>/gis, calendarMockup);
            }

            // Inject Live Preview sandbox script
            const formInterceptScript = `
            <style>
                .hidden { display: none !important; }
            </style>
            <script>
            (function() {
                // Check if this HTML page is a multi-step funnel
                function getFunnelSteps() {
                    var stepEls = Array.from(document.querySelectorAll('.funnel-step, [id^="step-"], [id^="step_"]'));
                    // Filter so only top-level steps (not nested substeps like substep-1 or step-3-1) are treated as steps
                    return stepEls.filter(function(el) {
                        var p = el.parentElement ? el.parentElement.closest('.funnel-step, [id^="step-"], [id^="step_"]') : null;
                        return !p;
                    });
                }

                var steps = getFunnelSteps();
                var isFunnel = steps.length > 1;
                window._currentStepNum = 1;

                if (isFunnel) {
                    // Universal switchStep that supports any number of steps cleanly without CSS conflicts
                    window.switchStep = function(stepNum) {
                        var allSteps = getFunnelSteps();
                        var target = document.getElementById('step-' + stepNum) || 
                                     document.getElementById('step_' + stepNum) || 
                                     document.getElementById('step' + stepNum);
                        if (!target && typeof stepNum === 'number' && allSteps[stepNum - 1]) {
                            target = allSteps[stepNum - 1];
                        }
                        if (!target && typeof stepNum === 'string') {
                            target = document.getElementById(stepNum) || document.querySelector(stepNum);
                        }

                        if (target) {
                            allSteps.forEach(function(s) {
                                if (s !== target) {
                                    s.classList.add('hidden');
                                    s.style.display = 'none';
                                }
                            });
                            target.classList.remove('hidden');
                            target.style.display = 'block';
                            window.scrollTo({ top: 0, behavior: 'smooth' });

                            var targetIdx = allSteps.indexOf(target);
                            if (targetIdx !== -1) {
                                window._currentStepNum = targetIdx + 1;
                            } else if (typeof stepNum === 'number') {
                                window._currentStepNum = stepNum;
                            }
                        }
                    };

                    // Initial isolation: ensure Step 1 is visible, all other steps hidden
                    steps.forEach(function(el, idx) {
                        if (idx === 0) {
                            el.classList.remove('hidden');
                            el.style.display = 'block';
                        } else {
                            el.classList.add('hidden');
                            el.style.display = 'none';
                        }
                    });
                }

                // Handle Form Submissions safely inside the sandbox iframe
                document.addEventListener('submit', function(e) {
                    e.preventDefault();
                    if (isFunnel) {
                        var onsubmitAttr = (e.target.getAttribute('onsubmit') || '');
                        if (onsubmitAttr.includes('switchStep')) return;

                        var allSteps = getFunnelSteps();
                        var parentStep = e.target.closest('.funnel-step, [id^="step-"], [id^="step_"]');
                        var cur = window._currentStepNum || 1;
                        if (parentStep) {
                            var idx = allSteps.indexOf(parentStep);
                            if (idx !== -1) cur = idx + 1;
                        }
                        if (cur < allSteps.length) {
                            window.switchStep(cur + 1);
                        }
                    } else {
                        // Landing page form submission feedback
                        var submitBtn = e.target.querySelector('button[type="submit"], input[type="submit"]');
                        if (submitBtn) {
                            var origText = submitBtn.innerHTML || submitBtn.value;
                            submitBtn.innerHTML = '✓ Submitted Successfully!';
                            setTimeout(function() { submitBtn.innerHTML = origText; }, 3000);
                        }
                    }
                });

                // Global Click Interceptor for Sandboxed Iframe (prevents reload / hash reset)
                document.addEventListener('click', function(e) {
                    // Mock Calendar date/time selection
                    var dateBtn = e.target.closest('.mock-date-btn');
                    if (dateBtn) {
                        document.querySelectorAll('.mock-date-btn').forEach(function(b) {
                            b.style.background = 'rgba(255,255,255,0.04)';
                            b.style.color = '#cbd5e1';
                            b.style.fontWeight = 'normal';
                            b.style.boxShadow = 'none';
                        });
                        dateBtn.style.background = '#0284c7';
                        dateBtn.style.color = '#fff';
                        dateBtn.style.fontWeight = 'bold';
                        dateBtn.style.boxShadow = '0 0 10px rgba(2,132,199,0.5)';
                    }
                    var timeBtn = e.target.closest('.mock-time-btn');
                    if (timeBtn) {
                        document.querySelectorAll('.mock-time-btn').forEach(function(b) {
                            b.style.background = 'rgba(255,255,255,0.06)';
                            b.style.color = '#fff';
                            b.style.fontWeight = 'normal';
                            b.style.boxShadow = 'none';
                            b.textContent = b.getAttribute('data-time') || b.textContent.replace('✓', '').trim();
                        });
                        timeBtn.style.background = '#0284c7';
                        timeBtn.style.fontWeight = 'bold';
                        timeBtn.style.boxShadow = '0 0 10px rgba(2,132,199,0.4)';
                        var t = timeBtn.getAttribute('data-time') || timeBtn.textContent.trim();
                        timeBtn.textContent = t + ' ✓';
                    }
                    var confirmBtn = e.target.closest('#mock-confirm-booking-btn');
                    if (confirmBtn) {
                        var calWrapper = document.getElementById('interactive-ghl-calendar');
                        if (calWrapper) {
                            calWrapper.innerHTML = '<div style="text-align: center; padding: 24px; font-family: sans-serif;">' +
                                '<div style="font-size: 32px; margin-bottom: 12px;">🎉</div>' +
                                '<h3 style="color: #fff; font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">Assessment Confirmed!</h3>' +
                                '<p style="color: #38bdf8; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px;">Your appointment has been registered in GoHighLevel CRM.</p>' +
                                '<p style="color: #94a3b8; font-size: 0.8rem;">A confirmation SMS and calendar invite have been dispatched.</p>' +
                            '</div>';
                        }
                    }

                    var anchor = e.target.closest('a');
                    var btn = e.target.closest('button, [role="button"], input[type="submit"], input[type="button"]');
                    var targetEl = anchor || btn;
                    if (!targetEl) return;

                    var href = anchor ? (anchor.getAttribute('href') || '') : '';
                    var isHashOrEmpty = href === '#' || href === '' || href === 'javascript:void(0)' || href.startsWith('#') || href.includes('#');

                    // Stop dead anchors from reloading or navigating iframe away
                    if (anchor && isHashOrEmpty) {
                        e.preventDefault();
                    }

                    if (!isFunnel) return;

                    // If anchor specifies a step target like href="#step-3" or data-step-target="3"
                    var stepTargetAttr = targetEl.getAttribute('data-step-target') || '';
                    var stepMatch = href.match(/step[-_]?(\d+)/i) || stepTargetAttr.match(/step[-_]?(\d+)/i);
                    if (stepMatch) {
                        window.switchStep(parseInt(stepMatch[1], 10));
                        return;
                    }

                    // 2-Step Order Form Substep Toggle
                    var text = (targetEl.textContent || targetEl.value || '').trim().toLowerCase();
                    if (/continue to payment|proceed to payment|continue to checkout|proceed to checkout/i.test(text)) {
                        var parentStep = targetEl.closest('.funnel-step, [id^="step-"], [id^="step_"]');
                        var sub2 = parentStep ? parentStep.querySelector('#substep-2, #sub-step-2, #step-3-2, .payment-step, .card-details') : null;
                        var sub1 = parentStep ? parentStep.querySelector('#substep-1, #sub-step-1, #step-3-1, .contact-step') : null;
                        if (sub2 && sub1) {
                            sub1.classList.add('hidden');
                            sub1.style.display = 'none';
                            sub2.classList.remove('hidden');
                            sub2.style.display = 'block';
                            return;
                        }
                    }

                    // If button has an inline onclick (e.g. switchStep(3)), let it run without interference
                    var onclickAttr = targetEl.getAttribute('onclick') || '';
                    if (onclickAttr.includes('switchStep')) {
                        return;
                    }

                    // For progression buttons without an inline onclick (Next, Continue, Yes Add Now, No Thanks, Complete Order)
                    var isProgression = /next|continue|proceed|complete|start|order|yes|claim|book|schedule|get|add now|no thanks|skip|bypass/i.test(text);
                    if (isProgression) {
                        var allSteps = getFunnelSteps();
                        var parentStep = targetEl.closest('.funnel-step, [id^="step-"], [id^="step_"]');
                        var cur = window._currentStepNum || 1;
                        if (parentStep) {
                            var idx = allSteps.indexOf(parentStep);
                            if (idx !== -1) cur = idx + 1;
                        }
                        // Only advance if there is a next step! Never loop past the last step!
                        if (cur < allSteps.length) {
                            window.switchStep(cur + 1);
                        }
                    }
                });
            })();
            <\/script>
            `;

            if (previewHtml.includes('</body>')) {
                previewHtml = previewHtml.replace('</body>', formInterceptScript + '</body>');
            } else {
                previewHtml += formInterceptScript;
            }

            if (artifactPreviewIframe) artifactPreviewIframe.srcdoc = previewHtml;
            setArtifactTab('preview');
        } else {
            if (artifactTabsPill) artifactTabsPill.classList.add('hidden');
            setArtifactTab('code');
        }

        if (artifactDrawer) artifactDrawer.classList.remove('hidden');
        if (mainContentArea) mainContentArea.classList.add('artifact-drawer-open');
    };

    window.closeArtifactDrawer = function () {
        if (artifactDrawer) artifactDrawer.classList.add('hidden');
        if (mainContentArea) mainContentArea.classList.remove('artifact-drawer-open');
        currentOpenArtifact = null;
    };

    function setArtifactTab(tab) {
        if (tab === 'preview') {
            if (artifactTabPreview) artifactTabPreview.classList.add('active');
            if (artifactTabCode) artifactTabCode.classList.remove('active');
            if (artifactPreviewView) artifactPreviewView.classList.remove('hidden');
            if (artifactCodeView) artifactCodeView.classList.add('hidden');
        } else {
            if (artifactTabCode) artifactTabCode.classList.add('active');
            if (artifactTabPreview) artifactTabPreview.classList.remove('active');
            if (artifactCodeView) artifactCodeView.classList.remove('hidden');
            if (artifactPreviewView) artifactPreviewView.classList.add('hidden');
        }
    }

    if (artifactTabCode) artifactTabCode.addEventListener('click', () => setArtifactTab('code'));
    if (artifactTabPreview) artifactTabPreview.addEventListener('click', () => setArtifactTab('preview'));
    if (closeArtifactBtn) closeArtifactBtn.addEventListener('click', window.closeArtifactDrawer);

    if (artifactCopyBtn) {
        artifactCopyBtn.addEventListener('click', () => {
            if (!currentOpenArtifact) return;
            navigator.clipboard.writeText(currentOpenArtifact.code).then(() => {
                const span = artifactCopyBtn.querySelector('span');
                if (span) span.textContent = 'Copied!';
                setTimeout(() => { if (span) span.textContent = 'Copy'; }, 2000);
            });
        });
    }

    if (artifactDownloadBtn) {
        artifactDownloadBtn.addEventListener('click', () => {
            if (!currentOpenArtifact) return;
            const blob = new Blob([currentOpenArtifact.code], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentOpenArtifact.title;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // Delegate clicks on artifact cards
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.claude-artifact-card');
        if (card) {
            const id = card.getAttribute('data-artifact-id');
            if (id) window.openArtifactDrawer(id);
        }
    });

    // Delegate copy button clicks
    document.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-code-btn');
        if (!copyBtn) return;
        const code = copyBtn.getAttribute('data-code') || copyBtn.closest('.code-block-wrapper').querySelector('code').innerText;
        navigator.clipboard.writeText(code).then(() => {
            const textSpan = copyBtn.querySelector('span');
            if (textSpan) textSpan.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                if (textSpan) textSpan.textContent = 'Copy code';
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
        });
    });

    updateGHLStatusUI();

    // Check initial connection
    if (ghlConfig.locationId && ghlConfig.accessToken) {
        verifyGhlConnection(ghlConfig.locationId, ghlConfig.accessToken, false);
    }

    // Load available models with live usage percentages
    fetchModelsCatalog();

    // ==========================================
    // CONFIRMATION & RENAME MODAL ENGINE
    // ==========================================
    let pendingConfirmCallback = null;
    const confirmActionModal = document.getElementById('confirm-action-modal');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalDesc = document.getElementById('confirm-modal-desc');
    const confirmModalIcon = document.getElementById('confirm-modal-icon');
    const executeConfirmBtn = document.getElementById('execute-confirm-btn');
    const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
    const closeConfirmModalBtn = document.getElementById('close-confirm-modal');

    function showConfirmModal({ title, desc, icon = '🗑️', confirmText = 'Delete', onConfirm }) {
        if (confirmModalTitle) confirmModalTitle.textContent = title;
        if (confirmModalDesc) confirmModalDesc.textContent = desc;
        if (confirmModalIcon) confirmModalIcon.textContent = icon;
        if (executeConfirmBtn) executeConfirmBtn.textContent = confirmText;
        pendingConfirmCallback = onConfirm;
        if (confirmActionModal) confirmActionModal.classList.remove('hidden');
    }

    function hideConfirmModal() {
        if (confirmActionModal) confirmActionModal.classList.add('hidden');
        pendingConfirmCallback = null;
    }

    if (cancelConfirmBtn) cancelConfirmBtn.addEventListener('click', hideConfirmModal);
    if (closeConfirmModalBtn) closeConfirmModalBtn.addEventListener('click', hideConfirmModal);
    if (executeConfirmBtn) {
        executeConfirmBtn.addEventListener('click', () => {
            if (pendingConfirmCallback) {
                const cb = pendingConfirmCallback;
                hideConfirmModal();
                cb();
            } else {
                hideConfirmModal();
            }
        });
    }

    // Rename Modal Elements
    const renameChatModal = document.getElementById('rename-chat-modal');
    const renameInputTitle = document.getElementById('rename-input-title');
    const saveRenameBtn = document.getElementById('save-rename-btn');
    const cancelRenameBtn = document.getElementById('cancel-rename-btn');
    const closeRenameModalBtn = document.getElementById('close-rename-modal');

    function openRenameModal() {
        const thread = getThreadById(currentThreadId);
        if (renameInputTitle) {
            renameInputTitle.value = (thread && thread.title) ? thread.title : 'Conversation AI Copilot';
        }
        if (renameChatModal) renameChatModal.classList.remove('hidden');
        if (renameInputTitle) setTimeout(() => renameInputTitle.focus(), 50);
    }

    function hideRenameModal() {
        if (renameChatModal) renameChatModal.classList.add('hidden');
    }

    function saveRenamedTitle() {
        const newTitle = renameInputTitle ? renameInputTitle.value.trim() : '';
        if (!newTitle) return;
        let thread = getThreadById(currentThreadId);
        if (thread) {
            thread.title = newTitle;
            saveThreads();
        }
        if (activeChatTitle) activeChatTitle.textContent = newTitle;
        renderRecentChatsList();
        hideRenameModal();
    }

    if (saveRenameBtn) saveRenameBtn.addEventListener('click', saveRenamedTitle);
    if (cancelRenameBtn) cancelRenameBtn.addEventListener('click', hideRenameModal);
    if (closeRenameModalBtn) closeRenameModalBtn.addEventListener('click', hideRenameModal);
    if (renameInputTitle) {
        renameInputTitle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveRenamedTitle();
            }
        });
    }

    // Header Chat Actions & Dropdown
    const headerNewChatBtn = document.getElementById('header-new-chat-btn');
    const chatOptionsTriggerBtn = document.getElementById('chat-options-trigger-btn');
    const chatOptionsDropdown = document.getElementById('chat-options-dropdown');
    const dropdownRenameChatBtn = document.getElementById('dropdown-rename-chat-btn');
    const dropdownCloseChatBtn = document.getElementById('dropdown-close-chat-btn');
    const dropdownClearMsgsBtn = document.getElementById('dropdown-clear-msgs-btn');
    const dropdownDeleteChatBtn = document.getElementById('dropdown-delete-chat-btn');

    if (headerNewChatBtn) {
        headerNewChatBtn.addEventListener('click', () => createNewThread(true));
    }

    if (chatOptionsTriggerBtn && chatOptionsDropdown) {
        chatOptionsTriggerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatOptionsDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!chatOptionsDropdown.contains(e.target) && e.target !== chatOptionsTriggerBtn) {
                chatOptionsDropdown.classList.add('hidden');
            }
        });
    }

    if (dropdownRenameChatBtn) {
        dropdownRenameChatBtn.addEventListener('click', () => {
            if (chatOptionsDropdown) chatOptionsDropdown.classList.add('hidden');
            openRenameModal();
        });
    }

    if (dropdownCloseChatBtn) {
        dropdownCloseChatBtn.addEventListener('click', () => {
            if (chatOptionsDropdown) chatOptionsDropdown.classList.add('hidden');
            closeCurrentChat();
        });
    }

    if (dropdownClearMsgsBtn) {
        dropdownClearMsgsBtn.addEventListener('click', () => {
            if (chatOptionsDropdown) chatOptionsDropdown.classList.add('hidden');
            clearCurrentChatMessages();
        });
    }

    if (dropdownDeleteChatBtn) {
        dropdownDeleteChatBtn.addEventListener('click', () => {
            if (chatOptionsDropdown) chatOptionsDropdown.classList.add('hidden');
            deleteCurrentChat();
        });
    }

    // Initialize Recent Chats & load active thread if any
    renderRecentChatsList();
    if (currentThreadId && getThreadById(currentThreadId) && getThreadById(currentThreadId).messages && getThreadById(currentThreadId).messages.length > 0) {
        loadThread(currentThreadId);
    } else if (chatThreads.length > 0) {
        const recentWithMsgs = chatThreads.find(t => t.messages && t.messages.length > 0);
        if (recentWithMsgs) {
            loadThread(recentWithMsgs.id);
        } else {
            createNewThread(false);
        }
    } else {
        createNewThread(false);
    }


    // ==========================================
    // CHAT THREADS & RECENT CHATS MANAGEMENT
    // ==========================================

    function loadSavedThreads() {
        try {
            return JSON.parse(localStorage.getItem('ghl_chat_threads') || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveThreads() {
        try {
            localStorage.setItem('ghl_chat_threads', JSON.stringify(chatThreads));
        } catch (e) {
            console.warn('Failed to save threads:', e);
        }
    }

    function getThreadById(id) {
        return chatThreads.find(t => t.id === id);
    }

    function createNewThread(shouldFocus = true) {
        abortCurrentGeneration();
        clearPromptQueue();
        currentThreadId = 'thread_' + Date.now();
        localStorage.setItem('ghl_active_thread_id', currentThreadId);

        messagesList.innerHTML = '';
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        if (activeChatTitle) activeChatTitle.textContent = 'Conversation AI Copilot';

        if (userInput) {
            userInput.value = '';
            userInput.style.height = 'auto';
            if (shouldFocus) userInput.focus();
        }
        updateSendButtonState();
        renderRecentChatsList();
    }

    function closeCurrentChat() {
        createNewThread(true);
    }

    function clearCurrentChatMessages() {
        showConfirmModal({
            title: 'Clear Messages',
            desc: 'Are you sure you want to clear all messages in this conversation?',
            icon: '🧹',
            confirmText: 'Clear Messages',
            onConfirm: () => {
                abortCurrentGeneration();
                clearPromptQueue();
                let thread = getThreadById(currentThreadId);
                if (thread) {
                    thread.messages = [];
                    saveThreads();
                }
                messagesList.innerHTML = '';
                if (welcomeScreen) welcomeScreen.classList.remove('hidden');
                updateSendButtonState();
                renderRecentChatsList();
            }
        });
    }

    function deleteCurrentChat() {
        showConfirmModal({
            title: 'Delete Conversation',
            desc: 'Are you sure you want to permanently delete this conversation?',
            icon: '🗑️',
            confirmText: 'Delete',
            onConfirm: () => {
                deleteThread(currentThreadId);
            }
        });
    }

    function loadThread(threadId) {
        abortCurrentGeneration();
        clearPromptQueue();
        const thread = getThreadById(threadId);
        if (!thread) return;

        currentThreadId = thread.id;
        localStorage.setItem('ghl_active_thread_id', currentThreadId);

        if (activeChatTitle) activeChatTitle.textContent = thread.title || 'Conversation AI Copilot';
        messagesList.innerHTML = '';

        if (!thread.messages || thread.messages.length === 0) {
            if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        } else {
            if (welcomeScreen) welcomeScreen.classList.add('hidden');
            thread.messages.forEach(msg => {
                if (msg.role === 'user') {
                    appendMessageUI('user', msg.content, msg.id);
                } else {
                    renderAssistantMessageUI(msg);
                }
            });
        }

        updateSendButtonState();


        renderRecentChatsList();
        setTimeout(() => scrollToLastUserQuery(), 80);
        if (window.innerWidth <= 768) closeSidebar();
    }

    function addMessageToCurrentThread(role, content, toolBadges = [], messageId = null) {
        let thread = getThreadById(currentThreadId);
        if (!thread) {
            // Generate title from first message
            const title = content.length > 35 ? content.substring(0, 35) + '...' : content;
            thread = {
                id: currentThreadId || ('thread_' + Date.now()),
                title: title,
                createdAt: new Date().toISOString(),
                messages: []
            };
            chatThreads.unshift(thread);
            currentThreadId = thread.id;
            localStorage.setItem('ghl_active_thread_id', currentThreadId);
            if (activeChatTitle) activeChatTitle.textContent = title;
        }

        const effectiveId = messageId || ('msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
        const existingIdx = thread.messages ? thread.messages.findIndex(m => m.id === effectiveId) : -1;

        if (existingIdx !== -1) {
            thread.messages[existingIdx].content = content;
            thread.messages[existingIdx].toolBadges = toolBadges;
        } else {
            if (!thread.messages) thread.messages = [];
            thread.messages.push({
                id: effectiveId,
                role: role,
                content: content,
                toolBadges: toolBadges,
                timestamp: new Date().toISOString()
            });
        }

        saveThreads();
        renderRecentChatsList();
        return effectiveId;
    }

    function deleteMessageFromThread(messageId, msgElement) {
        let thread = getThreadById(currentThreadId);
        if (thread && thread.messages) {
            thread.messages = thread.messages.filter(m => m.id !== messageId && m.content !== msgElement?.getAttribute('data-content'));
            saveThreads();
        }
        if (msgElement) msgElement.remove();
        if (messagesList.children.length === 0 && welcomeScreen) {
            welcomeScreen.classList.remove('hidden');
        }
    }

    function deleteThread(threadId, event) {
        if (event) event.stopPropagation();
        chatThreads = chatThreads.filter(t => t.id !== threadId);
        saveThreads();

        if (currentThreadId === threadId) {
            if (chatThreads.length > 0) {
                loadThread(chatThreads[0].id);
            } else {
                createNewThread();
            }
        } else {
            renderRecentChatsList();
        }
    }

    function renderRecentChatsList() {
        if (!historyList) return;

        if (chatThreads.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty-placeholder">
                    No recent chats yet.<br>Start a new conversation!
                </div>
            `;
            return;
        }

        historyList.innerHTML = chatThreads.map(thread => {
            const isActive = thread.id === currentThreadId;
            return `
                <div class="history-item ${isActive ? 'active' : ''}" data-thread-id="${escapeHtml(thread.id)}">
                    <div class="history-item-left">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span class="history-item-title">${escapeHtml(thread.title || 'Untitled Conversation')}</span>
                    </div>
                    <button class="delete-history-btn" data-delete-id="${escapeHtml(thread.id)}" title="Delete chat">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;
        }).join('');

        // Attach click listeners to history items
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.delete-history-btn')) return;
                const threadId = item.getAttribute('data-thread-id');
                loadThread(threadId);
            });
        });

        // Attach delete listeners with confirm modal
        historyList.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const threadId = btn.getAttribute('data-delete-id');
                showConfirmModal({
                    title: 'Delete Chat',
                    desc: 'Are you sure you want to delete this chat thread?',
                    icon: '🗑️',
                    confirmText: 'Delete',
                    onConfirm: () => deleteThread(threadId)
                });
            });
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => createNewThread(true));
    }

    if (clearAllHistoryBtn) {
        clearAllHistoryBtn.addEventListener('click', () => {
            if (chatThreads.length === 0) return;
            showConfirmModal({
                title: 'Clear All Chat History',
                desc: 'Are you sure you want to delete ALL conversations permanently?',
                icon: '⚠️',
                confirmText: 'Clear All History',
                onConfirm: () => {
                    chatThreads = [];
                    saveThreads();
                    createNewThread();
                }
            });
        });
    }

    // ==========================================
    // MODELS CATALOG & USAGE MONITOR
    // ==========================================

    async function fetchModelsCatalog() {
        if (!modelSelector) return;
        try {
            const resp = await fetch('/api/models');
            if (!resp.ok) return;
            const data = await resp.json();
            const models = data.models || [];
            cachedModelsData = models;
            if (models.length === 0) return;

            const categories = {};
            models.forEach(m => {
                const cat = m.category || 'Other Models';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(m);
            });

            const rawSaved = localStorage.getItem('selected_ai_model');
            const modelExists = models.some(m => m.id === rawSaved);
            const savedModel = modelExists ? rawSaved : (data.default_model || 'groq/compound-mini');
            localStorage.setItem('selected_ai_model', savedModel);
            modelSelector.innerHTML = '';

            const iconsMap = {
                'Google Gemini': '✨',
                'Groq Ultra-Fast': '⚡',
                'OpenRouter Gateway': '🌐',
                'Puter.js Free AI': '🚀',
                'RapidAPI Free': '🌐',
                'Other Models': '🔹'
            };

            for (const [catName, catModels] of Object.entries(categories)) {
                const optGroup = document.createElement('optgroup');
                optGroup.label = `${iconsMap[catName] || '⚡'} ${catName}`;
                catModels.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    const u = m.usage;
                    const quotaSummary = m.quota_summary || m.quota_limit || (u && u.badge_capacity) || m.badge;
                    opt.textContent = `${m.name} — Quota: ${quotaSummary}`;
                    if (m.id === savedModel) {
                        opt.selected = true;
                    }
                    optGroup.appendChild(opt);
                });
                modelSelector.appendChild(optGroup);
            }

            updateActiveModelUsageDisplay();

            if (modelSelector) {
                modelSelector.addEventListener('change', () => {
                    localStorage.setItem('selected_ai_model', modelSelector.value);
                    updateActiveModelUsageDisplay();
                });
            }
        } catch (e) {
            console.error('Failed to load models catalog:', e);
        }
    }

    function updateActiveModelUsageDisplay() {
        if (!modelSelector || cachedModelsData.length === 0) return;
        const currentModelId = modelSelector.value;
        const currentModel = cachedModelsData.find(m => m.id === currentModelId);
        if (currentModel && currentModel.usage) {
            const u = currentModel.usage;
            const healthColor = u.health_color || '#10b981';
            const quotaText = currentModel.quota_summary || currentModel.quota_limit || u.badge_capacity || 'Standard Quota';
            
            // 1. Top Header Active Model Pill
            if (activeModelUsagePill) {
                activeModelUsagePill.style.color = healthColor;
                activeModelUsagePill.style.borderColor = `${healthColor}44`;
                if (u.current_minute_tokens > 0) {
                    activeModelUsagePill.textContent = `⚡ ${currentModel.name.split(' ')[0]}: ${u.current_minute_tokens.toLocaleString()} / ${u.tpm_limit.toLocaleString()} TPM (${u.tpm_usage_pct}% Load)`;
                } else {
                    activeModelUsagePill.textContent = `⚡ ${currentModel.name.split(' ')[0]}: Quota: ${quotaText}`;
                }
            }

            // 2. Chat Input Bar Quota Pill
            const inputModelQuotaText = document.getElementById('input-model-quota-text');
            const inputModelQuotaPill = document.getElementById('input-model-quota-pill');
            if (inputModelQuotaText && inputModelQuotaPill) {
                inputModelQuotaText.textContent = `Quota: ${quotaText}`;
                inputModelQuotaPill.style.borderColor = `${healthColor}66`;
                inputModelQuotaPill.style.color = healthColor;
            }
        }
    }

    // Smart visibility-aware polling: 30s when active, 10s when usage modal is open, 0 when tab hidden
    setInterval(() => {
        if (document.hidden) return; // Pause polling when tab is inactive
        const modalOpen = usageModal && !usageModal.classList.contains('hidden');
        if (modalOpen || isGenerating) {
            fetchModelsCatalog();
            if (modalOpen) renderUsageModalGrid();
        }
    }, 10000);

    // Refresh every 30s when tab is visible and idle
    setInterval(() => {
        if (document.hidden) return;
        const modalOpen = usageModal && !usageModal.classList.contains('hidden');
        if (!modalOpen && !isGenerating) {
            fetchModelsCatalog();
        }
    }, 30000);

    // Usage Modal Handlers
    if (openUsageModalBtn) openUsageModalBtn.addEventListener('click', openUsageModal);
    if (sidebarUsageBtn) sidebarUsageBtn.addEventListener('click', openUsageModal);
    if (closeUsageModalBtn) closeUsageModalBtn.addEventListener('click', closeUsageModal);
    if (doneUsageModalBtn) doneUsageModalBtn.addEventListener('click', closeUsageModal);
    const inputModelQuotaPill = document.getElementById('input-model-quota-pill');
    if (inputModelQuotaPill) inputModelQuotaPill.addEventListener('click', openUsageModal);

    async function openUsageModal() {
        if (usageModal) usageModal.classList.remove('hidden');
        await fetchModelsCatalog();
        renderUsageModalGrid();
    }

    function closeUsageModal() {
        if (usageModal) usageModal.classList.add('hidden');
    }

    function renderUsageModalGrid() {
        if (!usageModelsGrid) return;
        const currentModelId = modelSelector ? modelSelector.value : '';
        usageModelsGrid.innerHTML = cachedModelsData.map(m => {
            const usage = m.usage || { usage_percentage: 0, remaining_percentage: 100, daily_requests: 0, daily_limit: 100, daily_tokens: 0, current_minute_tokens: 0, tpm_limit: 70000, status: '100% Ready' };
            const isActive = m.id === currentModelId;
            const usagePct = usage.usage_percentage || 0;
            const barColor = usage.health_color || (usagePct < 60 ? '#10b981' : (usagePct < 85 ? '#f59e0b' : '#ef4444'));
            const quotaLimit = m.quota_limit || (usage.badge_capacity || m.badge);
            const poolBadge = m.pool_count > 1 ? `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 10.5px; padding: 2px 7px; margin-left: 6px;">🔑 ${m.pool_count} Pool Keys</span>` : '';

            return `
                <div class="usage-model-card ${isActive ? 'active-model' : ''}">
                    <div class="usage-card-top">
                        <div class="usage-model-info">
                            <h4>${escapeHtml(m.name)}</h4>
                            <span class="usage-model-cat">${escapeHtml(m.category)} • <strong>Quota: ${escapeHtml(quotaLimit)}</strong>${poolBadge}</span>
                        </div>
                        <span class="badge" style="background-color: ${barColor}22; color: ${barColor}; border: 1px solid ${barColor}55;">
                            ${escapeHtml(usage.status || `${usagePct}% Load`)}
                        </span>
                    </div>

                    <div class="usage-progress-container">
                        <div class="usage-progress-bar-bg">
                            <div class="usage-progress-bar-fill" style="width: ${Math.max(2, usagePct)}%; background-color: ${barColor};"></div>
                        </div>
                        <div class="usage-stats-meta">
                            <span>Live TPM: ${(usage.current_minute_tokens || 0).toLocaleString()} / ${(usage.tpm_limit || 70000).toLocaleString()}</span>
                            <span>Daily Reqs: ${usage.daily_requests || 0} / ${usage.daily_limit || 1000}</span>
                        </div>
                    </div>

                    <div class="usage-card-actions">
                        <span style="font-size: 11px; color: var(--text-muted);">Total Tokens: ${(usage.total_tokens || 0).toLocaleString()}</span>
                        <button type="button" class="select-model-btn ${isActive ? 'active' : ''}" data-model-id="${escapeHtml(m.id)}">
                            ${isActive ? '✓ Active Model' : 'Switch Model'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        const switchBtns = usageModelsGrid.querySelectorAll('.select-model-btn');
        switchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetModelId = btn.getAttribute('data-model-id');
                if (targetModelId && modelSelector) {
                    modelSelector.value = targetModelId;
                    localStorage.setItem('selected_ai_model', targetModelId);
                    updateActiveModelUsageDisplay();
                    renderUsageModalGrid();
                    setTimeout(closeUsageModal, 300);
                }
            });
        });
    }
    // ========================================================
    // AI BUILDER WIZARD — DUAL-MODE QUESTIONNAIRE ENGINE
    // (Funnel vs Landing Page Specialized Flow)
    // ========================================================
    const wizardModal = document.getElementById('builder-wizard-modal');
    const closeWizardModalBtn = document.getElementById('close-wizard-modal');
    const headerWizardLauncherBtn = document.getElementById('header-wizard-launcher-btn');
    const sidebarWizardBtn = document.getElementById('sidebar-wizard-btn');
    const openWizardChipBtn = document.getElementById('open-wizard-chip-btn');
    const btnModeFunnel = document.getElementById('btn-mode-funnel');
    const btnModeLanding = document.getElementById('btn-mode-landing');

    const TOTAL_FUNNEL_STEPS = 6;
    let currentFunnelStep = 1;

    // Presets for Funnel Steps Breakdown
    const FUNNEL_STEP_PRESETS = {
        '2': `Page 1 (Opt-in Lead Capture): Hero hook headline, value bullets, and contact form (name, email, phone).\nPage 2 (Thank You Page): Confirmation message, next steps, and asset download link.`,
        '3': `Page 1 (Opt-in Hook): Lead magnet capture form and high-converting problem-solution hook.\nPage 2 (VSL & Offer Room): Video player presenting the core offer, proof, and CTA to schedule/apply.\nPage 3 (Booking & Confirmation): Calendar scheduler embed, onboarding call details, and instant access link.`,
        '4': `Page 1 (Lead Capture Opt-in): Attention-grabbing headline, lead magnet opt-in form.\nPage 2 (VSL Video Room): Video sales presentation with 80% watch tracking and CTA button.\nPage 3 (2-Step Order Form): Contact info + Payment details & bump offer ($37).\nPage 4 (Confirmation & Thank You): Order confirmation, receipt details, and community access link.`,
        '5': `Page 1 (Opt-in Lead Capture): High-converting hook headline, lead capture form (name, email, phone).\nPage 2 (VSL Video Room): Video player presenting the transformation, 80% watch tracking, and CTA.\nPage 3 (2-Step Order Checkout): Contact details + Payment details & bump offer.\nPage 4 (OTO Upsell Page): Special one-time discount offer ($49) with Accept and Bypass links.\nPage 5 (Thank You Page): Confirmation details, instant access, and calendar onboarding call.`,
        'custom': `Page 1: Opt-in lead capture\nPage 2: Video sales presentation\nPage 3: Order form or application\nPage 4: Special upsell or consultation\nPage 5: Thank you & onboarding steps`
    };

    // Unified Wizard State
    const wizardState = {
        mode: 'funnel', // 'funnel' or 'landing'

        // Funnel Specifics
        funnelPages: '5',
        funnelStructure: '5-Step Full High-Converting Funnel',
        funnelStepBreakdown: FUNNEL_STEP_PRESETS['5'],
        funnelGoal: 'Generate Leads',

        // Landing Page Specifics
        landingGoal: 'Lead Generation',
        landingSections: [
            'Hero Header',
            'Features & Value Benefits',
            'Problem vs Solution',
            'Social Proof & Testimonials',
            'Pricing Table & Packages',
            'Interactive FAQ Accordion',
            'Contact & Lead Form',
            'Trust Badges & Guarantee'
        ],

        // Shared Configuration
        audience: 'Business Owners',
        offer: 'Free Consultation',
        businessName: 'BrightSmile Dental',
        problemSolved: 'We help people get confident smiles with advanced care.',
        whyChooseYou: 'Experienced team, advanced technology, personalized care.',
        keyBenefits: 'Painless procedures, same-day results, 5-star rated.',
        designStyle: 'Modern & Clean',
        primaryColor: '#6C5CE7'
    };

    // Open & Close Modal
    function openWizardModal(promptContext = '', defaultMode = '') {
        currentFunnelStep = 1;

        // Auto-detect mode if not explicitly passed
        if (defaultMode) {
            wizardState.mode = defaultMode;
        } else if (promptContext) {
            const lower = promptContext.toLowerCase();
            if (/\b(landing\s*page|landingpage|single\s*page|one\s*page|lead\s*page|sales\s*page)\b/i.test(lower) && !/\bfunnel\b/i.test(lower)) {
                wizardState.mode = 'landing';
            } else {
                wizardState.mode = 'funnel';
            }
        }

        if (promptContext && promptContext.trim()) {
            parsePromptToWizardState(promptContext.trim());
        }

        applyWizardModeUI(wizardState.mode);
        syncStateToUI();
        renderFunnelStep(1);

        if (wizardModal) {
            wizardModal.classList.remove('hidden');
        }
    }

    function closeWizardModal() {
        if (wizardModal) {
            wizardModal.classList.add('hidden');
        }
    }

    // Switch between Funnel and Landing Page modes
    function setWizardMode(mode) {
        wizardState.mode = mode;
        applyWizardModeUI(mode);
        syncStateToUI();
        renderFunnelStep(currentFunnelStep);
    }

    function applyWizardModeUI(mode) {
        const isFunnel = (mode === 'funnel');

        // Toggle Mode Pills
        if (btnModeFunnel) btnModeFunnel.classList.toggle('active', isFunnel);
        if (btnModeLanding) btnModeLanding.classList.toggle('active', !isFunnel);

        // Left Panel Updates
        const leftTitle = document.getElementById('wizard-left-title');
        const leftDesc = document.getElementById('wizard-left-desc');
        const benefit1Title = document.getElementById('wizard-benefit-1-title');
        const benefit1Desc = document.getElementById('wizard-benefit-1-desc');
        const benefit2Title = document.getElementById('wizard-benefit-2-title');
        const benefit2Desc = document.getElementById('wizard-benefit-2-desc');
        const brandBadge = document.getElementById('wizard-brand-badge');

        if (isFunnel) {
            if (leftTitle) leftTitle.innerHTML = `Let's build your<br><span class="highlight-purple">multi-step funnel</span> 🚀`;
            if (leftDesc) leftDesc.textContent = `Choose how many pages you need, configure each step's content, and generate a complete multi-step funnel with zero scrolling.`;
            if (benefit1Title) benefit1Title.textContent = `Multi-Step Architecture`;
            if (benefit1Desc) benefit1Desc.textContent = `Discrete pages with wired button progression`;
            if (benefit2Title) benefit2Title.textContent = `Designed to Convert`;
            if (benefit2Desc) benefit2Desc.textContent = `HighLevel workflows, forms, and triggers`;
            if (brandBadge) brandBadge.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`;
        } else {
            if (leftTitle) leftTitle.innerHTML = `Let's build your<br><span class="highlight-purple">single landing page</span> ✨`;
            if (leftDesc) leftDesc.textContent = `Choose your primary conversion goal, select all key sections for this single page, and generate clean modern code.`;
            if (benefit1Title) benefit1Title.textContent = `Single Page Flow`;
            if (benefit1Desc) benefit1Desc.textContent = `Clean continuous layout with smooth navigation`;
            if (benefit2Title) benefit2Title.textContent = `Conversion Sections`;
            if (benefit2Desc) benefit2Desc.textContent = `Hero, Features, Testimonials, FAQ & Lead Form`;
            if (brandBadge) brandBadge.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`;
        }

        // Stepper Title Updates
        const st1 = document.getElementById('stepper-title-1');
        const st2 = document.getElementById('stepper-title-2');
        if (st1) st1.textContent = isFunnel ? 'Pages' : 'Goal';
        if (st2) st2.textContent = isFunnel ? 'Goal' : 'Sections';

        // Step 1 Views
        const funnelStep1 = document.getElementById('funnel-mode-step-1');
        const landingStep1 = document.getElementById('landing-mode-step-1');
        if (funnelStep1) funnelStep1.style.display = isFunnel ? 'block' : 'none';
        if (landingStep1) landingStep1.style.display = isFunnel ? 'none' : 'block';

        // Step 2 Views
        const funnelStep2 = document.getElementById('funnel-mode-step-2');
        const landingStep2 = document.getElementById('landing-mode-step-2');
        if (funnelStep2) funnelStep2.style.display = isFunnel ? 'block' : 'none';
        if (landingStep2) landingStep2.style.display = isFunnel ? 'none' : 'block';

        // Review Button
        const createBtn = document.getElementById('funnel-create-btn');
        if (createBtn) {
            createBtn.textContent = isFunnel ? 'Create My Multi-Step Funnel 🚀' : 'Create My Landing Page ✨';
        }
    }

    // Parse natural language hints to prepopulate fields
    function parsePromptToWizardState(prompt) {
        const lower = prompt.toLowerCase();

        // Detect Funnel Page Count
        if (lower.includes('2 page') || lower.includes('2 step') || lower.includes('two page') || lower.includes('two step')) {
            wizardState.funnelPages = '2';
            wizardState.funnelStructure = '2-Step Opt-in & Delivery';
            wizardState.funnelStepBreakdown = FUNNEL_STEP_PRESETS['2'];
        } else if (lower.includes('3 page') || lower.includes('3 step') || lower.includes('three page') || lower.includes('three step')) {
            wizardState.funnelPages = '3';
            wizardState.funnelStructure = '3-Step VSL & Booking Funnel';
            wizardState.funnelStepBreakdown = FUNNEL_STEP_PRESETS['3'];
        } else if (lower.includes('4 page') || lower.includes('4 step') || lower.includes('four page') || lower.includes('four step')) {
            wizardState.funnelPages = '4';
            wizardState.funnelStructure = '4-Step Lead & Sales Funnel';
            wizardState.funnelStepBreakdown = FUNNEL_STEP_PRESETS['4'];
        } else if (lower.includes('5 page') || lower.includes('5 step') || lower.includes('five page') || lower.includes('five step')) {
            wizardState.funnelPages = '5';
            wizardState.funnelStructure = '5-Step Full High-Converting Funnel';
            wizardState.funnelStepBreakdown = FUNNEL_STEP_PRESETS['5'];
        }

        // Detect Goal
        if (lower.includes('appointment') || lower.includes('booking') || lower.includes('consultation') || lower.includes('call')) {
            wizardState.funnelGoal = 'Book Appointments';
            wizardState.landingGoal = 'Book Appointments';
        } else if (lower.includes('webinar') || lower.includes('event') || lower.includes('workshop')) {
            wizardState.funnelGoal = 'Promote a Webinar';
            wizardState.landingGoal = 'Webinar Registration';
        } else if (lower.includes('sell') || lower.includes('product') || lower.includes('checkout') || lower.includes('order')) {
            wizardState.funnelGoal = 'Sell a Product';
            wizardState.landingGoal = 'Direct Product Sale';
        } else if (lower.includes('download') || lower.includes('ebook') || lower.includes('magnet') || lower.includes('guide')) {
            wizardState.funnelGoal = 'Download / Resource';
            wizardState.landingGoal = 'Download Resource';
        } else if (lower.includes('waitlist') || lower.includes('early access')) {
            wizardState.landingGoal = 'Waitlist & VIP Access';
        } else if (lower.includes('lead') || lower.includes('opt-in') || lower.includes('optin') || lower.includes('email')) {
            wizardState.funnelGoal = 'Generate Leads';
            wizardState.landingGoal = 'Lead Generation';
        }

        // Detect Audience
        if (lower.includes('e-commerce') || lower.includes('ecommerce') || lower.includes('shopify') || lower.includes('store')) {
            wizardState.audience = 'E-commerce Sellers';
        } else if (lower.includes('coach') || lower.includes('consultant') || lower.includes('trainer')) {
            wizardState.audience = 'Coaches & Consultants';
        } else if (lower.includes('agency') || lower.includes('marketer') || lower.includes('freelancer')) {
            wizardState.audience = 'Marketing Professionals';
        } else if (lower.includes('local') || lower.includes('clinic') || lower.includes('dental') || lower.includes('gym') || lower.includes('real estate') || lower.includes('roofing') || lower.includes('plumber')) {
            wizardState.audience = 'Local Service Providers';
        } else if (lower.includes('business') || lower.includes('owner') || lower.includes('b2b') || lower.includes('founder')) {
            wizardState.audience = 'Business Owners';
        }

        // Detect Brand Name if user said "for [Brand]"
        const forMatch = prompt.match(/\b(?:for|called|named|brand)\s+([A-Z][A-Za-z0-9\s&'-]{2,25})/i);
        if (forMatch && forMatch[1]) {
            wizardState.businessName = forMatch[1].trim();
        } else if (lower.includes('dental') || lower.includes('dentist')) {
            wizardState.businessName = 'BrightSmile Dental';
            wizardState.problemSolved = 'We help people get confident smiles with advanced care.';
            wizardState.whyChooseYou = 'Experienced team, advanced technology, personalized care.';
            wizardState.keyBenefits = 'Painless procedures, same-day results, 5-star rated.';
            wizardState.offer = 'Free Dental Consultation & 3D Scan';
        } else if (lower.includes('gym') || lower.includes('fitness')) {
            wizardState.businessName = 'Apex Fitness Club';
            wizardState.problemSolved = 'We help busy professionals lose fat and gain lean muscle.';
            wizardState.whyChooseYou = 'Custom nutrition plans, 1-on-1 coaching, 24/7 accountability.';
            wizardState.keyBenefits = 'Guaranteed 12-week body transformation, modern equipment.';
            wizardState.offer = 'Free 7-Day VIP Gym Pass';
        } else if (lower.includes('real estate') || lower.includes('realtor')) {
            wizardState.businessName = 'Apex Realty Group';
            wizardState.problemSolved = 'We help families find their dream homes without the stress.';
            wizardState.whyChooseYou = 'Top 1% local producers, VIP off-market access, fast closing.';
            wizardState.keyBenefits = 'Free home valuation, 0% listing fee option.';
            wizardState.offer = 'Free Home Valuation & Buyer Guide';
        }
    }

    // Synchronize State object with UI inputs and cards
    function syncStateToUI() {
        const isFunnel = (wizardState.mode === 'funnel');

        if (isFunnel) {
            // Step 1: Funnel Pages Count Cards
            document.querySelectorAll('#funnel-pages-count-grid .funnel-select-card').forEach(card => {
                const pages = card.getAttribute('data-pages');
                card.classList.toggle('selected', pages === wizardState.funnelPages);
            });

            // Step 1: Funnel Step Breakdown Textarea
            const breakdownInput = document.getElementById('funnel-step-breakdown-input');
            if (breakdownInput && wizardState.funnelStepBreakdown) {
                breakdownInput.value = wizardState.funnelStepBreakdown;
            }

            // Step 2: Funnel Goal cards
            document.querySelectorAll('#goal-options-grid .funnel-select-card').forEach(card => {
                const val = card.getAttribute('data-value');
                card.classList.toggle('selected', val === wizardState.funnelGoal);
            });
        } else {
            // Step 1: Landing Page Goal cards
            document.querySelectorAll('#landing-goal-options-grid .funnel-select-card').forEach(card => {
                const val = card.getAttribute('data-value');
                card.classList.toggle('selected', val === wizardState.landingGoal);
            });

            // Step 2: Landing Page Sections multi-select cards
            document.querySelectorAll('#landing-sections-grid .funnel-select-card').forEach(card => {
                const sectionName = card.getAttribute('data-section');
                const isSelected = wizardState.landingSections.includes(sectionName);
                card.classList.toggle('selected', isSelected);
            });
        }

        // Step 3: Offer input & counter
        const offerInput = document.getElementById('funnel-offer-input');
        const offerCounter = document.getElementById('offer-char-counter');
        if (offerInput) {
            offerInput.value = wizardState.offer;
            if (offerCounter) {
                offerCounter.textContent = `${offerInput.value.length}/140`;
            }
        }

        // Step 3: Audience cards
        document.querySelectorAll('#audience-options-list .funnel-select-card').forEach(card => {
            const val = card.getAttribute('data-value');
            card.classList.toggle('selected', val === wizardState.audience);
        });

        // Step 4: Business Details
        const bizNameInput = document.getElementById('funnel-biz-name');
        const bizProblemInput = document.getElementById('funnel-biz-problem');
        const bizChooseInput = document.getElementById('funnel-biz-choose');
        const bizBenefitsInput = document.getElementById('funnel-biz-benefits');

        if (bizNameInput) bizNameInput.value = wizardState.businessName;
        if (bizProblemInput) bizProblemInput.value = wizardState.problemSolved;
        if (bizChooseInput) bizChooseInput.value = wizardState.whyChooseYou;
        if (bizBenefitsInput) bizBenefitsInput.value = wizardState.keyBenefits;

        // Step 5: Design Style & Colors
        document.querySelectorAll('#style-options-grid .funnel-select-card').forEach(card => {
            const style = card.getAttribute('data-style');
            card.classList.toggle('selected', style === wizardState.designStyle);
        });

        document.querySelectorAll('#funnel-color-swatches .color-dot').forEach(dot => {
            const c = dot.getAttribute('data-color');
            const isActive = (c && c.toLowerCase() === wizardState.primaryColor.toLowerCase());
            dot.classList.toggle('active', isActive);
            if (!dot.classList.contains('custom-rainbow')) {
                dot.textContent = isActive ? '✓' : '';
            }
        });

        // Step 6: Review Summary
        updateReviewListUI();
    }

    // Read current inputs into state
    function syncUIToState() {
        const isFunnel = (wizardState.mode === 'funnel');

        if (isFunnel) {
            const breakdownInput = document.getElementById('funnel-step-breakdown-input');
            if (breakdownInput && breakdownInput.value.trim()) {
                wizardState.funnelStepBreakdown = breakdownInput.value.trim();
            }
        }

        const offerInput = document.getElementById('funnel-offer-input');
        if (offerInput && offerInput.value.trim()) {
            wizardState.offer = offerInput.value.trim();
        }

        const bizNameInput = document.getElementById('funnel-biz-name');
        if (bizNameInput && bizNameInput.value.trim()) {
            wizardState.businessName = bizNameInput.value.trim();
        }

        const bizProblemInput = document.getElementById('funnel-biz-problem');
        if (bizProblemInput && bizProblemInput.value.trim()) {
            wizardState.problemSolved = bizProblemInput.value.trim();
        }

        const bizChooseInput = document.getElementById('funnel-biz-choose');
        if (bizChooseInput && bizChooseInput.value.trim()) {
            wizardState.whyChooseYou = bizChooseInput.value.trim();
        }

        const bizBenefitsInput = document.getElementById('funnel-biz-benefits');
        if (bizBenefitsInput && bizBenefitsInput.value.trim()) {
            wizardState.keyBenefits = bizBenefitsInput.value.trim();
        }
    }

    // Step Navigation Renderer
    function renderFunnelStep(stepNum) {
        syncUIToState();
        currentFunnelStep = Math.max(1, Math.min(TOTAL_FUNNEL_STEPS, stepNum));

        // Update Panels
        for (let i = 1; i <= TOTAL_FUNNEL_STEPS; i++) {
            const panel = document.getElementById(`wizard-step-${i}`);
            if (panel) {
                panel.classList.toggle('active', i === currentFunnelStep);
            }
        }

        // Update Stepper Indicators
        const stepElements = document.querySelectorAll('.funnel-stepper .stepper-step');
        const lineElements = document.querySelectorAll('.funnel-stepper .stepper-line');

        stepElements.forEach((el, index) => {
            const stepIndex = index + 1;
            const circle = el.querySelector('.step-circle');
            el.classList.remove('active', 'completed');

            if (stepIndex < currentFunnelStep) {
                el.classList.add('completed');
                if (circle) circle.textContent = '✓';
            } else if (stepIndex === currentFunnelStep) {
                el.classList.add('active');
                if (circle) circle.textContent = stepIndex;
            } else {
                if (circle) circle.textContent = stepIndex;
            }
        });

        lineElements.forEach((line, index) => {
            const lineIndex = index + 1;
            line.classList.toggle('completed', lineIndex < currentFunnelStep);
        });

        // When reaching Step 6 (Review), refresh review content
        if (currentFunnelStep === 6) {
            updateReviewListUI();
        }
    }

    // Update Step 6 Review UI
    function updateReviewListUI() {
        const isFunnel = (wizardState.mode === 'funnel');

        const revAssetIcon = document.getElementById('rev-asset-icon');
        const revAssetType = document.getElementById('rev-asset-type-val');
        const revStructureIcon = document.getElementById('rev-structure-icon');
        const revStructureLabel = document.getElementById('rev-structure-label');
        const revStructureVal = document.getElementById('rev-structure-val');
        const revGoalLabel = document.getElementById('rev-goal-label');
        const revGoal = document.getElementById('rev-goal-val');
        const revAudience = document.getElementById('rev-audience-val');
        const revOffer = document.getElementById('rev-offer-val');
        const revBizName = document.getElementById('rev-bizname-val');
        const revProblem = document.getElementById('rev-problem-val');
        const revWhyChoose = document.getElementById('rev-whychoose-val');
        const revStyle = document.getElementById('rev-style-val');
        const revColorPreview = document.getElementById('rev-color-preview');
        const revColorHex = document.getElementById('rev-color-hex');
        const createBtn = document.getElementById('funnel-create-btn');

        if (isFunnel) {
            if (revAssetIcon) revAssetIcon.textContent = '🌪️';
            if (revAssetType) revAssetType.textContent = 'Multi-Step Funnel (Discrete Steps, No Scroll)';
            if (revStructureIcon) revStructureIcon.textContent = '📐';
            if (revStructureLabel) revStructureLabel.textContent = 'Pages & Step Flow';
            if (revStructureVal) revStructureVal.textContent = `${wizardState.funnelStructure} (${wizardState.funnelPages} Steps)`;
            if (revGoalLabel) revGoalLabel.textContent = 'Funnel Goal';
            if (revGoal) revGoal.textContent = wizardState.funnelGoal;
            if (createBtn) createBtn.textContent = 'Create My Multi-Step Funnel 🚀';
        } else {
            if (revAssetIcon) revAssetIcon.textContent = '📄';
            if (revAssetType) revAssetType.textContent = 'Single Continuous Landing Page';
            if (revStructureIcon) revStructureIcon.textContent = '📑';
            if (revStructureLabel) revStructureLabel.textContent = 'Included Page Sections';
            if (revStructureVal) revStructureVal.textContent = wizardState.landingSections.join(', ') || 'Hero, Features, Testimonials, FAQ, Lead Form';
            if (revGoalLabel) revGoalLabel.textContent = 'Primary Goal';
            if (revGoal) revGoal.textContent = wizardState.landingGoal;
            if (createBtn) createBtn.textContent = 'Create My Landing Page ✨';
        }

        if (revAudience) revAudience.textContent = wizardState.audience;
        if (revOffer) revOffer.textContent = wizardState.offer;
        if (revBizName) revBizName.textContent = wizardState.businessName;
        if (revProblem) revProblem.textContent = wizardState.problemSolved;
        if (revWhyChoose) revWhyChoose.textContent = wizardState.whyChooseYou;
        if (revStyle) revStyle.textContent = wizardState.designStyle;
        if (revColorPreview) revColorPreview.style.backgroundColor = wizardState.primaryColor;
        if (revColorHex) revColorHex.textContent = wizardState.primaryColor;
    }

    // Setup Event Listeners for Wizard Components
    function initFunnelWizardEvents() {
        // Mode toggle pill listeners
        if (btnModeFunnel) btnModeFunnel.addEventListener('click', () => setWizardMode('funnel'));
        if (btnModeLanding) btnModeLanding.addEventListener('click', () => setWizardMode('landing'));

        // Close buttons
        if (closeWizardModalBtn) closeWizardModalBtn.addEventListener('click', closeWizardModal);
        if (headerWizardLauncherBtn) headerWizardLauncherBtn.addEventListener('click', () => openWizardModal('', 'funnel'));
        if (sidebarWizardBtn) sidebarWizardBtn.addEventListener('click', () => openWizardModal('', 'funnel'));
        if (openWizardChipBtn) openWizardChipBtn.addEventListener('click', () => openWizardModal('', 'funnel'));

        // Stepper circle clicks (allow jumping to any step)
        document.querySelectorAll('.funnel-stepper .stepper-step').forEach(stepEl => {
            stepEl.addEventListener('click', () => {
                const s = parseInt(stepEl.getAttribute('data-step') || '1');
                renderFunnelStep(s);
            });
        });

        // Step 1: Funnel Pages Count Selection
        document.querySelectorAll('#funnel-pages-count-grid .funnel-select-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('#funnel-pages-count-grid .funnel-select-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const pages = card.getAttribute('data-pages') || '5';
                const structure = card.getAttribute('data-structure') || `${pages}-Step Funnel`;
                wizardState.funnelPages = pages;
                wizardState.funnelStructure = structure;
                if (FUNNEL_STEP_PRESETS[pages]) {
                    wizardState.funnelStepBreakdown = FUNNEL_STEP_PRESETS[pages];
                    const breakdownInput = document.getElementById('funnel-step-breakdown-input');
                    if (breakdownInput) breakdownInput.value = wizardState.funnelStepBreakdown;
                }
            });
        });

        // Step 1: Landing Page Goal Selection
        document.querySelectorAll('#landing-goal-options-grid .funnel-select-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('#landing-goal-options-grid .funnel-select-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                wizardState.landingGoal = card.getAttribute('data-value') || 'Lead Generation';
            });
        });

        const step1NextBtn = document.getElementById('step-1-next-btn');
        const step1SkipBtn = document.getElementById('step-1-skip-btn');
        if (step1NextBtn) step1NextBtn.addEventListener('click', () => renderFunnelStep(2));
        if (step1SkipBtn) step1SkipBtn.addEventListener('click', () => renderFunnelStep(2));

        // Step 2: Funnel Goal Selection
        document.querySelectorAll('#goal-options-grid .funnel-select-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('#goal-options-grid .funnel-select-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                wizardState.funnelGoal = card.getAttribute('data-value') || 'Generate Leads';
            });
        });

        // Step 2: Landing Page Sections Multi-Select
        document.querySelectorAll('#landing-sections-grid .funnel-select-card').forEach(card => {
            card.addEventListener('click', () => {
                const section = card.getAttribute('data-section');
                if (card.classList.contains('selected')) {
                    // Prevent deselecting all
                    if (wizardState.landingSections.length > 2) {
                        card.classList.remove('selected');
                        wizardState.landingSections = wizardState.landingSections.filter(s => s !== section);
                    }
                } else {
                    card.classList.add('selected');
                    if (!wizardState.landingSections.includes(section)) {
                        wizardState.landingSections.push(section);
                    }
                }
            });
        });

        const step2BackBtn = document.getElementById('step-2-back-btn');
        const step2NextBtn = document.getElementById('step-2-next-btn');
        const step2SkipBtn = document.getElementById('step-2-skip-btn');
        if (step2BackBtn) step2BackBtn.addEventListener('click', () => renderFunnelStep(1));
        if (step2NextBtn) step2NextBtn.addEventListener('click', () => renderFunnelStep(3));
        if (step2SkipBtn) step2SkipBtn.addEventListener('click', () => renderFunnelStep(3));

        // Step 3: Offer Textarea, Character Counter & Quick Pills
        const offerInput = document.getElementById('funnel-offer-input');
        const offerCounter = document.getElementById('offer-char-counter');
        if (offerInput) {
            offerInput.addEventListener('input', () => {
                if (offerCounter) {
                    offerCounter.textContent = `${offerInput.value.length}/140`;
                }
                wizardState.offer = offerInput.value.trim() || 'High-Converting Offer';
            });
        }

        document.querySelectorAll('#quick-offer-pills .quick-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const text = pill.getAttribute('data-text') || pill.textContent.trim();
                if (offerInput) {
                    offerInput.value = text;
                    if (offerCounter) offerCounter.textContent = `${text.length}/140`;
                    wizardState.offer = text;
                }
            });
        });

        // Step 3: Audience Card Selection
        document.querySelectorAll('#audience-options-list .funnel-select-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('#audience-options-list .funnel-select-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                wizardState.audience = card.getAttribute('data-value') || 'Business Owners';
            });
        });

        const step3BackBtn = document.getElementById('step-3-back-btn');
        const step3NextBtn = document.getElementById('step-3-next-btn');
        const step3SkipBtn = document.getElementById('step-3-skip-btn');
        if (step3BackBtn) step3BackBtn.addEventListener('click', () => renderFunnelStep(2));
        if (step3NextBtn) step3NextBtn.addEventListener('click', () => renderFunnelStep(4));
        if (step3SkipBtn) step3SkipBtn.addEventListener('click', () => renderFunnelStep(4));

        // Step 4: Business Details Form
        const step4BackBtn = document.getElementById('step-4-back-btn');
        const step4NextBtn = document.getElementById('step-4-next-btn');
        const step4SkipBtn = document.getElementById('step-4-skip-btn');
        if (step4BackBtn) step4BackBtn.addEventListener('click', () => renderFunnelStep(3));
        if (step4NextBtn) step4NextBtn.addEventListener('click', () => renderFunnelStep(5));
        if (step4SkipBtn) step4SkipBtn.addEventListener('click', () => renderFunnelStep(5));

        // Step 5: Design Style Cards
        document.querySelectorAll('#style-options-grid .funnel-select-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('#style-options-grid .funnel-select-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                wizardState.designStyle = card.getAttribute('data-style') || 'Modern & Clean';
            });
        });

        // Primary Color Swatches
        document.querySelectorAll('#funnel-color-swatches .color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                if (dot.classList.contains('custom-rainbow')) return;
                const color = dot.getAttribute('data-color') || '#6C5CE7';
                wizardState.primaryColor = color;
                document.querySelectorAll('#funnel-color-swatches .color-dot').forEach(d => {
                    d.classList.remove('active');
                    if (!d.classList.contains('custom-rainbow')) d.textContent = '';
                });
                dot.classList.add('active');
                dot.textContent = '✓';
            });
        });

        // Custom Color Picker input
        const customColorPicker = document.getElementById('funnel-custom-color-picker');
        if (customColorPicker) {
            customColorPicker.addEventListener('input', () => {
                wizardState.primaryColor = customColorPicker.value;
                document.querySelectorAll('#funnel-color-swatches .color-dot').forEach(d => {
                    d.classList.remove('active');
                    if (!d.classList.contains('custom-rainbow')) d.textContent = '';
                });
                updateReviewListUI();
            });
        }

        const step5BackBtn = document.getElementById('step-5-back-btn');
        const step5NextBtn = document.getElementById('step-5-next-btn');
        const step5SkipBtn = document.getElementById('step-5-skip-btn');
        if (step5BackBtn) step5BackBtn.addEventListener('click', () => renderFunnelStep(4));
        if (step5NextBtn) step5NextBtn.addEventListener('click', () => renderFunnelStep(6));
        if (step5SkipBtn) step5SkipBtn.addEventListener('click', () => renderFunnelStep(6));

        // Step 6: Review Screen Edit Action Buttons
        document.querySelectorAll('.review-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetStep = parseInt(btn.getAttribute('data-step') || '1');
                renderFunnelStep(targetStep);
            });
        });

        document.querySelectorAll('.funnel-review-list .review-item').forEach(item => {
            item.addEventListener('click', () => {
                const targetStep = parseInt(item.getAttribute('data-goto-step') || '1');
                if (targetStep) renderFunnelStep(targetStep);
            });
        });

        const step6BackBtn = document.getElementById('step-6-back-btn');
        if (step6BackBtn) step6BackBtn.addEventListener('click', () => renderFunnelStep(5));

        // Step 6: Final CTA Button
        const createFunnelBtn = document.getElementById('funnel-create-btn');
        if (createFunnelBtn) {
            createFunnelBtn.addEventListener('click', () => {
                submitFunnelGeneration();
            });
        }
    }

    // Submit Funnel or Landing Page Generation & Compile Specialized AI Prompt
    function submitFunnelGeneration() {
        syncUIToState();
        closeWizardModal();

        const isFunnel = (wizardState.mode === 'funnel');
        let compiledPrompt = '';

        if (isFunnel) {
            compiledPrompt = `Build a complete GoHighLevel Multi-Step High-Converting Funnel & CRM Architecture based strictly on my specifications.

🎯 Asset Type: Multi-Step Funnel
- Number of Funnel Pages: ${wizardState.funnelPages} Steps (${wizardState.funnelStructure})
- Step-by-Step Page Breakdown & Flow:
${wizardState.funnelStepBreakdown}
- Main Funnel Goal: ${wizardState.funnelGoal}
- Target Audience: ${wizardState.audience}
- Core Offer: ${wizardState.offer}
- Business / Brand Name: ${wizardState.businessName}
- Problem Solved: ${wizardState.problemSolved}
- Why Choose Us: ${wizardState.whyChooseYou}
- Key Benefits / Features: ${wizardState.keyBenefits}
- Design Style & Look: ${wizardState.designStyle}
- Primary Brand Color: ${wizardState.primaryColor}

Please deliver:
1. Complete Single-File HTML App with strictly ${wizardState.funnelPages} isolated steps (#step-1, #step-2, ... #step-${wizardState.funnelPages}) and wired button progression (switchStep). ONLY Step 1 must be visible on initial load; subsequent steps MUST have class="funnel-step hidden" style="display:none;". Strictly ZERO vertical scrolling across steps!
2. Funnel Step Map & URLs table.
3. HighLevel Pipeline stages, Custom Fields, and Tags schema.
4. Production-Ready HighLevel Workflow Automations for lead nurture and step recovery.
5. Step-by-step GoHighLevel Implementation & Deployment Guide.`;
        } else {
            compiledPrompt = `Build a complete GoHighLevel High-Converting Single-Page Landing Page & CRM Architecture based strictly on my specifications.

📄 Asset Type: Single-Page Landing Page (Standalone Page, NOT a multi-step funnel)
- Primary Conversion Goal: ${wizardState.landingGoal}
- Key Sections to Include on Single Page:
${wizardState.landingSections.map(s => '  • ' + s).join('\n')}
- Core Offer & Value Proposition: ${wizardState.offer}
- Target Audience: ${wizardState.audience}
- Business / Brand Name: ${wizardState.businessName}
- Problem Solved: ${wizardState.problemSolved}
- Why Choose Us: ${wizardState.whyChooseYou}
- Key Benefits / Features: ${wizardState.keyBenefits}
- Design Style & Look: ${wizardState.designStyle}
- Primary Brand Color: ${wizardState.primaryColor}

Please deliver:
1. Complete Single-File HTML Landing Page (<!DOCTYPE html> ... </html>) in a single code block. This is a single continuous page (NOT a multi-step hidden tab funnel). Include a sticky navigation bar with section anchors, Hero section, and all ${wizardState.landingSections.length} requested sections (${wizardState.landingSections.join(', ')}) with modern Tailwind CSS styling, responsive layout, interactive FAQ accordion, and lead capture form.
2. High-converting copywriting and conversion architecture.
3. GoHighLevel Form, Custom Fields, Pipeline & Lead Notification Tags.
4. Automated Speed-to-Lead Follow-up & Confirmation Workflow.
5. HighLevel Website/Page Deployment & Embedding Guide.`;
        }

        if (userInput) {
            userInput.value = compiledPrompt;
            userInput.style.height = 'auto';
            if (sendBtn) sendBtn.disabled = false;
            handleSendPrompt();
        }
    }

    // Initialize events
    initFunnelWizardEvents();

    // Global Keyboard Shortcut: Ctrl + K (or Cmd + K) for New Chat
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            createNewThread(true);
        }
    });

    // ==========================================
    // SIDEBAR & MODAL HANDLERS
    // ==========================================

    if (sidebarToggleBtn) sidebarToggleBtn.addEventListener('click', toggleSidebar);
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    function toggleSidebar() {
        if (sidebar.classList.contains('closed')) openSidebar();
        else closeSidebar();
    }

    function openSidebar() {
        sidebar.classList.remove('closed');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        localStorage.setItem('sidebar_closed', 'false');
    }

    function closeSidebar() {
        sidebar.classList.add('closed');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        localStorage.setItem('sidebar_closed', 'true');
    }

    // GHL Modal Events
    if (openGhlModalBtn) openGhlModalBtn.addEventListener('click', openGhlModal);
    if (sidebarConnectGhlBtn) sidebarConnectGhlBtn.addEventListener('click', openGhlModal);
    if (closeGhlModalBtn) closeGhlModalBtn.addEventListener('click', closeGhlModal);
    if (cancelGhlModalBtn) cancelGhlModalBtn.addEventListener('click', closeGhlModal);

    function openGhlModal() {
        ghlLocationIdInput.value = ghlConfig.locationId;
        ghlAccessTokenInput.value = ghlConfig.accessToken;
        clearGhlModalAlerts();
        ghlModal.classList.remove('hidden');
    }

    function closeGhlModal() {
        ghlModal.classList.add('hidden');
    }

    function clearGhlModalAlerts() {
        ghlModalError.classList.add('hidden');
        ghlModalSuccess.classList.add('hidden');
        ghlModalError.textContent = '';
        ghlModalSuccess.textContent = '';
    }

    if (saveGhlModalBtn) {
        saveGhlModalBtn.addEventListener('click', async () => {
            const locId = ghlLocationIdInput.value.trim();
            const token = ghlAccessTokenInput.value.trim();

            if (!locId || !token) {
                ghlModalError.textContent = 'Please provide both Location ID and Access Token.';
                ghlModalError.classList.remove('hidden');
                return;
            }

            clearGhlModalAlerts();
            setBtnLoading(saveGhlModalBtn, true);

            const res = await verifyGhlConnection(locId, token, true);
            setBtnLoading(saveGhlModalBtn, false);

            if (res.success) {
                ghlConfig.locationId = locId;
                ghlConfig.accessToken = token;
                ghlConfig.locationName = res.location_name || 'Sub-Account';
                localStorage.setItem('ghl_location_id', locId);
                localStorage.setItem('ghl_access_token', token);
                localStorage.setItem('ghl_location_name', ghlConfig.locationName);

                ghlModalSuccess.textContent = `Connected to GHL Sub-Account: ${ghlConfig.locationName}`;
                ghlModalSuccess.classList.remove('hidden');
                updateGHLStatusUI();
                setTimeout(closeGhlModal, 1200);
            } else {
                ghlModalError.textContent = `${res.message}`;
                ghlModalError.classList.remove('hidden');
            }
        });
    }

    async function verifyGhlConnection(locId, token, isTesting) {
        try {
            const response = await fetch('/api/ghl/verify-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_id: locId, access_token: token })
            });
            const data = await response.json();
            if (data.success) {
                ghlConfig.locationName = data.location_name || 'Sub-Account';
                updateGHLStatusUI(true);
            } else {
                if (!isTesting) updateGHLStatusUI(false);
            }
            return data;
        } catch (e) {
            return { success: false, message: 'Server connection error.' };
        }
    }

    function updateGHLStatusUI(isConnected) {
        const connected = isConnected !== undefined ? isConnected : Boolean(ghlConfig.locationId && ghlConfig.accessToken);
        if (connected) {
            ghlStatusPill.className = 'ghl-status-pill connected';
            ghlStatusLabel.textContent = ghlConfig.locationName || 'Connected';
            sidebarLocationName.textContent = ghlConfig.locationName || 'Connected Sub-Account';
            sidebarLocationId.textContent = `ID: ${ghlConfig.locationId}`;
        } else {
            ghlStatusPill.className = 'ghl-status-pill disconnected';
            ghlStatusLabel.textContent = 'Disconnected';
            sidebarLocationName.textContent = 'No Sub-Account';
            sidebarLocationId.textContent = 'Connect location to execute actions';
        }
    }

    function setBtnLoading(btn, isLoading) {
        if (!btn) return;
        if (isLoading) {
            btn.disabled = true;
            btn.setAttribute('data-original-text', btn.textContent);
            btn.textContent = 'Verifying...';
        } else {
            btn.disabled = false;
            btn.textContent = btn.getAttribute('data-original-text') || 'Save Connection';
        }
    }

    // ==========================================
    // CHAT EXECUTION & PROMPT QUEUE ENGINE
    // ==========================================

    if (userInput) {
        userInput.addEventListener('input', () => {
            userInput.style.height = 'auto';
            userInput.style.height = Math.min(userInput.scrollHeight, 180) + 'px';
            if (!isGenerating) {
                updateSendButtonState();
            }
        });

        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isGenerating) {
                e.preventDefault();
                abortCurrentGeneration();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isGenerating) {
                    abortCurrentGeneration();
                } else if (userInput.value.trim().length > 0 || (typeof pendingAttachments !== 'undefined' && pendingAttachments.length > 0)) {
                    handleSendPrompt();
                }
            }
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            if (isGenerating) {
                abortCurrentGeneration();
            } else {
                handleSendPrompt();
            }
        });
    }

    cardItems.forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            if (prompt) {
                if (userInput) {
                    userInput.value = prompt;
                    userInput.style.height = 'auto';
                }
                updateSendButtonState();
                handleSendPrompt();
            }
        });
    });

    chipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tmpl = btn.getAttribute('data-template');
            if (tmpl && userInput) {
                userInput.value = tmpl;
                userInput.focus();
                userInput.style.height = 'auto';
                userInput.style.height = Math.min(userInput.scrollHeight, 180) + 'px';
                updateSendButtonState();
            }
        });
    });

    function isFunnelOrLandingRequest(text) {
        if (!text) return false;
        const lower = text.toLowerCase().trim();

        // 1. Never intercept prompts that originated from our specifications studio or already contain full configurations
        if (lower.includes('configuration:') ||
            lower.includes('funnel plan & specifications:') ||
            lower.includes('strategic requirements') ||
            lower.includes('custom wizard specifications:') ||
            lower.includes('detailed specifications:') ||
            lower.includes('build a complete gohighlevel') ||
            lower.includes('special user requirements & freedom') ||
            lower.includes('funnel flow concept:') ||
            lower.includes('asset type:')) {
            return false;
        }

        // 2. Never intercept if user provided existing code (HTML/CSS/JS) or attachments
        if (typeof pendingAttachments !== 'undefined' && pendingAttachments && pendingAttachments.length > 0) {
            return false;
        }
        if (lower.includes('<!doctype') || lower.includes('<html') || lower.includes('```html') ||
            lower.includes('<body') || lower.includes('<div') || lower.includes('<section') ||
            lower.includes('<style') || lower.includes('class="') || lower.includes("class='") ||
            lower.includes('id="') || lower.includes("id='")) {
            return false;
        }

        // 3. Thread History Check:
        // If the current conversation thread ALREADY has a generated funnel/page HTML,
        // any subsequent prompt in this thread is a modification, tweak, fix, or follow-up!
        // NEVER show the modal unless the user explicitly asks for a BRAND NEW funnel from scratch.
        try {
            const activeThread = (typeof getThreadById === 'function' && typeof currentThreadId !== 'undefined' && currentThreadId) ? getThreadById(currentThreadId) : null;
            const hasExistingFunnelInThread = activeThread && activeThread.messages && activeThread.messages.some(m =>
                m.role === 'assistant' && (
                    m.content.includes('<!DOCTYPE') ||
                    m.content.includes('<html') ||
                    m.content.includes('```html') ||
                    m.content.includes('landing_page.html') ||
                    m.content.includes('switchStep')
                )
            );

            if (hasExistingFunnelInThread) {
                const isExplicitlyNewBuild = /\b(new\s+funnel|new\s+landing|fresh\s+funnel|another\s+funnel|brand\s*new\s+funnel|start\s+over|from\s+scratch|nayi\s+funnel|naya\s+funnel|dusri\s+funnel|alhada\s+funnel)\b/i.test(lower);
                if (!isExplicitlyNewBuild) {
                    return false; // Direct execution, do NOT show modal!
                }
            }
        } catch (e) {
            console.warn('Error checking thread history in isFunnelOrLandingRequest:', e);
        }

        // 4. Never intercept if the user is asking to EDIT, MODIFY, CHANGE, CORRECT, FIX, REMOVE, or UPDATE
        // Covers English and Roman Urdu / Hindi comprehensively
        const isModificationRequest =
            // Explicit modification / correction verbs
            /\b(change|changes|changing|modify|modification|modifications|modifying|update|updates|updating|edit|edits|editing|tweak|tweaks|adjust|adjustments|adjusting|fix|fixes|fixing|correct|corrects|correction|corrections|corect|corects|corection|corections|remove|removes|removing|removal|remov|delete|deletes|deleting|strip|clean|erase|hide|hidden|hiding|improve|improvement|refine|replace|replacement|swap|rewrite|redo|alter|revamp|redesign|patch|restyle)\b/i.test(lower) ||
            // Instructions / UI component adjustments ("make sure buttons are visible", "make button red", etc.)
            /\b(make\s+sure|make\s+it|make\s+them|ensure|visible|visibility|prominent|aligned|alignment|contrast)\b/i.test(lower) ||
            // Page / Step / Element references
            /\b(first\s+page|second\s+page|third\s+page|step\s*\d+|top\s*bar|navbar|header|hero|footer|button|buttons|heading|subheading|form|fields|input|testimonials?|faq|pricing)\b/i.test(lower) ||
            // Context markers: "in the funnel", "of the funnel", "to this funnel", "otherwise the funnel is...", "working fine"
            /\b(in\s+the\s+funnel|in\s+this\s+funnel|to\s+the\s+funnel|to\s+this\s+funnel|on\s+the\s+funnel|of\s+the\s+funnel|for\s+the\s+funnel|in\s+the\s+landing|to\s+the\s+landing|otherwise\s+the\s+funnel|funnel\s+is\s+good|working\s+fine)\b/i.test(lower) ||
            // Roman Urdu / Hindi edit & change phrases
            /\b(is\s*mein|ismein|is\s*me|isme|iss\s*mein|iss\s*me|is\s*ko|isko|iss\s*ko|yeh\s*changes|ye\s*changes|yeh\s*change|ye\s*change|badal|badlo|tabdeel|tabdeeli|theek\s*kro|theek\s*kr|theek\s*kardo|theek\s*kar\s*do|sahi\s*kro|sahi\s*kr|sahi\s*kardo|sahi\s*kar\s*do|kardo|krdo|kr\s*k\s*do|kar\s*k\s*do|hatao|hata\s*do|nikalo|nikal\s*do|door\s*kro|door\s*kar\s*do|change\s*kro|change\s*kr|changes\s*kro|changes\s*kr|update\s*kro|update\s*kr|edit\s*kro|edit\s*kr|modify\s*kro|modify\s*kr|daal\s*do|add\s*kro|aur\s*add)\b/i.test(lower) ||
            // Reference to existing assets
            /\b(existing|provided|above|current|previous|given|this\s+code|yeh\s+code|ye\s+code|is\s+code|this\s+funnel|is\s+funnel|this\s+landing|is\s+landing|this\s+page|is\s+page)\b/i.test(lower);

        if (isModificationRequest) {
            return false;
        }

        // 5. Target asset keywords for NEW creation
        const hasFunnel = /\b(funnel|funnels|sales\s*funnel|vsl\s*funnel|tripwire|squeeze\s*page|optin\s*page|opt-in\s*page)\b/i.test(lower);
        const hasLanding = /\b(landing\s*page|landingpage|lead\s*page|sales\s*page|one\s*pager|website|webpage)\b/i.test(lower);

        if (!hasFunnel && !hasLanding) return false;

        // Intent / Action verbs for CREATING NEW funnel
        // Note: Avoid bare \bmake\b which would falsely match "make sure", "make it blue", etc.
        const hasCreateAction =
            /\b(create|build|generate|setup|set\s*up|develop|design|construct|architect|give\s*me)\b/i.test(lower) ||
            /\bmake\s+(?:a|an|the|me|us|new)?\s*(?:[a-z0-9_-]+\s*){0,3}(?:funnel|landing|website|page|site)\b/i.test(lower) ||
            /\b(i\s+want|i\s+need|i\s+would\s+like|want\s+to\s+build|want\s+to\s+create|want\s+to\s+make|looking\s+to\s+build|need\s+a)\b.*?\b(funnel|landing\s*page)\b/i.test(lower) ||
            /\b(can\s+you|could\s+you|help\s+me|how\s+to)\s+(?:make|build|create|design|generate)\b.*?\b(funnel|landing\s*page)\b/i.test(lower) ||
            // Roman Urdu creation verbs: "funnel bana do", "funnel banani hai", "funnel chahiye", "funnel tayyar karo"
            /\b(funnel|landing\s*page)\s*(?:bana|bna|banao|banani|chahiye|tayyar|develop)\b/i.test(lower) ||
            /\b(bana|bna|banao|banani|tayyar)\s*(?:ek|aik|ik)?\s*(?:[a-z0-9_-]+\s*){0,2}(?:funnel|landing\s*page)\b/i.test(lower);

        if (hasCreateAction) return true;

        // Short queries for new builds e.g. "funnel", "landing page", "new funnel", "create a funnel"
        if (/^(a\s+)?(new\s+)?(funnel|landing\s*page|sales\s*page|vsl\s*funnel)[\s\.\?!]*$/i.test(lower)) return true;

        // Niche combos for new builds: "fitness funnel", "real estate landing page", "ecommerce funnel"
        if (/^(fitness|gym|real\s*estate|agency|coaching|ecommerce|restaurant|dental|contractor|crypto|saas|b2b)\s+(funnel|landing\s*page)[\s\.\?!]*$/i.test(lower)) return true;

        return false;
    }

    async function handleSendPrompt(promptOverride = null, existingElementId = null) {
        const prompt = promptOverride || userInput.value.trim();
        if (!prompt) return;

        // Auto-open Smart Specifications Studio for funnel or landing page requests (unless already generating)
        if (!isGenerating && isFunnelOrLandingRequest(prompt)) {
            userInput.value = '';
            userInput.style.height = 'auto';
            if (sendBtn) sendBtn.disabled = false;
            openWizardModal(prompt);
            return;
        }

        // IF CURRENTLY GENERATING: Put prompt into Pending Queue!
        if (isGenerating && !promptOverride) {
            userInput.value = '';
            userInput.style.height = 'auto';
            if (welcomeScreen) welcomeScreen.classList.add('hidden');

            const queuedElementId = 'queued_msg_' + Date.now();
            const queuedMsgWrap = appendMessageUI('user', prompt, null, true, queuedElementId);
            promptQueue.push({ prompt: prompt, elementId: queuedElementId });
            updateQueueUI();
            scrollToBottom();
            return;
        }

        // Start active generation
        isGenerating = true;
        updateSendButtonState();
        currentAbortController = new AbortController();

        // Extract prior history before appending new user prompt
        const activeThreadObj = getThreadById(currentThreadId);
        const history = (activeThreadObj && activeThreadObj.messages) ? activeThreadObj.messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
        })) : [];

        const currentAttachments = [...pendingAttachments];
        pendingAttachments = [];
        renderAttachmentPreviews();

        if (!promptOverride) {
            userInput.value = '';
            userInput.style.height = 'auto';
        }

        if (welcomeScreen) welcomeScreen.classList.add('hidden');

        // Append or activate User Message
        let userMsgWrap = null;
        if (existingElementId) {
            userMsgWrap = document.getElementById(existingElementId);
            if (userMsgWrap) {
                userMsgWrap.classList.remove('queued-message');
                const queuedBadge = userMsgWrap.querySelector('.queued-status-badge');
                if (queuedBadge) queuedBadge.remove();
            }
            addMessageToCurrentThread('user', prompt, [], existingElementId);
        } else {
            const msgId = 'msg_' + Date.now();
            userMsgWrap = appendMessageUI('user', prompt, msgId, false, null, currentAttachments);
            addMessageToCurrentThread('user', prompt, [], msgId);
        }

        if (userMsgWrap) {
            userMsgWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (loadingIndicator) loadingIndicator.classList.remove('hidden');

        const botMsgWrap = document.createElement('div');
        const botMsgId = 'msg_' + Date.now() + '_bot';
        botMsgWrap.className = 'message-wrapper assistant';
        botMsgWrap.id = botMsgId;
        botMsgWrap.innerHTML = `
            <div class="assistant-avatar thinking-pulse" id="current-bot-avatar">⚡</div>
            <div class="assistant-body" id="current-bot-body">
                <div class="ai-thinking-card" id="current-thinking-card">
                    <div class="ai-thinking-header">
                        <div class="thinking-spinner">
                            <div class="spinner-ring"></div>
                            <span class="sparkle-icon">✨</span>
                        </div>
                        <div class="thinking-text-wrapper">
                            <span class="thinking-title">Copilot is thinking...</span>
                            <span class="thinking-status" id="thinking-status-text">Analyzing prompt & scoping requirements...</span>
                        </div>
                    </div>
                    <div class="thinking-skeleton-lines">
                        <div class="skeleton-shimmer-line line-long"></div>
                        <div class="skeleton-shimmer-line line-medium"></div>
                        <div class="skeleton-shimmer-line line-short"></div>
                    </div>
                </div>
            </div>
            <div class="message-actions-bar">
                <button type="button" class="msg-action-btn copy-msg-btn" title="Copy Response">📋</button>
                <button type="button" class="msg-action-btn delete delete-msg-btn" title="Delete Message">🗑️</button>
            </div>
        `;
        messagesList.appendChild(botMsgWrap);
        bindMessageActions(botMsgWrap, botMsgId);

        const botBodyEl = botMsgWrap.querySelector('.assistant-body');
        const botAvatarEl = botMsgWrap.querySelector('.assistant-avatar');

        // Dynamic cycling thinking status messages
        const thinkingStatuses = [
            'Analyzing prompt & scoping requirements...',
            'Formulating smart clarifying questions & blueprint...',
            'Checking HighLevel taxonomy & pipelines...',
            'Preparing execution strategy...',
            'Streaming response...'
        ];
        let statusIdx = 0;
        const statusInterval = setInterval(() => {
            statusIdx = (statusIdx + 1) % thinkingStatuses.length;
            const statusEl = document.getElementById('thinking-status-text');
            if (statusEl) {
                statusEl.style.opacity = '0';
                setTimeout(() => {
                    if (statusEl) {
                        statusEl.textContent = thinkingStatuses[statusIdx];
                        statusEl.style.opacity = '1';
                    }
                }, 180);
            }
        }, 1500);

        function removeThinkingState() {
            clearInterval(statusInterval);
            const thinkingCard = document.getElementById('current-thinking-card');
            if (thinkingCard) thinkingCard.remove();
            if (botAvatarEl) botAvatarEl.classList.remove('thinking-pulse');
        }

        // Typewriter Streaming Engine
        let typewriterQueue = '';
        let displayedText = '';
        let isTypewriterRunning = false;
        let isStreamDone = false;
        let recordedBadges = [];

        window._stopActiveStream = () => {
            isStreamDone = true;
            typewriterQueue = '';
            isTypewriterRunning = false;
            removeThinkingState();
            const stopMsg = (displayedText ? '\n\n' : '') + '*[Response generation stopped by user]*';
            let textContainer = botBodyEl.querySelector('.agent-markdown-text');
            if (textContainer) {
                textContainer.innerHTML = safeMarkdown(displayedText + stopMsg);
            } else {
                botBodyEl.innerHTML = safeMarkdown(stopMsg);
            }
            addMessageToCurrentThread('assistant', (displayedText || '') + stopMsg, recordedBadges, botMsgId);
            onGenerationComplete();
        };

        function onGenerationComplete() {
            window._stopActiveStream = null;
            isGenerating = false;
            currentAbortController = null;
            updateSendButtonState();
            if (loadingIndicator) loadingIndicator.classList.add('hidden');

            // Process next prompt in queue if any exists!
            if (promptQueue.length > 0) {
                const nextItem = promptQueue.shift();
                updateQueueUI();
                setTimeout(() => {
                    handleSendPrompt(nextItem.prompt, nextItem.elementId);
                }, 300);
            }
        }

        function processTypewriterTick() {
            if (typewriterQueue.length > 0) {
                const qLen = typewriterQueue.length;
                let stepSize = 24;
                if (isStreamDone) stepSize = qLen; // flush instantly when stream completes
                else if (qLen > 300) stepSize = 160;
                else if (qLen > 100) stepSize = 80;
                else if (qLen > 40) stepSize = 40;

                const chunk = typewriterQueue.slice(0, stepSize);
                typewriterQueue = typewriterQueue.slice(stepSize);
                displayedText += chunk;

                let textContainer = botBodyEl.querySelector('.agent-markdown-text');
                if (!textContainer) {
                    textContainer = document.createElement('div');
                    textContainer.className = 'agent-markdown-text';
                    botBodyEl.appendChild(textContainer);
                }
                textContainer.innerHTML = safeMarkdown(displayedText) + '<span class="streaming-cursor"></span>';
            }

            if (typewriterQueue.length > 0 || !isStreamDone) {
                setTimeout(processTypewriterTick, 4);
            } else {
                isTypewriterRunning = false;
                if (displayedText && (displayedText.split('```').length - 1) % 2 !== 0) {
                    displayedText += '\n```\n';
                }
                let textContainer = botBodyEl.querySelector('.agent-markdown-text');
                if (textContainer && displayedText) {
                    textContainer.innerHTML = safeMarkdown(displayedText);
                }
                if (displayedText) {
                    addMessageToCurrentThread('assistant', displayedText, recordedBadges, botMsgId);
                }
                fetchModelsCatalog();
                onGenerationComplete();
            }
        }

        function enqueueIncomingChunk(text) {
            removeThinkingState();
            typewriterQueue += text;
            if (!isTypewriterRunning) {
                isTypewriterRunning = true;
                processTypewriterTick();
            }
        }

        try {
            const response = await fetch('/api/chat-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: currentAbortController.signal,
                body: JSON.stringify({
                    prompt: prompt,
                    location_id: ghlConfig.locationId,
                    access_token: ghlConfig.accessToken,
                    selected_model: modelSelector ? modelSelector.value : 'groq/compound-mini',
                    history: history,
                    attachments: currentAttachments
                })
            });

            if (!response.ok) {
                removeThinkingState();
                const errData = await response.json().catch(() => ({ detail: response.statusText }));
                const errMsg = `⚠️ **Error (${response.status}):** ${errData.detail || 'Execution failed.'}`;
                if (displayedText && displayedText.length > 0) {
                    if ((displayedText.split('```').length - 1) % 2 !== 0) {
                        displayedText += '\n```\n';
                    }
                    displayedText += `\n\n> ${errMsg}\n> *(All content generated above has been preserved)*`;
                    let textContainer = botBodyEl.querySelector('.agent-markdown-text');
                    if (textContainer) {
                        textContainer.innerHTML = safeMarkdown(displayedText);
                    }
                } else {
                    botBodyEl.innerHTML = safeMarkdown(errMsg);
                }
                addMessageToCurrentThread('assistant', displayedText || errMsg, [], botMsgId);
                onGenerationComplete();
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.replace('data: ', '').trim();
                        if (!jsonStr) continue;
                        try {
                            const data = JSON.parse(jsonStr);

                            if (data.type === 'tool_start') {
                                removeThinkingState();
                                const toolBadge = document.createElement('div');
                                toolBadge.className = 'tool-execution-badge';
                                toolBadge.innerHTML = `⚡ Invoking GHL API: <strong>${data.name}</strong> (${escapeHtml(JSON.stringify(data.args))})`;
                                botBodyEl.appendChild(toolBadge);
                                recordedBadges.push({ type: 'tool_start', text: toolBadge.innerHTML });
                            } else if (data.type === 'tool_result') {
                                removeThinkingState();
                                const resultBadge = document.createElement('div');
                                const isSuccess = data.result && data.result.success !== false;
                                resultBadge.className = isSuccess ? 'tool-execution-badge success' : 'tool-execution-badge error';
                                const errMsg = data.result.error || data.result.message || 'Action failed';
                                const isAuthErr = !isSuccess && (errMsg.includes('Location ID') || errMsg.includes('Token') || errMsg.includes('401') || errMsg.includes('404'));

                                resultBadge.innerHTML = isSuccess ?
                                    `✅ Action Executed: ${data.result.message || 'Asset Created'}` :
                                    `❌ Action Failed: ${errMsg} ${isAuthErr ? '<button type="button" class="connect-ghl-btn inline-connect-trigger" style="margin-left: 10px; font-size: 11px; padding: 3px 10px;">Connect Location</button>' : ''}`;

                                botBodyEl.appendChild(resultBadge);
                                recordedBadges.push({ type: 'tool_result', text: resultBadge.innerHTML, isSuccess: isSuccess });

                                const inlineTrigger = resultBadge.querySelector('.inline-connect-trigger');
                                if (inlineTrigger) {
                                    inlineTrigger.addEventListener('click', openGhlModal);
                                }
                            } else if (data.type === 'replace_content') {
                                removeThinkingState();
                                const newText = data.text || '';
                                if (displayedText && displayedText.length > 200 && !newText.includes('<!DOCTYPE') && !newText.includes('```html')) {
                                    enqueueIncomingChunk('\n\n' + newText);
                                } else {
                                    typewriterQueue = '';
                                    displayedText = newText;
                                    let textContainer = botBodyEl.querySelector('.agent-markdown-text');
                                    if (textContainer) {
                                        textContainer.innerHTML = safeMarkdown(displayedText);
                                    }
                                }
                            } else if (data.type === 'chunk') {
                                enqueueIncomingChunk(data.text || '');
                            } else if (data.type === 'usage_update') {
                                if (data.model && data.stats) {
                                    const modelObj = cachedModelsData.find(m => m.id === data.model);
                                    if (modelObj) {
                                        modelObj.usage = data.stats;
                                        updateActiveModelUsageDisplay();
                                    }
                                }
                            } else if (data.type === 'done') {
                                isStreamDone = true;
                            }
                        } catch (e) {
                            console.warn('JSON parse error:', e);
                        }
                    }
                }
            }

            isStreamDone = true;
            if (!isTypewriterRunning) {
                removeThinkingState();
                onGenerationComplete();
            }
        } catch (err) {
            removeThinkingState();
            if (err.name === 'AbortError') {
                isStreamDone = true;
                typewriterQueue = '';
                isTypewriterRunning = false;
                const stopMsg = (displayedText ? '\n\n' : '') + '*[Response generation stopped by user]*';
                let textContainer = botBodyEl.querySelector('.agent-markdown-text');
                if (textContainer) {
                    textContainer.innerHTML = safeMarkdown(displayedText + stopMsg);
                } else {
                    botBodyEl.innerHTML = safeMarkdown(stopMsg);
                }
                addMessageToCurrentThread('assistant', (displayedText || '') + stopMsg, recordedBadges, botMsgId);
            } else {
                const errStr = `\n\n> ⚠️ **Notice:** Generation interrupted (${err.message}). All content generated above has been preserved.`;
                if (displayedText && displayedText.length > 0) {
                    if ((displayedText.split('```').length - 1) % 2 !== 0) {
                        displayedText += '\n```\n';
                    }
                    displayedText += errStr;
                    let textContainer = botBodyEl.querySelector('.agent-markdown-text');
                    if (textContainer) {
                        textContainer.innerHTML = safeMarkdown(displayedText);
                    }
                    addMessageToCurrentThread('assistant', displayedText, recordedBadges, botMsgId);
                } else {
                    botBodyEl.innerHTML = safeMarkdown(errStr);
                    addMessageToCurrentThread('assistant', errStr, [], botMsgId);
                }
            }
            onGenerationComplete();
        }
    }

    function appendMessageUI(role, content, messageId = null, isQueued = false, customElementId = null, attachments = []) {
        const msgWrap = document.createElement('div');
        const id = customElementId || messageId || ('msg_' + Date.now());
        msgWrap.id = id;
        msgWrap.className = `message-wrapper ${role} ${isQueued ? 'queued-message' : ''}`;
        msgWrap.setAttribute('data-content', content);

        let attachmentsHtml = '';
        if (attachments && attachments.length > 0) {
            attachmentsHtml = `
                <div class="user-attachments-grid">
                    ${attachments.map(att => {
                const isImg = att.type === 'image' || (att.mime_type && att.mime_type.startsWith('image/'));
                if (isImg) {
                    return `<img src="${att.data}" class="user-att-preview-img" alt="${escapeHtml(att.name)}" title="${escapeHtml(att.name)}" onclick="window.open('${att.data}', '_blank')">`;
                } else {
                    return `<div class="user-att-doc-pill"><span>${getFileIcon(att.name)}</span> <span>${escapeHtml(att.name)}</span></div>`;
                }
            }).join('')}
                </div>
            `;
        }

        if (role === 'user') {
            const isLong = (content && (content.length > 140 || content.split('\n').length > 2));
            msgWrap.innerHTML = `
                <div class="user-body">
                    ${isQueued ? '<div class="queued-status-badge">⏳ Queued — Will generate next</div>' : ''}
                    ${attachmentsHtml}
                    <div class="user-prompt-text ${isLong ? 'is-collapsed' : ''}">${escapeHtml(content)}</div>
                    ${isLong ? `
                        <button type="button" class="user-prompt-expand-btn" title="Click to show full prompt">
                            <span class="expand-label">Show more</span>
                            <svg class="expand-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    ` : ''}
                </div>
                <div class="user-avatar">👤</div>
                <div class="message-actions-bar">
                    <button type="button" class="msg-action-btn copy-msg-btn" title="Copy Message">📋</button>
                    <button type="button" class="msg-action-btn delete delete-msg-btn" title="Delete Message">🗑️</button>
                </div>
            `;

            if (isLong) {
                const expandBtn = msgWrap.querySelector('.user-prompt-expand-btn');
                const promptTextEl = msgWrap.querySelector('.user-prompt-text');

                const toggleExpand = (e) => {
                    if (e) e.stopPropagation();
                    const isCurrentlyCollapsed = promptTextEl.classList.contains('is-collapsed');
                    if (isCurrentlyCollapsed) {
                        promptTextEl.classList.remove('is-collapsed');
                        promptTextEl.classList.add('is-expanded');
                        if (expandBtn) {
                            expandBtn.querySelector('.expand-label').textContent = 'Show less';
                            const icon = expandBtn.querySelector('.expand-icon');
                            if (icon) icon.style.transform = 'rotate(180deg)';
                        }
                    } else {
                        promptTextEl.classList.add('is-collapsed');
                        promptTextEl.classList.remove('is-expanded');
                        if (expandBtn) {
                            expandBtn.querySelector('.expand-label').textContent = 'Show more';
                            const icon = expandBtn.querySelector('.expand-icon');
                            if (icon) icon.style.transform = 'rotate(0deg)';
                        }
                    }
                };

                if (expandBtn) expandBtn.addEventListener('click', toggleExpand);
                if (promptTextEl) {
                    promptTextEl.addEventListener('click', (e) => {
                        if (promptTextEl.classList.contains('is-collapsed')) {
                            toggleExpand(e);
                        }
                    });
                }
            }
        }
        messagesList.appendChild(msgWrap);
        bindMessageActions(msgWrap, id);
        return msgWrap;
    }

    function renderAssistantMessageUI(msg) {
        const msgWrap = document.createElement('div');
        const id = msg.id || ('msg_' + Date.now());
        msgWrap.id = id;
        msgWrap.className = 'message-wrapper assistant';
        msgWrap.setAttribute('data-content', msg.content || '');

        let badgesHtml = '';
        if (msg.toolBadges && msg.toolBadges.length > 0) {
            badgesHtml = msg.toolBadges.map(b => `
                <div class="tool-execution-badge ${b.isSuccess === false ? 'error' : (b.isSuccess === true ? 'success' : '')}">${b.text}</div>
            `).join('');
        }

        const parsedContent = safeMarkdown(msg.content || '');
        msgWrap.innerHTML = `
            <div class="assistant-avatar">⚡</div>
            <div class="assistant-body">
                ${badgesHtml}
                <div class="agent-markdown-text">${parsedContent}</div>
            </div>
            <div class="message-actions-bar">
                <button type="button" class="msg-action-btn copy-msg-btn" title="Copy Response">📋</button>
                <button type="button" class="msg-action-btn delete delete-msg-btn" title="Delete Message">🗑️</button>
            </div>
        `;
        messagesList.appendChild(msgWrap);
        bindMessageActions(msgWrap, id);
    }

    function bindMessageActions(msgWrap, messageId) {
        const copyBtn = msgWrap.querySelector('.copy-msg-btn');
        const deleteBtn = msgWrap.querySelector('.delete-msg-btn');

        if (copyBtn) {
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = msgWrap.getAttribute('data-content') || msgWrap.querySelector('.agent-markdown-text, .user-body')?.textContent || '';
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.textContent = '✓';
                    setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
                });
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMessageFromThread(messageId, msgWrap);
            });
        }
    }

    function scrollToBottom() {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    function scrollToLastUserQuery() {
        if (!chatContainer || !messagesList) return;
        const userMessages = messagesList.querySelectorAll('.message-wrapper.user');
        if (userMessages.length > 0) {
            const lastUserMsg = userMessages[userMessages.length - 1];
            if (lastUserMsg) {
                const containerRect = chatContainer.getBoundingClientRect();
                const msgRect = lastUserMsg.getBoundingClientRect();
                const targetScrollTop = chatContainer.scrollTop + (msgRect.top - containerRect.top) - 18;
                chatContainer.scrollTo({
                    top: Math.max(0, targetScrollTop),
                    behavior: 'smooth'
                });
                return;
            }
        }
        chatContainer.scrollTop = 0;
    }
    function safeMarkdown(rawText) {
        if (!rawText) return '';
        if (typeof marked === 'undefined') return escapeHtml(rawText);
        try {
            const rawHtml = marked.parse(rawText);
            if (typeof DOMPurify !== 'undefined') {
                return DOMPurify.sanitize(rawHtml, {
                    ADD_ATTR: ['target', 'data-code', 'data-funnel-action'],
                    ADD_TAGS: ['iframe']
                });
            }
            return rawHtml;
        } catch (e) {
            console.error("Markdown parse error:", e);
            return escapeHtml(rawText);
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
});