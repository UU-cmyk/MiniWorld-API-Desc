import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as vscode from 'vscode';

import { buildEventCompletionItems, parseEventDefinitions } from '../eventCompletion';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('parses event definitions from json', async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'miniworld-event-'));
		const filePath = path.join(tempDir, 'MNEvent.d.json');
		fs.writeFileSync(filePath, JSON.stringify({
			'Game.Hour': {
				desc: '世界小时时间变化',
			},
		}, null, 2));

		const definitions = await parseEventDefinitions(filePath);

		assert.strictEqual(definitions.size, 1);
		assert.strictEqual(definitions.get('Game.Hour')?.desc, '世界小时时间变化');
	});

	test('builds completion items for event definitions', () => {
		const definitions = new Map<string, { desc?: string }>([['Player.Die', { desc: '玩家死亡' }]]);
		const items = buildEventCompletionItems(definitions as Map<string, { desc?: string; event_info?: Record<string, string> }>);

		assert.strictEqual(items.length, 1);
		assert.strictEqual(items[0].label, 'Player.Die');
		assert.strictEqual(items[0].detail, '玩家死亡');
		assert.strictEqual(items[0].insertText, '[=[Player.Die]=]');
	});
});
