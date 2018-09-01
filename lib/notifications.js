'use strict';
const dotProp = require('dot-prop');
const Extra = require('telegraf/extra');
const context = require('./context');
const sendStatus = require('./handlers/status');

exports.send = (ctx, event, status) => {
	const chats = getChatsForEvent(ctx.db.get('chats'), event);
	chats.forEach((id) => sendStatus(context.createChatContext(ctx, id), status));
};

exports.console = async (ctx, msg) => {
	const chats = getChatsForEvent(ctx.db.get('chats'), 'console');
	const payload = `📺 Console message:\n<pre>${msg}</pre>`;
	chats.forEach((id) => ctx.telegram.sendMessage(id, payload, Extra.HTML()));
};

exports.printStarted = (ctx, file) => {
	const chats = getChatsForEvent(ctx.db.get('chats'), 'printStarted');
	const reply = sendStatus.replyWithScreenshot(`🖨️ Printing of ${file.fileName} started.`);
	chats.forEach((id) => reply(context.createChatContext(ctx, id)));
};

exports.printFinished = (ctx, file) => {
	const chats = getChatsForEvent(ctx.db.get('chats'), 'printFinished');
	const reply = sendStatus.replyWithScreenshot(`🏁 Printing of ${file.fileName} finished.`);
	chats.forEach((id) => reply(context.createChatContext(ctx, id)));
};

exports.printTime = (ctx, started, status) => {
	const elapsedMinutes = Math.trunc((new Date().getTime() - started) / 60000);
	const chats = getChatsWithPrintTime(ctx.db.get('chats'));

	chats.forEach((chat) => {
		if ((elapsedMinutes % chat.minutes) === 0) {
			sendStatus(context.createChatContext(ctx, chat.id), status);
		}
	});
};

function getChatsForEvent(chats, event) {
	const res = [];
	for (const chat in chats) {
		const disabled = dotProp.get(chats[chat], 'notifications.disabled');
		if (dotProp.get(chats[chat], `notifications.${event}`) && !disabled) {
			res.push(chat);
		}
	}
	return res;
}

function getChatsWithPrintTime(chats) {
	const res = [];
	for (const chat in chats) {
		const disabled = dotProp.get(chats[chat], 'notifications.disabled');
		const minutes = dotProp.get(chats[chat], 'notifications.printMinutes');
		if (minutes && !disabled) {
			res.push({
				id: chat,
				minutes
			});
		}
	}
	return res;
}