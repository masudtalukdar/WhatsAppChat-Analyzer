let chatData = {};
let charts = {};
let analysisData = {};

document.getElementById('fileInput').addEventListener('change', handleFileUpload);
document.getElementById('downloadPDF').addEventListener('click', generatePDFReport);

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    try {
        const text = await file.text();
        chatData = parseWhatsAppChat(text);
        displayResults();
    } catch (error) {
        alert('Error processing file: ' + error.message);
    }

    document.getElementById('loading').classList.add('hidden');
}

function parseWhatsAppChat(text) {
    const lines = text.split('\n');
    const messages = [];
    const participants = new Set();
    const words = {};
    const hourlyActivity = new Array(24).fill(0);
    const weeklyActivity = new Array(7).fill(0);
    const dailyActivity = {};
    const messageLengths = [];

    // WhatsApp message pattern: [DD/MM/YY, HH:MM:SS] Name: Message
    const messagePattern = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]?\s*([^:]+):\s*(.*)$/;
    
    let currentMessage = null;
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const match = line.match(messagePattern);
        
        if (match) {
            if (currentMessage) {
                messages.push(currentMessage);
            }
            
            const [, date, time, sender, message] = match;
            const dateObj = parseWhatsAppDate(date, time);
            
            currentMessage = {
                date: dateObj,
                sender: sender.trim(),
                message: message.trim(),
                length: message.trim().length
            };
            
            participants.add(sender.trim());
        } else if (currentMessage) {
            currentMessage.message += ' ' + line;
            currentMessage.length = currentMessage.message.length;
        }
    }
    
    if (currentMessage) {
        messages.push(currentMessage);
    }

    messages.forEach(msg => {
        hourlyActivity[msg.date.getHours()]++;
        weeklyActivity[msg.date.getDay()]++;
        const dayKey = msg.date.toDateString();
        dailyActivity[dayKey] = (dailyActivity[dayKey] || 0) + 1;
        messageLengths.push(msg.length);
        
        if (!isSystemMessage(msg.message)) {
            const messageWords = msg.message.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 2 && !isCommonWord(word));
            
            messageWords.forEach(word => {
                words[word] = (words[word] || 0) + 1;
            });
        }
    });

    return {
        messages,
        participants: Array.from(participants),
        words,
        hourlyActivity,
        weeklyActivity,
        dailyActivity,
        messageLengths
    };
}

function parseWhatsAppDate(dateStr, timeStr) {
    let [day, month, year] = dateStr.split('/');
    if (year.length === 2) year = '20' + year;
    let [hours, minutes] = timeStr.split(':');
    
    if (timeStr.includes('PM') || timeStr.includes('pm')) {
        hours = parseInt(hours) === 12 ? 12 : parseInt(hours) + 12;
    } else if (timeStr.includes('AM') || timeStr.includes('am')) {
        hours = parseInt(hours) === 12 ? 0 : parseInt(hours);
    }
    
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
}

function isSystemMessage(message) {
    const systemPatterns = ['Messages and calls are end-to-end encrypted', 'You deleted this message', 'This message was deleted', 'joined using', 'left', 'added', 'removed', 'changed the group', 'created group'];
    return systemPatterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()));
}

function isCommonWord(word) {
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'car', 'she', 'use', 'your', 'said', 'each', 'make', 'most', 'over', 'said', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were', 'will', 'with', 'have', 'this', 'that', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'could', 'state', 'there', 'think', 'where', 'being', 'every', 'great', 'might', 'shall', 'still', 'those', 'under', 'while'];
    return commonWords.includes(word.toLowerCase());
}

