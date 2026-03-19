// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'ElyOS Fejlesztői Dokumentáció',
			components: {
				SocialIcons: './src/components/CustomSocialIcons.astro'
			},
			logo: {
				src: './src/assets/logo.webp',
				alt: 'ElyOS Logo',
				replacesTitle: true
			},
			head: [
				{
					tag: 'script',
					attrs: {
						defer: true,
						src: 'https://elyos.hu/umami/script.js',
						'data-website-id': process.env.UMAMI_WEBSITE_ID_DOCS ?? ''
					}
				}
			],
			defaultLocale: 'hu',
			locales: {
				hu: {
					label: 'Magyar',
					lang: 'hu'
				},
				en: {
					label: 'English',
					lang: 'en'
				}
			},
			social: process.env.GITHUB_URL
				? [{ icon: /** @type {'github'} */ ('github'), label: 'GitHub', href: process.env.GITHUB_URL }]
				: [],
			customCss: [
				'@fontsource/inter/400.css',
				'@fontsource/inter/500.css',
				'@fontsource/inter/600.css',
				'@fontsource/inter/700.css',
				'./src/styles/custom.css'
			],
			sidebar: [
				{
					label: 'Kezdőlap',
					translations: { en: 'Home' },
					link: '/'
				},
				{
					label: 'Bevezetés',
					translations: { en: 'Introduction' },
					collapsed: false,
					items: [
						{
							label: 'Első lépések',
							translations: { en: 'Getting Started' },
							slug: 'getting-started'
						},
						{
							label: 'Docker',
							translations: { en: 'Docker' },
							slug: 'docker'
						},
						{
							label: 'Scripts referencia',
							translations: { en: 'Scripts Reference' },
							slug: 'scripts'
						},
						{
							label: 'Architektúra',
							translations: { en: 'Architecture' },
							slug: 'architecture'
						},
						{
							label: 'Hozzájárulás',
							translations: { en: 'Contributing' },
							slug: 'contributing'
						},
						{
							label: 'Felelősség kizárása',
							translations: { en: 'Disclaimer' },
							slug: 'disclaimer'
						}
					]
				},
				{
					label: 'Backend',
					translations: { en: 'Backend' },
					collapsed: false,
					items: [
						{
							label: 'Környezeti változók',
							translations: { en: 'Environment Variables' },
							collapsed: false,
							items: [
								{
									label: 'Áttekintés',
									translations: { en: 'Overview' },
									slug: 'environment'
								},
								{
									label: 'Varlock séma',
									translations: { en: 'Varlock Schema' },
									slug: 'environment-schema'
								},
								{
									label: 'Infisical integráció',
									translations: { en: 'Infisical Integration' },
									slug: 'environment-infisical'
								},
								{
									label: 'Runtime validáció',
									translations: { en: 'Runtime Validation' },
									slug: 'environment-runtime'
								},
								{
									label: 'Új változó hozzáadása',
									translations: { en: 'Adding New Variable' },
									slug: 'environment-add-variable'
								},
								{
									label: 'Változók referencia',
									translations: { en: 'Variables Reference' },
									slug: 'configuration'
								}
							]
						},
						{
							label: 'Server Actions',
							translations: { en: 'Server Actions' },
							slug: 'server-actions'
						},
						{
							label: 'Validáció',
							translations: { en: 'Validation' },
							collapsed: false,
							items: [
								{
									label: 'Env séma validáció',
									translations: { en: 'Env Schema Validation' },
									slug: 'env-validation',
									badge: { text: 'Varlock', variant: 'tip' }
								},
								{
									label: 'Adat validáció',
									translations: { en: 'Data Validation' },
									slug: 'data-validation',
									badge: { text: 'Valibot', variant: 'success' }
								}
							]
						},
						{
							label: 'Adatbázis',
							translations: { en: 'Database' },
							slug: 'database'
						},
						{
							label: 'Autentikáció',
							translations: { en: 'Authentication' },
							slug: 'authentication'
						},
						{
							label: 'Fájlkezelés',
							translations: { en: 'File Storage' },
							slug: 'file-storage'
						},
						{
							label: 'Naplózás',
							translations: { en: 'Logging' },
							slug: 'logging'
						},
						{
							label: 'Értesítések',
							translations: { en: 'Notifications' },
							collapsed: false,
							items: [
								{
									label: 'Áttekintés',
									translations: { en: 'Overview' },
									slug: 'notifications',
									badge: { text: 'Socket.IO', variant: 'tip' }
								},
								{
									label: 'Értesítés küldése',
									translations: { en: 'Sending Notifications' },
									slug: 'notifications-sending'
								},
								{
									label: 'NotificationStore',
									translations: { en: 'NotificationStore' },
									slug: 'notifications-store'
								},
								{
									label: 'UI Komponensek',
									translations: { en: 'UI Components' },
									slug: 'notifications-ui'
								},
								{
									label: 'API és Socket.IO',
									translations: { en: 'API and Socket.IO' },
									slug: 'notifications-api'
								},
								{
									label: 'Hibaelhárítás',
									translations: { en: 'Troubleshooting' },
									slug: 'notifications-troubleshooting'
								}
							]
						}
					]
				},
				{
					label: 'Frontend',
					translations: { en: 'Frontend' },
					collapsed: false,
					items: [
						{
							label: 'UI Komponensek',
							translations: { en: 'UI Components' },
							collapsed: false,
							items: [
								{
									label: 'Áttekintés',
									translations: { en: 'Overview' },
									slug: 'ui-components'
								},
								{
									label: 'Alapvető komponensek',
									translations: { en: 'Basic Components' },
									slug: 'ui-components/basic'
								},
								{
									label: 'Layout komponensek',
									translations: { en: 'Layout Components' },
									slug: 'ui-components/layout'
								},
								{
									label: 'Dialog komponensek',
									translations: { en: 'Dialogs' },
									slug: 'ui-components/dialogs'
								},
								{
									label: 'Navigáció',
									translations: { en: 'Navigation' },
									slug: 'ui-components/navigation'
								},
								{
									label: 'DataTable',
									translations: { en: 'DataTable' },
									slug: 'ui-components/datatable'
								},
								{
									label: 'Toast értesítések',
									translations: { en: 'Notifications' },
									slug: 'ui-components/notifications'
								},
								{
									label: 'Ikonok',
									translations: { en: 'Icons' },
									slug: 'ui-components/icons'
								},
								{
									label: 'Tailwind CSS',
									translations: { en: 'Tailwind CSS' },
									slug: 'ui-components/tailwind'
								}
							]
						},
						{
							label: 'Állapotkezelés',
							translations: { en: 'State Management' },
							slug: 'state-management'
						},
						{
							label: 'Többnyelvűség',
							translations: { en: 'Internationalization' },
							slug: 'i18n'
						}
					]
				},
				{
					label: 'Alkalmazás fejlesztés',
					translations: { en: 'Application Development' },
					collapsed: false,
					items: [
						{
							label: 'Áttekintés',
							translations: { en: 'Overview' },
							slug: 'plugins'
						},
						{
							label: 'Első lépések',
							translations: { en: 'Getting Started' },
							slug: 'plugins-getting-started'
						},
						{
							label: 'Fejlesztés',
							translations: { en: 'Development' },
							slug: 'plugins-development'
						},
						{
							label: 'manifest.json',
							translations: { en: 'manifest.json' },
							slug: 'plugins-manifest'
						},
						{
							label: 'SDK referencia',
							translations: { en: 'SDK Reference' },
							slug: 'plugins-sdk'
						},
						{
							label: 'Szerver függvények',
							translations: { en: 'Server Functions' },
							slug: 'plugins-server-functions'
						},
						{
							label: 'menu.json és AppLayout',
							translations: { en: 'menu.json & AppLayout' },
							slug: 'plugins-menu'
						},
						{
							label: 'Build és csomagolás',
							translations: { en: 'Build & Packaging' },
							slug: 'plugins-build'
						},
						{
							label: 'Biztonság',
							translations: { en: 'Security' },
							slug: 'plugins-security'
						}
					]
				},
				{
					label: 'Beépített alkalmazások',
					translations: { en: 'Built-in Applications' },
					collapsed: false,
					items: [
						{
							label: 'Áttekintés',
							translations: { en: 'Overview' },
							slug: 'builtin-apps'
						},
						{
							label: 'Beállítások',
							translations: { en: 'Settings' },
							slug: 'builtin-apps/settings'
						},
						{
							label: 'Felhasználók',
							translations: { en: 'Users' },
							slug: 'builtin-apps/users'
						},
						{
							label: 'Chat',
							translations: { en: 'Chat' },
							slug: 'builtin-apps/chat',
							badge: { text: 'Socket.IO', variant: 'tip' }
						},
						{
							label: 'Naplók',
							translations: { en: 'Logs' },
							slug: 'builtin-apps/log'
						},
						{
							label: 'Plugin Manager',
							translations: { en: 'Plugin Manager' },
							slug: 'builtin-apps/plugin-manager'
						},
						{
							label: 'Súgó',
							translations: { en: 'Help' },
							slug: 'builtin-apps/help',
							badge: { text: 'Dev', variant: 'caution' }
						}
					]
				},
				{
					label: 'Tesztelés',
					translations: { en: 'Testing' },
					collapsed: false,
					items: [
						{
							label: 'Áttekintés',
							translations: { en: 'Overview' },
							slug: 'testing'
						},
						{
							label: 'Vitest',
							translations: { en: 'Vitest' },
							slug: 'testing-vitest',
							badge: { text: 'Unit', variant: 'success' }
						},
						{
							label: 'fast-check',
							translations: { en: 'fast-check' },
							slug: 'testing-pbt',
							badge: { text: 'Property-based', variant: 'tip' }
						},
						{
							label: 'Playwright',
							translations: { en: 'Playwright' },
							slug: 'testing-e2e',
							badge: { text: 'E2E', variant: 'note' }
						}
					]
				},
				{
					label: 'Hibaelhárítás',
					translations: { en: 'Troubleshooting' },
					slug: 'troubleshooting'
				}
			]
		})
	]
});
