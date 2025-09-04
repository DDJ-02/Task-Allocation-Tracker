const twilio = require('twilio');
require('dotenv').config();


// Parses user WhatsApp replies into actionable commands
function parseReply(text) {
  const parts = text.trim().split(' ');
  const command = parts[0].toUpperCase();
  const args = parts.slice(1);

  switch (command) {
    case 'ASSIGN':        
      return { action: 'ASSIGN', params: args };
    case 'YES':
      return { action: 'STATUS', params: args.join(' ') }; // e.g., "In Progress"
    case 'START':
      return { action: 'STATUS', params: args.join(' ') }; // e.g., "In Progress"
    case 'PAUSE':
      return { action: 'COMMENT', params: args.join(' ') };
    case 'CONTINUE':
      return { action: 'REOPEN' };
    case 'DONE':
      return { action: 'DONE' };
    case 'CANCEL':
        return { action: 'CANCEL' };
    default:
      return { action: 'UNKNOWN' };
  }
}

module.exports = { parseReply };