function displayResults() {
    document.getElementById('results').classList.remove('hidden');
    const totalMessages = chatData.messages.length;
    const totalParticipants = chatData.participants.length;
    
    let maxMessages = 0;
    let mostActiveDay = '';
    for (const [day, count] of Object.entries(chatData.dailyActivity)) {
        if (count > maxMessages) {
            maxMessages = count;
            mostActiveDay = new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
    }

    const firstMessage = chatData.messages[0];
    const lastMessage = chatData.messages[chatData.messages.length - 1];
    const duration = Math.ceil((lastMessage.date - firstMessage.date) / (1000 * 60 * 60 * 24));

    document.getElementById('totalMessages').textContent = totalMessages.toLocaleString();
    document.getElementById('totalParticipants').textContent = totalParticipants;
    document.getElementById('mostActiveDay').textContent = mostActiveDay;
    document.getElementById('chatDuration').textContent = `${duration} days`;

    createCharts();
}

function createCharts() {
    createMessagesOverTimeChart();
    createParticipantsChart();
    createHourlyChart();
    createWeeklyChart();
    createWordCloud();
    createMessageLengthChart();
    createSentimentAnalysis();
    createEmojiAnalysis();
    createActivityHeatmap();
    createResponseTimeAnalysis();
    createConversationPatterns();
    createMessageTypeChart();
    createPeakMoments();
}

// Visual Chart Logic
function createMessagesOverTimeChart() {
    const ctx = document.getElementById('messagesChart').getContext('2d');
    const monthlyData = {};
    chatData.messages.forEach(msg => {
        const monthKey = msg.date.getFullYear() + '-' + String(msg.date.getMonth() + 1).padStart(2, '0');
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });
    const sortedMonths = Object.keys(monthlyData).sort();
    const data = sortedMonths.map(month => monthlyData[month]);
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
    if (charts.messagesChart) charts.messagesChart.destroy();
    charts.messagesChart = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Messages', data: data, borderColor: '#25D366', backgroundColor: 'rgba(37, 211, 102, 0.1)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function createParticipantsChart() {
    const ctx = document.getElementById('participantsChart').getContext('2d');
    const participantCounts = {};
    chatData.messages.forEach(msg => { participantCounts[msg.sender] = (participantCounts[msg.sender] || 0) + 1; });
    const sortedParticipants = Object.entries(participantCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const labels = sortedParticipants.map(([name]) => name.length > 15 ? name.substring(0, 15) + '...' : name);
    const data = sortedParticipants.map(([, count]) => count);
    if (charts.participantsChart) charts.participantsChart.destroy();
    charts.participantsChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: 'Messages', data: data, backgroundColor: 'rgba(37, 211, 102, 0.8)', borderColor: '#25D366', borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function createHourlyChart() {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    const labels = Array.from({ length: 24 }, (_, i) => i + ':00');
    if (charts.hourlyChart) charts.hourlyChart.destroy();
    charts.hourlyChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: 'Messages', data: chatData.hourlyActivity, backgroundColor: 'rgba(37, 211, 102, 0.8)', borderColor: '#25D366', borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function createWeeklyChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (charts.weeklyChart) charts.weeklyChart.destroy();
    charts.weeklyChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: dayNames, datasets: [{ data: chatData.weeklyActivity, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function createWordCloud() {
    const wordCloudEl = document.getElementById('wordCloud');
    const sortedWords = Object.entries(chatData.words).sort((a, b) => b[1] - a[1]).slice(0, 30);
    wordCloudEl.innerHTML = '';
    const maxCount = sortedWords[0] ? sortedWords[0][1] : 1;
    sortedWords.forEach(([word, count]) => {
        const wordEl = document.createElement('span');
        wordEl.className = 'word-item';
        wordEl.textContent = `${word} (${count})`;
        const fontSize = Math.max(0.8, Math.min(2, count / maxCount * 2));
        wordEl.style.fontSize = fontSize + 'em';
        wordCloudEl.appendChild(wordEl);
    });
}

function createMessageLengthChart() {
    const ctx = document.getElementById('lengthChart').getContext('2d');
    const bins = [0, 10, 25, 50, 100, 200, 500];
    const binCounts = new Array(bins.length - 1).fill(0);
    const binLabels = [];
    for (let i = 0; i < bins.length - 1; i++) { binLabels.push(`${bins[i]}-${bins[i + 1]} chars`); }
    binLabels.push('500+ chars'); binCounts.push(0);
    chatData.messageLengths.forEach(length => {
        for (let i = 0; i < bins.length - 1; i++) {
            if (length >= bins[i] && length < bins[i + 1]) { binCounts[i]++; return; }
        }
        binCounts[binCounts.length - 1]++;
    });
    if (charts.lengthChart) charts.lengthChart.destroy();
    charts.lengthChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: binLabels, datasets: [{ label: 'Messages', data: binCounts, backgroundColor: 'rgba(37, 211, 102, 0.8)', borderColor: '#25D366', borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function createSentimentAnalysis() {
    const sentimentFlow = document.getElementById('sentimentFlow');
    const positiveWords = ['love', 'great', 'awesome', 'amazing', 'happy', 'good', 'nice', 'wonderful', 'perfect', 'best', 'excellent', 'fantastic', '😊', '😍', '❤️', '😂', '👍'];
    const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'sad', 'angry', 'worst', 'horrible', 'stupid', 'annoying', '😢', '😡', '😞', '💔', '😭'];
    let positive = 0, neutral = 0, negative = 0;
    chatData.messages.forEach(msg => {
        const text = msg.message.toLowerCase();
        let sentiment = 0;
        positiveWords.forEach(word => { if (text.includes(word)) sentiment++; });
        negativeWords.forEach(word => { if (text.includes(word)) sentiment--; });
        if (sentiment > 0) positive++; else if (sentiment < 0) negative++; else neutral++;
    });
    const total = positive + neutral + negative;
    const sentiments = [
        { type: 'Positive', count: positive, percentage: (positive/total*100).toFixed(1), class: 'sentiment-positive' },
        { type: 'Neutral', count: neutral, percentage: (neutral/total*100).toFixed(1), class: 'sentiment-neutral' },
        { type: 'Negative', count: negative, percentage: (negative/total*100).toFixed(1), class: 'sentiment-negative' }
    ];
    sentimentFlow.innerHTML = '';
    sentiments.forEach(sentiment => {
        const item = document.createElement('div');
        item.className = `sentiment-item ${sentiment.class}`;
        item.innerHTML = `<div>${sentiment.type}</div><div>${sentiment.percentage}%</div><div style="font-size: 0.8em; opacity: 0.8;">${sentiment.count} messages</div>`;
        sentimentFlow.appendChild(item);
    });
}

function createEmojiAnalysis() {
    const emojiGrid = document.getElementById('emojiGrid');
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiCount = {};
    chatData.messages.forEach(msg => {
        const emojis = msg.message.match(emojiRegex);
        if (emojis) emojis.forEach(emoji => { emojiCount[emoji] = (emojiCount[emoji] || 0) + 1; });
    });
    const topEmojis = Object.entries(emojiCount).sort((a, b) => b[1] - a[1]).slice(0, 12);
    emojiGrid.innerHTML = '';
    topEmojis.forEach(([emoji, count]) => {
        const item = document.createElement('div');
        item.className = 'emoji-item';
        item.innerHTML = `<div class="emoji">${emoji}</div><div class="count">${count}</div><div style="font-size: 0.8em; color: #666;">times used</div>`;
        emojiGrid.appendChild(item);
    });
}

function createActivityHeatmap() {
    const heatmap = document.getElementById('activityHeatmap');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const activityGrid = Array(7).fill().map(() => Array(24).fill(0));
    chatData.messages.forEach(msg => {
        const day = (msg.date.getDay() + 6) % 7;
        const hour = msg.date.getHours();
        activityGrid[day][hour]++;
    });
    const maxActivity = Math.max(...activityGrid.flat());
    heatmap.innerHTML = '';
    const headerRow = document.createElement('div');
    headerRow.style.display = 'contents';
    headerRow.innerHTML = '<div></div>' + Array.from({length: 24}, (_, i) => `<div class="heatmap-label">${i}</div>`).join('');
    heatmap.appendChild(headerRow);
    days.forEach((day, dayIndex) => {
        const dayLabel = document.createElement('div'); dayLabel.className = 'heatmap-label'; dayLabel.textContent = day; heatmap.appendChild(dayLabel);
        for (let hour = 0; hour < 24; hour++) {
            const cell = document.createElement('div'); cell.className = 'heatmap-cell';
            const activity = activityGrid[dayIndex][hour]; const intensity = activity / maxActivity;
            cell.style.backgroundColor = `rgba(37, 211, 102, ${intensity})`; cell.textContent = activity > 0 ? activity : ''; cell.title = `${day} ${hour}:00 - ${activity} messages`;
            heatmap.appendChild(cell);
        }
    });
}

function createResponseTimeAnalysis() {
    const ctx = document.getElementById('responseTimeChart').getContext('2d');
    const responseTimes = [];
    for (let i = 1; i < chatData.messages.length; i++) {
        const prev = chatData.messages[i - 1]; const curr = chatData.messages[i];
        if (prev.sender !== curr.sender) {
            const timeDiff = (curr.date - prev.date) / (1000 * 60);
            if (timeDiff < 1440) responseTimes.push(timeDiff);
        }
    }
    const bins = [0, 1, 5, 15, 60, 240, 1440]; const binLabels = ['< 1 min', '1-5 min', '5-15 min', '15-60 min', '1-4 hours', '4-24 hours']; const binCounts = new Array(bins.length - 1).fill(0);
    responseTimes.forEach(time => { for (let i = 0; i < bins.length - 1; i++) { if (time >= bins[i] && time < bins[i + 1]) { binCounts[i]++; break; } } });
    if (charts.responseTimeChart) charts.responseTimeChart.destroy();
    charts.responseTimeChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: binLabels, datasets: [{ label: 'Responses', data: binCounts, backgroundColor: 'rgba(37, 211, 102, 0.8)', borderColor: '#25D366', borderWidth: 1 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function createConversationPatterns() {
    const earlyBirdActivity = {}, nightOwlActivity = {}, messageLengthsByUser = {}, emojiCountByUser = {}, conversationStarters = {}, responseTimesByUser = {};
    chatData.messages.forEach((msg, index) => {
        const hour = msg.date.getHours(); const sender = msg.sender;
        if (hour < 8) earlyBirdActivity[sender] = (earlyBirdActivity[sender] || 0) + 1;
        if (hour >= 22) nightOwlActivity[sender] = (nightOwlActivity[sender] || 0) + 1;
        if (!messageLengthsByUser[sender]) messageLengthsByUser[sender] = []; messageLengthsByUser[sender].push(msg.message.length);
        const emojiCount = (msg.message.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
        emojiCountByUser[sender] = (emojiCountByUser[sender] || 0) + emojiCount;
        if (index > 0) {
            const prevMsg = chatData.messages[index - 1]; const timeDiff = (msg.date - prevMsg.date) / (1000 * 60 * 60);
            if (timeDiff >= 1 && prevMsg.sender !== sender) conversationStarters[sender] = (conversationStarters[sender] || 0) + 1;
        }
    });
    const earlyBird = Object.entries(earlyBirdActivity).sort((a, b) => b[1] - a[1])[0];
    const nightOwl = Object.entries(nightOwlActivity).sort((a, b) => b[1] - a[1])[0];
    const avgMessageLengths = {}; Object.entries(messageLengthsByUser).forEach(([user, lengths]) => { avgMessageLengths[user] = lengths.reduce((a, b) => a + b, 0) / lengths.length; });
    const essayWriter = Object.entries(avgMessageLengths).sort((a, b) => b[1] - a[1])[0];
    const emojiMaster = Object.entries(emojiCountByUser).sort((a, b) => b[1] - a[1])[0];
    const conversationStarterWinner = Object.entries(conversationStarters).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('earlyBird').textContent = earlyBird ? earlyBird[0] : 'N/A';
    document.getElementById('nightOwl').textContent = nightOwl ? nightOwl[0] : 'N/A';
    document.getElementById('essayWriter').textContent = essayWriter ? essayWriter[0] : 'N/A';
    document.getElementById('emojiMaster').textContent = emojiMaster ? emojiMaster[0] : 'N/A';
    document.getElementById('conversationStarter').textContent = conversationStarterWinner ? conversationStarterWinner[0] : 'N/A';
}

function createMessageTypeChart() {
    const ctx = document.getElementById('messageTypeChart').getContext('2d');
    let text = 0, media = 0, link = 0, emojiOnly = 0;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    chatData.messages.forEach(msg => {
        const m = msg.message.trim();
        if (m.includes('<Media omitted>') || m.includes('image omitted')) media++;
        else if (urlRegex.test(m)) link++;
        else if (m.replace(emojiRegex, '').trim() === '') emojiOnly++;
        else text++;
    });
    if (charts.messageTypeChart) charts.messageTypeChart.destroy();
    charts.messageTypeChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['Text', 'Media', 'Links', 'Emoji Only'], datasets: [{ data: [text, media, link, emojiOnly], backgroundColor: ['#25D366', '#128C7E', '#FF9500', '#FF6B6B'] }] }, options: { responsive: true, maintainAspectRatio: false } });
}

function createPeakMoments() {
    const el = document.getElementById('peakMoments');
    let maxDay = '', maxMsgs = 0;
    Object.entries(chatData.dailyActivity).forEach(([day, count]) => { if (count > maxMsgs) { maxMsgs = count; maxDay = day; } });
    const totalDays = Object.keys(chatData.dailyActivity).length;
    const moments = [
        { title: 'Busiest Day Ever', value: maxMsgs, desc: new Date(maxDay).toLocaleDateString() },
        { title: 'Peak Hour', value: Math.max(...chatData.hourlyActivity), desc: 'Max messages in one hour' },
        { title: 'Daily Average', value: Math.round(chatData.messages.length / totalDays), desc: 'Messages per day' },
        { title: 'Active Days', value: totalDays, desc: 'Days you actually chatted' }
    ];
    el.innerHTML = '';
    moments.forEach(m => {
        const div = document.createElement('div'); div.className = 'peak-moment';
        div.innerHTML = `<div class="peak-moment-title">${m.title}</div><div class="peak-moment-value">${m.value}</div><div class="peak-moment-desc">${m.desc}</div>`;
        el.appendChild(div);
    });
}

async function generatePDFReport() {
    const btn = document.getElementById('downloadPDF');
    btn.disabled = true;
    btn.textContent = '⏳ Designing Report...';

    const overlay = document.createElement('div');
    overlay.className = 'pdf-generating';
    overlay.innerHTML = `<div class="pdf-spinner"></div><p>Generating comprehensive analytical report...</p>`;
    document.body.appendChild(overlay);

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        let currentY = margin + 10; // Starting Y position

        // 1. Add a Styled Title Page Header
        pdf.setFillColor(37, 211, 102); // WhatsApp Green
        pdf.rect(0, 0, pageWidth, 20, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text('WhatsApp Chat Analysis Insights', margin, 13);
        pdf.setFontSize(10);
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, 13);

        // 2. Identify all "Cards" to capture individually
        const cards = document.querySelectorAll('.stat-card, .chart-container, .card, .peak-moment-container');
        
        for (let i = 0; i < cards.length; i++) {
            const canvas = await html2canvas(cards[i], { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * contentWidth) / canvas.width;

            // Check if this card fits on the current page
            if (currentY + imgHeight > pageHeight - margin) {
                pdf.addPage();
                // Add header to new page
                pdf.setFillColor(37, 211, 102);
                pdf.rect(0, 0, pageWidth, 10, 'F');
                currentY = 20; // Reset Y for new page
            }

            // Draw the card
            pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
            currentY += imgHeight + 10; // Add spacing between cards
        }

        pdf.save(`WhatsApp_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (e) {
        console.error(e);
        alert('PDF Generation failed. Try again.');
    } finally {
        document.body.removeChild(overlay);
        btn.disabled = false;
        btn.textContent = '📄 Download Analysis Report (PDF)';
    }
}