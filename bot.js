const { Bot } = require('grammy');
const axios = require('axios');

// Initialize Telegram Bot
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Axios Instance for RapidAPI (API-Football)
const api = axios.create({
  baseURL: 'https://api-football-v1.p.rapidapi.com/v3',
  headers: {
    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
    'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
  }
});

// Command: /start
bot.command('start', (ctx) => {
  ctx.reply(
    `⚽ *Welcome to EliteMatchbot!*\n\n` +
    `Your sports assistant for live scores, fixtures, and team data.\n\n` +
    `*Available Commands:*\n` +
    `• \`/live\` - Check live football matches happening right now\n` +
    `• \`/today\` - Get today's upcoming match schedules\n` +
    `• \`/standings <league_id>\` - Check league standings (e.g. \`/standings 39\` for Premier League)`,
    { parse_mode: 'Markdown' }
  );
});

// Command: /live
bot.command('live', async (ctx) => {
  try {
    const res = await api.get('/fixtures', { params: { live: 'all' } });
    const matches = res.data.response;

    if (!matches || matches.length === 0) {
      return ctx.reply('🔴 No live matches currently in progress.');
    }

    let text = '⚡ *Live Matches Right Now:*\n\n';
    matches.slice(0, 10).forEach((m) => {
      const home = m.teams.home.name;
      const away = m.teams.away.name;
      const scoreHome = m.goals.home ?? 0;
      const scoreAway = m.goals.away ?? 0;
      const elapsed = m.fixture.status.elapsed ?? 0;

      text += `⚽ *${home}* ${scoreHome} - ${scoreAway} *${away}* (${elapsed}')\n`;
      text += `🏆 _${m.league.name}_\n\n`;
    });

    ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    ctx.reply('⚠️ Unable to fetch live scores right now. Check API key setup.');
  }
});

// Command: /today
bot.command('today', async (ctx) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const res = await api.get('/fixtures', { params: { date: todayStr } });
    const matches = res.data.response;

    if (!matches || matches.length === 0) {
      return ctx.reply('📅 No matches scheduled for today.');
    }

    let text = `📅 *Today's Match Fixtures (${todayStr}):*\n\n`;
    matches.slice(0, 10).forEach((m) => {
      const home = m.teams.home.name;
      const away = m.teams.away.name;
      const time = new Date(m.fixture.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      text += `🕒 *${time}* | ${home} vs ${away}\n`;
      text += `🏆 _${m.league.name}_\n\n`;
    });

    ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    ctx.reply('⚠️ Failed to load today\'s fixtures.');
  }
});

// Command: /standings <league_id>
bot.command('standings', async (ctx) => {
  const leagueId = ctx.match.trim() || '39'; // Default: Premier League (39)
  const currentYear = new Date().getFullYear();

  try {
    const res = await api.get('/standings', { params: { league: leagueId, season: currentYear } });
    const standings = res.data.response[0]?.league?.standings[0];

    if (!standings) {
      return ctx.reply('⚠️ Could not find standings for this league ID.');
    }

    let text = `🏆 *League Standings (${res.data.response[0].league.name}):*\n\n`;
    standings.slice(0, 10).forEach((item) => {
      text += `*${item.rank}. ${item.team.name}* - ${item.points} pts (W: ${item.all.win}, D: ${item.all.draw}, L: ${item.all.lose})\n`;
    });

    ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    ctx.reply('⚠️ Unable to fetch standings.');
  }
});

// Launch Bot
bot.start();
console.log('EliteMatchbot is online and running...');
