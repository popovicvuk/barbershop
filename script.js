document.addEventListener('DOMContentLoaded', () => {
    // Current Date Tracking
    let currentDate = new Date();
    let selectedDate = null;
    let selectedTime = null;

    // Elements
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');
    
    const selectedDateInfo = document.getElementById('selected-date-info');
    const timeSlotsGrid = document.getElementById('time-slots');
    const backToCalBtn = document.getElementById('back-to-cal');
    const backToTimeBtn = document.getElementById('back-to-time');
    
    const confirmDatetimeDisplay = document.getElementById('confirm-datetime-display');
    const clientNameInput = document.getElementById('client-name');
    const btnConfirmBooking = document.getElementById('btn-confirm-booking');
    const confirmationDetails = document.getElementById('booking-confirmation-details');
    const btnNewBooking = document.getElementById('btn-new-booking');

    // Admin Elements
    const openAdminLogin = document.getElementById('open-admin-login');
    const adminModal = document.getElementById('admin-modal');
    const closeAdminLogin = document.getElementById('close-admin-login');
    const adminPassword = document.getElementById('admin-password');
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const adminError = document.getElementById('admin-error');
    const mainSite = document.getElementById('main-site');
    const adminDashboard = document.getElementById('admin-dashboard');
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    const adminDatePicker = document.getElementById('admin-date-picker');
    const adminTableBody = document.getElementById('admin-table-body');
    const noBookingsMsg = document.getElementById('no-bookings-msg');

    const confirmModal = document.getElementById('confirm-modal');
    const btnConfirmOk = document.getElementById('btn-confirm-ok');
    const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
    let onConfirmFunc = null;

    const editModal = document.getElementById('edit-modal');
    const editClientNameInput = document.getElementById('edit-client-name');
    const btnEditSave = document.getElementById('btn-edit-save');
    const btnEditCancel = document.getElementById('btn-edit-cancel');
    let onEditSaveFunc = null;

    const months = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

    // ─── API Helper Functions ─────────────────────────────────────────────────
    
    // Auto-detect server base if using Live Server
    const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
    const API_BASE = isLocalhost && window.location.port !== '3000' ? 'http://localhost:3000' : '';

    // Fetch bookings for a specific date, returns object { "10:00": "Marko", ... }
    async function getBookingsForDate(dateStr) {
        try {
            const res = await fetch(`${API_BASE}/api/bookings?date=${dateStr}`);
            const json = await res.json();
            if (!json.success) return {};
            // Convert array rows to { time: client_name } map
            const map = {};
            for (const row of json.data) {
                map[row.time] = row.client_name;
            }
            return map;
        } catch (err) {
            console.error('Greška pri učitavanju termina:', err);
            return {};
        }
    }

    async function saveBooking(dateStr, timeStr, name) {
        try {
            const res = await fetch(`${API_BASE}/api/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateStr, time: timeStr, client_name: name })
            });
            const json = await res.json();
            if (!json.success) {
                console.error('Greška pri čuvanju termina:', json.error);
                // Alert only if it's not a Conflict
                if (res.status !== 409) {
                   alert('Greška servera: ' + json.error);
                   return { ok: false, errorType: 'server' };
                }
                return { ok: false, errorType: 'conflict' };
            }
            return { ok: true };
        } catch (err) {
            console.error('Mrežna greška:', err);
            alert('Greška u komunikaciji sa serverom. Da li ste pokrenuli server.js?');
            return { ok: false, errorType: 'network' };
        }
    }

    async function updateBooking(dateStr, timeStr, newName) {
        try {
            const res = await fetch(`${API_BASE}/api/bookings/${dateStr}/${timeStr}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_name: newName })
            });
            const json = await res.json();
            return json.success;
        } catch (err) {
            console.error('Mrežna greška:', err);
            return false;
        }
    }

    async function removeBooking(dateStr, timeStr) {
        try {
            const res = await fetch(`${API_BASE}/api/bookings/${dateStr}/${timeStr}`, {
                method: 'DELETE'
            });
            const json = await res.json();
            return json.success;
        } catch (err) {
            console.error('Mrežna greška:', err);
            return false;
        }
    }

    function getFormattedDateForKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // ─── CLIENT FLOW ─────────────────────────────────────────────────────────

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        monthYearDisplay.textContent = `${months[month]} ${year}`;

        let firstDay = new Date(year, month, 1).getDay();
        firstDay = firstDay === 0 ? 6 : firstDay - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0,0,0,0);
        
        // Max 7 days limit
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 7);

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'cal-day empty';
            calendarGrid.appendChild(emptyDiv);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'cal-day';
            dayDiv.textContent = i;

            const iterDate = new Date(year, month, i);
            
            if (iterDate < today || iterDate >= maxDate) {
                dayDiv.classList.add('disabled');
            } else {
                if (iterDate.getDay() === 0) {
                    dayDiv.classList.add('disabled');
                    dayDiv.title = 'Ne radimo nedeljom';
                } else {
                    dayDiv.addEventListener('click', () => selectDate(iterDate, dayDiv));
                }
            }

            if (iterDate.getTime() === today.getTime()) dayDiv.classList.add('today');
            if (selectedDate && iterDate.getTime() === selectedDate.getTime()) dayDiv.classList.add('selected');

            calendarGrid.appendChild(dayDiv);
        }
    }

    function selectDate(date, element) {
        selectedDate = date;
        const day = String(date.getDate()).padStart(2, '0');
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();
        
        selectedDateInfo.textContent = `Odabrano: ${day}. ${monthName} ${year}.`;
        
        goToStep(2);
        generateTimeSlots(date);
    }

    async function generateTimeSlots(date) {
        timeSlotsGrid.innerHTML = '<p style="color:var(--text-secondary);grid-column:1/-1;text-align:center;">Učitavanje termina...</p>';
        const dayOfWeek = date.getDay();
        
        let startHour = 8;
        let endHour = dayOfWeek === 6 ? 14 : 18;

        const now = new Date();
        const dateKey = getFormattedDateForKey(date);
        const bookedSlots = await getBookingsForDate(dateKey);

        timeSlotsGrid.innerHTML = '';

        for (let h = startHour; h < endHour; h++) {
            for (let m of [0, 30]) {
                const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                const slotBtn = document.createElement('button');
                slotBtn.className = 'time-slot';
                slotBtn.textContent = timeString;

                const slotDateTime = new Date(date);
                slotDateTime.setHours(h, m, 0, 0);

                if (slotDateTime < now) {
                    slotBtn.classList.add('booked');
                    slotBtn.title = 'Termin je prošao';
                } else if (bookedSlots[timeString]) {
                    slotBtn.classList.add('booked');
                    slotBtn.title = bookedSlots[timeString] === 'BLOKIRANO' ? 'Termin je blokiran' : 'Termin je već zauzet';
                } else {
                    slotBtn.addEventListener('click', () => confirmSlotStep(timeString));
                }

                timeSlotsGrid.appendChild(slotBtn);
            }
        }
    }

    function confirmSlotStep(time) {
        selectedTime = time;
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const monthName = months[selectedDate.getMonth()];
        
        confirmDatetimeDisplay.textContent = `${day}. ${monthName} u ${time}h`;
        clientNameInput.value = '';
        clientNameInput.style.borderColor = '';
        
        goToStep(3);
    }

    btnConfirmBooking.addEventListener('click', async () => {
        const name = clientNameInput.value.trim();
        if (!name) {
            clientNameInput.style.borderColor = 'var(--error-color)';
            return;
        }

        btnConfirmBooking.disabled = true;
        btnConfirmBooking.textContent = 'Čuvam...';

        const dateKey = getFormattedDateForKey(selectedDate);
        const result = await saveBooking(dateKey, selectedTime, name);

        btnConfirmBooking.disabled = false;
        btnConfirmBooking.textContent = 'Potvrdi Termin';

        if (result.ok) {
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const monthName = months[selectedDate.getMonth()];
            confirmationDetails.textContent = `Vidimo se ${day}. ${monthName} u ${selectedTime}h, ${name}.`;
            goToStep(4);
        } else if (result.errorType === 'conflict') {
            alert('Termin je u međuvremenu zauzet ili blokiran. Molimo odaberite drugi termin.');
            generateTimeSlots(selectedDate);
            goToStep(2);
        }
        // If it's network or server error, we leave them on the current step so they can try again once they fix the server.
    });

    function goToStep(stepNumber) {
        step1.classList.remove('active');
        step2.classList.remove('active');
        step3.classList.remove('active');
        step4.classList.remove('active');

        if (stepNumber === 1) step1.classList.add('active');
        if (stepNumber === 2) step2.classList.add('active');
        if (stepNumber === 3) step3.classList.add('active');
        if (stepNumber === 4) step4.classList.add('active');
    }

    // ─── EVENT LISTENERS ─────────────────────────────────────────────────────
    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
    backToCalBtn.addEventListener('click', () => goToStep(1));
    backToTimeBtn.addEventListener('click', () => goToStep(2));
    btnNewBooking.addEventListener('click', () => {
        selectedTime = null;
        renderCalendar();
        goToStep(1);
    });

    // Custom Modal logic
    function showConfirm(title, text, onConfirm) {
        document.getElementById('confirm-modal-title').textContent = title;
        document.getElementById('confirm-modal-text').textContent = text;
        confirmModal.classList.add('active');
        onConfirmFunc = onConfirm;
    }

    btnConfirmOk.addEventListener('click', () => {
        if (onConfirmFunc) onConfirmFunc();
        confirmModal.classList.remove('active');
    });

    btnConfirmCancel.addEventListener('click', () => {
        confirmModal.classList.remove('active');
    });

    // Edit Modal logic
    function showEditModal(currentName, onSave) {
        editClientNameInput.value = currentName;
        editModal.classList.add('active');
        onEditSaveFunc = onSave;
        setTimeout(() => editClientNameInput.focus(), 100);
    }

    btnEditSave.addEventListener('click', () => {
        const newName = editClientNameInput.value.trim();
        if (onEditSaveFunc) {
            onEditSaveFunc(newName);
            editModal.classList.remove('active');
        }
    });

    editClientNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            btnEditSave.click();
        } else if (e.key === 'Escape') {
            btnEditCancel.click();
        }
    });

    btnEditCancel.addEventListener('click', () => {
        editModal.classList.remove('active');
    });

    // ─── ADMIN FLOW ───────────────────────────────────────────────────────────
    openAdminLogin.addEventListener('click', () => {
        adminModal.classList.add('active');
        adminError.style.display = 'none';
        adminPassword.value = '';
    });

    closeAdminLogin.addEventListener('click', () => {
        adminModal.classList.remove('active');
    });

    btnAdminLogin.addEventListener('click', () => {
        if (adminPassword.value === 'admin123') {
            adminModal.classList.remove('active');
            mainSite.style.display = 'none';
            adminDashboard.style.display = 'block';
            
            const todayStr = getFormattedDateForKey(new Date());
            adminDatePicker.value = todayStr;
            renderAdminTable(todayStr);
        } else {
            adminError.textContent = 'Pogrešna lozinka!';
            adminError.style.display = 'block';
        }
    });

    btnAdminLogout.addEventListener('click', () => {
        adminDashboard.style.display = 'none';
        mainSite.style.display = 'block';
        if (selectedDate) generateTimeSlots(selectedDate);
    });

    adminDatePicker.addEventListener('change', (e) => {
        renderAdminTable(e.target.value);
    });

    async function renderAdminTable(dateStr) {
        adminTableBody.innerHTML = '';
        
        const dayOfWeek = new Date(dateStr).getDay();
        if (dayOfWeek === 0) {
            noBookingsMsg.textContent = 'Nedeljom ne radimo.';
            noBookingsMsg.style.display = 'block';
            adminTableBody.parentElement.style.display = 'none';
            return;
        }

        noBookingsMsg.textContent = 'Učitavanje...';
        noBookingsMsg.style.display = 'block';
        adminTableBody.parentElement.style.display = 'none';

        let startHour = 8;
        let endHour = dayOfWeek === 6 ? 14 : 18;
        
        const dateBookings = await getBookingsForDate(dateStr);
        
        noBookingsMsg.style.display = 'none';
        adminTableBody.parentElement.style.display = 'table';

        for (let h = startHour; h < endHour; h++) {
            for (let m of [0, 30]) {
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                const clientName = dateBookings[timeStr];
                
                const tr = document.createElement('tr');
                
                const tdTime = document.createElement('td');
                tdTime.textContent = timeStr;
                tdTime.style.fontWeight = 'bold';
                
                const tdName = document.createElement('td');
                tdName.textContent = clientName || 'Slobodno';
                if (!clientName) tdName.style.color = 'var(--text-secondary)';
                if (clientName === 'BLOKIRANO') tdName.style.color = 'var(--error-color)';
                
                const tdActions = document.createElement('td');
                tdActions.className = 'admin-actions';
                
                if (clientName && clientName !== 'BLOKIRANO') {
                    // Edit Button
                    const btnEdit = document.createElement('button');
                    btnEdit.className = 'btn-action btn-edit';
                    btnEdit.innerHTML = '<span>✏️</span> Izmeni';
                    btnEdit.onclick = () => {
                        showEditModal(clientName, async (newName) => {
                            if (newName === '') {
                                await removeBooking(dateStr, timeStr);
                            } else {
                                await updateBooking(dateStr, timeStr, newName);
                            }
                            renderAdminTable(dateStr);
                        });
                    };
                    
                    // Delete Button
                    const btnDel = document.createElement('button');
                    btnDel.className = 'btn-action btn-delete';
                    btnDel.innerHTML = '<span>🗑️</span> Otkaži';
                    btnDel.onclick = () => {
                        showConfirm(
                            'Otkaži Termin?', 
                            `Da li ste sigurni da želite da otkažete termin u ${timeStr}h za klijenta: ${clientName}?`,
                            async () => {
                                await removeBooking(dateStr, timeStr);
                                renderAdminTable(dateStr);
                            }
                        );
                    };
                    
                    tdActions.appendChild(btnEdit);
                    tdActions.appendChild(btnDel);
                } else if (clientName === 'BLOKIRANO') {
                    const btnUnblock = document.createElement('button');
                    btnUnblock.className = 'btn-action btn-edit';
                    btnUnblock.innerHTML = '<span>🔓</span> Odblokiraj';
                    btnUnblock.onclick = async () => {
                        await removeBooking(dateStr, timeStr);
                        renderAdminTable(dateStr);
                    };
                    tdActions.appendChild(btnUnblock);
                } else {
                    const btnBlock = document.createElement('button');
                    btnBlock.className = 'btn-action btn-delete';
                    btnBlock.innerHTML = '<span>🚫</span> Blokiraj';
                    btnBlock.onclick = async () => {
                        await saveBooking(dateStr, timeStr, 'BLOKIRANO');
                        renderAdminTable(dateStr);
                    };
                    tdActions.appendChild(btnBlock);
                }

                tr.appendChild(tdTime);
                tr.appendChild(tdName);
                tr.appendChild(tdActions);
                adminTableBody.appendChild(tr);
            }
        }
    }

    // Initialize
    renderCalendar();
});
