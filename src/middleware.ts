import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
	const { pathname } = context.url;

	// Ha a gyökér URL-t nyitják meg, irányítsuk át a /hu/ útvonalra
	if (pathname === '/') {
		return context.redirect('/hu/', 302);
	}

	return next();
});
