  // Data global
        let currentLocation = { lat: null, lng: null };
        let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || [];
        let deviceFingerprint = generateDeviceFingerprint();
        
        // Inisialisasi aplikasi
        document.addEventListener('DOMContentLoaded', function() {
            updateDateTime();
            setInterval(updateDateTime, 1000);
            getCurrentLocation();
            loadTodayHistory();
            loadTodaySchedule();
        });
        
        // Update waktu dan tanggal
        function updateDateTime() {
            const now = new Date();
            const timeOptions = { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
            };
            const dateOptions = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            
            document.getElementById('currentTime').textContent = now.toLocaleTimeString('id-ID', timeOptions);
            document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', dateOptions);
        }
        
        // Mendapatkan lokasi GPS
        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        currentLocation.lat = position.coords.latitude.toFixed(6);
                        currentLocation.lng = position.coords.longitude.toFixed(6);
                        document.getElementById('latitude').textContent = currentLocation.lat;
                        document.getElementById('longitude').textContent = currentLocation.lng;
                    },
                    function(error) {
                        console.log('Error getting location:', error);
                        document.getElementById('latitude').textContent = 'Tidak tersedia';
                        document.getElementById('longitude').textContent = 'Tidak tersedia';
                    }
                );
            }
        }
        
        // Generate device fingerprint
        function generateDeviceFingerprint() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Device fingerprint', 2, 2);
            
            const fingerprint = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screenResolution: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                canvas: canvas.toDataURL(),
                timestamp: Date.now()
            };
            
            return btoa(JSON.stringify(fingerprint));
        }
        
        // Submit absensi
        function submitAttendance() {
            const teacherId = document.getElementById('teacherId').value.trim();
            const teacherName = document.getElementById('teacherName').value.trim();
            const attendanceType = document.getElementById('attendanceType').value;
            const notes = document.getElementById('notes').value.trim();
            
            // Validasi input
            if (!teacherId || !teacherName || !attendanceType) {
                alert('Mohon lengkapi semua field yang wajib diisi!');
                return;
            }
            
            // Validasi NIP (contoh: harus 18 digit)
            if (teacherId.length < 8) {
                alert('NIP harus minimal 8 karakter!');
                return;
            }
            
            // Cek duplikasi absensi
            const today = new Date().toDateString();
            const existingRecord = attendanceData.find(record => 
                record.date === today && 
                record.teacherId === teacherId && 
                record.type === attendanceType
            );
            
            if (existingRecord) {
                alert('Anda sudah melakukan absensi ' + attendanceType + ' hari ini!');
                return;
            }
            
            // Tampilkan modal konfirmasi
            const confirmDetails = `
                <div class="space-y-2">
                    <div><strong>NIP:</strong> ${teacherId}</div>
                    <div><strong>Nama:</strong> ${teacherName}</div>
                    <div><strong>Jenis:</strong> ${attendanceType}</div>
                    <div><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}</div>
                    <div><strong>Lokasi:</strong> ${currentLocation.lat}, ${currentLocation.lng}</div>
                </div>
            `;
            document.getElementById('confirmDetails').innerHTML = confirmDetails;
            document.getElementById('confirmModal').classList.remove('hidden');
            document.getElementById('confirmModal').classList.add('flex');
        }
        
        // Konfirmasi submit
        function confirmSubmission() {
            const teacherId = document.getElementById('teacherId').value.trim();
            const teacherName = document.getElementById('teacherName').value.trim();
            const attendanceType = document.getElementById('attendanceType').value;
            const notes = document.getElementById('notes').value.trim();
            
            // Buat record absensi dengan enkripsi
            const attendanceRecord = {
                id: generateUniqueId(),
                teacherId: teacherId,
                teacherName: teacherName,
                type: attendanceType,
                notes: notes,
                timestamp: Date.now(),
                date: new Date().toDateString(),
                location: currentLocation,
                ipAddress: 'xxx.xxx.xxx.xxx', // Simulasi IP
                deviceFingerprint: deviceFingerprint,
                hash: generateSecurityHash(teacherId, attendanceType, Date.now())
            };
            
            // Simpan ke localStorage (dalam implementasi nyata akan ke server)
            attendanceData.push(attendanceRecord);
            localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
            
            // Reset form
            document.getElementById('teacherId').value = '';
            document.getElementById('teacherName').value = '';
            document.getElementById('attendanceType').value = '';
            document.getElementById('notes').value = '';
            
            // Tutup modal konfirmasi dan tampilkan sukses
            closeModal();
            document.getElementById('successModal').classList.remove('hidden');
            document.getElementById('successModal').classList.add('flex');
            
            // Update riwayat
            loadTodayHistory();
        }
        
        // Generate unique ID
        function generateUniqueId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        
        // Generate security hash
        function generateSecurityHash(teacherId, type, timestamp) {
            const data = teacherId + type + timestamp + deviceFingerprint;
            return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
        }
        
        // Capture photo (simulasi)
        function capturePhoto() {
            alert('Fitur kamera akan mengambil foto untuk verifikasi identitas. Dalam implementasi nyata, ini akan menggunakan WebRTC camera API.');
        }
        
        // Load riwayat hari ini
        function loadTodayHistory() {
            const today = new Date().toDateString();
            const todayRecords = attendanceData.filter(record => record.date === today);
            
            const historyContainer = document.getElementById('todayHistory');
            
            if (todayRecords.length === 0) {
                historyContainer.innerHTML = '<div class="text-blue-100 text-center py-4">Belum ada absensi hari ini</div>';
                return;
            }
            
            historyContainer.innerHTML = todayRecords.map(record => `
                <div class="bg-white/10 rounded-xl p-4 border border-white/20">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="text-white font-semibold">${record.teacherName}</div>
                            <div class="text-blue-100 text-sm">${record.type.toUpperCase()}</div>
                            <div class="text-blue-200 text-xs mt-1">${new Date(record.timestamp).toLocaleTimeString('id-ID')}</div>
                        </div>
                        <div class="text-green-400 text-sm">✓ Verified</div>
                    </div>
                </div>
            `).join('');
        }
        
        // Load jadwal hari ini
        function loadTodaySchedule() {
            const schedules = [
                { time: '07:00-08:30', subject: 'Matematika', class: 'X-A' },
                { time: '08:30-10:00', subject: 'Fisika', class: 'X-B' },
                { time: '10:15-11:45', subject: 'Matematika', class: 'XI-A' },
                { time: '13:00-14:30', subject: 'Fisika', class: 'XII-B' }
            ];
            
            const scheduleContainer = document.getElementById('todaySchedule');
            scheduleContainer.innerHTML = schedules.map(schedule => `
                <div class="bg-white/10 rounded-xl p-3 border border-white/20">
                    <div class="text-white font-medium text-sm">${schedule.time}</div>
                    <div class="text-blue-100 text-sm">${schedule.subject}</div>
                    <div class="text-blue-200 text-xs">Kelas ${schedule.class}</div>
                </div>
            `).join('');
        }
        
        // Modal functions
        function closeModal() {
            document.getElementById('confirmModal').classList.add('hidden');
            document.getElementById('confirmModal').classList.remove('flex');
        }
        
        function closeSuccessModal() {
            document.getElementById('successModal').classList.add('hidden');
            document.getElementById('successModal').classList.remove('flex');
        }
        
        // Prevent common cheating attempts
        document.addEventListener('keydown', function(e) {
            // Disable F12, Ctrl+Shift+I, Ctrl+U
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') || 
                (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
                alert('Akses developer tools tidak diizinkan untuk keamanan sistem!');
            }
        });
        
        // Disable right click
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            alert('Right click dinonaktifkan untuk keamanan sistem!');
        });
        
        // Detect if page is being inspected
        let devtools = {open: false, orientation: null};
        setInterval(function() {
            if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.clear();
                    console.log('%cSistem Keamanan Aktif!', 'color: red; font-size: 30px; font-weight: bold;');
                    console.log('%cAkses tidak sah terdeteksi. Aktivitas ini akan dilaporkan.', 'color: red; font-size: 16px;');
                }
            } else {
                devtools.open = false;
            }
        }, 500);

        (function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'975618e1e5bb5fce',t:'MTc1NjI0MDMzMy4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();