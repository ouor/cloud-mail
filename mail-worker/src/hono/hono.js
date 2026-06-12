import { Hono } from 'hono';
const app = new Hono();

import result from '../model/result';
import { cors } from 'hono/cors';

app.use('*', cors());

app.onError(async (err, c) => {
	if (err.name === 'BizError') {
		console.log(err.message);
	} else {
		console.error(err);
	}

	// 动态导入避免与 i18n.js 的循环依赖 (i18n.js 在加载时引用本模块的 app)
	const { t } = await import('../i18n/i18n');

	if (err.message === `Cannot read properties of undefined (reading 'get')`) {
		return c.json(result.fail(t('kvNotBound'),502));
	}

	if (err.message === `Cannot read properties of undefined (reading 'put')`) {
		return c.json(result.fail(t('kvNotBound'),502));
	}

	if (err.message === `Cannot read properties of undefined (reading 'prepare')`) {
		return c.json(result.fail(t('d1NotBound'),502));
	}

	return c.json(result.fail(err.message, err.code));
});

export default app;


