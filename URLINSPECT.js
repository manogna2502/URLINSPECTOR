const suspiciousKeywords = ['login', 'verify', 'free', 'win', 'gift', 'secure', 'bank', 'reset'];
const blacklistedDomains = ['phishy.com', 'malicious-site.net', 'badlink.org'];
const reportURL = "https://www.cybercrime.gov.in/";

const linkInput = document.getElementById('linkInput');
const resultDiv = document.getElementById('result');
const historyList = document.getElementById('historyList');
const historyPanel = document.getElementById('historyPanel');

window.onload = () => {
    const saved = JSON.parse(localStorage.getItem('linkHistory')) || [];
    saved.forEach(({ url, status }) => addToHistory(url, status));
};

async function checkLink() {
    const url = linkInput.value.trim();
    if (!url) {
        alert('Please enter a link!');
        return;
    }

    let status = '✅ Safe';
    const lowerUrl = url.toLowerCase();
    let isSuspicious = false;
    let isBlacklisted = false;
    let domain = '';

    try {
        domain = new URL(url).hostname.replace(/^www\./, '');
        isSuspicious = suspiciousKeywords.some(k => lowerUrl.includes(k));
        isBlacklisted = blacklistedDomains.includes(domain);
    } catch (e) {
        resultDiv.innerHTML = "❌ Invalid URL!";
        return;
    }

    if (isBlacklisted) {
        status = '🚨 Blacklisted Domain!';
    } else if (isSuspicious) {
        status = '⚠️ Suspicious Link!';
    }

    let ipDisplay = '';
    try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
        const data = await response.json();
        const ip = data.Answer?.[0]?.data || 'N/A';
        ipDisplay = `🌍 IP: ${ip}`;
    } catch (err) {
        ipDisplay = '🌍 IP: Not found';
    }

    resultDiv.innerHTML = `Result: ${status}<br>${ipDisplay}`;
    addToHistory(url, `${status} | ${ipDisplay}`);
    saveToLocal(url, `${status} | ${ipDisplay}`);
    linkInput.value = '';
    linkInput.blur(); // small polish fix

    if (status === '✅ Safe') {
        window.open(url, '_blank');
    } else {
        if (confirm('Suspicious or Blacklisted URL detected! Would you like to report it instead?')) {
            window.open(reportURL, '_blank');
        }
    }
}

function addToHistory(url, status) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="font-semibold">${status}</span> - <a href="${url}" target="_blank" class="text-blue-600 underline break-all">${url}</a>`;
    historyList.prepend(li);
}

function saveToLocal(url, status) {
    const saved = JSON.parse(localStorage.getItem('linkHistory')) || [];
    saved.unshift({ url, status });
    if (saved.length > 50) saved.pop();
    localStorage.setItem('linkHistory', JSON.stringify(saved));
}

function clearHistory() {
    if (confirm("Are you sure you want to clear all history?")) {
        localStorage.removeItem('linkHistory');
        historyList.innerHTML = '';
        resultDiv.textContent = '';
    }
}

function exportHistory() {
    const history = localStorage.getItem('linkHistory');
    if (!history) {
        alert("No history to export.");
        return;
    }
    const blob = new Blob([history], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "fraud-link-history.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importHistory(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                localStorage.setItem('linkHistory', JSON.stringify(imported));
                historyList.innerHTML = '';
                imported.forEach(({ url, status }) => addToHistory(url, status));
                alert("History imported successfully.");
            } else {
                alert("Invalid file format.");
            }
        } catch (err) {
            alert("Error reading file.");
        }
    };
    reader.readAsText(file);
}

function toggleHistory() {
    historyPanel.classList.toggle('hidden');
}
