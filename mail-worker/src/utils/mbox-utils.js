// 将邮件记录转换为 mbox 格式 (仅正文导出, 不含附件)
// 正文使用 base64 编码, 既能安全承载 html/unicode, 也规避 mbox 中 "From " 行转义问题

function base64Utf8(str) {
	const bytes = new TextEncoder().encode(str || '');
	let binary = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}

// 将 base64 字符串按 76 字符换行 (MIME 规范)
function wrap76(b64) {
	return b64.replace(/.{1,76}/g, '$&\n').trimEnd();
}

// RFC 2047 encoded-word, 纯 ASCII 原样返回, 否则 base64 编码避免乱码
function encodeWord(str) {
	if (!str) return '';
	if (/^[\x00-\x7F]*$/.test(str)) return str;
	return '=?utf-8?B?' + base64Utf8(str) + '?=';
}

function parseTime(createTime) {
	if (!createTime) return new Date(0);
	// D1 CURRENT_TIMESTAMP 形如 'YYYY-MM-DD HH:MM:SS' (UTC)
	const d = new Date(createTime.replace(' ', 'T') + 'Z');
	return isNaN(d.getTime()) ? new Date(0) : d;
}

function rfc5322Date(createTime) {
	return parseTime(createTime).toUTCString();
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');

// mbox 分隔行使用的 asctime 格式: Mon Jan 01 00:00:00 2024
function asctime(d) {
	return `${DAYS[d.getUTCDay()]} ${MONS[d.getUTCMonth()]} ${pad(d.getUTCDate())} `
		+ `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} ${d.getUTCFullYear()}`;
}

function formatAddr(addr) {
	if (!addr || !addr.address) return '';
	const name = addr.name ? encodeWord(addr.name) + ' ' : '';
	return `${name}<${addr.address}>`;
}

function formatAddrList(jsonStr) {
	try {
		const arr = JSON.parse(jsonStr || '[]');
		if (!Array.isArray(arr)) return '';
		return arr.map(formatAddr).filter(Boolean).join(', ');
	} catch (e) {
		return '';
	}
}

const mboxUtils = {

	toMbox(row) {
		const time = parseTime(row.createTime);
		const lines = [];

		lines.push(`From ${row.sendEmail || 'MAILER-DAEMON'} ${asctime(time)}`);
		lines.push('Date: ' + rfc5322Date(row.createTime));
		lines.push('From: ' + formatAddr({ name: row.name, address: row.sendEmail }));

		const to = formatAddrList(row.recipient)
			|| (row.toEmail ? formatAddr({ name: row.toName, address: row.toEmail }) : '');
		if (to) lines.push('To: ' + to);

		const cc = formatAddrList(row.cc);
		if (cc) lines.push('Cc: ' + cc);

		if (row.subject) lines.push('Subject: ' + encodeWord(row.subject));
		if (row.messageId) lines.push('Message-ID: ' + row.messageId);
		if (row.inReplyTo) lines.push('In-Reply-To: ' + row.inReplyTo);
		if (row.relation) lines.push('References: ' + row.relation);

		const hasHtml = row.content != null && row.content !== '';
		const body = hasHtml ? row.content : (row.text || '');

		lines.push('MIME-Version: 1.0');
		lines.push('Content-Type: ' + (hasHtml ? 'text/html' : 'text/plain') + '; charset=utf-8');
		lines.push('Content-Transfer-Encoding: base64');
		lines.push('');
		lines.push(wrap76(base64Utf8(body)));
		lines.push('');

		return lines.join('\n') + '\n';
	}

};

export default mboxUtils;
